import { db } from "@db";
import {
  users,
  contacts,
  contactLists,
  contactListMemberships,
  templates,
  campaigns,
  campaignEvents,
  settings,
  type User,
  type Contact,
  type ContactList,
  type Template,
  type Campaign,
  type Settings,
} from "@shared/schema";
import { eq, and, or, like, desc, count, sql, asc, isNull, not } from "drizzle-orm";
import { randomBytes } from "crypto";

// Contacts
interface GetContactsParams {
  search?: string;
  listId?: number;
  status?: string;
  page?: number;
  limit?: number;
}

interface CreateContactParams {
  email: string;
  name?: string;
  userId: number;
  listIds?: number[];
}

// Campaigns
interface GetCampaignsParams {
  search?: string;
  status?: string;
}

interface CreateCampaignParams {
  name: string;
  subject: string;
  content: string;
  senderName: string;
  senderEmail: string;
  replyToEmail: string;
  listId: number;
  userId: number;
  templateId?: number;
  scheduledAt?: Date | null;
}

// Email settings
interface EmailSettingsParams {
  senderName: string;
  senderEmail: string;
  replyToEmail: string;
  defaultFooter?: string;
  includeUnsubscribeLink: boolean;
}

// SMTP settings
interface SmtpSettingsParams {
  smtpHost: string;
  smtpPort: number;
  smtpUsername: string;
  smtpPassword: string;
  useTLS: boolean;
}

// User profile
interface UserProfileParams {
  name: string;
  email: string;
  company?: string;
  website?: string;
}

class Storage {
  // Contacts
  async getContacts({ search = "", listId, status, page = 1, limit = 10 }: GetContactsParams) {
    try {
      const offset = (page - 1) * limit;
      
      // Build the query
      let query = db.select({
        id: contacts.id,
        email: contacts.email,
        name: contacts.name,
        status: contacts.status,
        createdAt: contacts.createdAt,
      })
      .from(contacts);
      
      // Apply search filter
      if (search) {
        query = query.where(
          or(
            like(contacts.email, `%${search}%`),
            like(contacts.name, `%${search}%`)
          )
        );
      }
      
      // Apply list filter if provided
      if (listId) {
        query = query.innerJoin(
          contactListMemberships,
          eq(contacts.id, contactListMemberships.contactId)
        ).where(eq(contactListMemberships.listId, listId));
      }
      
      // Apply status filter if provided
      if (status) {
        query = query.where(eq(contacts.status, status));
      }
      
      // Get total count
      const countResult = await db.select({ count: count() })
        .from(query.as("filtered_contacts"));
      
      const total = countResult[0]?.count || 0;
      const totalPages = Math.ceil(total / limit);
      
      // Get paginated results
      const paginatedQuery = query
        .orderBy(desc(contacts.createdAt))
        .limit(limit)
        .offset(offset);
      
      const results = await paginatedQuery;
      
      // Fetch list memberships for each contact
      const contactsWithLists = await Promise.all(
        results.map(async (contact) => {
          const lists = await db.select({
            id: contactLists.id,
            name: contactLists.name,
          })
          .from(contactListMemberships)
          .innerJoin(
            contactLists,
            eq(contactListMemberships.listId, contactLists.id)
          )
          .where(eq(contactListMemberships.contactId, contact.id));
          
          return {
            ...contact,
            lists,
          };
        })
      );
      
      return {
        data: contactsWithLists,
        page,
        limit,
        total,
        totalPages,
      };
    } catch (error) {
      console.error("Error in getContacts:", error);
      throw error;
    }
  }

  async createContact({ email, name, userId, listIds = [] }: CreateContactParams) {
    try {
      // Insert contact
      const [newContact] = await db.insert(contacts)
        .values({
          email,
          name,
          userId,
          status: "active",
        })
        .returning();
      
      // Add to lists if provided
      if (listIds.length > 0) {
        await db.insert(contactListMemberships)
          .values(
            listIds.map(listId => ({
              contactId: newContact.id,
              listId,
            }))
          );
      }
      
      return newContact;
    } catch (error) {
      console.error("Error in createContact:", error);
      throw error;
    }
  }

