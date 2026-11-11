import {
  pgTable,
  uuid,
  varchar,
  boolean,
  integer,
  text,
  date,
  time,
  timestamp,
  smallint,
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
  // role: 'mahasiswa' | 'dosen' | 'admin'
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
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
  // status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'BLOCKED'
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

// ─── RELATIONS ────────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  bookings: many(bookings),
  approvalActions: many(bookingApprovalActions),
}))

export const laboratoriesRelations = relations(laboratories, ({ many }) => ({
  facilities: many(laboratoryFacilities),
  bookings: many(bookings),
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

// ─── TYPES ───────────────────────────────────────────────────────────────────

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Laboratory = typeof laboratories.$inferSelect
export type LaboratoryFacility = typeof laboratoryFacilities.$inferSelect
export type Booking = typeof bookings.$inferSelect
export type BookingApprovalAction = typeof bookingApprovalActions.$inferSelect
export type BookingStatusHistory = typeof bookingStatusHistory.$inferSelect
export type RoleCode = 'mahasiswa' | 'dosen' | 'admin'
export type BookingStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'BLOCKED'
