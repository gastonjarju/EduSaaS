// Alumni Relations — directory, class groups, events, mentorship, donations.
// See docs/edusaasSchemas.md §6-7.
import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { schools, users } from "./core";

// The core entity of the module — one row per alumnus, one-to-one with users.
export const alumniProfiles = pgTable(
  "alumni_profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),
    schoolId: uuid("school_id")
      .notNull()
      .references(() => schools.id, { onDelete: "cascade" }),

    graduationYear: smallint("graduation_year").notNull(),
    classSection: varchar("class_section", { length: 100 }), // "Form 5A", "Upper 6 Arts"

    currentCity: varchar("current_city", { length: 120 }),
    currentCountry: varchar("current_country", { length: 2 }), // ISO 3166-1 alpha-2
    profession: varchar("profession", { length: 150 }),
    employer: varchar("employer", { length: 150 }),
    bio: text("bio"),
    linkedinUrl: text("linkedin_url"),

    // A5 lightweight verification (honor system, not identity-proof)
    verificationStatus: varchar("verification_status", { length: 20 })
      .notNull()
      .default("unverified"),
    verificationAnswer: text("verification_answer"), // e.g. answer to "name a teacher"

    // A7 mentorship opt-in
    isMentor: boolean("is_mentor").notNull().default(false),
    mentorAreas: text("mentor_areas")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`), // career | university | tutoring | general

    // per-field privacy, default: name + grad year always visible (name lives on users)
    visibility: jsonb("visibility")
      .notNull()
      .default(
        sql`'{"city": true, "profession": true, "bio": true, "employer": false, "linkedin": true}'::jsonb`
      ),

    deletedAt: timestamp("deleted_at", { withTimezone: true }), // GDPR-lite soft delete
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "alumni_profiles_graduation_year_check",
      sql`${table.graduationYear} BETWEEN 1950 AND date_part('year', now())::int + 1`
    ),
    check(
      "alumni_profiles_verification_status_check",
      sql`${table.verificationStatus} IN ('unverified','pending','verified','rejected')`
    ),
    index("idx_alumni_profiles_school_year")
      .on(table.schoolId, table.graduationYear)
      .where(sql`${table.deletedAt} IS NULL`),
    index("idx_alumni_profiles_school_city")
      .on(table.schoolId, table.currentCity)
      .where(sql`${table.deletedAt} IS NULL`),
    index("idx_alumni_profiles_mentors")
      .on(table.schoolId)
      .where(sql`${table.isMentor} = true AND ${table.deletedAt} IS NULL`),
  ]
);

// Backs A12 (school admin verification queue). Append-friendly log, not fields
// bolted onto alumni_profiles, so review history isn't lost on re-verification.
export const alumniVerificationRequests = pgTable(
  "alumni_verification_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    alumniProfileId: uuid("alumni_profile_id")
      .notNull()
      .references(() => alumniProfiles.id, { onDelete: "cascade" }),
    schoolId: uuid("school_id")
      .notNull()
      .references(() => schools.id, { onDelete: "cascade" }),
    verificationAnswerSnap: text("verification_answer_snap").notNull(), // snapshot at time of request
    status: varchar("status", { length: 20 }).notNull().default("pending"),
    reviewedBy: uuid("reviewed_by").references(() => users.id), // school_admin
    reviewerNotes: text("reviewer_notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  },
  (table) => [
    check(
      "alumni_verification_requests_status_check",
      sql`${table.status} IN ('pending','approved','rejected')`
    ),
    // Only one open (pending) request per profile at a time
    uniqueIndex("uq_alumni_verification_pending")
      .on(table.alumniProfileId)
      .where(sql`${table.status} = 'pending'`),
    index("idx_alumni_verification_school_queue").on(
      table.schoolId,
      table.status
    ),
  ]
);

// One row auto-created (application-layer) per (school_id, graduation_year).
// Membership is implicit — any alumni profile matching school_id + graduation_year
// belongs; no separate membership table since that would just duplicate alumni_profiles.
export const classGroups = pgTable(
  "class_groups",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    schoolId: uuid("school_id")
      .notNull()
      .references(() => schools.id, { onDelete: "cascade" }),
    graduationYear: smallint("graduation_year").notNull(),
    name: varchar("name", { length: 50 }).notNull(), // auto: "Class of 2015"
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("uq_class_groups_school_year").on(
      table.schoolId,
      table.graduationYear
    ),
  ]
);

export const classGroupPosts = pgTable(
  "class_group_posts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    classGroupId: uuid("class_group_id")
      .notNull()
      .references(() => classGroups.id, { onDelete: "cascade" }),
    schoolId: uuid("school_id") // denormalized, see §2
      .notNull()
      .references(() => schools.id, { onDelete: "cascade" }),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    imageUrl: text("image_url"),
    deletedAt: timestamp("deleted_at", { withTimezone: true }), // soft delete for moderation
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "class_group_posts_content_length_check",
      sql`char_length(${table.content}) <= 2000`
    ),
    index("idx_class_group_posts_feed")
      .on(table.classGroupId, table.createdAt.desc())
      .where(sql`${table.deletedAt} IS NULL`),
  ]
);

// Not carrying school_id — always accessed by post_id (already indexed, one hop
// away), and reaction volume per post is small, so denormalization isn't worth it.
export const classGroupPostReactions = pgTable(
  "class_group_post_reactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    postId: uuid("post_id")
      .notNull()
      .references(() => classGroupPosts.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 20 }).notNull().default("like"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("uq_class_group_post_reactions_post_user").on(
      table.postId,
      table.userId
    ),
  ]
);

// Authored once; read by both the admin Events screen and the public site's
// event listing (docs/edusaasSchemas.md §5).
export const events = pgTable(
  "events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    schoolId: uuid("school_id")
      .notNull()
      .references(() => schools.id, { onDelete: "cascade" }),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id),
    title: varchar("title", { length: 200 }).notNull(),
    description: text("description"),
    eventDate: timestamp("event_date", { withTimezone: true }).notNull(),
    endDate: timestamp("end_date", { withTimezone: true }),
    location: varchar("location", { length: 255 }),
    locationType: varchar("location_type", { length: 20 })
      .notNull()
      .default("physical"),
    virtualLink: text("virtual_link"),
    coverImageUrl: text("cover_image_url"),
    isPublished: boolean("is_published").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "events_location_type_check",
      sql`${table.locationType} IN ('physical','virtual','hybrid')`
    ),
    check(
      "events_end_date_check",
      sql`${table.endDate} IS NULL OR ${table.endDate} >= ${table.eventDate}`
    ),
    index("idx_events_school_upcoming")
      .on(table.schoolId, table.eventDate)
      .where(sql`${table.isPublished} = true`),
  ]
);

export const eventRsvps = pgTable(
  "event_rsvps",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    schoolId: uuid("school_id") // denormalized, see §2
      .notNull()
      .references(() => schools.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: varchar("status", { length: 20 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "event_rsvps_status_check",
      sql`${table.status} IN ('going','maybe','not_going')`
    ),
    uniqueIndex("uq_event_rsvps_event_user").on(table.eventId, table.userId),
    index("idx_event_rsvps_event_status").on(table.eventId, table.status),
  ]
);

// alumni_profiles.is_mentor / mentor_areas cover the opt-in side.
// This table backs the connection-request flow (V1.1 — A7).
export const mentorshipConnections = pgTable(
  "mentorship_connections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    schoolId: uuid("school_id") // denormalized, see §2
      .notNull()
      .references(() => schools.id, { onDelete: "cascade" }),
    mentorId: uuid("mentor_id")
      .notNull()
      .references(() => alumniProfiles.id, { onDelete: "cascade" }),
    requesterId: uuid("requester_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    area: varchar("area", { length: 50 }).notNull(), // career | university | tutoring | general
    message: text("message"),
    status: varchar("status", { length: 20 }).notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "mentorship_connections_status_check",
      sql`${table.status} IN ('pending','accepted','declined','closed')`
    ),
    index("idx_mentorship_mentor_queue").on(table.mentorId, table.status),
  ]
);

export const donationCampaigns = pgTable(
  "donation_campaigns",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    schoolId: uuid("school_id")
      .notNull()
      .references(() => schools.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 200 }).notNull(),
    description: text("description"),
    goalAmount: integer("goal_amount").notNull(), // smallest currency unit
    currency: varchar("currency", { length: 3 }).notNull().default("GMD"),
    deadline: timestamp("deadline", { withTimezone: true }),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "donation_campaigns_goal_amount_check",
      sql`${table.goalAmount} > 0`
    ),
    check(
      "donation_campaigns_currency_check",
      sql`${table.currency} IN ('GMD','ZWL','USD')`
    ),
  ]
);

// ON DELETE RESTRICT (not CASCADE) — a campaign or school row should never be
// hard-deletable once real money has moved through it; that path goes through
// soft-delete/archival at the application layer instead.
export const donations = pgTable(
  "donations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    campaignId: uuid("campaign_id")
      .notNull()
      .references(() => donationCampaigns.id, { onDelete: "restrict" }),
    schoolId: uuid("school_id") // denormalized, see §2
      .notNull()
      .references(() => schools.id, { onDelete: "restrict" }),
    donorId: uuid("donor_id")
      .notNull()
      .references(() => users.id),
    amount: integer("amount").notNull(),
    currency: varchar("currency", { length: 3 }).notNull(),
    paymentMethod: varchar("payment_method", { length: 20 }).notNull(),
    paymentRef: varchar("payment_ref", { length: 255 }).unique(), // external transaction id; idempotency key
    isAnonymous: boolean("is_anonymous").notNull().default(false),
    status: varchar("status", { length: 20 }).notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check("donations_amount_check", sql`${table.amount} > 0`),
    check(
      "donations_payment_method_check",
      sql`${table.paymentMethod} IN ('wave','ecocash','paynow','stripe')`
    ),
    check(
      "donations_status_check",
      sql`${table.status} IN ('pending','completed','failed','refunded')`
    ),
    index("idx_donations_campaign_status").on(
      table.campaignId,
      table.status
    ),
  ]
);
