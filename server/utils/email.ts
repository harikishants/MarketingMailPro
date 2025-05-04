import nodemailer from 'nodemailer';
import { db } from "@db";
import { campaigns, contacts, contactListMemberships, campaignEvents, settings } from "@shared/schema";
import { eq, and } from "drizzle-orm";

interface SmtpConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  useTLS: boolean;
}

class EmailService {
  private getTransporter(config: SmtpConfig) {
    return nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.useTLS,
      auth: {
        user: config.username,
        pass: config.password,
      },
    });
  }

  async testSmtpConnection(config: SmtpConfig): Promise<{ success: boolean; error?: string }> {
    try {
      const transporter = this.getTransporter(config);
      await transporter.verify();
      return { success: true };
    } catch (error) {
      console.error('SMTP connection test failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  async sendCampaign(campaignId: number): Promise<{ success: boolean; error?: string }> {
    try {
      // Get campaign details
      const campaign = await db.query.campaigns.findFirst({
        where: eq(campaigns.id, campaignId),
        with: {
          user: true
        }
      });

      if (!campaign) {
        return { success: false, error: 'Campaign not found' };
      }

      // Get SMTP settings for the user
      const userSettings = await db.query.settings.findFirst({
        where: eq(settings.userId, campaign.userId)
      });

      if (!userSettings || !userSettings.smtpHost) {
        return { success: false, error: 'SMTP settings not configured' };
      }

      const smtpConfig: SmtpConfig = {
        host: userSettings.smtpHost || '',
        port: userSettings.smtpPort || 587,
        username: userSettings.smtpUsername || '',
        password: userSettings.smtpPassword || '',
        useTLS: userSettings.useTls !== false,
      };

      // Get contacts for the campaign's list
      const contactsInList = await db.select({
        id: contacts.id,
        email: contacts.email, 
        name: contacts.name
      })
      .from(contacts)
      .innerJoin(
        contactListMemberships,
        eq(contacts.id, contactListMemberships.contactId)
      )
      .where(
        and(
          eq(contactListMemberships.listId, campaign.listId),
          eq(contacts.status, 'active')
        )
      );

      if (contactsInList.length === 0) {
        // Update campaign status to sent but with no recipients
        await db.update(campaigns)
          .set({ 
            status: 'sent',
            sentAt: new Date(),
            updatedAt: new Date()
          })
          .where(eq(campaigns.id, campaignId));
          
        return { success: true };
      }

      // Setup email transporter
      const transporter = this.getTransporter(smtpConfig);

      // Update campaign status to sending
      await db.update(campaigns)
        .set({ 
          status: 'sending',
          updatedAt: new Date()
        })
        .where(eq(campaigns.id, campaignId));

      // Add unsubscribe link if required
      let content = campaign.content;
      if (userSettings.includeUnsubscribeLink) {
        const unsubscribeLink = `<div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
          <p>If you no longer wish to receive these emails, you can <a href="[[UNSUBSCRIBE_LINK]]" style="color: #4A6FFF;">unsubscribe here</a>.</p>
        </div>`;
        content = content + unsubscribeLink;
      }

      // Add default footer if exists
      if (userSettings.defaultFooter) {
        content = content + `<div style="margin-top: 20px; font-size: 12px; color: #666;">
          ${userSettings.defaultFooter}
        </div>`;
      }

      // Send emails to all contacts
      for (const contact of contactsInList) {
        try {
          // Personalize email content
          let personalizedContent = content.replace(/\[name\]/gi, contact.name || 'there');
          // In a real app, replace other personalization tokens

          // Add unique tracking pixel
          const trackingPixel = `<img src="[[TRACKING_PIXEL_URL]]&contactId=${contact.id}&campaignId=${campaignId}" width="1" height="1" alt="" style="display:none;">`;
          personalizedContent = personalizedContent + trackingPixel;

          // Replace unsubscribe link with actual link
          personalizedContent = personalizedContent.replace(
            '[[UNSUBSCRIBE_LINK]]', 
            `https://yourdomain.com/unsubscribe?email=${encodeURIComponent(contact.email)}&campaignId=${campaignId}`
          );

          // Send the email
          await transporter.sendMail({
            from: `"${campaign.senderName}" <${campaign.senderEmail}>`,
            to: contact.email,
            subject: campaign.subject,
            html: personalizedContent,
            replyTo: campaign.replyToEmail
          });

          // Record sent event
          await db.insert(campaignEvents)
            .values({
              campaignId,
              contactId: contact.id,
              eventType: 'sent',
              createdAt: new Date()
            });
        } catch (error) {
          console.error(`Failed to send email to ${contact.email}:`, error);
          
          // Record bounce event
          await db.insert(campaignEvents)
            .values({
              campaignId,
              contactId: contact.id,
              eventType: 'bounced',
              metadata: { 
                reason: error instanceof Error ? error.message : 'Unknown error', 
                type: 'soft' 
              },
              createdAt: new Date()
            });
        }
      }

      // Update campaign status to sent
      await db.update(campaigns)
        .set({ 
          status: 'sent',
          sentAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(campaigns.id, campaignId));

      return { success: true };
    } catch (error) {
      console.error('Error sending campaign:', error);
      
      // Update campaign status to failed
      await db.update(campaigns)
        .set({ 
          status: 'failed',
          updatedAt: new Date()
        })
        .where(eq(campaigns.id, campaignId));
        
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  async trackEmailOpen(campaignId: number, contactId: number): Promise<void> {
    try {
      // Check if an open event already exists for this campaign and contact
      const existingEvent = await db.query.campaignEvents.findFirst({
        where: and(
          eq(campaignEvents.campaignId, campaignId),
          eq(campaignEvents.contactId, contactId),
          eq(campaignEvents.eventType, 'opened')
        )
      });

      // Only record first open
      if (!existingEvent) {
        await db.insert(campaignEvents)
          .values({
            campaignId,
            contactId,
            eventType: 'opened',
            createdAt: new Date()
          });
      }
    } catch (error) {
      console.error('Error tracking email open:', error);
    }
  }

  async trackEmailClick(campaignId: number, contactId: number, url: string): Promise<void> {
    try {
      await db.insert(campaignEvents)
        .values({
          campaignId,
          contactId,
          eventType: 'clicked',
          metadata: { url },
          createdAt: new Date()
        });
    } catch (error) {
      console.error('Error tracking email click:', error);
    }
  }

  async processUnsubscribe(email: string, campaignId?: number): Promise<boolean> {
    try {
      const contact = await db.query.contacts.findFirst({
        where: eq(contacts.email, email)
      });

      if (!contact) {
        return false;
      }

      // Update contact status
      await db.update(contacts)
        .set({ 
          status: 'unsubscribed',
          updatedAt: new Date()
        })
        .where(eq(contacts.id, contact.id));

      // Record unsubscribe event if campaign ID is provided
      if (campaignId) {
        await db.insert(campaignEvents)
          .values({
            campaignId,
            contactId: contact.id,
            eventType: 'unsubscribed',
            createdAt: new Date()
          });
      }

      return true;
    } catch (error) {
      console.error('Error processing unsubscribe:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();
