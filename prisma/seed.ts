import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ─── Demo Users Definition ───────────────────────────────────────────────────
const DEMO_USERS = [
  {
    email: "demo@linkpulse.io",
    password: "Demo1234!",
    name: "Alex Rivera",
  },
  {
    email: "jane@linkpulse.io",
    password: "Demo1234!",
    name: "Jane Doe",
  },
];

// ─── Generator Helpers for Deterministic, Realistic Analytics ─────────────────
// Seeded pseudo-random generator for reproducible and idempotent distributions
function createRandom(seed = 42) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const random = createRandom(1337);

function pickWeighted<T>(items: { value: T; weight: number }[]): T {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let threshold = random() * total;
  for (const item of items) {
    threshold -= item.weight;
    if (threshold <= 0) return item.value;
  }
  return items[items.length - 1].value;
}

// Distribution: Mobile 60%, Desktop 30%, Tablet 10%
function getDeviceType(): string {
  return pickWeighted([
    { value: "mobile", weight: 60 },
    { value: "desktop", weight: 30 },
    { value: "tablet", weight: 10 },
  ]);
}

// Distribution: Chrome 55%, Safari 25%, Firefox 12%, Edge 8%
function getBrowser(): string {
  return pickWeighted([
    { value: "Chrome", weight: 55 },
    { value: "Safari", weight: 25 },
    { value: "Firefox", weight: 12 },
    { value: "Edge", weight: 8 },
  ]);
}

// Distribution: twitter.com, google.com, direct (null), github.com, reddit.com
function getReferrer(): string | null {
  return pickWeighted([
    { value: "https://twitter.com/tech_trends/status/8291038", weight: 28 },
    { value: "https://google.com/search?q=linkpulse+url+shortener", weight: 26 },
    { value: null, weight: 22 }, // Direct
    { value: "https://github.com/trending/developers", weight: 14 },
    { value: "https://reddit.com/r/technology/comments/best_tools", weight: 10 },
  ]);
}

// Generate a realistic timestamp over past 30 days:
// - Weekdays have higher traffic (75%) vs weekends (25%)
// - Peak hours in afternoon/evening (13:00 - 21:00)
function getTimestamp(daysAgoLimit = 30, maxDateLimit?: Date): Date {
  let targetDate = new Date();
  let attempts = 0;

  while (attempts < 50) {
    attempts++;
    const daysAgo = Math.floor(random() * daysAgoLimit);
    const candidate = new Date(Date.now() - daysAgo * 86400000);

    const dayOfWeek = candidate.getDay(); // 0 = Sunday, 6 = Saturday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // Prefer weekdays 3:1 over weekends
    if (isWeekend && random() > 0.35) {
      continue;
    }

    // Peak hours: 13:00 to 21:00 (weight higher)
    let hour: number;
    if (random() < 0.70) {
      // Afternoon / Evening peak: 13:00 to 21:00
      hour = 13 + Math.floor(random() * 9);
    } else {
      // Off-peak hours
      hour = Math.floor(random() * 24);
    }

    const minute = Math.floor(random() * 60);
    const second = Math.floor(random() * 60);
    candidate.setHours(hour, minute, second, 0);

    if (!maxDateLimit || candidate < maxDateLimit) {
      targetDate = candidate;
      break;
    }
  }

  return targetDate;
}

