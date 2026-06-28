ALTER TABLE "employees" DROP CONSTRAINT "employees_employee_number_unique";--> statement-breakpoint
ALTER TABLE "employees" DROP CONSTRAINT "employees_cpr_unique";--> statement-breakpoint
ALTER TABLE "employees" ALTER COLUMN "employee_code" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "employees" ALTER COLUMN "government_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "employees" DROP COLUMN "employee_number";--> statement-breakpoint
ALTER TABLE "employees" DROP COLUMN "cpr";