import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";

const DEMO_EMAIL = "demo@devstash.io";
const DEMO_PASSWORD = "12345678";

// Expected item counts per collection, from context/features/seed-spec.md
const EXPECTED_COLLECTIONS: Record<string, number> = {
  "React Patterns": 3,
  "AI Workflows": 3,
  DevOps: 4,
  "Terminal Commands": 4,
  "Design Resources": 4,
};

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function checkConnection() {
  const [{ now }] = await prisma.$queryRaw<{ now: Date }[]>`SELECT NOW() as now`;
  console.log(`✔ Connected (server time: ${now.toISOString()})`);
}

async function logTableCounts() {
  const [users, itemTypes, items, collections, tags] = await Promise.all([
    prisma.user.count(),
    prisma.itemType.count(),
    prisma.item.count(),
    prisma.collection.count(),
    prisma.tag.count(),
  ]);
  console.log("✔ Table counts:", { users, itemTypes, items, collections, tags });
}

async function checkDemoUser() {
  const user = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } });
  assert(user, `Demo user ${DEMO_EMAIL} not found. Run \`npx prisma db seed\``);
  assert(user.password, "Demo user has no password");
  assert(await bcrypt.compare(DEMO_PASSWORD, user.password), "Demo user password does not match");
  assert(!user.isPro && user.emailVerified, "Demo user should be free and email-verified");

  console.log(`\n✔ Demo user: ${user.name} <${user.email}> (password ok, isPro: ${user.isPro})`);
  return user.id;
}

async function showSystemTypes() {
  const types = await prisma.itemType.findMany({
    where: { isSystem: true, userId: null },
    include: { _count: { select: { items: true } } },
    orderBy: { name: "asc" },
  });
  assert(types.length === 7, `Expected 7 system item types, found ${types.length}`);

  console.log(`\n✔ System item types (${types.length}):`);
  for (const type of types) {
    console.log(`  - ${type.name.padEnd(8)} ${type.icon?.padEnd(10)} ${type.color}  ${type._count.items} items`);
  }
}

async function showDemoCollections(userId: string) {
  const collections = await prisma.collection.findMany({
    where: { userId },
    include: { items: { include: { item: { include: { type: true } } } } },
    orderBy: { createdAt: "asc" },
  });
  assert(
    collections.length === Object.keys(EXPECTED_COLLECTIONS).length,
    `Expected ${Object.keys(EXPECTED_COLLECTIONS).length} collections, found ${collections.length}`,
  );

  console.log(`\n✔ Collections (${collections.length}):`);
  for (const collection of collections) {
    const expected = EXPECTED_COLLECTIONS[collection.name];
    assert(
      collection.items.length === expected,
      `"${collection.name}" should have ${expected} items, found ${collection.items.length}`,
    );

    console.log(`\n  ${collection.name} — ${collection.description}`);
    for (const { item } of collection.items) {
      const detail = item.url ?? item.language ?? "";
      assert(item.url || item.content, `"${item.title}" has no content or URL`);
      console.log(`    [${item.type.name}] ${item.title}  ${detail}`);
    }
  }
}

async function testCascadeDelete() {
  const user = await prisma.user.create({
    data: {
      email: `test-db-${Date.now()}@devstash.local`,
      itemTypes: { create: { name: "Test Type" } },
      tags: { create: { name: "test-tag" } },
      collections: { create: { name: "Test Collection" } },
    },
    include: { itemTypes: true, tags: true, collections: true },
  });

  await prisma.item.create({
    data: {
      title: "Test Item",
      content: "console.log('hello')",
      userId: user.id,
      typeId: user.itemTypes[0].id,
      tags: { create: { tagId: user.tags[0].id } },
      collections: { create: { collectionId: user.collections[0].id } },
    },
  });
  console.log("✔ Created test user with type, tag, collection and item");

  await prisma.user.delete({ where: { id: user.id } });
  const leftover = await prisma.item.count({ where: { userId: user.id } });
  if (leftover !== 0) throw new Error("Cascade delete left orphaned items");
  console.log("✔ Deleted test user and cascaded to related records");
}

async function main() {
  await checkConnection();
  await logTableCounts();
  const demoUserId = await checkDemoUser();
  await showSystemTypes();
  await showDemoCollections(demoUserId);
  console.log();
  await testCascadeDelete();
  console.log("\nDatabase test passed");
}

main()
  .catch((error) => {
    console.error("✘ Database test failed:", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
