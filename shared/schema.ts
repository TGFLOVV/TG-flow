import {
  pgTable,
  text,
  varchar,
  timestamp,
  json,
  index,
  integer,
  decimal,
  boolean,
  unique,
  serial,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table for PostgreSQL session store (connect-pg-simple format)
export const sessions = pgTable("sessions", {
  sid: varchar("sid").primaryKey(),
  sess: json("sess").notNull(),
  expire: timestamp("expire").notNull(),
});

// User storage table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  password: varchar("password", { length: 255 }).default(""),
  firstName: varchar("first_name", { length: 255 }),
  lastName: varchar("last_name", { length: 255 }),
  profileImageUrl: text("profile_image_url"),
  googleId: varchar("google_id", { length: 255 }),
  telegramId: varchar("telegram_id", { length: 255 }),
  telegramUsername: varchar("telegram_username", { length: 255 }),
  telegramFirstName: varchar("telegram_first_name", { length: 255 }),
  telegramLastName: varchar("telegram_last_name", { length: 255 }),
  telegramPhotoUrl: text("telegram_photo_url"),
  role: varchar("role", { length: 50 }).notNull().default("user"),
  status: varchar("status", { length: 50 }).notNull().default("active"),
  balance: decimal("balance", { precision: 10, scale: 2 }).notNull().default("0.00"),
  emailVerificationCode: varchar("email_verification_code", { length: 255 }),
  emailVerificationExpires: timestamp("email_verification_expires"),
  isEmailVerified: boolean("is_email_verified").notNull().default(false),
  newEmail: varchar("new_email", { length: 255 }),
  starfieldEnabled: boolean("starfield_enabled").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  usernameIdx: unique().on(table.username),
  emailIdx: index("IDX_user_email").on(table.email),
}));

// Category storage table
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  icon: varchar("icon", { length: 255 }).notNull(),
  isAdult: boolean("is_adult").notNull().default(false),
  price: decimal("price", { precision: 10, scale: 2 }).notNull().default("30.00"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Channel storage table
export const channels = pgTable("channels", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  username: varchar("username", { length: 255 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  channelUrl: varchar("channel_url", { length: 255 }).notNull(),
  subscriberCount: integer("subscriber_count").default(0),
  categoryId: integer("category_id").references(() => categories.id).notNull(),
  ownerId: integer("owner_id").references(() => users.id).notNull(),
  imageUrl: text("image_url"),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  type: varchar("type", { length: 50 }).notNull().default("channel"),
  isTopPromoted: boolean("is_top_promoted").notNull().default(false),
  isUltraTopPromoted: boolean("is_ultra_top_promoted").notNull().default(false),
  topPromotionExpiry: timestamp("top_promotion_expiry"),
  ultraTopPromotionExpiry: timestamp("ultra_top_promotion_expiry"),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0.00"),
  ratingCount: integer("rating_count").default(0),
  views: integer("views").default(0),
  views24h: integer("views_24h").default(0),
  lastViewReset: timestamp("last_view_reset").defaultNow(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Channel application storage table
export const channelApplications = pgTable("channel_applications", {
  id: serial("id").primaryKey(),
  applicantId: integer("applicant_id").references(() => users.id).notNull(),
  channelName: varchar("channel_name", { length: 255 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  channelUrl: varchar("channel_url", { length: 255 }).notNull(),
  categoryId: integer("category_id").references(() => categories.id).notNull(),
  type: varchar("type", { length: 50 }).notNull().default("channel"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull().default("30.00"),
  isPaid: boolean("is_paid").notNull().default(false),
  imageUrl: text("image_url"),
  channelImage: text("channel_image"),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  reviewerId: integer("reviewer_id").references(() => users.id),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  statusIdx: index("IDX_application_status").on(table.status),
}));

// Payment storage table
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  description: text("description"),
  paymentUrl: text("payment_url"),
  paymentId: varchar("payment_id", { length: 255 }),
  transactionId: varchar("transaction_id", { length: 255 }),
  invoiceId: varchar("invoice_id", { length: 255 }),
  robokassaInvoiceId: varchar("robokassa_invoice_id", { length: 255 }).unique(),
  robokassaSignature: varchar("robokassa_signature", { length: 255 }),
  resultProcessed: boolean("result_processed").notNull().default(false),
  applicationId: integer("application_id").references(() => channelApplications.id),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Rating storage table
export const ratings = pgTable("ratings", {
  id: serial("id").primaryKey(),
  channelId: integer("channel_id").references(() => channels.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  rating: integer("rating").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  uniqueUserChannel: unique().on(table.channelId, table.userId),
}));

// Channel view storage table
export const channelViews = pgTable("channel_views", {
  id: serial("id").primaryKey(),
  channelId: integer("channel_id").references(() => channels.id).notNull(),
  userId: integer("user_id").references(() => users.id),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  channelIdIdx: index("IDX_view_channel").on(table.channelId),
  createdAtIdx: index("IDX_view_created").on(table.createdAt),
}));

// Bot storage table
export const bots = pgTable("bots", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  botUrl: varchar("bot_url", { length: 255 }).notNull(),
  categoryId: integer("category_id").references(() => categories.id).notNull(),
  ownerId: integer("owner_id").references(() => users.id).notNull(),
  imageUrl: text("image_url"),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0.00"),
  ratingCount: integer("rating_count").default(0),
  views: integer("views").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  statusIdx: index("IDX_bot_status").on(table.status),
}));

// Group storage table
export const groups = pgTable("groups", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  groupUrl: varchar("group_url", { length: 255 }).notNull(),
  categoryId: integer("category_id").references(() => categories.id).notNull(),
  ownerId: integer("owner_id").references(() => users.id).notNull(),
  imageUrl: text("image_url"),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  memberCount: integer("member_count").default(0),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0.00"),
  ratingCount: integer("rating_count").default(0),
  views: integer("views").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  statusIdx: index("IDX_group_status").on(table.status),
}));

// News storage table
export const news = pgTable("news", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  imageUrl: text("image_url"),
  authorId: integer("author_id").references(() => users.id).notNull(),
  status: varchar("status", { length: 50 }).notNull().default("draft"),
  views: integer("views").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Notification storage table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("IDX_notification_user").on(table.userId),
}));



