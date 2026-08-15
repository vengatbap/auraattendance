CREATE TABLE "payroll_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"payroll_run_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"salary_setting_id" uuid NOT NULL,
	"basic_salary" numeric(14, 2) NOT NULL,
	"present_days" numeric(5, 2) DEFAULT '0' NOT NULL,
	"paid_leave_days" numeric(5, 2) DEFAULT '0' NOT NULL,
	"unpaid_leave_days" numeric(5, 2) DEFAULT '0' NOT NULL,
	"absent_days" numeric(5, 2) DEFAULT '0' NOT NULL,
	"overtime_hours" numeric(5, 2) DEFAULT '0' NOT NULL,
	"overtime_amount" numeric(14, 2) DEFAULT '0' NOT NULL,
	"allowance_amount" numeric(14, 2) DEFAULT '0' NOT NULL,
	"deduction_amount" numeric(14, 2) DEFAULT '0' NOT NULL,
	"unpaid_absence_amount" numeric(14, 2) DEFAULT '0' NOT NULL,
	"gross_pay" numeric(14, 2) DEFAULT '0' NOT NULL,
	"net_pay" numeric(14, 2) DEFAULT '0' NOT NULL,
	"calculation_snapshot" jsonb NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "payroll_periods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"status" varchar(50) DEFAULT 'DRAFT' NOT NULL,
	"calculated_at" timestamp,
	"approved_at" timestamp,
	"paid_at" timestamp,
	"locked_at" timestamp,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"created_by" uuid,
	"updated_by" uuid,
	CONSTRAINT "payroll_periods_org_dates_unique" UNIQUE("organization_id","period_start","period_end")
);
--> statement-breakpoint
CREATE TABLE "payroll_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"payroll_period_id" uuid NOT NULL,
	"status" varchar(50) DEFAULT 'DRAFT' NOT NULL,
	"employee_count" integer DEFAULT 0 NOT NULL,
	"gross_total" numeric(14, 2) DEFAULT '0' NOT NULL,
	"deduction_total" numeric(14, 2) DEFAULT '0' NOT NULL,
	"net_total" numeric(14, 2) DEFAULT '0' NOT NULL,
	"calculated_at" timestamp,
	"approved_at" timestamp,
	"paid_at" timestamp,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "payslips" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"payroll_run_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"payroll_item_id" uuid NOT NULL,
	"payslip_number" varchar(100) NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"gross_pay" numeric(14, 2) NOT NULL,
	"total_deductions" numeric(14, 2) NOT NULL,
	"net_pay" numeric(14, 2) NOT NULL,
	"currency" varchar(3) NOT NULL,
	"status" varchar(50) DEFAULT 'LOCKED' NOT NULL,
	"issued_at" timestamp DEFAULT now(),
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"created_by" uuid,
	"updated_by" uuid,
	CONSTRAINT "payslips_org_number_unique" UNIQUE("organization_id","payslip_number")
);
--> statement-breakpoint
CREATE TABLE "salary_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"currency" varchar(3) NOT NULL,
	"pay_frequency" varchar(50) DEFAULT 'monthly' NOT NULL,
	"basic_salary" numeric(14, 2) NOT NULL,
	"overtime_rate" numeric(14, 2) DEFAULT '0' NOT NULL,
	"working_days_per_period" numeric(5, 2) DEFAULT '22' NOT NULL,
	"working_hours_per_day" numeric(5, 2) DEFAULT '8' NOT NULL,
	"fixed_allowances" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"fixed_deductions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"effective_from" date NOT NULL,
	"effective_to" date,
	"status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
ALTER TABLE "payroll_items" ADD CONSTRAINT "payroll_items_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_items" ADD CONSTRAINT "payroll_items_payroll_run_id_payroll_runs_id_fk" FOREIGN KEY ("payroll_run_id") REFERENCES "public"."payroll_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_items" ADD CONSTRAINT "payroll_items_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_items" ADD CONSTRAINT "payroll_items_salary_setting_id_salary_settings_id_fk" FOREIGN KEY ("salary_setting_id") REFERENCES "public"."salary_settings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_periods" ADD CONSTRAINT "payroll_periods_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_runs" ADD CONSTRAINT "payroll_runs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_runs" ADD CONSTRAINT "payroll_runs_payroll_period_id_payroll_periods_id_fk" FOREIGN KEY ("payroll_period_id") REFERENCES "public"."payroll_periods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_payroll_run_id_payroll_runs_id_fk" FOREIGN KEY ("payroll_run_id") REFERENCES "public"."payroll_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_payroll_item_id_payroll_items_id_fk" FOREIGN KEY ("payroll_item_id") REFERENCES "public"."payroll_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salary_settings" ADD CONSTRAINT "salary_settings_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salary_settings" ADD CONSTRAINT "salary_settings_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "payroll_items_org_idx" ON "payroll_items" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "payroll_items_run_idx" ON "payroll_items" USING btree ("payroll_run_id");--> statement-breakpoint
CREATE INDEX "payroll_items_emp_idx" ON "payroll_items" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "payroll_periods_org_idx" ON "payroll_periods" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "payroll_runs_org_idx" ON "payroll_runs" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "payroll_runs_period_idx" ON "payroll_runs" USING btree ("payroll_period_id");--> statement-breakpoint
CREATE INDEX "payslips_org_idx" ON "payslips" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "payslips_emp_idx" ON "payslips" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "salary_settings_org_idx" ON "salary_settings" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "salary_settings_emp_idx" ON "salary_settings" USING btree ("employee_id");