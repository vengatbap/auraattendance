import { pgTable, varchar, text, timestamp, jsonb, doublePrecision, uuid, date, integer, boolean, index, unique, numeric } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

export type Status = "ACTIVE" | "INACTIVE" | "ARCHIVED";

export const auditColumns = {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id"),
  status: varchar("status", { length: 30 }).$type<Status>().default("ACTIVE"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  deletedAt: timestamp("deleted_at"),
  createdBy: uuid("created_by"),
  updatedBy: uuid("updated_by"),
};

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  status: varchar("status", { length: 50 }).notNull().default("active"),
  logo: text("logo"),
  favicon: text("favicon"),
  primaryColor: varchar("primary_color", { length: 50 }).notNull().default("#2563eb"),
  secondaryColor: varchar("secondary_color", { length: 50 }).notNull().default("#4f46e5"),
  loginBackground: text("login_background"),
  sidebarLogo: text("sidebar_logo"),
  companyName: varchar("company_name", { length: 255 }),
  supportEmail: varchar("support_email", { length: 255 }),
  timezone: varchar("timezone", { length: 100 }).notNull().default("UTC"),
  language: varchar("language", { length: 10 }).notNull().default("en"),
  dateFormat: varchar("date_format", { length: 50 }).notNull().default("YYYY-MM-DD"),
  isOnboarded: boolean("is_onboarded").notNull().default(false),
  subscriptionPlan: varchar("subscription_plan", { length: 50 }).notNull().default("trial"),
  trialEndsAt: timestamp("trial_ends_at"),
  featureFlags: jsonb("feature_flags").default({
    face: true,
    gps: true,
    qr: false,
    offline: true,
    adjustments: true,
    reports: true,
    analytics: true
  }),
  // Attendance configurations
  attendanceMode: varchar("attendance_mode", { length: 50 }).notNull().default("face_gps"),
  allowMultiplePunches: boolean("allow_multiple_punches").notNull().default(true),
  minimumPunchGapMinutes: integer("minimum_punch_gap_minutes").notNull().default(30),
  autoCheckout: boolean("auto_checkout").notNull().default(false),
  autoCheckoutTime: varchar("auto_checkout_time", { length: 5 }).notNull().default("23:59"),
  gracePeriodMinutes: integer("grace_period_minutes").notNull().default(15),
  lateAfterTime: varchar("late_after_time", { length: 5 }).notNull().default("09:15"),
  // Face settings
  faceMatchThreshold: doublePrecision("face_match_threshold").notNull().default(0.6),
  faceLightingThreshold: doublePrecision("face_lighting_threshold").notNull().default(0.2),
  faceMinSize: integer("face_min_size").notNull().default(110),
  faceCaptureDelaySeconds: integer("face_capture_delay_seconds").notNull().default(2),
  faceRetryAttempts: integer("face_retry_attempts").notNull().default(3),
  // Future integrations
  smtpSettings: jsonb("smtp_settings"),
  whatsappEnabled: boolean("whatsapp_enabled").notNull().default(false),
  smsEnabled: boolean("sms_enabled").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
  version: integer("version").default(1).notNull(),
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: varchar("role", { length: 50 }).notNull().default("admin"), // "super_admin", "admin"
  name: varchar("name", { length: 255 }).notNull(),
  isPlatformUser: boolean("is_platform_user").default(false).notNull(),
  resetPasswordToken: text("reset_password_token"),
  resetPasswordExpiresAt: timestamp("reset_password_expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
  version: integer("version").default(1).notNull(),
}, (table) => [
  index("users_organization_id_idx").on(table.organizationId),
]);

export const userInvitations = pgTable("user_invitations", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  email: varchar("email", { length: 255 }).notNull(),
  token: text("token").notNull().unique(),
  status: varchar("status", { length: 50 }).notNull().default("pending"), // "pending", "accepted", "expired"
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  version: integer("version").default(1).notNull(),
}, (table) => [
  index("user_invitations_organization_id_idx").on(table.organizationId),
]);

export const loginHistory = pgTable("login_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
  ipAddress: varchar("ip_address", { length: 100 }),
  userAgent: text("user_agent"),
  status: varchar("status", { length: 50 }).notNull(), // "success", "failed"
  timestamp: timestamp("timestamp").defaultNow().notNull(),
}, (table) => [
  index("login_history_user_id_idx").on(table.userId),
  index("login_history_organization_id_idx").on(table.organizationId),
]);

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 50 }).notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
  version: integer("version").default(1).notNull(),
}, (table) => [
  index("projects_organization_id_idx").on(table.organizationId),
]);

