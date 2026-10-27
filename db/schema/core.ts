// Core platform — schools and users. See docs/edusaasSchemas.md §3.
import { sql } from "drizzle-orm";
import {
  check,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const schools = pgTable(
  "schools",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: varchar("slug", { length: 63 }).notNull().unique(), // DNS-safe
    country: varchar("country", { length: 2 }).notNull(), // ISO 3166-1 alpha-2

    // custom domain (premium tier) — see docs/domainRoutingArchitecture.md §3
    customDomain: text("custom_domain").unique(),
    domainStatus: varchar("domain_status", { length: 20 })
      .notNull()
      .default("none"),
    domainVerificationToken: text("domain_verification_token"),
    domainAddedAt: timestamp("domain_added_at", { withTimezone: true }),
    domainActivatedAt: timestamp("domain_activated_at", {
      withTimezone: true,
    }),

    network: varchar("network", { length: 120 }), // nullable grouping tag, no routing implication

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "schools_domain_status_check",
      sql`${table.domainStatus} IN ('none','pending_dns','pending_ssl','active','failed')`
    ),
  ]
);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Sign-up needs at least one of phone/email (users_phone_or_email_check)
    phone: text("phone").unique(), // E.164, e.g. +2203121164
    email: text("email").unique(), // stored lowercase
    name: text("name").notNull(),
    passwordHash: text("password_hash"), // nullable: sign-in is phone/email OTP
    role: varchar("role", { length: 20 }).notNull(), // teacher/parent/student deferred to V2
    schoolId: uuid("school_id").references(() => schools.id, {
      onDelete: "cascade",
    }), // set only for school_admin; null for super_admin/alumni
    avatarUrl: text("avatar_url"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "users_role_check",
      sql`${table.role} IN ('super_admin','school_admin','alumni')`
    ),
    check(
      "users_school_admin_requires_school_check",
      sql`${table.role} != 'school_admin' OR ${table.schoolId} IS NOT NULL`
    ),
    check(
      "users_phone_or_email_check",
      sql`${table.phone} IS NOT NULL OR ${table.email} IS NOT NULL`
    ),
    index("idx_users_school_admins")
      .on(table.schoolId)
      .where(sql`${table.role} = 'school_admin'`),
  ]
);
