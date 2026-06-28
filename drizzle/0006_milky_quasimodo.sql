ALTER TABLE "employees" ADD COLUMN "employee_code" varchar(100);--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "government_id" varchar(100);--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_employee_code_unique" UNIQUE("employee_code");--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_government_id_unique" UNIQUE("government_id");--> statement-breakpoint
UPDATE "employees" SET "employee_code" = "employee_number", "government_id" = "cpr";