export const sites = pgTable("sites", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  radius: doublePrecision("radius").notNull().default(50), // in meters
  status: varchar("status", { length: 50 }).notNull().default("active"),
  allowedDevices: varchar("allowed_devices", { length: 50 }).notNull().default("both"), // "browser", "kiosk", "tablet", "both"
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
  version: integer("version").default(1).notNull(),
}, (table) => [
  index("sites_organization_id_idx").on(table.organizationId),
  index("sites_project_id_idx").on(table.projectId),
]);

export const departments = pgTable("departments", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  status: varchar("status", { length: 50 }).notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
  version: integer("version").default(1).notNull(),
}, (table) => [
  index("departments_organization_id_idx").on(table.organizationId),
]);

export const employees = pgTable("employees", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
  employeeCode: varchar("employee_code", { length: 100 }).notNull().unique(),
  governmentId: varchar("government_id", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  siteId: uuid("site_id").references(() => sites.id, { onDelete: "set null" }),
  department: varchar("department", { length: 255 }),
  departmentId: uuid("department_id").references(() => departments.id, { onDelete: "set null" }),
  designation: varchar("designation", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 255 }),
  status: varchar("status", { length: 50 }).notNull().default("active"), // "active", "inactive", "suspended", "resigned"
  isActive: boolean("is_active").notNull().default(true),
  enrollmentPhoto: text("enrollment_photo"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
  version: integer("version").default(1).notNull(),
}, (table) => [
  index("employees_organization_id_idx").on(table.organizationId),
  index("employees_site_id_idx").on(table.siteId),
  index("employees_department_id_idx").on(table.departmentId),
]);

export const faceProfiles = pgTable("face_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
  employeeId: uuid("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  embedding: jsonb("embedding").notNull(), // Store as array of numbers
  version: integer("version").notNull().default(1),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
}, (table) => [
  index("face_profiles_organization_id_idx").on(table.organizationId),
  index("face_profiles_employee_id_idx").on(table.employeeId),
]);

export const faceProfileImages = pgTable("face_profile_images", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
  faceProfileId: uuid("face_profile_id").notNull().references(() => faceProfiles.id, { onDelete: "cascade" }),
  employeeId: uuid("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  imageUrl: text("image_url").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("face_profile_images_organization_id_idx").on(table.organizationId),
  index("face_profile_images_employee_id_idx").on(table.employeeId),
]);

export const attendanceLogs = pgTable("attendance_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
  employeeId: uuid("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  siteId: uuid("site_id").references(() => sites.id),
  date: date("date").notNull(),
  checkInTime: timestamp("check_in_time"),
  checkOutTime: timestamp("check_out_time"),
  status: varchar("status", { length: 50 }).notNull().default("present"), // "present", "late", "absent"
  deviceInfo: text("device_info"),
  browser: varchar("browser", { length: 255 }),
  photoUrl: text("photo_url"),
  confidenceScore: doublePrecision("confidence_score"),
  gpsDistanceMeters: doublePrecision("gps_distance_meters"),
  gpsLatitude: doublePrecision("gps_latitude"),
  gpsLongitude: doublePrecision("gps_longitude"),
  ipAddress: varchar("ip_address", { length: 100 }),
  punchType: varchar("punch_type", { length: 20 }), // "in", "out"
  flags: jsonb("flags").default(sql`'[]'::jsonb`).notNull(),
  requestId: varchar("request_id", { length: 100 }),
  isOffline: boolean("is_offline").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
  version: integer("version").default(1).notNull(),
}, (table) => [
  index("attendance_logs_organization_id_idx").on(table.organizationId),
  index("attendance_logs_employee_date_idx").on(table.employeeId, table.date),
  index("attendance_logs_site_date_idx").on(table.siteId, table.date),
]);

