import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_USER = {
  email: "demo@linkpulse.io",
  password: "DemoPassword123!",
  name: "LinkPulse Demo User",
};

async function main() {
  console.log("🌱 Seeding LinkPulse development database...");

  // 1. Upsert Demo User (Idempotent)
  const passwordHash = await bcrypt.hash(DEMO_USER.password, 10);
  const user = await prisma.user.upsert({
    where: { email: DEMO_USER.email },
    update: {
      name: DEMO_USER.name,
      // Do not overwrite passwordHash if user exists and changed it
    },
    create: {
      email: DEMO_USER.email,
      name: DEMO_USER.name,
      passwordHash,
    },
  });

  console.log(`👤 Demo user verified: ${user.email} (id: ${user.id})`);

  // 2. Define Sample Short Links
  const now = Date.now();
  const sampleLinks = [
    {
      shortCode: "docs-guide",
      originalUrl: "https://nextjs.org/docs",
      title: "Next.js 16 Documentation",
      isActive: true,
      expiresAt: null,
      clicks: [
        { referrer: "https://github.com/trending", deviceType: "desktop", browser: "Chrome", daysAgo: 5 },
        { referrer: "https://github.com/trending", deviceType: "desktop", browser: "Chrome", daysAgo: 5 },
        { referrer: "https://twitter.com/nextjs", deviceType: "mobile", browser: "Safari", daysAgo: 4 },
        { referrer: "https://twitter.com/nextjs", deviceType: "mobile", browser: "Safari", daysAgo: 4 },
        { referrer: "https://news.ycombinator.com", deviceType: "desktop", browser: "Firefox", daysAgo: 3 },
        { referrer: "https://news.ycombinator.com", deviceType: "desktop", browser: "Chrome", daysAgo: 2 },
        { referrer: null, deviceType: "desktop", browser: "Edge", daysAgo: 2 }, // Direct
        { referrer: null, deviceType: "mobile", browser: "Chrome", daysAgo: 1 }, // Direct
        { referrer: "https://linkedin.com/feed", deviceType: "mobile", browser: "Safari", daysAgo: 1 },
        { referrer: "https://google.com/search", deviceType: "desktop", browser: "Chrome", daysAgo: 0 },
      ],
    },
    {
      shortCode: "summer-launch",
      originalUrl: "https://github.com/trending",
      title: "Summer Product Launch",
      isActive: true,
      expiresAt: new Date(now + 30 * 86400000), // 30 days in future
      clicks: [
        { referrer: "https://twitter.com/startup", deviceType: "mobile", browser: "Safari", daysAgo: 3 },
        { referrer: "https://linkedin.com", deviceType: "desktop", browser: "Chrome", daysAgo: 2 },
        { referrer: null, deviceType: "desktop", browser: "Chrome", daysAgo: 1 },
        { referrer: "https://reddit.com/r/technology", deviceType: "desktop", browser: "Firefox", daysAgo: 0 },
      ],
    },
    {
      shortCode: "old-portfolio",
      originalUrl: "https://example.com/portfolio-v1",
      title: "Archived Portfolio (Disabled)",
      isActive: false, // Disabled link
      expiresAt: null,
      clicks: [
        { referrer: "https://linkedin.com", deviceType: "desktop", browser: "Chrome", daysAgo: 12 },
        { referrer: null, deviceType: "mobile", browser: "Safari", daysAgo: 10 },
      ],
    },
    {
      shortCode: "flash-sale",
      originalUrl: "https://example.com/promo-2025",
      title: "Black Friday Flash Sale (Expired)",
      isActive: true,
      expiresAt: new Date(now - 7 * 86400000), // Expired 7 days ago
      clicks: [
        { referrer: "https://twitter.com", deviceType: "mobile", browser: "Safari", daysAgo: 9 },
        { referrer: "https://facebook.com", deviceType: "mobile", browser: "Chrome", daysAgo: 8 },
        { referrer: null, deviceType: "desktop", browser: "Edge", daysAgo: 8 },
      ],
    },
  ];

  // 3. Upsert Sample Links & Analytics Clicks
  for (const item of sampleLinks) {
    const link = await prisma.link.upsert({
      where: { shortCode: item.shortCode },
      update: {
        title: item.title,
        originalUrl: item.originalUrl,
        isActive: item.isActive,
        expiresAt: item.expiresAt,
      },
      create: {
        shortCode: item.shortCode,
        originalUrl: item.originalUrl,
        title: item.title,
        isActive: item.isActive,
        expiresAt: item.expiresAt,
        userId: user.id,
      },
    });

    // Check if clicks already exist to avoid duplicate accumulation
    const existingClicks = await prisma.click.count({ where: { linkId: link.id } });
    if (existingClicks === 0 && item.clicks && item.clicks.length > 0) {
      for (const clickData of item.clicks) {
        const clickTimestamp = new Date(now - clickData.daysAgo * 86400000);
        await prisma.click.create({
          data: {
            linkId: link.id,
            timestamp: clickTimestamp,
            referrer: clickData.referrer,
            deviceType: clickData.deviceType,
            browser: clickData.browser,
          },
        });
      }
      console.log(`   🔗 Seeded link /${link.shortCode} with ${item.clicks.length} sample clicks`);
    } else {
      console.log(`   🔗 Verified link /${link.shortCode} (${existingClicks} existing clicks preserved)`);
    }
  }

  console.log("\n✅ Database seed completed successfully!");
  console.log("--------------------------------------------------");
  console.log("Demo Credentials:");
  console.log(`  Email:    ${DEMO_USER.email}`);
  console.log(`  Password: ${DEMO_USER.password}`);
  console.log("--------------------------------------------------");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
