import { pgTable, text, varchar, serial, integer, primaryKey, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define database tables
export const walkingSlots = pgTable('walking_slots', {
  id: serial('id').primaryKey(),
  date: varchar('date', { length: 10 }).notNull(), // YYYY-MM-DD format
  time: varchar('time', { length: 4 }).notNull(),  // HHMM format (24-hour)
  name: text('name').notNull(),                    // Walker's name
  phone: text('phone'),                            // Walker's phone number (E.164 format)
  notes: text('notes'),                            // Optional notes
  timestamp: integer('timestamp').notNull(),       // Timestamp for when the slot was booked
});

export const walkerColors = pgTable('walker_colors', {
  name: text('name').primaryKey(),                 // Walker's name
  colorIndex: integer('color_index').notNull(),    // Color index (0-9)
  phone: text('phone'),                            // Walker's phone number (E.164 format)
});

// SMS audit table to prevent duplicate messages
export const smsAuditLog = pgTable('sms_audit_log', {
  id: serial('id').primaryKey(),
  messageHash: text('message_hash').notNull(),     // Hash of recipient + message content
  recipient: text('recipient').notNull(),          // SMS recipient
  messageType: text('message_type').notNull(),     // Type of message (booking, cancellation)
  messageContent: text('message_content').notNull(), // The actual message content
  slotDate: varchar('slot_date', { length: 10 }), // Related walking slot date
  slotTime: varchar('slot_time', { length: 4 }),  // Related walking slot time
  sentAt: timestamp('sent_at').defaultNow().notNull(), // When the SMS was sent
});

// WalkingSlot type matches the database schema
export type WalkingSlot = {
  date: string;       // YYYY-MM-DD format
  time: string;       // HHMM format (24-hour)
  name: string;       // Walker's name
  phone?: string;     // Walker's phone number (E.164 format)
  notes?: string;     // Optional notes
  timestamp: number;  // Timestamp for when the slot was booked
};

// Zod schemas with validation
export const insertSlotSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  time: z.string().regex(/^\d{4}$/, "Time must be in 24-hour HHMM format"),
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

export const deleteSlotSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  time: z.string().regex(/^\d{4}$/, "Time must be in 24-hour HHMM format"),
  name: z.string().min(1, "Name is required"),
});

export type InsertSlot = z.infer<typeof insertSlotSchema>;
export type DeleteSlot = z.infer<typeof deleteSlotSchema>;

export type DaySchedule = {
  date: string;
  slots: WalkingSlot[];
};

export type WeekSchedule = {
  [date: string]: WalkingSlot[];
};

// Walker type definition
export type Walker = {
  name: string;
  colorIndex: number;
  phone?: string;
};

// SMS Audit type definitions
export type SmsAuditRecord = {
  id: number;
  messageHash: string;
  recipient: string;
  messageType: string;
  messageContent: string;
  slotDate?: string;
  slotTime?: string;
  sentAt: Date;
};

export const insertSmsAuditSchema = z.object({
  messageHash: z.string(),
  recipient: z.string(),
  messageType: z.string(),
  messageContent: z.string(),
  slotDate: z.string().optional(),
  slotTime: z.string().optional(),
});

export type InsertSmsAudit = z.infer<typeof insertSmsAuditSchema>;
