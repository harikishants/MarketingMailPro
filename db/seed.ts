import { db } from "./index";
import * as schema from "@shared/schema";
import { eq } from "drizzle-orm";
import { hash } from "bcrypt";

async function seed() {
  try {
    console.log("Starting database seed...");

    // Create default user
    const existingUser = await db.query.users.findFirst({
      where: eq(schema.users.email, "admin@example.com")
    });

    if (!existingUser) {
      console.log("Creating default user...");
      const hashedPassword = await hash("password123", 10);
      const [user] = await db.insert(schema.users)
        .values({
          username: "admin",
          password: hashedPassword,
          name: "John Smith",
          email: "admin@example.com", 
          company: "BulkMail Pro",
          website: "https://bulkmailpro.example.com"
        })
        .returning();

      // Create default settings
      await db.insert(schema.settings)
        .values({
          userId: user.id,
          defaultSenderName: "John Smith",
          defaultSenderEmail: "john@example.com",
          defaultReplyToEmail: "john@example.com",
          defaultFooter: "© 2023 BulkMail Pro. All rights reserved.",
          includeUnsubscribeLink: true,
          smtpHost: "smtp.example.com",
          smtpPort: 587,
          smtpUsername: "smtp_user",
          smtpPassword: "smtp_password",
          useTls: true
        });

      // Create contact lists
      const [mainList] = await db.insert(schema.contactLists)
        .values({
          name: "Main Subscribers",
          description: "Primary list of subscribers",
          userId: user.id
        })
        .returning();

      const [newsletterList] = await db.insert(schema.contactLists)
        .values({
          name: "Newsletter",
          description: "Monthly newsletter subscribers",
          userId: user.id
        })
        .returning();

      const [premiumList] = await db.insert(schema.contactLists)
        .values({
          name: "Premium Customers",
          description: "Premium customers with special offers",
          userId: user.id
        })
        .returning();

      // Create some contacts
      const contactsData = [
        { email: "john.doe@example.com", name: "John Doe", status: "active", lists: [mainList.id, newsletterList.id] },
        { email: "jane.smith@example.com", name: "Jane Smith", status: "active", lists: [premiumList.id] },
        { email: "robert.johnson@example.com", name: "Robert Johnson", status: "unsubscribed", lists: [mainList.id] },
        { email: "sarah.williams@example.com", name: "Sarah Williams", status: "bounced", lists: [newsletterList.id, premiumList.id] },
        { email: "michael.brown@example.com", name: "Michael Brown", status: "active", lists: [mainList.id, newsletterList.id] },
        { email: "emily.davis@example.com", name: "Emily Davis", status: "active", lists: [premiumList.id] },
        { email: "david.miller@example.com", name: "David Miller", status: "active", lists: [mainList.id, premiumList.id] },
        { email: "jennifer.wilson@example.com", name: "Jennifer Wilson", status: "active", lists: [newsletterList.id] }
      ];

      console.log("Creating contacts...");
      for (const contactData of contactsData) {
        const [contact] = await db.insert(schema.contacts)
          .values({
            email: contactData.email,
            name: contactData.name,
            status: contactData.status as any,
            userId: user.id
          })
          .returning();

        // Add to specified lists
        for (const listId of contactData.lists) {
          await db.insert(schema.contactListMemberships)
            .values({
              contactId: contact.id,
              listId: listId
            });
        }
      }

      // Create some templates
      console.log("Creating email templates...");
      const [monthlyTemplate] = await db.insert(schema.templates)
        .values({
          name: "Monthly Newsletter",
          description: "Standard monthly newsletter template",
          content: `<div class="p-4 bg-primary text-white text-center">
            <h1 class="text-xl font-bold">Monthly Newsletter</h1>
            <p>July 2023 Edition</p>
          </div>
          
          <div class="p-6">
            <h2 class="text-lg font-semibold text-neutral-800 mb-4">Hello [name],</h2>
            
            <p class="text-neutral-600 mb-4">
              Welcome to our July newsletter! We have some exciting updates to share with you this month.
            </p>
            
            <div class="mb-6">
              <img src="https://images.unsplash.com/photo-1499750310107-5fef28a66643?ixlib=rb-4.0.3&auto=format&fit=crop&w=2340&q=80" 
                   alt="A laptop on a desk with a coffee cup" 
                   class="w-full h-48 object-cover rounded-md mb-2">
              <p class="text-xs text-neutral-500 text-center">Our new office space!</p>
            </div>
            
            <h3 class="text-base font-semibold text-neutral-800 mb-2">What's New This Month</h3>
            
            <p class="text-neutral-600 mb-4">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla quam velit, vulputate eu pharetra nec, mattis ac neque.
            </p>
            
            <div class="text-center mb-6">
              <a href="#" class="inline-block px-6 py-2 bg-secondary text-white rounded-md">Read More</a>
            </div>
            
            <hr class="my-6 border-neutral-200">
            
            <h3 class="text-base font-semibold text-neutral-800 mb-2">Upcoming Events</h3>
            
            <ul class="list-disc pl-5 mb-4 text-neutral-600">
              <li>July 15 - Summer Webinar Series</li>
              <li>July 22 - Product Launch</li>
              <li>July 30 - Customer Appreciation Day</li>
            </ul>
            
            <div class="text-center mt-6">
              <a href="#" class="text-primary hover:underline">View all events</a>
            </div>
          </div>`,
          userId: user.id,
          backgroundColor: "#FFFFFF",
          textColor: "#1E293B",
          font: "Arial"
        })
        .returning();

      const [welcomeTemplate] = await db.insert(schema.templates)
        .values({
          name: "Welcome Email",
          description: "Welcome new subscribers",
          content: `<div class="p-4 bg-primary text-white text-center">
            <h1 class="text-xl font-bold">Welcome to Our Community!</h1>
          </div>
          
          <div class="p-6">
            <h2 class="text-lg font-semibold text-neutral-800 mb-4">Hello [name],</h2>
            
            <p class="text-neutral-600 mb-4">
              Thank you for subscribing to our newsletter! We're excited to have you join our community.
            </p>
            
            <div class="mb-6">
              <img src="https://images.unsplash.com/photo-1516387938699-a93567ec168e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2340&q=80" 
                   alt="Welcoming handshake" 
                   class="w-full h-48 object-cover rounded-md mb-2">
            </div>
            
            <h3 class="text-base font-semibold text-neutral-800 mb-2">What to Expect</h3>
            
            <p class="text-neutral-600 mb-4">
              Here's what you can look forward to as a subscriber:
            </p>
            
            <ul class="list-disc pl-5 mb-4 text-neutral-600">
              <li>Monthly newsletters with the latest updates</li>
              <li>Exclusive offers and promotions</li>
              <li>Industry insights and tips</li>
            </ul>
            
            <div class="text-center mb-6">
              <a href="#" class="inline-block px-6 py-2 bg-secondary text-white rounded-md">Explore Our Website</a>
            </div>
          </div>`,
          userId: user.id,
          backgroundColor: "#FFFFFF",
          textColor: "#1E293B",
          font: "Arial"
        })
        .returning();

      const [promotionTemplate] = await db.insert(schema.templates)
        .values({
          name: "Promotional Offer",
          description: "Special sales and promotional offers",
          content: `<div class="p-4 bg-secondary text-white text-center">
            <h1 class="text-xl font-bold">Special Offer Inside!</h1>
          </div>
          
          <div class="p-6">
            <h2 class="text-lg font-semibold text-neutral-800 mb-4">Hello [name],</h2>
            
            <p class="text-neutral-600 mb-4">
              We have an exclusive offer just for you!
            </p>
            
            <div class="bg-neutral-50 p-4 rounded-md border border-neutral-200 mb-6 text-center">
              <h3 class="text-xl font-bold text-secondary mb-2">25% OFF</h3>
              <p class="text-neutral-800 mb-2">Use code: <span class="font-bold">SPECIAL25</span></p>
              <p class="text-xs text-neutral-500">Valid until June 30, 2023</p>
            </div>
            
            <div class="mb-6">
              <img src="https://images.unsplash.com/photo-1607083206968-13611e3d76db?ixlib=rb-4.0.3&auto=format&fit=crop&w=2340&q=80" 
                   alt="Special offer" 
                   class="w-full h-48 object-cover rounded-md mb-2">
            </div>
            
            <div class="text-center mb-6">
              <a href="#" class="inline-block px-6 py-2 bg-secondary text-white rounded-md">Shop Now</a>
            </div>
          </div>`,
          userId: user.id,
          backgroundColor: "#FFFFFF",
          textColor: "#1E293B",
          font: "Arial"
        })
        .returning();

      // Create some campaigns
      console.log("Creating campaigns...");
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      
      const oneMonthAgo = new Date();
      oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      await db.insert(schema.campaigns)
        .values({
          name: "July Newsletter",
          subject: "Your July Newsletter Is Here",
          content: monthlyTemplate.content,
          senderName: "John Smith",
          senderEmail: "john@example.com",
          replyToEmail: "john@example.com",
          listId: mainList.id,
          userId: user.id,
          templateId: monthlyTemplate.id,
          status: "sent",
          sentAt: twoWeeksAgo
        });

      await db.insert(schema.campaigns)
        .values({
          name: "Summer Sale Announcement",
          subject: "Don't Miss Our Biggest Summer Sale!",
          content: promotionTemplate.content,
          senderName: "John Smith",
          senderEmail: "john@example.com",
          replyToEmail: "john@example.com",
          listId: premiumList.id,
          userId: user.id,
          templateId: promotionTemplate.id,
          status: "scheduled",
          scheduledAt: tomorrow
        });

      await db.insert(schema.campaigns)
        .values({
          name: "New Product Launch",
          subject: "Introducing Our Latest Product",
          content: "<p>Draft campaign content goes here</p>",
          senderName: "John Smith",
          senderEmail: "john@example.com",
          replyToEmail: "john@example.com",
          listId: premiumList.id,
          userId: user.id,
          status: "draft"
        });

      await db.insert(schema.campaigns)
        .values({
          name: "June Newsletter",
          subject: "Your June Newsletter Is Here",
          content: monthlyTemplate.content,
          senderName: "John Smith",
          senderEmail: "john@example.com",
          replyToEmail: "john@example.com",
          listId: mainList.id,
          userId: user.id,
          templateId: monthlyTemplate.id,
          status: "sent",
          sentAt: oneMonthAgo
        });

      console.log("Database seed completed successfully!");
    } else {
      console.log("Database already seeded. Skipping...");
    }
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

seed();