  // Contact Lists
  async getContactLists() {
    try {
      const lists = await db.select({
        id: contactLists.id,
        name: contactLists.name,
        description: contactLists.description,
        createdAt: contactLists.createdAt,
      })
      .from(contactLists)
      .orderBy(desc(contactLists.createdAt));
      
      // Get contact count and active percentage for each list
      const listsWithStats = await Promise.all(
        lists.map(async (list) => {
          // Get total contacts in list
          const totalResult = await db.select({ count: count() })
            .from(contactListMemberships)
            .where(eq(contactListMemberships.listId, list.id));
          
          const contactCount = totalResult[0]?.count || 0;
          
          // Get active contacts in list
          const activeResult = await db.select({ count: count() })
            .from(contactListMemberships)
            .innerJoin(
              contacts,
              eq(contactListMemberships.contactId, contacts.id)
            )
            .where(
              and(
                eq(contactListMemberships.listId, list.id),
                eq(contacts.status, "active")
              )
            );
          
          const activeCount = activeResult[0]?.count || 0;
          const activePercentage = contactCount > 0 
            ? Math.round((activeCount / contactCount) * 100) 
            : 0;
          
          return {
            ...list,
            contactCount,
            activeCount,
            activePercentage,
          };
        })
      );
      
      return listsWithStats;
    } catch (error) {
      console.error("Error in getContactLists:", error);
      throw error;
    }
  }

  async createContactList({ name, description, userId }: { name: string, description?: string, userId: number }) {
    try {
      const [newList] = await db.insert(contactLists)
        .values({
          name,
          description,
          userId,
        })
        .returning();
      
      return {
        ...newList,
        contactCount: 0,
        activeCount: 0,
        activePercentage: 0,
      };
    } catch (error) {
      console.error("Error in createContactList:", error);
      throw error;
    }
  }

  // Templates
  async getTemplates(search: string = "") {
    try {
      let query = db.select({
        id: templates.id,
        name: templates.name,
        description: templates.description,
        createdAt: templates.createdAt,
        updatedAt: templates.updatedAt,
      })
      .from(templates);
      
      if (search) {
        query = query.where(
          or(
            like(templates.name, `%${search}%`),
            like(templates.description, `%${search}%`)
          )
        );
      }
      
      return await query.orderBy(desc(templates.updatedAt));
    } catch (error) {
      console.error("Error in getTemplates:", error);
      throw error;
    }
  }

  async getTemplateById(id: number) {
    try {
      const template = await db.select()
        .from(templates)
        .where(eq(templates.id, id))
        .limit(1);
      
      return template[0] || null;
    } catch (error) {
      console.error("Error in getTemplateById:", error);
      throw error;
    }
  }

  async createTemplate({ name, description, content, userId, backgroundColor, textColor, font }: {
    name: string,
    description?: string,
    content: string,
    userId: number,
    backgroundColor?: string,
    textColor?: string,
    font?: string,
  }) {
    try {
      const [newTemplate] = await db.insert(templates)
        .values({
          name,
          description,
          content,
          userId,
          backgroundColor,
          textColor,
          font,
        })
        .returning();
      
      return newTemplate;
    } catch (error) {
      console.error("Error in createTemplate:", error);
      throw error;
    }
  }

  async updateTemplate(id: number, { name, description, content, userId, backgroundColor, textColor, font }: {
    name: string,
    description?: string,
    content: string,
    userId: number,
    backgroundColor?: string,
    textColor?: string,
    font?: string,
  }) {
    try {
      const [updatedTemplate] = await db.update(templates)
        .set({
          name,
          description,
          content,
          backgroundColor,
          textColor,
          font,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(templates.id, id),
            eq(templates.userId, userId)
          )
        )
        .returning();
      
      return updatedTemplate || null;
    } catch (error) {
      console.error("Error in updateTemplate:", error);
      throw error;
    }
  }

  async deleteTemplate(id: number) {
    try {
      const result = await db.delete(templates)
        .where(eq(templates.id, id))
        .returning({ id: templates.id });
      
      return result.length > 0;
    } catch (error) {
      console.error("Error in deleteTemplate:", error);
      throw error;
    }
  }