export const attendanceEvents = pgTable("attendance_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id),
  employeeId: uuid("employee_id").references(() => employees.id),
  siteId: uuid("site_id").references(() => sites.id),
  clientEventId: varchar("client_event_id", { length: 255 }).notNull(),
  eventType: varchar("event_type", { length: 50 }).notNull(),
  outcome: varchar("outcome", { length: 30 }).notNull(),
  capturedAt: timestamp("captured_at"),
  receivedAt: timestamp("received_at").defaultNow().notNull(),
  gpsLatitude: doublePrecision("gps_latitude"),
  gpsLongitude: doublePrecision("gps_longitude"),
  gpsDistanceMeters: doublePrecision("gps_distance_meters"),
  faceDistance: doublePrecision("face_distance"),
  faceThreshold: doublePrecision("face_threshold"),
  faceMatchPassed: boolean("face_match_passed"),
  deviceInfo: text("device_info"),
  browser: varchar("browser", { length: 255 }),
  ipAddress: varchar("ip_address", { length: 100 }),
  isOffline: boolean("is_offline").default(false).notNull(),
  flags: jsonb("flags").default(sql`'[]'::jsonb`).notNull(),
  warnings: jsonb("warnings").default(sql`'[]'::jsonb`).notNull(),
  resultSnapshot: jsonb("result_snapshot"),
  requestId: varchar("request_id", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("attendance_events_org_idx").on(table.organizationId),
  index("attendance_events_employee_idx").on(table.employeeId),
  index("attendance_events_created_idx").on(table.organizationId, table.createdAt),
  unique("attendance_events_client_event_unique").on(table.organizationId, table.clientEventId),
]);

export const attendanceAdjustments = pgTable("attendance_adjustments", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
  attendanceLogId: uuid("attendance_log_id").notNull().references(() => attendanceLogs.id, { onDelete: "cascade" }),
  adjustedByUserId: uuid("adjusted_by_user_id").references(() => users.id, { onDelete: "set null" }),
  type: varchar("type", { length: 80 }).notNull(),
  reason: text("reason").notNull(),
  before: jsonb("before"),
  after: jsonb("after"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("attendance_adjustments_organization_id_idx").on(table.organizationId),
  index("attendance_adjustments_log_id_idx").on(table.attendanceLogId),
]);

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  action: varchar("action", { length: 255 }).notNull(),
  entity: varchar("entity", { length: 100 }).notNull(),
  entityId: uuid("entity_id"),
  details: jsonb("details"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("audit_logs_organization_id_idx").on(table.organizationId),
  index("audit_logs_entity_idx").on(table.entity, table.entityId),
]);

export const systemSettings = pgTable("system_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
  key: varchar("key", { length: 255 }).notNull().unique(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  version: integer("version").default(1).notNull(),
}, (table) => [
  index("system_settings_organization_id_idx").on(table.organizationId),
]);

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  version: integer("version").default(1).notNull(),
}, (table) => [
  index("sessions_organization_id_idx").on(table.organizationId),
  index("sessions_user_id_idx").on(table.userId),
]);

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
  plan: varchar("plan", { length: 50 }).notNull(), // "trial", "standard", "enterprise"
  status: varchar("status", { length: 50 }).notNull().default("active"),
  trialEndsAt: timestamp("trial_ends_at"),
  startsAt: timestamp("starts_at").defaultNow(),
  endsAt: timestamp("ends_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  version: integer("version").default(1).notNull(),
}, (table) => [
  index("subscriptions_organization_id_idx").on(table.organizationId),
]);

export const employeeRelations = relations(employees, ({ many, one }) => ({
  faceProfiles: many(faceProfiles),
  attendanceLogs: many(attendanceLogs),
  site: one(sites, {
    fields: [employees.siteId],
    references: [sites.id],
  }),
  department: one(departments, {
    fields: [employees.departmentId],
    references: [departments.id],
  }),
}));

export const faceProfileRelations = relations(faceProfiles, ({ one }) => ({
  employee: one(employees, {
    fields: [faceProfiles.employeeId],
    references: [employees.id],
  }),
}));

export const attendanceLogRelations = relations(attendanceLogs, ({ one }) => ({
  employee: one(employees, {
    fields: [attendanceLogs.employeeId],
    references: [employees.id],
  }),
  site: one(sites, {
    fields: [attendanceLogs.siteId],
    references: [sites.id],
  }),
}));

export const projectRelations = relations(projects, ({ many }) => ({
  sites: many(sites),
}));

export const siteRelations = relations(sites, ({ one, many }) => ({
  attendanceLogs: many(attendanceLogs),
  project: one(projects, {
    fields: [sites.projectId],
    references: [projects.id],
  }),
}));

export const departmentRelations = relations(departments, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [departments.organizationId],
    references: [organizations.id],
  }),
  employees: many(employees),
}));

