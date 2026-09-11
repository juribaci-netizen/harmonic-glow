import { pgTable, primaryKey, text, timestamp, boolean, serial, integer, date, numeric } from "drizzle-orm/pg-core"

// ---------- Better Auth tables ----------
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
})

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
})

// ---------- App tables ----------
export const profile = pgTable("profile", {
  id: serial("id").primaryKey(),
  userId: text("userId").notNull().unique(),
  fullName: text("fullName"),
  instrument: text("instrument"),
  section: text("section"),
  position: text("position"),
  phone: text("phone"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const activity = pgTable("activity", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  type: text("type").notNull(),
  startTime: text("startTime"),
  endTime: text("endTime"),
  title: text("title").notNull(),
  conductor: text("conductor"),
  venue: text("venue"),
  program: text("program"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
})

export const timeEntry = pgTable("time_entry", {
  id: serial("id").primaryKey(),
  userId: text("userId").notNull(),
  activityId: integer("activityId"),
  date: date("date").notNull(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  startTime: text("startTime"),
  endTime: text("endTime"),
  hours: numeric("hours", { precision: 5, scale: 2 }).notNull().default("0"),
  status: text("status").notNull().default("present"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const concertVideo = pgTable("concert_video", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  date: date("date"),
  conductor: text("conductor"),
  venue: text("venue"),
  description: text("description"),
  url: text("url"),
  thumbnailUrl: text("thumbnailUrl"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
})

export const participationChoice = pgTable('participation_choice', {
  userId: text('user_id').notNull(),
  key: text('choice_key').notNull(),
  choice: text('choice').notNull(),
  updatedAt: timestamp('updated_at', {withTimezone:true}).notNull().defaultNow(),
}, table => [primaryKey({columns:[table.userId,table.key]})])
