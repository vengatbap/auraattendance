CREATE TABLE "attendance_adjustments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid,
	"attendance_log_id" uuid NOT NULL,
	"adjusted_by_user_id" uuid,
	"type" varchar(80) NOT NULL,
	"reason" text NOT NULL,
	"before" jsonb,
	"after" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "face_profile_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid,
	"face_profile_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"image_url" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(120) NOT NULL,
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "attendance_logs" ADD COLUMN "organization_id" uuid;--> statement-breakpoint
ALTER TABLE "attendance_logs" ADD COLUMN "gps_distance_meters" double precision;--> statement-breakpoint
ALTER TABLE "attendance_logs" ADD COLUMN "ip_address" varchar(100);--> statement-breakpoint
ALTER TABLE "attendance_logs" ADD COLUMN "punch_type" varchar(20);--> statement-breakpoint
ALTER TABLE "attendance_logs" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD COLUMN "organization_id" uuid;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "organization_id" uuid;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "face_profiles" ADD COLUMN "organization_id" uuid;--> statement-breakpoint
ALTER TABLE "face_profiles" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "face_profiles" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "face_profiles" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "organization_id" uuid;--> statement-breakpoint
ALTER TABLE "sites" ADD COLUMN "organization_id" uuid;--> statement-breakpoint
ALTER TABLE "sites" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "system_settings" ADD COLUMN "organization_id" uuid;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "organization_id" uuid;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "attendance_adjustments" ADD CONSTRAINT "attendance_adjustments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_adjustments" ADD CONSTRAINT "attendance_adjustments_attendance_log_id_attendance_logs_id_fk" FOREIGN KEY ("attendance_log_id") REFERENCES "public"."attendance_logs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_adjustments" ADD CONSTRAINT "attendance_adjustments_adjusted_by_user_id_users_id_fk" FOREIGN KEY ("adjusted_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "face_profile_images" ADD CONSTRAINT "face_profile_images_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "face_profile_images" ADD CONSTRAINT "face_profile_images_face_profile_id_face_profiles_id_fk" FOREIGN KEY ("face_profile_id") REFERENCES "public"."face_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "face_profile_images" ADD CONSTRAINT "face_profile_images_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "attendance_adjustments_organization_id_idx" ON "attendance_adjustments" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "attendance_adjustments_log_id_idx" ON "attendance_adjustments" USING btree ("attendance_log_id");--> statement-breakpoint
CREATE INDEX "face_profile_images_organization_id_idx" ON "face_profile_images" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "face_profile_images_employee_id_idx" ON "face_profile_images" USING btree ("employee_id");--> statement-breakpoint
ALTER TABLE "attendance_logs" ADD CONSTRAINT "attendance_logs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "face_profiles" ADD CONSTRAINT "face_profiles_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sites" ADD CONSTRAINT "sites_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "attendance_logs_organization_id_idx" ON "attendance_logs" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "attendance_logs_employee_date_idx" ON "attendance_logs" USING btree ("employee_id","date");--> statement-breakpoint
CREATE INDEX "attendance_logs_site_date_idx" ON "attendance_logs" USING btree ("site_id","date");--> statement-breakpoint
CREATE INDEX "audit_logs_organization_id_idx" ON "audit_logs" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs" USING btree ("entity","entity_id");--> statement-breakpoint
CREATE INDEX "employees_organization_id_idx" ON "employees" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "employees_site_id_idx" ON "employees" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "face_profiles_organization_id_idx" ON "face_profiles" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "face_profiles_employee_id_idx" ON "face_profiles" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "sessions_organization_id_idx" ON "sessions" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sites_organization_id_idx" ON "sites" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "system_settings_organization_id_idx" ON "system_settings" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "users_organization_id_idx" ON "users" USING btree ("organization_id");