// ─── Main Seeding Procedure ───────────────────────────────────────────────────
async function main() {
  console.log("🌱 Starting LinkPulse Phase 9 database seeding...\n");

  // 1. Seed Demo Users
  const userRecords: Record<string, { id: string; email: string }> = {};

  for (const demoUser of DEMO_USERS) {
    const passwordHash = await bcrypt.hash(demoUser.password, 10);
    const user = await prisma.user.upsert({
      where: { email: demoUser.email },
      update: {
        name: demoUser.name,
        passwordHash,
      },
      create: {
        email: demoUser.email,
        name: demoUser.name,
        passwordHash,
      },
    });

    userRecords[demoUser.email] = { id: user.id, email: user.email };
    console.log(`👤 Verified user: ${user.email} (${user.name})`);
  }

  const now = Date.now();
  const demoUserId = userRecords["demo@linkpulse.io"].id;
  const janeUserId = userRecords["jane@linkpulse.io"].id;

  // 2. Define 10 Demo Links Distributed Across Both Users
  // Total target clicks = 500 across all 10 links
  const demoLinks = [
    // ── User 1: demo@linkpulse.io (5 links) ──
    {
      shortCode: "docs-guide",
      originalUrl: "https://nextjs.org/docs",
      title: "Next.js 16 Documentation",
      isActive: true,
      expiresAt: null,
      userId: demoUserId,
      clickCount: 85,
    },
    {
      shortCode: "summer-launch",
      originalUrl: "https://github.com/trending",
      title: "Summer Open Source Launch",
      isActive: true,
      expiresAt: new Date(now + 45 * 86400000), // Active, expires in 45 days
      userId: demoUserId,
      clickCount: 75,
    },
    {
      shortCode: "old-portfolio",
      originalUrl: "https://wikipedia.org/wiki/Web_development",
      title: "Archived Web Dev Reference",
      isActive: false, // Disabled link
      expiresAt: null,
      userId: demoUserId,
      clickCount: 15,
    },
    {
      shortCode: "flash-sale",
      originalUrl: "https://youtube.com/watch?v=dQw4w9WgXcQ",
      title: "Black Friday Flash Sale (Concluded)",
      isActive: true,
      expiresAt: new Date(now - 10 * 86400000), // Expired 10 days ago
      userId: demoUserId,
      clickCount: 35,
    },
    {
      shortCode: "k9x2m7p",
      originalUrl: "https://developer.mozilla.org/en-US/",
      title: "MDN Web Docs Quick Reference",
      isActive: true,
      expiresAt: null,
      userId: demoUserId,
      clickCount: 40,
    },

    // ── User 2: jane@linkpulse.io (5 links) ──
    {
      shortCode: "design-system",
      originalUrl: "https://figma.com",
      title: "Figma Team Design System",
      isActive: true,
      expiresAt: null,
      userId: janeUserId,
      clickCount: 90,
    },
    {
      shortCode: "react-conf",
      originalUrl: "https://react.dev",
      title: "React Official Docs & Deep Dives",
      isActive: true,
      expiresAt: new Date(now + 60 * 86400000), // Active, expires in 60 days
      userId: janeUserId,
      clickCount: 80,
    },
    {
      shortCode: "beta-invite",
      originalUrl: "https://news.ycombinator.com",
      title: "Hacker News Early Beta Thread",
      isActive: false, // Disabled link
      expiresAt: null,
      userId: janeUserId,
      clickCount: 15,
    },
    {
      shortCode: "spring-promo",
      originalUrl: "https://en.wikipedia.org/wiki/URL_shortening",
      title: "Spring Marketing Promo (Ended)",
      isActive: true,
      expiresAt: new Date(now - 15 * 86400000), // Expired 15 days ago
      userId: janeUserId,
      clickCount: 20,
    },
    {
      shortCode: "v4b8q1z",
      originalUrl: "https://stackoverflow.com",
      title: "Stack Overflow Developer Hub",
      isActive: true,
      expiresAt: null,
      userId: janeUserId,
      clickCount: 45,
    },
  ];

  console.log("\n🔗 Upserting 10 demo links & generating 500 click events...");

  let totalClicksCreated = 0;
  let totalClicksPreserved = 0;

  for (const linkDef of demoLinks) {
    // Upsert link idempotently
    const link = await prisma.link.upsert({
      where: { shortCode: linkDef.shortCode },
      update: {
        title: linkDef.title,
        originalUrl: linkDef.originalUrl,
        isActive: linkDef.isActive,
        expiresAt: linkDef.expiresAt,
        userId: linkDef.userId,
      },
      create: {
        shortCode: linkDef.shortCode,
        originalUrl: linkDef.originalUrl,
        title: linkDef.title,
        isActive: linkDef.isActive,
        expiresAt: linkDef.expiresAt,
        userId: linkDef.userId,
      },
    });

    // Check existing clicks to ensure strict idempotency and target volume (~500 clicks)
    const existingClickCount = await prisma.click.count({
      where: { linkId: link.id },
    });

    if (existingClickCount < linkDef.clickCount) {
      const remainingClicks = linkDef.clickCount - existingClickCount;
      // Generate clicks matching realistic distributions
      const clicksToCreate = [];
      const maxDate = linkDef.expiresAt && linkDef.expiresAt < new Date() ? linkDef.expiresAt : undefined;

      for (let i = 0; i < remainingClicks; i++) {
        clicksToCreate.push({
          linkId: link.id,
          deviceType: getDeviceType(),
          browser: getBrowser(),
          referrer: getReferrer(),
          timestamp: getTimestamp(30, maxDate),
        });
      }

      await prisma.click.createMany({
        data: clicksToCreate,
      });

      totalClicksCreated += remainingClicks;
      console.log(
        `   ✔ /${link.shortCode.padEnd(14)} (${linkDef.isActive ? (linkDef.expiresAt && linkDef.expiresAt < new Date() ? "expired" : "active") : "disabled"}) → Added ${remainingClicks} clicks (Total: ${linkDef.clickCount})`
      );
    } else {
      totalClicksPreserved += existingClickCount;
      console.log(
        `   ✔ /${link.shortCode.padEnd(14)} (${linkDef.isActive ? (linkDef.expiresAt && linkDef.expiresAt < new Date() ? "expired" : "active") : "disabled"}) → Preserved ${existingClickCount} existing clicks`
      );
    }
  }

  console.log("\n==================================================");
  console.log("✅ Seed completed successfully!");
  console.log(`   Users:         2 demo accounts`);
  console.log(`   Links:         10 short links (6 active, 2 disabled, 2 expired)`);
  if (totalClicksCreated > 0) {
    console.log(`   Clicks seeded: ${totalClicksCreated} telemetry records`);
  } else {
    console.log(`   Clicks:        ${totalClicksPreserved} existing records preserved (idempotent)`);
  }
  console.log("==================================================");
  console.log("Demo Credentials:");
  console.log("  1. Email:    demo@linkpulse.io");
  console.log("     Password: Demo1234!\n");
  console.log("  2. Email:    jane@linkpulse.io");
  console.log("     Password: Demo1234!");
  console.log("==================================================\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