export const attendanceEventRelations = relations(attendanceEvents, ({ one }) => ({
  employee: one(employees, {
    fields: [attendanceEvents.employeeId],
    references: [employees.id],
  }),
  site: one(sites, {
    fields: [attendanceEvents.siteId],
    references: [sites.id],
  }),
  organization: one(organizations, {
    fields: [attendanceEvents.organizationId],
    references: [organizations.id],
  }),
}));

export const leaveTypes = pgTable("leave_types", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  code: varchar("code", { length: 50 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  isPaid: boolean("is_paid").notNull().default(true),
  annualAllowance: doublePrecision("annual_allowance").notNull().default(0),
  carryForwardAllowed: boolean("carry_forward_allowed").notNull().default(false),
  maxCarryForward: doublePrecision("max_carry_forward").notNull().default(0),
  requiresApproval: boolean("requires_approval").notNull().default(true),
  requiresAttachment: boolean("requires_attachment").notNull().default(false),
  status: varchar("status", { length: 50 }).notNull().default("ACTIVE"),
  version: integer("version").default(1).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
  createdBy: uuid("created_by"),
  updatedBy: uuid("updated_by"),
}, (table) => [
  index("leave_types_org_idx").on(table.organizationId),
  unique("leave_types_org_code_unique").on(table.organizationId, table.code),
]);

export const leaveBalances = pgTable("leave_balances", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  employeeId: uuid("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  leaveTypeId: uuid("leave_type_id").notNull().references(() => leaveTypes.id, { onDelete: "cascade" }),
  year: integer("year").notNull(),
  allocatedDays: doublePrecision("allocated_days").notNull().default(0),
  usedDays: doublePrecision("used_days").notNull().default(0),
  pendingDays: doublePrecision("pending_days").notNull().default(0),
  status: varchar("status", { length: 50 }).notNull().default("ACTIVE"),
  version: integer("version").default(1).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
  createdBy: uuid("created_by"),
  updatedBy: uuid("updated_by"),
}, (table) => [
  index("leave_balances_org_idx").on(table.organizationId),
  index("leave_balances_employee_idx").on(table.employeeId),
  unique("leave_balances_org_emp_type_year_unique").on(table.organizationId, table.employeeId, table.leaveTypeId, table.year),
]);

export const leaveRequests = pgTable("leave_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  employeeId: uuid("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  leaveTypeId: uuid("leave_type_id").notNull().references(() => leaveTypes.id, { onDelete: "cascade" }),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  requestedDays: doublePrecision("requested_days").notNull(),
  reason: text("reason").notNull(),
  attachmentUrl: text("attachment_url"),
  status: varchar("status", { length: 50 }).notNull().default("DRAFT"), // DRAFT, PENDING, APPROVED, REJECTED, CANCELLED
  submittedAt: timestamp("submitted_at"),
  approvedAt: timestamp("approved_at"),
  approvedBy: uuid("approved_by").references(() => users.id, { onDelete: "set null" }),
  rejectedAt: timestamp("rejected_at"),
  rejectedBy: uuid("rejected_by").references(() => users.id, { onDelete: "set null" }),
  rejectionReason: text("rejection_reason"),
  cancelledAt: timestamp("cancelled_at"),
  cancelledBy: uuid("cancelled_by").references(() => users.id, { onDelete: "set null" }),
  version: integer("version").default(1).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
  createdBy: uuid("created_by"),
  updatedBy: uuid("updated_by"),
}, (table) => [
  index("leave_requests_org_idx").on(table.organizationId),
  index("leave_requests_employee_idx").on(table.employeeId),
  index("leave_requests_status_idx").on(table.organizationId, table.status),
  index("leave_requests_dates_idx").on(table.organizationId, table.startDate, table.endDate),
]);

export const leaveTypeRelations = relations(leaveTypes, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [leaveTypes.organizationId],
    references: [organizations.id],
  }),
  balances: many(leaveBalances),
  requests: many(leaveRequests),
}));

export const leaveBalanceRelations = relations(leaveBalances, ({ one }) => ({
  organization: one(organizations, {
    fields: [leaveBalances.organizationId],
    references: [organizations.id],
  }),
  employee: one(employees, {
    fields: [leaveBalances.employeeId],
    references: [employees.id],
  }),
  leaveType: one(leaveTypes, {
    fields: [leaveBalances.leaveTypeId],
    references: [leaveTypes.id],
  }),
}));

