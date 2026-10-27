CREATE TABLE "schools" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" varchar(63) NOT NULL,
	"country" varchar(2) NOT NULL,
	"custom_domain" text,
	"domain_status" varchar(20) DEFAULT 'none' NOT NULL,
	"domain_verification_token" text,
	"domain_added_at" timestamp with time zone,
	"domain_activated_at" timestamp with time zone,
	"network" varchar(120),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "schools_slug_unique" UNIQUE("slug"),
	CONSTRAINT "schools_custom_domain_unique" UNIQUE("custom_domain"),
	CONSTRAINT "schools_domain_status_check" CHECK ("schools"."domain_status" IN ('none','pending_dns','pending_ssl','active','failed'))
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phone" text NOT NULL,
	"email" text,
	"name" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" varchar(20) NOT NULL,
	"school_id" uuid,
	"avatar_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_phone_unique" UNIQUE("phone"),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_role_check" CHECK ("users"."role" IN ('super_admin','school_admin','alumni')),
	CONSTRAINT "users_school_admin_requires_school_check" CHECK ("users"."role" != 'school_admin' OR "users"."school_id" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "admission_enquiries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"enquirer_type" varchar(20) NOT NULL,
	"full_name" varchar(150) NOT NULL,
	"phone" text NOT NULL,
	"email" text,
	"grade_of_interest" varchar(50),
	"intended_start_term" varchar(50),
	"message" text,
	"status" varchar(10) DEFAULT 'new' NOT NULL,
	"responded_by" uuid,
	"responded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admission_enquiries_enquirer_type_check" CHECK ("admission_enquiries"."enquirer_type" IN ('parent_guardian','prospective_student')),
	CONSTRAINT "admission_enquiries_status_check" CHECK ("admission_enquiries"."status" IN ('new','responded'))
);
--> statement-breakpoint
CREATE TABLE "gallery_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"image_url" text NOT NULL,
	"caption" text,
	"layout_span" varchar(10) DEFAULT 'normal' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "gallery_items_layout_span_check" CHECK ("gallery_items"."layout_span" IN ('normal','tall','wide'))
);
--> statement-breakpoint
CREATE TABLE "news_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	"title" varchar(200) NOT NULL,
	"cover_image_url" text,
	"body" text NOT NULL,
	"audience" varchar(10) DEFAULT 'public' NOT NULL,
	"notify_whatsapp" boolean DEFAULT false NOT NULL,
	"status" varchar(10) DEFAULT 'draft' NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "news_posts_audience_check" CHECK ("news_posts"."audience" IN ('public','alumni','both')),
	CONSTRAINT "news_posts_status_check" CHECK ("news_posts"."status" IN ('draft','published'))
);
--> statement-breakpoint
CREATE TABLE "school_site_sections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"section_key" varchar(20) NOT NULL,
	"draft_data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"published_data" jsonb,
	"published_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "school_site_sections_section_key_check" CHECK ("school_site_sections"."section_key" IN ('hero','about','contact'))
);
--> statement-breakpoint
CREATE TABLE "school_site_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"logo_url" text,
	"primary_color" varchar(7),
	"secondary_color" varchar(7),
	"content_blocks" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "school_site_settings_school_id_unique" UNIQUE("school_id")
);
--> statement-breakpoint
CREATE TABLE "site_contact_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"full_name" varchar(150) NOT NULL,
	"contact_value" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"status" varchar(10) DEFAULT 'new' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "site_contact_messages_status_check" CHECK ("site_contact_messages"."status" IN ('new','responded'))
);
--> statement-breakpoint
CREATE TABLE "alumni_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"school_id" uuid NOT NULL,
	"graduation_year" smallint NOT NULL,
	"class_section" varchar(100),
	"current_city" varchar(120),
	"current_country" varchar(2),
	"profession" varchar(150),
	"employer" varchar(150),
	"bio" text,
	"linkedin_url" text,
	"verification_status" varchar(20) DEFAULT 'unverified' NOT NULL,
	"verification_answer" text,
	"is_mentor" boolean DEFAULT false NOT NULL,
	"mentor_areas" text[] DEFAULT '{}'::text[] NOT NULL,
	"visibility" jsonb DEFAULT '{"city": true, "profession": true, "bio": true, "employer": false, "linkedin": false}'::jsonb NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "alumni_profiles_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "alumni_profiles_graduation_year_check" CHECK ("alumni_profiles"."graduation_year" BETWEEN 1950 AND date_part('year', now())::int + 1),
	CONSTRAINT "alumni_profiles_verification_status_check" CHECK ("alumni_profiles"."verification_status" IN ('unverified','pending','verified','rejected'))
);
--> statement-breakpoint
CREATE TABLE "alumni_verification_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"alumni_profile_id" uuid NOT NULL,
	"school_id" uuid NOT NULL,
	"verification_answer_snap" text NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"reviewed_by" uuid,
	"reviewer_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_at" timestamp with time zone,
	CONSTRAINT "alumni_verification_requests_status_check" CHECK ("alumni_verification_requests"."status" IN ('pending','approved','rejected'))
);
--> statement-breakpoint
CREATE TABLE "class_group_post_reactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"type" varchar(20) DEFAULT 'like' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "class_group_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"class_group_id" uuid NOT NULL,
	"school_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	"content" text NOT NULL,
	"image_url" text,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "class_group_posts_content_length_check" CHECK (char_length("class_group_posts"."content") <= 2000)
);
--> statement-breakpoint
CREATE TABLE "class_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"graduation_year" smallint NOT NULL,
	"name" varchar(50) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "donation_campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text,
	"goal_amount" integer NOT NULL,
	"currency" varchar(3) DEFAULT 'GMD' NOT NULL,
	"deadline" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "donation_campaigns_goal_amount_check" CHECK ("donation_campaigns"."goal_amount" > 0),
	CONSTRAINT "donation_campaigns_currency_check" CHECK ("donation_campaigns"."currency" IN ('GMD','ZWL','USD'))
);
--> statement-breakpoint
CREATE TABLE "donations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"school_id" uuid NOT NULL,
	"donor_id" uuid NOT NULL,
	"amount" integer NOT NULL,
	"currency" varchar(3) NOT NULL,
	"payment_method" varchar(20) NOT NULL,
	"payment_ref" varchar(255),
	"is_anonymous" boolean DEFAULT false NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "donations_payment_ref_unique" UNIQUE("payment_ref"),
	CONSTRAINT "donations_amount_check" CHECK ("donations"."amount" > 0),
	CONSTRAINT "donations_payment_method_check" CHECK ("donations"."payment_method" IN ('wave','ecocash','paynow','stripe')),
	CONSTRAINT "donations_status_check" CHECK ("donations"."status" IN ('pending','completed','failed','refunded'))
);
--> statement-breakpoint
CREATE TABLE "event_rsvps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"school_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"status" varchar(20) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "event_rsvps_status_check" CHECK ("event_rsvps"."status" IN ('going','maybe','not_going'))
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text,
	"event_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone,
	"location" varchar(255),
	"location_type" varchar(20) DEFAULT 'physical' NOT NULL,
	"virtual_link" text,
	"cover_image_url" text,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "events_location_type_check" CHECK ("events"."location_type" IN ('physical','virtual','hybrid')),
	CONSTRAINT "events_end_date_check" CHECK ("events"."end_date" IS NULL OR "events"."end_date" >= "events"."event_date")
);
--> statement-breakpoint
CREATE TABLE "mentorship_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"mentor_id" uuid NOT NULL,
	"requester_id" uuid NOT NULL,
	"area" varchar(50) NOT NULL,
	"message" text,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "mentorship_connections_status_check" CHECK ("mentorship_connections"."status" IN ('pending','accepted','declined','closed'))
);
--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_enquiries" ADD CONSTRAINT "admission_enquiries_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_enquiries" ADD CONSTRAINT "admission_enquiries_responded_by_users_id_fk" FOREIGN KEY ("responded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gallery_items" ADD CONSTRAINT "gallery_items_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news_posts" ADD CONSTRAINT "news_posts_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news_posts" ADD CONSTRAINT "news_posts_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school_site_sections" ADD CONSTRAINT "school_site_sections_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school_site_settings" ADD CONSTRAINT "school_site_settings_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_contact_messages" ADD CONSTRAINT "site_contact_messages_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alumni_profiles" ADD CONSTRAINT "alumni_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alumni_profiles" ADD CONSTRAINT "alumni_profiles_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alumni_verification_requests" ADD CONSTRAINT "alumni_verification_requests_alumni_profile_id_alumni_profiles_id_fk" FOREIGN KEY ("alumni_profile_id") REFERENCES "public"."alumni_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alumni_verification_requests" ADD CONSTRAINT "alumni_verification_requests_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alumni_verification_requests" ADD CONSTRAINT "alumni_verification_requests_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_group_post_reactions" ADD CONSTRAINT "class_group_post_reactions_post_id_class_group_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."class_group_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_group_post_reactions" ADD CONSTRAINT "class_group_post_reactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_group_posts" ADD CONSTRAINT "class_group_posts_class_group_id_class_groups_id_fk" FOREIGN KEY ("class_group_id") REFERENCES "public"."class_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_group_posts" ADD CONSTRAINT "class_group_posts_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_group_posts" ADD CONSTRAINT "class_group_posts_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_groups" ADD CONSTRAINT "class_groups_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donation_campaigns" ADD CONSTRAINT "donation_campaigns_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donations" ADD CONSTRAINT "donations_campaign_id_donation_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."donation_campaigns"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donations" ADD CONSTRAINT "donations_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donations" ADD CONSTRAINT "donations_donor_id_users_id_fk" FOREIGN KEY ("donor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_rsvps" ADD CONSTRAINT "event_rsvps_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_rsvps" ADD CONSTRAINT "event_rsvps_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_rsvps" ADD CONSTRAINT "event_rsvps_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentorship_connections" ADD CONSTRAINT "mentorship_connections_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentorship_connections" ADD CONSTRAINT "mentorship_connections_mentor_id_alumni_profiles_id_fk" FOREIGN KEY ("mentor_id") REFERENCES "public"."alumni_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentorship_connections" ADD CONSTRAINT "mentorship_connections_requester_id_users_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_users_school_admins" ON "users" USING btree ("school_id") WHERE "users"."role" = 'school_admin';--> statement-breakpoint
CREATE INDEX "idx_admission_enquiries_queue" ON "admission_enquiries" USING btree ("school_id","status","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_gallery_items_school_order" ON "gallery_items" USING btree ("school_id","sort_order");--> statement-breakpoint
CREATE INDEX "idx_news_posts_public_feed" ON "news_posts" USING btree ("school_id","published_at" DESC NULLS LAST) WHERE "news_posts"."status" = 'published' AND "news_posts"."audience" IN ('public','both');--> statement-breakpoint
CREATE INDEX "idx_news_posts_alumni_feed" ON "news_posts" USING btree ("school_id","published_at" DESC NULLS LAST) WHERE "news_posts"."status" = 'published' AND "news_posts"."audience" IN ('alumni','both');--> statement-breakpoint
CREATE UNIQUE INDEX "uq_school_site_sections_school_key" ON "school_site_sections" USING btree ("school_id","section_key");--> statement-breakpoint
CREATE INDEX "idx_school_site_sections_school" ON "school_site_sections" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "idx_site_contact_messages_inbox" ON "site_contact_messages" USING btree ("school_id","status","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_alumni_profiles_school_year" ON "alumni_profiles" USING btree ("school_id","graduation_year") WHERE "alumni_profiles"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_alumni_profiles_school_city" ON "alumni_profiles" USING btree ("school_id","current_city") WHERE "alumni_profiles"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_alumni_profiles_mentors" ON "alumni_profiles" USING btree ("school_id") WHERE "alumni_profiles"."is_mentor" = true AND "alumni_profiles"."deleted_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_alumni_verification_pending" ON "alumni_verification_requests" USING btree ("alumni_profile_id") WHERE "alumni_verification_requests"."status" = 'pending';--> statement-breakpoint
CREATE INDEX "idx_alumni_verification_school_queue" ON "alumni_verification_requests" USING btree ("school_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_class_group_post_reactions_post_user" ON "class_group_post_reactions" USING btree ("post_id","user_id");--> statement-breakpoint
CREATE INDEX "idx_class_group_posts_feed" ON "class_group_posts" USING btree ("class_group_id","created_at" DESC NULLS LAST) WHERE "class_group_posts"."deleted_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_class_groups_school_year" ON "class_groups" USING btree ("school_id","graduation_year");--> statement-breakpoint
CREATE INDEX "idx_donations_campaign_status" ON "donations" USING btree ("campaign_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_event_rsvps_event_user" ON "event_rsvps" USING btree ("event_id","user_id");--> statement-breakpoint
CREATE INDEX "idx_event_rsvps_event_status" ON "event_rsvps" USING btree ("event_id","status");--> statement-breakpoint
CREATE INDEX "idx_events_school_upcoming" ON "events" USING btree ("school_id","event_date") WHERE "events"."is_published" = true;--> statement-breakpoint
CREATE INDEX "idx_mentorship_mentor_queue" ON "mentorship_connections" USING btree ("mentor_id","status");