ALTER TABLE "alumni_profiles" ALTER COLUMN "visibility" SET DEFAULT '{"city": true, "profession": true, "bio": true, "employer": false, "linkedin": true, "photo": true, "studying": true, "activities": true, "memories": true}'::jsonb;--> statement-breakpoint
ALTER TABLE "alumni_profiles" ADD COLUMN "industry" varchar(50);--> statement-breakpoint
ALTER TABLE "alumni_profiles" ADD COLUMN "studying" varchar(200);--> statement-breakpoint
ALTER TABLE "alumni_profiles" ADD COLUMN "school_activities" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "alumni_profiles" ADD COLUMN "school_memories" text[] DEFAULT '{}'::text[] NOT NULL;