export const leaveRequestRelations = relations(leaveRequests, ({ one }) => ({
  organization: one(organizations, {
    fields: [leaveRequests.organizationId],
    references: [organizations.id],
  }),
  employee: one(employees, {
    fields: [leaveRequests.employeeId],
    references: [employees.id],
  }),
  leaveType: one(leaveTypes, {
    fields: [leaveRequests.leaveTypeId],
    references: [leaveTypes.id],
  }),
  approver: one(users, {
    fields: [leaveRequests.approvedBy],
    references: [users.id],
  }),
  rejecter: one(users, {
    fields: [leaveRequests.rejectedBy],
    references: [users.id],
  }),
  canceller: one(users, {
    fields: [leaveRequests.cancelledBy],
    references: [users.id],
  }),
}));

export const salarySettings = pgTable("salary_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  employeeId: uuid("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  currency: varchar("currency", { length: 3 }).notNull(),
  payFrequency: varchar("pay_frequency", { length: 50 }).notNull().default("monthly"),
  basicSalary: numeric("basic_salary", { precision: 14, scale: 2 }).notNull(),
  overtimeRate: numeric("overtime_rate", { precision: 14, scale: 2 }).notNull().default("0"),
  workingDaysPerPeriod: numeric("working_days_per_period", { precision: 5, scale: 2 }).notNull().default("22"),
  workingHoursPerDay: numeric("working_hours_per_day", { precision: 5, scale: 2 }).notNull().default("8"),
  fixedAllowances: jsonb("fixed_allowances").default(sql`'[]'::jsonb`).notNull(),
  fixedDeductions: jsonb("fixed_deductions").default(sql`'[]'::jsonb`).notNull(),
  effectiveFrom: date("effective_from").notNull(),
  effectiveTo: date("effective_to"),
  status: varchar("status", { length: 50 }).notNull().default("ACTIVE"),
  version: integer("version").default(1).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
  createdBy: uuid("created_by"),
  updatedBy: uuid("updated_by"),
}, (table) => [
  index("salary_settings_org_idx").on(table.organizationId),
  index("salary_settings_emp_idx").on(table.employeeId),
]);

export const payrollPeriods = pgTable("payroll_periods", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  periodStart: date("period_start").notNull(),
  periodEnd: date("period_end").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("DRAFT"), // DRAFT, CALCULATING, REVIEW, APPROVED, PAID, LOCKED, CANCELLED
  calculatedAt: timestamp("calculated_at"),
  approvedAt: timestamp("approved_at"),
  paidAt: timestamp("paid_at"),
  lockedAt: timestamp("locked_at"),
  version: integer("version").default(1).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
  createdBy: uuid("created_by"),
  updatedBy: uuid("updated_by"),
}, (table) => [
  index("payroll_periods_org_idx").on(table.organizationId),
  unique("payroll_periods_org_dates_unique").on(table.organizationId, table.periodStart, table.periodEnd),
]);

export const payrollRuns = pgTable("payroll_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  payrollPeriodId: uuid("payroll_period_id").notNull().references(() => payrollPeriods.id, { onDelete: "cascade" }),
  status: varchar("status", { length: 50 }).notNull().default("DRAFT"),
  employeeCount: integer("employee_count").notNull().default(0),
  grossTotal: numeric("gross_total", { precision: 14, scale: 2 }).notNull().default("0"),
  deductionTotal: numeric("deduction_total", { precision: 14, scale: 2 }).notNull().default("0"),
  netTotal: numeric("net_total", { precision: 14, scale: 2 }).notNull().default("0"),
  calculatedAt: timestamp("calculated_at"),
  approvedAt: timestamp("approved_at"),
  paidAt: timestamp("paid_at"),
  version: integer("version").default(1).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
  createdBy: uuid("created_by"),
  updatedBy: uuid("updated_by"),
}, (table) => [
  index("payroll_runs_org_idx").on(table.organizationId),
  index("payroll_runs_period_idx").on(table.payrollPeriodId),
]);