  // Campaigns
  async getCampaigns({ search = "", status }: GetCampaignsParams) {
    try {
      let query = db.select({
        id: campaigns.id,
        name: campaigns.name,
        subject: campaigns.subject,
        status: campaigns.status,
        sentAt: campaigns.sentAt,
        scheduledAt: campaigns.scheduledAt,
        createdAt: campaigns.createdAt,
        listId: campaigns.listId,
      })
      .from(campaigns);
      
      // Apply search filter
      if (search) {
        query = query.where(
          or(
            like(campaigns.name, `%${search}%`),
            like(campaigns.subject, `%${search}%`)
          )
        );
      }
      
      // Apply status filter
      if (status) {
        query = query.where(eq(campaigns.status, status));
      }
      
      const results = await query.orderBy(desc(campaigns.createdAt));
      
      // Enhance with recipient count and list name
      const campaignsWithStats = await Promise.all(
        results.map(async (campaign) => {
          // Get list name
          const list = await db.select({ name: contactLists.name })
            .from(contactLists)
            .where(eq(contactLists.id, campaign.listId))
            .limit(1);
          
          const listName = list[0]?.name || "Unknown List";
          
          // Get recipient count
          const countResult = await db.select({ count: count() })
            .from(contactListMemberships)
            .where(eq(contactListMemberships.listId, campaign.listId));
          
          const recipientCount = countResult[0]?.count || 0;
          
          // Get open and click rates for sent campaigns
          let openRate = null;
          let clickRate = null;
          
          if (campaign.status === "sent") {
            // Calculate open rate
            const openEvents = await db.select({ count: count() })
              .from(campaignEvents)
              .where(
                and(
                  eq(campaignEvents.campaignId, campaign.id),
                  eq(campaignEvents.eventType, "opened")
                )
              );
            
            const sentEvents = await db.select({ count: count() })
              .from(campaignEvents)
              .where(
                and(
                  eq(campaignEvents.campaignId, campaign.id),
                  eq(campaignEvents.eventType, "sent")
                )
              );
            
            if (sentEvents[0]?.count > 0) {
              openRate = Math.round((openEvents[0]?.count / sentEvents[0]?.count) * 100);
            }
            
            // Calculate click rate
            const clickEvents = await db.select({ count: count() })
              .from(campaignEvents)
              .where(
                and(
                  eq(campaignEvents.campaignId, campaign.id),
                  eq(campaignEvents.eventType, "clicked")
                )
              );
            
            if (sentEvents[0]?.count > 0) {
              clickRate = Math.round((clickEvents[0]?.count / sentEvents[0]?.count) * 100);
            }
          }
          
          return {
            ...campaign,
            recipientCount,
            listName,
            openRate,
            clickRate,
          };
        })
      );
      
      return campaignsWithStats;
    } catch (error) {
      console.error("Error in getCampaigns:", error);
      throw error;
    }
  }

  async getRecentCampaigns() {
    try {
      const recentCampaigns = await db.select({
        id: campaigns.id,
        name: campaigns.name,
        status: campaigns.status,
        sentAt: campaigns.sentAt,
        scheduledAt: campaigns.scheduledAt,
        listId: campaigns.listId,
      })
      .from(campaigns)
      .orderBy(desc(campaigns.createdAt))
      .limit(4);
      
      // Enhance with list name, recipient count, and metrics
      const campaignsWithDetails = await Promise.all(
        recentCampaigns.map(async (campaign) => {
          // Get list name
          const list = await db.select({ name: contactLists.name })
            .from(contactLists)
            .where(eq(contactLists.id, campaign.listId))
            .limit(1);
          
          const listName = list[0]?.name || "Unknown List";
          
          // Get metrics for sent campaigns
          let sentCount = 0;
          let openRate = null;
          let clickRate = null;
          
          if (campaign.status === "sent") {
            const sentEvents = await db.select({ count: count() })
              .from(campaignEvents)
              .where(
                and(
                  eq(campaignEvents.campaignId, campaign.id),
                  eq(campaignEvents.eventType, "sent")
                )
              );
            
            sentCount = sentEvents[0]?.count || 0;
            
            if (sentCount > 0) {
              // Calculate open rate
              const openEvents = await db.select({ count: count() })
                .from(campaignEvents)
                .where(
                  and(
                    eq(campaignEvents.campaignId, campaign.id),
                    eq(campaignEvents.eventType, "opened")
                  )
                );
              
              openRate = Math.round((openEvents[0]?.count / sentCount) * 100);
              
              // Calculate click rate
              const clickEvents = await db.select({ count: count() })
                .from(campaignEvents)
                .where(
                  and(
                    eq(campaignEvents.campaignId, campaign.id),
                    eq(campaignEvents.eventType, "clicked")
                  )
                );
              
              clickRate = Math.round((clickEvents[0]?.count / sentCount) * 100);
            }
          }
          
          return {
            ...campaign,
            listName,
            sentCount,
            openRate,
            clickRate,
          };
        })
      );
      
      return campaignsWithDetails;
    } catch (error) {
      console.error("Error in getRecentCampaigns:", error);
      throw error;
    }
  }

