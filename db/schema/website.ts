// School Site & Admin — website content. See docs/edusaasSchemas.md §5.
import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { schools, users } from "./core";

// Structural/branding chrome. One row per school.
export const schoolSiteSettings = pgTable("school_site_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  schoolId: uuid("school_id")
    .notNull()
    .unique()
    .references(() => schools.id, { onDelete: "cascade" }),
  logoUrl: text("logo_url"),
  primaryColor: varchar("primary_color", { length: 7 }), // hex, e.g. "#1d9e75"
  secondaryColor: varchar("secondary_color", { length: 7 }),
  contentBlocks: jsonb("content_blocks").notNull().default(sql`'[]'::jsonb`), // ordered, toggleable sections
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Editable prose/media behind Hero, About, Contact — each independently draftable/publishable.
export const schoolSiteSections = pgTable(
  "school_site_sections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    schoolId: uuid("school_id")
      .notNull()
      .references(() => schools.id, { onDelete: "cascade" }),
    sectionKey: varchar("section_key", { length: 20 }).notNull(),
    draftData: jsonb("draft_data").notNull().default(sql`'{}'::jsonb`), // what the admin is currently editing
    publishedData: jsonb("published_data"), // last-published snapshot; null until first publish
    publishedAt: timestamp("published_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "school_site_sections_section_key_check",
      sql`${table.sectionKey} IN ('hero','about','contact')`
    ),
    uniqueIndex("uq_school_site_sections_school_key").on(
      table.schoolId,
      table.sectionKey
    ),
    index("idx_school_site_sections_school").on(table.schoolId),
  ]
);

// One compose flow, two possible audiences — public site and alumni feed read the same rows.
export const newsPosts = pgTable(
  "news_posts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    schoolId: uuid("school_id")
      .notNull()
      .references(() => schools.id, { onDelete: "cascade" }),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id),
    title: varchar("title", { length: 200 }).notNull(),
    coverImageUrl: text("cover_image_url"),
    body: text("body").notNull(),
    audience: varchar("audience", { length: 10 }).notNull().default("public"),
    // opt-in push; rate limit (2/week) enforced app-side, not here
    notifyWhatsapp: boolean("notify_whatsapp").notNull().default(false),
    status: varchar("status", { length: 10 }).notNull().default("draft"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "news_posts_audience_check",
      sql`${table.audience} IN ('public','alumni','both')`
    ),
    check(
      "news_posts_status_check",
      sql`${table.status} IN ('draft','published')`
    ),
    index("idx_news_posts_public_feed")
      .on(table.schoolId, table.publishedAt.desc())
      .where(
        sql`${table.status} = 'published' AND ${table.audience} IN ('public','both')`
      ),
    index("idx_news_posts_alumni_feed")
      .on(table.schoolId, table.publishedAt.desc())
      .where(
        sql`${table.status} = 'published' AND ${table.audience} IN ('alumni','both')`
      ),
  ]
);

export const galleryItems = pgTable(
  "gallery_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    schoolId: uuid("school_id")
      .notNull()
      .references(() => schools.id, { onDelete: "cascade" }),
    imageUrl: text("image_url").notNull(),
    caption: text("caption"),
    layoutSpan: varchar("layout_span", { length: 10 })
      .notNull()
      .default("normal"), // mirrors the public site's masonry grid classes
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "gallery_items_layout_span_check",
      sql`${table.layoutSpan} IN ('normal','tall','wide')`
    ),
    index("idx_gallery_items_school_order").on(
      table.schoolId,
      table.sortOrder
    ),
  ]
);

// Generic "Get in touch" box — simple message drop, no triage beyond new/responded.
export const siteContactMessages = pgTable(
  "site_contact_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    schoolId: uuid("school_id")
      .notNull()
      .references(() => schools.id, { onDelete: "cascade" }),
    fullName: varchar("full_name", { length: 150 }).notNull(),
    contactValue: varchar("contact_value", { length: 255 }).notNull(), // email or phone, single field
    message: text("message").notNull(),
    status: varchar("status", { length: 10 }).notNull().default("new"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "site_contact_messages_status_check",
      sql`${table.status} IN ('new','responded')`
    ),
    index("idx_site_contact_messages_inbox").on(
      table.schoolId,
      table.status,
      table.createdAt.desc()
    ),
  ]
);

// Backs the `/enquire` flow (V2, deliberately short — not a full application) and its admin inbox.
export const admissionEnquiries = pgTable(
  "admission_enquiries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    schoolId: uuid("school_id")
      .notNull()
      .references(() => schools.id, { onDelete: "cascade" }),
    enquirerType: varchar("enquirer_type", { length: 20 }).notNull(),
    fullName: varchar("full_name", { length: 150 }).notNull(),
    phone: text("phone").notNull(), // primary contact channel
    email: text("email"),
    gradeOfInterest: varchar("grade_of_interest", { length: 50 }),
    intendedStartTerm: varchar("intended_start_term", { length: 50 }),
    message: text("message"),
    status: varchar("status", { length: 10 }).notNull().default("new"),
    respondedBy: uuid("responded_by").references(() => users.id),
    respondedAt: timestamp("responded_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "admission_enquiries_enquirer_type_check",
      sql`${table.enquirerType} IN ('parent_guardian','prospective_student')`
    ),
    check(
      "admission_enquiries_status_check",
      sql`${table.status} IN ('new','responded')`
    ),
    index("idx_admission_enquiries_queue").on(
      table.schoolId,
      table.status,
      table.createdAt.desc()
    ),
  ]
);
