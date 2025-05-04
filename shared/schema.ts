import { pgTable, text, serial, integer, boolean, timestamp, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// User table schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name"),
  email: text("email").notNull().unique(),
  company: text("company"),
  website: text("website"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  email: true,
  company: true,
  website: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Contact status enum
export const contactStatusEnum = pgEnum('contact_status', ['active', 'unsubscribed', 'bounced']);

// Contact lists table schema
export const contactLists = pgTable("contact_lists", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  userId: integer("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertContactListSchema = createInsertSchema(contactLists, {
  name: (schema) => schema.min(1, "List name is required"),
});

export type InsertContactList = z.infer<typeof insertContactListSchema>;
export type ContactList = typeof contactLists.$inferSelect;

// Contacts table schema
export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  name: text("name"),
  status: contactStatusEnum("status").default('active').notNull(),
  metadata: jsonb("metadata"),
  userId: integer("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertContactSchema = createInsertSchema(contacts, {
  email: (schema) => schema.email("Invalid email address"),
});

export type InsertContact = z.infer<typeof insertContactSchema>;
export type Contact = typeof contacts.$inferSelect;

// Contact list memberships (many-to-many)
export const contactListMemberships = pgTable("contact_list_memberships", {
  id: serial("id").primaryKey(),
  contactId: integer("contact_id").references(() => contacts.id).notNull(),
  listId: integer("list_id").references(() => contactLists.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertContactListMembershipSchema = createInsertSchema(contactListMemberships);

export type InsertContactListMembership = z.infer<typeof insertContactListMembershipSchema>;
export type ContactListMembership = typeof contactListMemberships.$inferSelect;

// Templates table schema
export const templates = pgTable("templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  content: text("content").notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  backgroundColor: text("background_color").default("#FFFFFF"),
  textColor: text("text_color").default("#000000"),
  font: text("font").default("Arial"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertTemplateSchema = createInsertSchema(templates, {
  name: (schema) => schema.min(1, "Template name is required"),
  content: (schema) => schema.min(1, "Template content is required"),
});

export type InsertTemplate = z.infer<typeof insertTemplateSchema>;
export type Template = typeof templates.$inferSelect;

// Campaign status enum
export const campaignStatusEnum = pgEnum('campaign_status', ['draft', 'scheduled', 'sending', 'sent', 'failed']);

// Campaigns table schema
export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  content: text("content").notNull(),
  senderName: text("sender_name").notNull(),
  senderEmail: text("sender_email").notNull(),
  replyToEmail: text("reply_to_email").notNull(),
  listId: integer("list_id").references(() => contactLists.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  templateId: integer("template_id").references(() => templates.id),
  status: campaignStatusEnum("status").default('draft').notNull(),
  scheduledAt: timestamp("scheduled_at"),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCampaignSchema = createInsertSchema(campaigns, {
  name: (schema) => schema.min(1, "Campaign name is required"),
  subject: (schema) => schema.min(1, "Subject line is required"),
  senderName: (schema) => schema.min(1, "Sender name is required"),
  senderEmail: (schema) => schema.email("Invalid sender email"),
  replyToEmail: (schema) => schema.email("Invalid reply-to email"),
});

export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type Campaign = typeof campaigns.$inferSelect;

// Campaign analytics schema
export const campaignEvents = pgTable("campaign_events", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").references(() => campaigns.id).notNull(),
  contactId: integer("contact_id").references(() => contacts.id).notNull(),
  eventType: text("event_type").notNull(), // 'sent', 'opened', 'clicked', 'bounced', 'unsubscribed'
  metadata: jsonb("metadata"), // For click events: URL, for bounce events: reason
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCampaignEventSchema = createInsertSchema(campaignEvents);

export type InsertCampaignEvent = z.infer<typeof insertCampaignEventSchema>;
export type CampaignEvent = typeof campaignEvents.$inferSelect;

// Settings table schema
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull().unique(),
  smtpHost: text("smtp_host"),
  smtpPort: integer("smtp_port"),
  smtpUsername: text("smtp_username"),
  smtpPassword: text("smtp_password"),
  useTls: boolean("use_tls").default(true),
  defaultSenderName: text("default_sender_name"),
  defaultSenderEmail: text("default_sender_email"),
  defaultReplyToEmail: text("default_reply_to_email"),
  defaultFooter: text("default_footer"),
  includeUnsubscribeLink: boolean("include_unsubscribe_link").default(true),
  apiKey: text("api_key"),
  apiKeyCreatedAt: timestamp("api_key_created_at"),
  apiKeyLastUsedAt: timestamp("api_key_last_used_at"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSettingsSchema = createInsertSchema(settings);

export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settings.$inferSelect;

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  contactLists: many(contactLists),
  contacts: many(contacts),
  templates: many(templates),
  campaigns: many(campaigns),
  settings: many(settings),
}));

export const contactListsRelations = relations(contactLists, ({ one, many }) => ({
  user: one(users, { fields: [contactLists.userId], references: [users.id] }),
  memberships: many(contactListMemberships),
  campaigns: many(campaigns),
}));

export const contactsRelations = relations(contacts, ({ one, many }) => ({
  user: one(users, { fields: [contacts.userId], references: [users.id] }),
  listMemberships: many(contactListMemberships),
  events: many(campaignEvents),
}));

export const contactListMembershipsRelations = relations(contactListMemberships, ({ one }) => ({
  contact: one(contacts, { fields: [contactListMemberships.contactId], references: [contacts.id] }),
  list: one(contactLists, { fields: [contactListMemberships.listId], references: [contactLists.id] }),
}));

export const templatesRelations = relations(templates, ({ one, many }) => ({
  user: one(users, { fields: [templates.userId], references: [users.id] }),
  campaigns: many(campaigns),
}));

export const campaignsRelations = relations(campaigns, ({ one, many }) => ({
  user: one(users, { fields: [campaigns.userId], references: [users.id] }),
  list: one(contactLists, { fields: [campaigns.listId], references: [contactLists.id] }),
  template: one(templates, { fields: [campaigns.templateId], references: [templates.id] }),
  events: many(campaignEvents),
}));

export const campaignEventsRelations = relations(campaignEvents, ({ one }) => ({
  campaign: one(campaigns, { fields: [campaignEvents.campaignId], references: [campaigns.id] }),
  contact: one(contacts, { fields: [campaignEvents.contactId], references: [contacts.id] }),
}));

export const settingsRelations = relations(settings, ({ one }) => ({
  user: one(users, { fields: [settings.userId], references: [users.id] }),
}));
