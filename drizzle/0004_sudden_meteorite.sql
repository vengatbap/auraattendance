CREATE TABLE "login_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"organization_id" uuid,
	"ip_address" varchar(100),
	"user_agent" text,
	"status" varchar(50) NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"email" varchar(255) NOT NULL,
	"token" text NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_invitations_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "logo" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "favicon" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "primary_color" varchar(50) DEFAULT '#2563eb' NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "secondary_color" varchar(50) DEFAULT '#4f46e5' NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "login_background" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "sidebar_logo" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "company_name" varchar(255);--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "support_email" varchar(255);--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "timezone" varchar(100) DEFAULT 'UTC' NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "language" varchar(10) DEFAULT 'en' NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "date_format" varchar(50) DEFAULT 'YYYY-MM-DD' NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "is_onboarded" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "subscription_plan" varchar(50) DEFAULT 'trial' NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "trial_ends_at" timestamp;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "feature_flags" jsonb DEFAULT '{"face":true,"gps":true,"qr":false,"offline":true,"adjustments":true,"reports":true,"analytics":true}'::jsonb;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "attendance_mode" varchar(50) DEFAULT 'face_gps' NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "allow_multiple_punches" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "minimum_punch_gap_minutes" integer DEFAULT 30 NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "auto_checkout" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "auto_checkout_time" varchar(5) DEFAULT '23:59' NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "grace_period_minutes" integer DEFAULT 15 NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "late_after_time" varchar(5) DEFAULT '09:15' NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "face_match_threshold" double precision DEFAULT 0.6 NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "face_lighting_threshold" double precision DEFAULT 0.2 NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "face_min_size" integer DEFAULT 110 NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "face_capture_delay_seconds" integer DEFAULT 2 NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "face_retry_attempts" integer DEFAULT 3 NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "smtp_settings" jsonb;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "whatsapp_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "sms_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "reset_password_token" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "reset_password_expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "login_history" ADD CONSTRAINT "login_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "login_history" ADD CONSTRAINT "login_history_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_invitations" ADD CONSTRAINT "user_invitations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "login_history_user_id_idx" ON "login_history" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "login_history_organization_id_idx" ON "login_history" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "user_invitations_organization_id_idx" ON "user_invitations" USING btree ("organization_id");