  async getCampaignById(id: number) {
    try {
      const campaign = await db.select()
        .from(campaigns)
        .where(eq(campaigns.id, id))
        .limit(1);
      
      return campaign[0] || null;
    } catch (error) {
      console.error("Error in getCampaignById:", error);
      throw error;
    }
  }

  async createCampaign({ name, subject, content, senderName, senderEmail, replyToEmail, listId, userId, templateId, scheduledAt }: CreateCampaignParams) {
    try {
      // If template is specified, fetch its content
      let campaignContent = content;
      
      if (templateId) {
        const template = await this.getTemplateById(templateId);
        if (template) {
          campaignContent = template.content;
        }
      }
      
      // Set appropriate status based on scheduling
      const status = scheduledAt ? "scheduled" : "draft";
      
      const [newCampaign] = await db.insert(campaigns)
        .values({
          name,
          subject,
          content: campaignContent,
          senderName,
          senderEmail,
          replyToEmail,
          listId,
          userId,
          templateId,
          status,
          scheduledAt,
        })
        .returning();
      
      return newCampaign;
    } catch (error) {
      console.error("Error in createCampaign:", error);
      throw error;
    }
  }

  async updateCampaign(id: number, { name, subject, content, senderName, senderEmail, replyToEmail, listId, userId, templateId, scheduledAt }: CreateCampaignParams) {
    try {
      // If template is specified, fetch its content
      let campaignContent = content;
      
      if (templateId) {
        const template = await this.getTemplateById(templateId);
        if (template) {
          campaignContent = template.content;
        }
      }
      
      // Set appropriate status based on scheduling
      const status = scheduledAt ? "scheduled" : "draft";
      
      const [updatedCampaign] = await db.update(campaigns)
        .set({
          name,
          subject,
          content: campaignContent,
          senderName,
          senderEmail,
          replyToEmail,
          listId,
          templateId,
          status,
          scheduledAt,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(campaigns.id, id),
            eq(campaigns.userId, userId)
          )
        )
        .returning();
      
      return updatedCampaign || null;
    } catch (error) {
      console.error("Error in updateCampaign:", error);
      throw error;
    }
  }

