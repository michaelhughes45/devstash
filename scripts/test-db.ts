import "dotenv/config";
import { prisma } from "../src/lib/prisma";

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
  await testCascadeDelete();
  console.log("\nDatabase test passed");
}

main()
  .catch((error) => {
    console.error("✘ Database test failed:", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
