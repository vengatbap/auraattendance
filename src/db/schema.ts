import { pgTable, varchar, text, timestamp, jsonb, doublePrecision, uuid, date, integer, boolean, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  status: varchar("status", { length: 50 }).notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: varchar("role", { length: 50 }).notNull().default("admin"), // "super_admin", "admin"
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
}, (table) => [
  index("users_organization_id_idx").on(table.organizationId),
]);

export const sites = pgTable("sites", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  radius: doublePrecision("radius").notNull().default(50), // in meters
  status: varchar("status", { length: 50 }).notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
}, (table) => [
  index("sites_organization_id_idx").on(table.organizationId),
]);

export const employees = pgTable("employees", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
  employeeNumber: varchar("employee_number", { length: 100 }).notNull().unique(),
  cpr: varchar("cpr", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  siteId: uuid("site_id").references(() => sites.id, { onDelete: "set null" }),
  department: varchar("department", { length: 255 }),
  designation: varchar("designation", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 255 }),
  status: varchar("status", { length: 50 }).notNull().default("active"), // "active", "inactive", "resigned"
  enrollmentPhoto: text("enrollment_photo"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
}, (table) => [
  index("employees_organization_id_idx").on(table.organizationId),
  index("employees_site_id_idx").on(table.siteId),
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
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
}, (table) => [
  index("attendance_logs_organization_id_idx").on(table.organizationId),
  index("attendance_logs_employee_date_idx").on(table.employeeId, table.date),
  index("attendance_logs_site_date_idx").on(table.siteId, table.date),
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
}, (table) => [
  index("sessions_organization_id_idx").on(table.organizationId),
  index("sessions_user_id_idx").on(table.userId),
]);

// Relations
export const employeeRelations = relations(employees, ({ many, one }) => ({
  faceProfiles: many(faceProfiles),
  attendanceLogs: many(attendanceLogs),
  site: one(sites, {
    fields: [employees.siteId],
    references: [sites.id],
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

export const siteRelations = relations(sites, ({ many }) => ({
  attendanceLogs: many(attendanceLogs),
}));