  // Dashboard
  async getDashboardStats() {
    try {
      // Get active campaigns count
      const activeCampaignsQuery = await db.select({ count: count() })
        .from(campaigns)
        .where(
          or(
            eq(campaigns.status, "scheduled"),
            eq(campaigns.status, "sending")
          )
        );
      
      const activeCampaignsCount = activeCampaignsQuery[0]?.count || 0;
      
      // Calculate change from last month
      const lastMonthActiveCampaignsQuery = await db.select({ count: count() })
        .from(campaigns)
        .where(
          and(
            or(
              eq(campaigns.status, "scheduled"),
              eq(campaigns.status, "sending")
            ),
            sql`${campaigns.createdAt} < now() - interval '1 month'`
          )
        );
      
      const lastMonthActiveCampaignsCount = lastMonthActiveCampaignsQuery[0]?.count || 0;
      const activeCampaignsChange = lastMonthActiveCampaignsCount === 0 
        ? 100 // If there were no active campaigns last month, it's a 100% increase
        : Math.round(((activeCampaignsCount - lastMonthActiveCampaignsCount) / lastMonthActiveCampaignsCount) * 100);
      
      // Get total subscribers count
      const totalSubscribersQuery = await db.select({ count: count() })
        .from(contacts)
        .where(eq(contacts.status, "active"));
      
      const totalSubscribersCount = totalSubscribersQuery[0]?.count || 0;
      
      // Get new subscribers this week
      const newSubscribersQuery = await db.select({ count: count() })
        .from(contacts)
        .where(
          and(
            eq(contacts.status, "active"),
            sql`${contacts.createdAt} > now() - interval '1 week'`
          )
        );
      
      const newSubscribersCount = newSubscribersQuery[0]?.count || 0;
      
      // Calculate subscriber change percentage
      const lastWeekSubscribersQuery = await db.select({ count: count() })
        .from(contacts)
        .where(
          and(
            eq(contacts.status, "active"),
            sql`${contacts.createdAt} < now() - interval '1 week'`
          )
        );
      
      const lastWeekSubscribersCount = lastWeekSubscribersQuery[0]?.count || 0;
      const subscribersChange = lastWeekSubscribersCount === 0 
        ? 100 
        : Math.round(((newSubscribersCount) / lastWeekSubscribersCount) * 100);
      
      // Calculate average open rate
      const sentCampaignsQuery = await db.select({ id: campaigns.id })
        .from(campaigns)
        .where(eq(campaigns.status, "sent"));
      
      let totalOpenRate = 0;
      let campaignCount = 0;
      
      for (const campaign of sentCampaignsQuery) {
        const sentEventsQuery = await db.select({ count: count() })
          .from(campaignEvents)
          .where(
            and(
              eq(campaignEvents.campaignId, campaign.id),
              eq(campaignEvents.eventType, "sent")
            )
          );
        
        const openEventsQuery = await db.select({ count: count() })
          .from(campaignEvents)
          .where(
            and(
              eq(campaignEvents.campaignId, campaign.id),
              eq(campaignEvents.eventType, "opened")
            )
          );
        
        const sentCount = sentEventsQuery[0]?.count || 0;
        const openCount = openEventsQuery[0]?.count || 0;
        
        if (sentCount > 0) {
          totalOpenRate += (openCount / sentCount) * 100;
          campaignCount++;
        }
      }
      
      const avgOpenRate = campaignCount > 0 ? Math.round(totalOpenRate / campaignCount) : 0;
      
      // Calculate change in open rate from last month
      // In a real app, this would be more sophisticated
      const openRateChange = -2.3; // Mocked for demo
      
      // Calculate average click rate - similar to open rate
      const avgClickRate = 12.5; // Mocked for demo
      const clickRateChange = 1.2; // Mocked for demo
      
      return {
        activeCampaigns: {
          count: activeCampaignsCount,
          change: activeCampaignsChange
        },
        totalSubscribers: {
          count: totalSubscribersCount,
          change: subscribersChange
        },
        openRate: {
          percentage: avgOpenRate,
          change: openRateChange
        },
        clickRate: {
          percentage: avgClickRate,
          change: clickRateChange
        }
      };
    } catch (error) {
      console.error("Error in getDashboardStats:", error);
      throw error;
    }
  }

  async getAudienceGrowthData() {
    try {
      // In a real app, this would fetch actual data
      // For demo purposes, we'll return mock data
      return {
        monthlyGrowth: {
          labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
          data: [241, 352, 497, 624, 768, 847],
        },
        newSubscribers: {
          value: 847,
          change: 18.2,
        },
        unsubscribers: {
          value: 124,
          change: 5.3,
        },
        growthRate: {
          value: 21.2,
          change: 4.1,
        },
      };
    } catch (error) {
      console.error("Error in getAudienceGrowthData:", error);
      throw error;
    }
  }