// Withdrawal request storage table
export const withdrawalRequests = pgTable("withdrawal_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  method: varchar("method", { length: 50 }).notNull(),
  details: json("details").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  processedBy: integer("processed_by").references(() => users.id),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Support messages storage table
export const supportMessages = pgTable("support_messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  chatId: varchar("chat_id", { length: 255 }).notNull(),
  message: text("message").notNull(),
  isFromAdmin: boolean("is_from_admin").notNull().default(false),
  adminUserId: integer("admin_user_id").references(() => users.id),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const supportFiles = pgTable("support_files", {
  id: serial("id").primaryKey(),
  messageId: integer("message_id").references(() => supportMessages.id).notNull(),
  filename: varchar("filename", { length: 255 }).notNull(),
  originalName: varchar("original_name", { length: 255 }).notNull(),
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  fileData: text("file_data").notNull(),
  fileSize: integer("file_size").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  channels: many(channels),
  applications: many(channelApplications),
  payments: many(payments),
  bots: many(bots),
  groups: many(groups),
  news: many(news),
  notifications: many(notifications),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  channels: many(channels),
  applications: many(channelApplications),
  bots: many(bots),
  groups: many(groups),
}));

export const channelsRelations = relations(channels, ({ one }) => ({
  category: one(categories, {
    fields: [channels.categoryId],
    references: [categories.id],
  }),
  owner: one(users, {
    fields: [channels.ownerId],
    references: [users.id],
  }),
}));

export const applicationRelations = relations(channelApplications, ({ one }) => ({
  category: one(categories, {
    fields: [channelApplications.categoryId],
    references: [categories.id],
  }),
  applicant: one(users, {
    fields: [channelApplications.applicantId],
    references: [users.id],
  }),
  reviewer: one(users, {
    fields: [channelApplications.reviewerId],
    references: [users.id],
  }),
}));

export const botsRelations = relations(bots, ({ one }) => ({
  category: one(categories, {
    fields: [bots.categoryId],
    references: [categories.id],
  }),
  owner: one(users, {
    fields: [bots.ownerId],
    references: [users.id],
  }),
}));

export const groupsRelations = relations(groups, ({ one }) => ({
  category: one(categories, {
    fields: [groups.categoryId],
    references: [categories.id],
  }),
  owner: one(users, {
    fields: [groups.ownerId],
    references: [users.id],
  }),
}));

export const newsRelations = relations(news, ({ one }) => ({
  author: one(users, {
    fields: [news.authorId],
    references: [users.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  user: one(users, {
    fields: [payments.userId],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const ratingsRelations = relations(ratings, ({ one }) => ({
  channel: one(channels, {
    fields: [ratings.channelId],
    references: [channels.id],
  }),
  user: one(users, {
    fields: [ratings.userId],
    references: [users.id],
  }),
}));

export const channelViewsRelations = relations(channelViews, ({ one }) => ({
  channel: one(channels, {
    fields: [channelViews.channelId],
    references: [channels.id],
  }),
  user: one(users, {
    fields: [channelViews.userId],
    references: [users.id],
  }),
}));

export const withdrawalRequestsRelations = relations(withdrawalRequests, ({ one }) => ({
  user: one(users, {
    fields: [withdrawalRequests.userId],
    references: [users.id],
  }),
  processor: one(users, {
    fields: [withdrawalRequests.processedBy],
    references: [users.id],
  }),
}));

export const supportMessagesRelations = relations(supportMessages, ({ one, many }) => ({
  user: one(users, {
    fields: [supportMessages.userId],
    references: [users.id],
  }),
  admin: one(users, {
    fields: [supportMessages.adminUserId],
    references: [users.id],
  }),
  files: many(supportFiles),
}));

export const supportFilesRelations = relations(supportFiles, ({ one }) => ({
  message: one(supportMessages, {
    fields: [supportFiles.messageId],
    references: [supportMessages.id],
  }),
}));

// Type inference
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;
export type Channel = typeof channels.$inferSelect;
export type InsertChannel = typeof channels.$inferInsert;
export type ChannelApplication = typeof channelApplications.$inferSelect;
export type InsertChannelApplication = typeof channelApplications.$inferInsert;
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;
export type Rating = typeof ratings.$inferSelect;
export type InsertRating = typeof ratings.$inferInsert;
export type ChannelView = typeof channelViews.$inferSelect;
export type InsertChannelView = typeof channelViews.$inferInsert;
export type Bot = typeof bots.$inferSelect;
export type InsertBot = typeof bots.$inferInsert;
export type Group = typeof groups.$inferSelect;
export type InsertGroup = typeof groups.$inferInsert;
export type News = typeof news.$inferSelect;
export type InsertNews = typeof news.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
export type WithdrawalRequest = typeof withdrawalRequests.$inferSelect;
export type InsertWithdrawalRequest = typeof withdrawalRequests.$inferInsert;
export type SupportMessage = typeof supportMessages.$inferSelect;
export type InsertSupportMessage = typeof supportMessages.$inferInsert;
export type SupportFile = typeof supportFiles.$inferSelect;
export type InsertSupportFile = typeof supportFiles.$inferInsert;

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const selectUserSchema = createInsertSchema(users);
export const insertCategorySchema = createInsertSchema(categories).omit({ id: true, createdAt: true });
export const insertChannelSchema = createInsertSchema(channels).omit({ id: true, createdAt: true, updatedAt: true });
export const insertChannelApplicationSchema = createInsertSchema(channelApplications).omit({ id: true, createdAt: true, updatedAt: true, reviewerId: true, rejectionReason: true });
export const insertPaymentSchema = createInsertSchema(payments).omit({ id: true, createdAt: true });
export const insertBotSchema = createInsertSchema(bots).omit({ id: true, createdAt: true, updatedAt: true });
export const insertGroupSchema = createInsertSchema(groups).omit({ id: true, createdAt: true, updatedAt: true });
export const insertNewsSchema = createInsertSchema(news).omit({ id: true, createdAt: true, updatedAt: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true });
export const insertWithdrawalRequestSchema = createInsertSchema(withdrawalRequests).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSupportMessageSchema = createInsertSchema(supportMessages).omit({ id: true, createdAt: true });
export const insertSupportFileSchema = createInsertSchema(supportFiles).omit({ id: true, createdAt: true });