export const payrollItems = pgTable("payroll_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  payrollRunId: uuid("payroll_run_id").notNull().references(() => payrollRuns.id, { onDelete: "cascade" }),
  employeeId: uuid("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  salarySettingId: uuid("salary_setting_id").notNull().references(() => salarySettings.id, { onDelete: "cascade" }),
  basicSalary: numeric("basic_salary", { precision: 14, scale: 2 }).notNull(),
  presentDays: numeric("present_days", { precision: 5, scale: 2 }).notNull().default("0"),
  paidLeaveDays: numeric("paid_leave_days", { precision: 5, scale: 2 }).notNull().default("0"),
  unpaidLeaveDays: numeric("unpaid_leave_days", { precision: 5, scale: 2 }).notNull().default("0"),
  absentDays: numeric("absent_days", { precision: 5, scale: 2 }).notNull().default("0"),
  overtimeHours: numeric("overtime_hours", { precision: 5, scale: 2 }).notNull().default("0"),
  overtimeAmount: numeric("overtime_amount", { precision: 14, scale: 2 }).notNull().default("0"),
  allowanceAmount: numeric("allowance_amount", { precision: 14, scale: 2 }).notNull().default("0"),
  deductionAmount: numeric("deduction_amount", { precision: 14, scale: 2 }).notNull().default("0"),
  unpaidAbsenceAmount: numeric("unpaid_absence_amount", { precision: 14, scale: 2 }).notNull().default("0"),
  grossPay: numeric("gross_pay", { precision: 14, scale: 2 }).notNull().default("0"),
  netPay: numeric("net_pay", { precision: 14, scale: 2 }).notNull().default("0"),
  calculationSnapshot: jsonb("calculation_snapshot").notNull(),
  version: integer("version").default(1).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
  createdBy: uuid("created_by"),
  updatedBy: uuid("updated_by"),
}, (table) => [
  index("payroll_items_org_idx").on(table.organizationId),
  index("payroll_items_run_idx").on(table.payrollRunId),
  index("payroll_items_emp_idx").on(table.employeeId),
]);

export const payslips = pgTable("payslips", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  payrollRunId: uuid("payroll_run_id").notNull().references(() => payrollRuns.id, { onDelete: "cascade" }),
  employeeId: uuid("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  payrollItemId: uuid("payroll_item_id").notNull().references(() => payrollItems.id, { onDelete: "cascade" }),
  payslipNumber: varchar("payslip_number", { length: 100 }).notNull(),
  periodStart: date("period_start").notNull(),
  periodEnd: date("period_end").notNull(),
  grossPay: numeric("gross_pay", { precision: 14, scale: 2 }).notNull(),
  totalDeductions: numeric("total_deductions", { precision: 14, scale: 2 }).notNull(),
  netPay: numeric("net_pay", { precision: 14, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull(),
  status: varchar("status", { length: 50 }).notNull().default("LOCKED"),
  issuedAt: timestamp("issued_at").defaultNow(),
  version: integer("version").default(1).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
  createdBy: uuid("created_by"),
  updatedBy: uuid("updated_by"),
}, (table) => [
  index("payslips_org_idx").on(table.organizationId),
  index("payslips_emp_idx").on(table.employeeId),
  unique("payslips_org_number_unique").on(table.organizationId, table.payslipNumber),
]);

export const salarySettingRelations = relations(salarySettings, ({ one }) => ({
  organization: one(organizations, { fields: [salarySettings.organizationId], references: [organizations.id] }),
  employee: one(employees, { fields: [salarySettings.employeeId], references: [employees.id] }),
}));

export const payrollPeriodRelations = relations(payrollPeriods, ({ one, many }) => ({
  organization: one(organizations, { fields: [payrollPeriods.organizationId], references: [organizations.id] }),
  runs: many(payrollRuns),
}));

export const payrollRunRelations = relations(payrollRuns, ({ one, many }) => ({
  organization: one(organizations, { fields: [payrollRuns.organizationId], references: [organizations.id] }),
  period: one(payrollPeriods, { fields: [payrollRuns.payrollPeriodId], references: [payrollPeriods.id] }),
  items: many(payrollItems),
  payslips: many(payslips),
}));

export const payrollItemRelations = relations(payrollItems, ({ one }) => ({
  organization: one(organizations, { fields: [payrollItems.organizationId], references: [organizations.id] }),
  run: one(payrollRuns, { fields: [payrollItems.payrollRunId], references: [payrollRuns.id] }),
  employee: one(employees, { fields: [payrollItems.employeeId], references: [employees.id] }),
  salarySetting: one(salarySettings, { fields: [payrollItems.salarySettingId], references: [salarySettings.id] }),
}));

export const payslipRelations = relations(payslips, ({ one }) => ({
  organization: one(organizations, { fields: [payslips.organizationId], references: [organizations.id] }),
  run: one(payrollRuns, { fields: [payslips.payrollRunId], references: [payrollRuns.id] }),
  employee: one(employees, { fields: [payslips.employeeId], references: [employees.id] }),
  item: one(payrollItems, { fields: [payslips.payrollItemId], references: [payrollItems.id] }),
}));