  // Analytics
  async getAnalyticsData(timeRange: string, campaignId?: number) {
    try {
      // In a real app, this would fetch actual data based on time range and campaign
      // For demo purposes, we'll return mock data
      return {
        // Open rate over time
        openRateOverTime: [
          { name: "Week 1", value: 22.5 },
          { name: "Week 2", value: 25.3 },
          { name: "Week 3", value: 24.1 },
          { name: "Week 4", value: 26.7 },
        ],
        
        // Click rate over time
        clickRateOverTime: [
          { name: "Week 1", value: 10.2 },
          { name: "Week 2", value: 12.8 },
          { name: "Week 3", value: 11.5 },
          { name: "Week 4", value: 13.6 },
        ],
        
        // Subscriber growth
        subscriberGrowth: [
          { name: "Jan", value: 241 },
          { name: "Feb", value: 352 },
          { name: "Mar", value: 497 },
          { name: "Apr", value: 624 },
          { name: "May", value: 768 },
          { name: "Jun", value: 847 },
        ],
        
        // Engagement stats
        engagementStats: {
          openRate: 24.8,
          openRateChange: -2.3,
          clickRate: 12.5,
          clickRateChange: 1.2,
          totalSubscribers: 3427,
          newSubscribers: 124,
          bounceRate: 1.8,
          bounceRateChange: -0.3,
        },
        
        // Device usage
        deviceUsage: [
          { name: "Mobile", value: 62 },
          { name: "Desktop", value: 31 },
          { name: "Tablet", value: 7 },
        ],
        
        // Email clients
        emailClients: [
          { name: "Gmail", value: 48 },
          { name: "Apple Mail", value: 22 },
          { name: "Outlook", value: 17 },
          { name: "Other", value: 13 },
        ],
        
        // Bounce rate data
        bounceRate: [
          { name: "Jan", value: 2.1 },
          { name: "Feb", value: 1.9 },
          { name: "Mar", value: 2.2 },
          { name: "Apr", value: 1.7 },
          { name: "May", value: 1.5 },
          { name: "Jun", value: 1.8 },
        ],
        
        // Bounce types
        bounceTypes: {
          hard: 35,
          soft: 65,
        },
        
        // Top links
        topLinks: [
          {
            url: "https://example.com/products",
            clicks: 342,
            clickRate: 15.2,
            campaignName: "July Newsletter",
          },
          {
            url: "https://example.com/offers/summer",
            clicks: 276,
            clickRate: 12.3,
            campaignName: "Summer Sale Announcement",
          },
          {
            url: "https://example.com/blog/email-tips",
            clicks: 189,
            clickRate: 8.4,
            campaignName: "June Newsletter",
          },
        ],
        
        // Campaign performance
        campaignPerformance: [
          {
            id: 1,
            name: "July Newsletter",
            sentCount: 3241,
            openRate: 26.4,
            clickRate: 14.2,
            bounceRate: 1.6,
            unsubscribeRate: 0.7,
            sentDate: "Jul 15, 2023",
          },
          {
            id: 2,
            name: "Summer Sale Announcement",
            sentCount: 3254,
            openRate: 32.1,
            clickRate: 18.7,
            bounceRate: 1.9,
            unsubscribeRate: 0.4,
            sentDate: "Jul 01, 2023",
          },
          {
            id: 3,
            name: "June Newsletter",
            sentCount: 3198,
            openRate: 23.7,
            clickRate: 11.5,
            bounceRate: 2.1,
            unsubscribeRate: 0.8,
            sentDate: "Jun 15, 2023",
          },
        ],
      };
    } catch (error) {
      console.error("Error in getAnalyticsData:", error);
      throw error;
    }
  }

