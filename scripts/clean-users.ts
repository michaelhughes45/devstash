import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { DEMO_USER_EMAIL } from "../src/lib/demo-user";

// Deletes every user except the demo user, along with everything they own.
// Dry run by default; pass --confirm to actually delete.
const CONFIRM = process.argv.includes("--confirm");

function databaseHost() {
  try {
    return new URL(process.env.DATABASE_URL ?? "").host;
  } catch {
    return "unknown";
  }
}

async function main() {
  const users = await prisma.user.findMany({
    where: { email: { not: DEMO_USER_EMAIL } },
    select: { id: true, email: true, _count: { select: { items: true, collections: true } } },
    orderBy: { createdAt: "asc" },
  });

  console.log(`Database: ${databaseHost()}`);
  console.log(`Keeping: ${DEMO_USER_EMAIL}`);

  if (users.length === 0) {
    console.log("No other users to delete.");
    return;
  }

  console.log(`\nUsers to delete (${users.length}):`);
  for (const user of users) {
    console.log(
      `  - ${user.email} (${user._count.items} items, ${user._count.collections} collections)`,
    );
  }

  if (!CONFIRM) {
    console.log("\nDry run: nothing was deleted. Re-run with --confirm to delete.");
    return;
  }

  const userIds = users.map((user) => user.id);
  const emails = users.map((user) => user.email);

  // Items go first: their type relation doesn't cascade, so deleting a user's
  // custom types while their items still exist could be blocked
  const [items, tokens, deletedUsers] = await prisma.$transaction([
    prisma.item.deleteMany({ where: { userId: { in: userIds } } }),
    prisma.verificationToken.deleteMany({ where: { identifier: { in: emails } } }),
    // Cascades to collections, tags, custom types, accounts and sessions
    prisma.user.deleteMany({ where: { id: { in: userIds } } }),
  ]);

  console.log(
    `\n✔ Deleted ${deletedUsers.count} users, ${items.count} items and ${tokens.count} verification tokens.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
