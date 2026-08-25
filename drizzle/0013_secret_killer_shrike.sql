CREATE TABLE "attendance_credentials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"pin_hash" varchar(255),
	"enabled" boolean DEFAULT true NOT NULL,
	"failed_attempts" integer DEFAULT 0 NOT NULL,
	"locked_until" timestamp,
	"last_used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "attendance_credentials_emp_unique" UNIQUE("employee_id")
);
--> statement-breakpoint
ALTER TABLE "attendance_events" ADD COLUMN "authentication_method" varchar(50) DEFAULT 'FACE' NOT NULL;--> statement-breakpoint
ALTER TABLE "attendance_events" ADD COLUMN "authentication_result" varchar(50) DEFAULT 'VERIFIED' NOT NULL;--> statement-breakpoint
ALTER TABLE "attendance_events" ADD COLUMN "performed_by" uuid;--> statement-breakpoint
ALTER TABLE "attendance_logs" ADD COLUMN "authentication_method" varchar(50) DEFAULT 'FACE' NOT NULL;--> statement-breakpoint
ALTER TABLE "attendance_logs" ADD COLUMN "authentication_result" varchar(50) DEFAULT 'VERIFIED' NOT NULL;--> statement-breakpoint
ALTER TABLE "attendance_logs" ADD COLUMN "performed_by" uuid;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "attendance_credentials" ADD CONSTRAINT "attendance_credentials_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_credentials" ADD CONSTRAINT "attendance_credentials_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "attendance_credentials_org_idx" ON "attendance_credentials" USING btree ("organization_id");--> statement-breakpoint
ALTER TABLE "attendance_events" ADD CONSTRAINT "attendance_events_performed_by_users_id_fk" FOREIGN KEY ("performed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_logs" ADD CONSTRAINT "attendance_logs_performed_by_users_id_fk" FOREIGN KEY ("performed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;