  // User settings
  async getUserProfile(userId: number) {
    try {
      const user = await db.select({
        name: users.name,
        email: users.email,
        company: users.company,
        website: users.website,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
      
      return user[0] || null;
    } catch (error) {
      console.error("Error in getUserProfile:", error);
      throw error;
    }
  }

  async updateUserProfile(userId: number, profile: UserProfileParams) {
    try {
      const [updatedUser] = await db.update(users)
        .set({
          name: profile.name,
          email: profile.email,
          company: profile.company,
          website: profile.website,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
        .returning({
          name: users.name,
          email: users.email,
          company: users.company,
          website: users.website,
        });
      
      return updatedUser || null;
    } catch (error) {
      console.error("Error in updateUserProfile:", error);
      throw error;
    }
  }

  async getEmailSettings(userId: number) {
    try {
      const userSettings = await db.select({
        defaultSenderName: settings.defaultSenderName,
        defaultSenderEmail: settings.defaultSenderEmail,
        defaultReplyToEmail: settings.defaultReplyToEmail,
        defaultFooter: settings.defaultFooter,
        includeUnsubscribeLink: settings.includeUnsubscribeLink,
      })
      .from(settings)
      .where(eq(settings.userId, userId))
      .limit(1);
      
      if (userSettings.length === 0) {
        return {
          senderName: "",
          senderEmail: "",
          replyToEmail: "",
          defaultFooter: "",
          includeUnsubscribeLink: true,
        };
      }
      
      return {
        senderName: userSettings[0].defaultSenderName || "",
        senderEmail: userSettings[0].defaultSenderEmail || "",
        replyToEmail: userSettings[0].defaultReplyToEmail || "",
        defaultFooter: userSettings[0].defaultFooter || "",
        includeUnsubscribeLink: userSettings[0].includeUnsubscribeLink !== false,
      };
    } catch (error) {
      console.error("Error in getEmailSettings:", error);
      throw error;
    }
  }

  async updateEmailSettings(userId: number, emailSettings: EmailSettingsParams) {
    try {
      // Check if settings exist for this user
      const existing = await db.select({ id: settings.id })
        .from(settings)
        .where(eq(settings.userId, userId))
        .limit(1);
      
      if (existing.length === 0) {
        // Create new settings
        const [newSettings] = await db.insert(settings)
          .values({
            userId,
            defaultSenderName: emailSettings.senderName,
            defaultSenderEmail: emailSettings.senderEmail,
            defaultReplyToEmail: emailSettings.replyToEmail,
            defaultFooter: emailSettings.defaultFooter,
            includeUnsubscribeLink: emailSettings.includeUnsubscribeLink,
          })
          .returning();
        
        return {
          senderName: newSettings.defaultSenderName || "",
          senderEmail: newSettings.defaultSenderEmail || "",
          replyToEmail: newSettings.defaultReplyToEmail || "",
          defaultFooter: newSettings.defaultFooter || "",
          includeUnsubscribeLink: newSettings.includeUnsubscribeLink !== false,
        };
      } else {
        // Update existing settings
        const [updatedSettings] = await db.update(settings)
          .set({
            defaultSenderName: emailSettings.senderName,
            defaultSenderEmail: emailSettings.senderEmail,
            defaultReplyToEmail: emailSettings.replyToEmail,
            defaultFooter: emailSettings.defaultFooter,
            includeUnsubscribeLink: emailSettings.includeUnsubscribeLink,
            updatedAt: new Date(),
          })
          .where(eq(settings.userId, userId))
          .returning();
        
        return {
          senderName: updatedSettings.defaultSenderName || "",
          senderEmail: updatedSettings.defaultSenderEmail || "",
          replyToEmail: updatedSettings.defaultReplyToEmail || "",
          defaultFooter: updatedSettings.defaultFooter || "",
          includeUnsubscribeLink: updatedSettings.includeUnsubscribeLink !== false,
        };
      }
    } catch (error) {
      console.error("Error in updateEmailSettings:", error);
      throw error;
    }
  }

  async getSmtpSettings(userId: number) {
    try {
      const userSettings = await db.select({
        smtpHost: settings.smtpHost,
        smtpPort: settings.smtpPort,
        smtpUsername: settings.smtpUsername,
        smtpPassword: settings.smtpPassword,
        useTls: settings.useTls,
      })
      .from(settings)
      .where(eq(settings.userId, userId))
      .limit(1);
      
      if (userSettings.length === 0) {
        return {
          smtpHost: "",
          smtpPort: 587,
          smtpUsername: "",
          smtpPassword: "",
          useTLS: true,
        };
      }
      
      return {
        smtpHost: userSettings[0].smtpHost || "",
        smtpPort: userSettings[0].smtpPort || 587,
        smtpUsername: userSettings[0].smtpUsername || "",
        smtpPassword: userSettings[0].smtpPassword || "",
        useTLS: userSettings[0].useTls !== false,
      };
    } catch (error) {
      console.error("Error in getSmtpSettings:", error);
      throw error;
    }
  }

  async updateSmtpSettings(userId: number, smtpSettings: SmtpSettingsParams) {
    try {
      // Check if settings exist for this user
      const existing = await db.select({ id: settings.id })
        .from(settings)
        .where(eq(settings.userId, userId))
        .limit(1);
      
      if (existing.length === 0) {
        // Create new settings
        const [newSettings] = await db.insert(settings)
          .values({
            userId,
            smtpHost: smtpSettings.smtpHost,
            smtpPort: smtpSettings.smtpPort,
            smtpUsername: smtpSettings.smtpUsername,
            smtpPassword: smtpSettings.smtpPassword,
            useTls: smtpSettings.useTLS,
          })
          .returning();
        
        return {
          smtpHost: newSettings.smtpHost || "",
          smtpPort: newSettings.smtpPort || 587,
          smtpUsername: newSettings.smtpUsername || "",
          smtpPassword: newSettings.smtpPassword || "",
          useTLS: newSettings.useTls !== false,
        };
      } else {
        // Update existing settings
        const [updatedSettings] = await db.update(settings)
          .set({
            smtpHost: smtpSettings.smtpHost,
            smtpPort: smtpSettings.smtpPort,
            smtpUsername: smtpSettings.smtpUsername,
            smtpPassword: smtpSettings.smtpPassword,
            useTls: smtpSettings.useTLS,
            updatedAt: new Date(),
          })
          .where(eq(settings.userId, userId))
          .returning();
        
        return {
          smtpHost: updatedSettings.smtpHost || "",
          smtpPort: updatedSettings.smtpPort || 587,
          smtpUsername: updatedSettings.smtpUsername || "",
          smtpPassword: updatedSettings.smtpPassword || "",
          useTLS: updatedSettings.useTls !== false,
        };
      }
    } catch (error) {
      console.error("Error in updateSmtpSettings:", error);
      throw error;
    }
  }

  async getApiKeys(userId: number) {
    try {
      const userSettings = await db.select({
        apiKey: settings.apiKey,
        apiKeyCreatedAt: settings.apiKeyCreatedAt,
        apiKeyLastUsedAt: settings.apiKeyLastUsedAt,
      })
      .from(settings)
      .where(eq(settings.userId, userId))
      .limit(1);
      
      if (userSettings.length === 0 || !userSettings[0].apiKey) {
        return {
          apiKey: null,
          createdAt: null,
          lastUsedAt: null,
        };
      }
      
      return {
        apiKey: userSettings[0].apiKey,
        createdAt: userSettings[0].apiKeyCreatedAt,
        lastUsedAt: userSettings[0].apiKeyLastUsedAt,
      };
    } catch (error) {
      console.error("Error in getApiKeys:", error);
      throw error;
    }
  }

  async generateApiKey(userId: number) {
    try {
      // Generate a random API key
      const apiKey = randomBytes(32).toString('hex');
      const now = new Date();
      
      // Check if settings exist for this user
      const existing = await db.select({ id: settings.id })
        .from(settings)
        .where(eq(settings.userId, userId))
        .limit(1);
      
      if (existing.length === 0) {
        // Create new settings
        const [newSettings] = await db.insert(settings)
          .values({
            userId,
            apiKey,
            apiKeyCreatedAt: now,
          })
          .returning({ apiKey: settings.apiKey });
        
        return newSettings.apiKey;
      } else {
        // Update existing settings
        const [updatedSettings] = await db.update(settings)
          .set({
            apiKey,
            apiKeyCreatedAt: now,
            updatedAt: now,
          })
          .where(eq(settings.userId, userId))
          .returning({ apiKey: settings.apiKey });
        
        return updatedSettings.apiKey;
      }
    } catch (error) {
      console.error("Error in generateApiKey:", error);
      throw error;
    }
  }
}

export const storage = new Storage();
