CREATE TABLE "attendance_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"employee_id" uuid,
	"site_id" uuid,
	"client_event_id" varchar(255) NOT NULL,
	"event_type" varchar(50) NOT NULL,
	"outcome" varchar(30) NOT NULL,
	"captured_at" timestamp,
	"received_at" timestamp DEFAULT now() NOT NULL,
	"gps_latitude" double precision,
	"gps_longitude" double precision,
	"gps_distance_meters" double precision,
	"face_distance" double precision,
	"face_threshold" double precision,
	"face_match_passed" boolean,
	"device_info" text,
	"browser" varchar(255),
	"ip_address" varchar(100),
	"is_offline" boolean DEFAULT false NOT NULL,
	"flags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"warnings" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"result_snapshot" jsonb,
	"request_id" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "attendance_events_client_event_unique" UNIQUE("organization_id","client_event_id")
);
--> statement-breakpoint
ALTER TABLE "attendance_logs" ADD COLUMN "flags" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "attendance_logs" ADD COLUMN "request_id" varchar(100);--> statement-breakpoint
ALTER TABLE "attendance_logs" ADD COLUMN "is_offline" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "attendance_events" ADD CONSTRAINT "attendance_events_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_events" ADD CONSTRAINT "attendance_events_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_events" ADD CONSTRAINT "attendance_events_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "attendance_events_org_idx" ON "attendance_events" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "attendance_events_employee_idx" ON "attendance_events" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "attendance_events_created_idx" ON "attendance_events" USING btree ("organization_id","created_at");