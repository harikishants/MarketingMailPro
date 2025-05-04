import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { 
  insertContactSchema, 
  insertContactListSchema, 
  insertTemplateSchema,
  insertCampaignSchema,
  insertCampaignEventSchema,
  insertUserSchema,
  contactStatusEnum,
  campaignStatusEnum
} from "@shared/schema";
import { emailService } from "./utils/email";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // API routes for contacts
  app.get("/api/contacts", async (req, res) => {
    try {
      const search = typeof req.query.search === "string" ? req.query.search : "";
      const listId = typeof req.query.list === "string" ? req.query.list : undefined;
      const status = typeof req.query.status === "string" ? req.query.status : undefined;
      const page = parseInt(typeof req.query.page === "string" ? req.query.page : "1");
      const limit = 10;
      
      // Basic validation for status
      if (status && status !== "all_statuses" && !["active", "unsubscribed", "bounced"].includes(status)) {
        return res.status(400).json({ message: "Invalid status value" });
      }
      
      const result = await storage.getContacts({
        search,
        listId: listId && listId !== "all_lists" ? parseInt(listId) : undefined,
        status: status && status !== "all_statuses" ? status : undefined,
        page,
        limit,
      });
      
      res.json(result);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      res.status(500).json({ message: "Failed to fetch contacts" });
    }
  });

  app.post("/api/contacts", async (req, res) => {
    try {
      const validatedData = insertContactSchema.parse(req.body);
      const listIds = req.body.listIds || [];

      const newContact = await storage.createContact({
        ...validatedData,
        userId: 1, // In a real app, get from authenticated user
        listIds,
      });
      
      res.status(201).json(newContact);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error creating contact:", error);
      res.status(500).json({ message: "Failed to create contact" });
    }
  });

  app.post("/api/contacts/import", async (req, res) => {
    try {
      // In a real implementation, handle file upload or CSV parsing
      // For this demo, we'll simulate a successful import
      
      const listId = req.body.listId;
      if (!listId) {
        return res.status(400).json({ message: "List ID is required" });
      }
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      res.status(200).json({
        imported: 125,
        duplicates: 15,
        failed: 2,
        listId
      });
    } catch (error) {
      console.error("Error importing contacts:", error);
      res.status(500).json({ message: "Failed to import contacts" });
    }
  });

  // API routes for contact lists
  app.get("/api/contactLists", async (req, res) => {
    try {
      const contactLists = await storage.getContactLists();
      res.json(contactLists);
    } catch (error) {
      console.error("Error fetching contact lists:", error);
      res.status(500).json({ message: "Failed to fetch contact lists" });
    }
  });

  app.post("/api/contactLists", async (req, res) => {
    try {
      const validatedData = insertContactListSchema.parse(req.body);
      
      const newList = await storage.createContactList({
        ...validatedData,
        userId: 1, // In a real app, get from authenticated user
      });
      
      res.status(201).json(newList);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error creating contact list:", error);
      res.status(500).json({ message: "Failed to create contact list" });
    }
  });

  // API routes for templates
  app.get("/api/templates", async (req, res) => {
    try {
      const search = typeof req.query.search === "string" ? req.query.search : "";
      
      const templates = await storage.getTemplates(search);
      res.json(templates);
    } catch (error) {
      console.error("Error fetching templates:", error);
      res.status(500).json({ message: "Failed to fetch templates" });
    }
  });

  app.get("/api/templates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid template ID" });
      }
      
      const template = await storage.getTemplateById(id);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      res.json(template);
    } catch (error) {
      console.error("Error fetching template:", error);
      res.status(500).json({ message: "Failed to fetch template" });
    }
  });

  app.post("/api/templates", async (req, res) => {
    try {
      const validatedData = insertTemplateSchema.parse(req.body);
      
      const newTemplate = await storage.createTemplate({
        ...validatedData,
        userId: 1, // In a real app, get from authenticated user
      });
      
      res.status(201).json(newTemplate);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error creating template:", error);
      res.status(500).json({ message: "Failed to create template" });
    }
  });

  app.patch("/api/templates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid template ID" });
      }
      
      const validatedData = insertTemplateSchema.parse(req.body);
      
      const updatedTemplate = await storage.updateTemplate(id, {
        ...validatedData,
        userId: 1, // In a real app, get from authenticated user
      });
      
      if (!updatedTemplate) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      res.json(updatedTemplate);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error updating template:", error);
      res.status(500).json({ message: "Failed to update template" });
    }
  });

  app.delete("/api/templates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid template ID" });
      }
      
      const success = await storage.deleteTemplate(id);
      if (!success) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting template:", error);
      res.status(500).json({ message: "Failed to delete template" });
    }
  });

  // API routes for campaigns
  app.get("/api/campaigns", async (req, res) => {
    try {
      const search = typeof req.query.search === "string" ? req.query.search : "";
      const status = typeof req.query.status === "string" ? req.query.status : undefined;
      
      // Basic validation for status
      if (status && status !== "all_statuses" && !["draft", "scheduled", "sending", "sent", "failed"].includes(status)) {
        return res.status(400).json({ message: "Invalid status value" });
      }
      
      const campaigns = await storage.getCampaigns({
        search,
        status: status && status !== "all_statuses" ? status : undefined,
      });
      
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      res.status(500).json({ message: "Failed to fetch campaigns" });
    }
  });

  app.get("/api/campaigns/recent", async (req, res) => {
    try {
      const campaigns = await storage.getRecentCampaigns();
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching recent campaigns:", error);
      res.status(500).json({ message: "Failed to fetch recent campaigns" });
    }
  });

  app.get("/api/campaigns/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid campaign ID" });
      }
      
      const campaign = await storage.getCampaignById(id);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      res.json(campaign);
    } catch (error) {
      console.error("Error fetching campaign:", error);
      res.status(500).json({ message: "Failed to fetch campaign" });
    }
  });

  app.post("/api/campaigns", async (req, res) => {
    try {
      const validatedData = insertCampaignSchema.parse(req.body);
      
      const newCampaign = await storage.createCampaign({
        ...validatedData,
        userId: 1, // In a real app, get from authenticated user
        scheduledAt: req.body.scheduleType === "later" ? new Date(req.body.scheduledDate) : null,
      });
      
      // If campaign is to be sent immediately, process it
      if (req.body.scheduleType === "now") {
        // In a real app, this would be done in a background job
        await emailService.sendCampaign(newCampaign.id);
      }
      
      res.status(201).json(newCampaign);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error creating campaign:", error);
      res.status(500).json({ message: "Failed to create campaign" });
    }
  });

  app.patch("/api/campaigns/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid campaign ID" });
      }
      
      const validatedData = insertCampaignSchema.parse(req.body);
      
      const campaign = await storage.getCampaignById(id);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      // Only allow editing drafts
      if (campaign.status !== "draft") {
        return res.status(400).json({ message: "Only draft campaigns can be edited" });
      }
      
      const updatedCampaign = await storage.updateCampaign(id, {
        ...validatedData,
        userId: 1, // In a real app, get from authenticated user
        scheduledAt: req.body.scheduleType === "later" ? new Date(req.body.scheduledDate) : null,
      });
      
      res.json(updatedCampaign);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error updating campaign:", error);
      res.status(500).json({ message: "Failed to update campaign" });
    }
  });

  // API routes for analytics
  app.get("/api/analytics", async (req, res) => {
    try {
      const timeRange = typeof req.query.timeRange === "string" ? req.query.timeRange : "30days";
      const campaignId = typeof req.query.campaign === "string" && req.query.campaign !== "all" 
        ? parseInt(req.query.campaign) 
        : undefined;
      
      const analyticsData = await storage.getAnalyticsData(timeRange, campaignId);
      res.json(analyticsData);
    } catch (error) {
      console.error("Error fetching analytics data:", error);
      res.status(500).json({ message: "Failed to fetch analytics data" });
    }
  });

  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  app.get("/api/audience/growth", async (req, res) => {
    try {
      const growthData = await storage.getAudienceGrowthData();
      res.json(growthData);
    } catch (error) {
      console.error("Error fetching audience growth data:", error);
      res.status(500).json({ message: "Failed to fetch audience growth data" });
    }
  });

  // API routes for settings
  app.get("/api/settings/profile", async (req, res) => {
    try {
      const profile = await storage.getUserProfile(1); // In a real app, get user ID from auth
      res.json(profile);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ message: "Failed to fetch user profile" });
    }
  });

  app.patch("/api/settings/profile", async (req, res) => {
    try {
      const userId = 1; // In a real app, get from auth
      
      const profileSchema = z.object({
        name: z.string().min(2, "Name must be at least 2 characters."),
        email: z.string().email("Please enter a valid email address."),
        company: z.string().optional(),
        website: z.string().url("Please enter a valid URL.").optional().or(z.string().length(0)),
      });
      
      const validatedData = profileSchema.parse(req.body);
      
      const updatedProfile = await storage.updateUserProfile(userId, validatedData);
      res.json(updatedProfile);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error updating user profile:", error);
      res.status(500).json({ message: "Failed to update user profile" });
    }
  });

  app.get("/api/settings/email", async (req, res) => {
    try {
      const emailSettings = await storage.getEmailSettings(1); // In a real app, get user ID from auth
      res.json(emailSettings);
    } catch (error) {
      console.error("Error fetching email settings:", error);
      res.status(500).json({ message: "Failed to fetch email settings" });
    }
  });

  app.patch("/api/settings/email", async (req, res) => {
    try {
      const userId = 1; // In a real app, get from auth
      
      const emailSettingsSchema = z.object({
        senderName: z.string().min(2, "Sender name is required."),
        senderEmail: z.string().email("Please enter a valid email address."),
        replyToEmail: z.string().email("Please enter a valid email address."),
        defaultFooter: z.string().optional(),
        includeUnsubscribeLink: z.boolean().default(true),
      });
      
      const validatedData = emailSettingsSchema.parse(req.body);
      
      const updatedSettings = await storage.updateEmailSettings(userId, validatedData);
      res.json(updatedSettings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error updating email settings:", error);
      res.status(500).json({ message: "Failed to update email settings" });
    }
  });

  app.get("/api/settings/smtp", async (req, res) => {
    try {
      const smtpSettings = await storage.getSmtpSettings(1); // In a real app, get user ID from auth
      res.json(smtpSettings);
    } catch (error) {
      console.error("Error fetching SMTP settings:", error);
      res.status(500).json({ message: "Failed to fetch SMTP settings" });
    }
  });

  app.patch("/api/settings/smtp", async (req, res) => {
    try {
      const userId = 1; // In a real app, get from auth
      
      const smtpSettingsSchema = z.object({
        smtpHost: z.string().min(1, "SMTP host is required."),
        smtpPort: z.string().refine((val) => !isNaN(Number(val)), {
          message: "Port must be a number.",
        }),
        smtpUsername: z.string().min(1, "SMTP username is required."),
        smtpPassword: z.string().min(1, "SMTP password is required."),
        useTLS: z.boolean().default(true),
      });
      
      const validatedData = smtpSettingsSchema.parse(req.body);
      
      const updatedSettings = await storage.updateSmtpSettings(userId, {
        ...validatedData,
        smtpPort: parseInt(validatedData.smtpPort),
      });
      
      res.json(updatedSettings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error updating SMTP settings:", error);
      res.status(500).json({ message: "Failed to update SMTP settings" });
    }
  });

  app.post("/api/settings/smtp/test", async (req, res) => {
    try {
      const smtpSettingsSchema = z.object({
        smtpHost: z.string().min(1, "SMTP host is required."),
        smtpPort: z.string().or(z.number()).refine((val) => !isNaN(Number(val)), {
          message: "Port must be a number.",
        }),
        smtpUsername: z.string().min(1, "SMTP username is required."),
        smtpPassword: z.string().min(1, "SMTP password is required."),
        useTLS: z.boolean().default(true),
      });
      
      const validatedData = smtpSettingsSchema.parse(req.body);
      
      // Test SMTP connection
      const testResult = await emailService.testSmtpConnection({
        host: validatedData.smtpHost,
        port: typeof validatedData.smtpPort === 'string' ? parseInt(validatedData.smtpPort) : validatedData.smtpPort,
        username: validatedData.smtpUsername,
        password: validatedData.smtpPassword,
        useTLS: validatedData.useTLS,
      });
      
      if (testResult.success) {
        res.json({ message: "SMTP connection successful" });
      } else {
        res.status(400).json({ message: `SMTP test failed: ${testResult.error}` });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error testing SMTP connection:", error);
      res.status(500).json({ message: "Failed to test SMTP connection" });
    }
  });

  app.get("/api/settings/apiKeys", async (req, res) => {
    try {
      const apiKeys = await storage.getApiKeys(1); // In a real app, get user ID from auth
      res.json(apiKeys);
    } catch (error) {
      console.error("Error fetching API keys:", error);
      res.status(500).json({ message: "Failed to fetch API keys" });
    }
  });

  app.post("/api/settings/apiKeys/generate", async (req, res) => {
    try {
      const userId = 1; // In a real app, get from auth
      
      const apiKey = await storage.generateApiKey(userId);
      res.json({ apiKey });
    } catch (error) {
      console.error("Error generating API key:", error);
      res.status(500).json({ message: "Failed to generate API key" });
    }
  });

  return httpServer;
}
