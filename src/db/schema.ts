import {
  pgTable,
  uuid,
  varchar,
  boolean,
  integer,
  text,
  jsonb,
  date,
  time,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// ─── USERS / PROFILES ────────────────────────────────────────────────────────

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  fullName: varchar('full_name', { length: 150 }).notNull(),
  institutionalId: varchar('institutional_id', { length: 50 }).unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  role: varchar('role', { length: 20 }).notNull().default('mahasiswa'),
  // role: 'mahasiswa' | 'dosen' | 'aslab' | 'kaprodi' | 'pembina_lab' | 'admin'
  verificationStatus: varchar('verification_status', { length: 20 }).notNull().default('ACTIVE'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const emailVerificationTokens = pgTable('email_verification_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: varchar('token_hash', { length: 64 }).notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: varchar('token_hash', { length: 64 }).notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  actorUserId: uuid('actor_user_id').references(() => users.id),
  action: varchar('action', { length: 80 }).notNull(),
  targetType: varchar('target_type', { length: 40 }).notNull(),
  targetId: uuid('target_id'),
  reason: text('reason'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// ─── LABORATORIES ─────────────────────────────────────────────────────────────

export const laboratories = pgTable('laboratories', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 150 }).notNull(),
  location: varchar('location', { length: 255 }).notNull(),
  capacity: integer('capacity').notNull(),
  description: text('description'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const laboratoryFacilities = pgTable('laboratory_facilities', {
  id: uuid('id').defaultRandom().primaryKey(),
  laboratoryId: uuid('laboratory_id')
    .notNull()
    .references(() => laboratories.id, { onDelete: 'cascade' }),
  facilityName: varchar('facility_name', { length: 120 }).notNull(),
  details: text('details'),
  quantity: integer('quantity'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const laboratoryAssignments = pgTable('laboratory_assignments', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  laboratoryId: uuid('laboratory_id').notNull().references(() => laboratories.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  userLabUnique: unique('laboratory_assignments_user_lab_unique').on(table.userId, table.laboratoryId),
}))

// ─── BOOKINGS ─────────────────────────────────────────────────────────────────

export const bookings = pgTable('bookings', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  laboratoryId: uuid('laboratory_id')
    .notNull()
    .references(() => laboratories.id),
  bookingDate: date('booking_date').notNull(),
  startTime: time('start_time').notNull(),
  endTime: time('end_time').notNull(),
  purpose: text('purpose').notNull(),
  participantCount: integer('participant_count'),
  notes: text('notes'),
  status: varchar('status', { length: 20 }).notNull().default('PENDING'),
  // status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'BLOCKED' | 'IN_USE' | 'COMPLETED'
  keyTakenAt: timestamp('key_taken_at'),
  keyReturnedAt: timestamp('key_returned_at'),
  keyHandledByUserId: uuid('key_handled_by_user_id').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// ─── BOOKING APPROVAL ACTIONS ─────────────────────────────────────────────────

export const bookingApprovalActions = pgTable('booking_approval_actions', {
  id: uuid('id').defaultRandom().primaryKey(),
  bookingId: uuid('booking_id')
    .notNull()
    .references(() => bookings.id, { onDelete: 'cascade' }),
  approverUserId: uuid('approver_user_id')
    .notNull()
    .references(() => users.id),
  decision: varchar('decision', { length: 20 }).notNull(),
  // decision: 'APPROVED' | 'REJECTED'
  reason: text('reason'),
  decidedAt: timestamp('decided_at').notNull().defaultNow(),
})

// ─── BOOKING STATUS HISTORY ───────────────────────────────────────────────────

export const bookingStatusHistory = pgTable('booking_status_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  bookingId: uuid('booking_id')
    .notNull()
    .references(() => bookings.id, { onDelete: 'cascade' }),
  oldStatus: varchar('old_status', { length: 20 }),
  newStatus: varchar('new_status', { length: 20 }).notNull(),
  changedByUserId: uuid('changed_by_user_id').references(() => users.id),
  reason: text('reason'),
  changedAt: timestamp('changed_at').notNull().defaultNow(),
})

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────

export const notifications = pgTable('notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  type: varchar('type', { length: 50 }).notNull().default('INFO'),
  // type: 'INFO' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'NEW_BOOKING'
  link: varchar('link', { length: 255 }),
  isRead: boolean('is_read').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// ─── RELATIONS ────────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  bookings: many(bookings),
  approvalActions: many(bookingApprovalActions),
  notifications: many(notifications),
  laboratoryAssignments: many(laboratoryAssignments),
  emailVerificationTokens: many(emailVerificationTokens),
  passwordResetTokens: many(passwordResetTokens),
}))

export const emailVerificationTokensRelations = relations(emailVerificationTokens, ({ one }) => ({
  user: one(users, { fields: [emailVerificationTokens.userId], references: [users.id] }),
}))

export const passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
  user: one(users, { fields: [passwordResetTokens.userId], references: [users.id] }),
}))

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}))

export const laboratoriesRelations = relations(laboratories, ({ many }) => ({
  facilities: many(laboratoryFacilities),
  bookings: many(bookings),
  assignments: many(laboratoryAssignments),
}))

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  user: one(users, { fields: [bookings.userId], references: [users.id] }),
  laboratory: one(laboratories, {
    fields: [bookings.laboratoryId],
    references: [laboratories.id],
  }),
  approvalActions: many(bookingApprovalActions),
  statusHistory: many(bookingStatusHistory),
}))

export const laboratoryAssignmentsRelations = relations(laboratoryAssignments, ({ one }) => ({
  user: one(users, { fields: [laboratoryAssignments.userId], references: [users.id] }),
  laboratory: one(laboratories, { fields: [laboratoryAssignments.laboratoryId], references: [laboratories.id] }),
}))

// ─── TYPES ───────────────────────────────────────────────────────────────────

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type EmailVerificationToken = typeof emailVerificationTokens.$inferSelect
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect
export type Laboratory = typeof laboratories.$inferSelect
export type LaboratoryFacility = typeof laboratoryFacilities.$inferSelect
export type LaboratoryAssignment = typeof laboratoryAssignments.$inferSelect
export type Booking = typeof bookings.$inferSelect
export type BookingApprovalAction = typeof bookingApprovalActions.$inferSelect
export type BookingStatusHistory = typeof bookingStatusHistory.$inferSelect
export type Notification = typeof notifications.$inferSelect
export type NewNotification = typeof notifications.$inferInsert
export type RoleCode = 'mahasiswa' | 'dosen' | 'aslab' | 'kaprodi' | 'pembina_lab' | 'admin'
export type VerificationStatus = 'PENDING' | 'ACTIVE' | 'REJECTED'
export type BookingStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'BLOCKED' | 'IN_USE' | 'COMPLETED'
