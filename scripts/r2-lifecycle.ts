import "dotenv/config";
import {
  GetBucketLifecycleConfigurationCommand,
  PutBucketLifecycleConfigurationCommand,
  type LifecycleRule,
} from "@aws-sdk/client-s3";

import { PENDING_PREFIX, bucket, r2Client } from "../src/lib/r2";

// Adds (or updates) the bucket lifecycle rule that deletes uploads left under
// pending/ for a day, i.e. files uploaded but never turned into an item.
// Other rules on the bucket are kept. Dry run by default; pass --confirm to apply.
const CONFIRM = process.argv.includes("--confirm");

const RULE_ID = "delete-abandoned-uploads";
const EXPIRE_AFTER_DAYS = 1;

const PENDING_RULE: LifecycleRule = {
  ID: RULE_ID,
  Status: "Enabled",
  Filter: { Prefix: PENDING_PREFIX },
  Expiration: { Days: EXPIRE_AFTER_DAYS },
};

async function currentRules(): Promise<LifecycleRule[]> {
  try {
    const result = await r2Client().send(
      new GetBucketLifecycleConfigurationCommand({ Bucket: bucket() }),
    );
    return result.Rules ?? [];
  } catch (error) {
    // A bucket with no lifecycle configuration answers with this error
    if (error instanceof Error && error.name === "NoSuchLifecycleConfiguration") return [];
    throw error;
  }
}

function describeRule(rule: LifecycleRule): string {
  const prefix = rule.Filter?.Prefix ?? "(all objects)";
  const days = rule.Expiration?.Days;
  return `${rule.ID ?? "(no id)"}: ${rule.Status}, prefix ${prefix}${days ? `, expire after ${days} day(s)` : ""}`;
}

async function main() {
  const rules = await currentRules();
  console.log(`Bucket: ${bucket()}`);
  console.log(`\nCurrent rules (${rules.length}):`);
  for (const rule of rules) console.log(`  - ${describeRule(rule)}`);

  // PutBucketLifecycleConfiguration replaces every rule, so the others are sent back too
  const nextRules = [...rules.filter((rule) => rule.ID !== RULE_ID), PENDING_RULE];
  console.log(`\nRule to apply:\n  - ${describeRule(PENDING_RULE)}`);

  if (!CONFIRM) {
    console.log("\nDry run: nothing was changed. Re-run with --confirm to apply.");
    return;
  }

  await r2Client().send(
    new PutBucketLifecycleConfigurationCommand({
      Bucket: bucket(),
      LifecycleConfiguration: { Rules: nextRules },
    }),
  );
  console.log(`\n✔ Applied. The bucket now has ${nextRules.length} rule(s):`);
  for (const rule of await currentRules()) console.log(`  - ${describeRule(rule)}`);
}

main().catch((error) => {
  if (error instanceof Error && error.name === "AccessDenied") {
    // The app's token should only read and write objects, so this is expected
    console.error(
      `Access denied: the R2 token in .env can't manage bucket settings.\n` +
        `Either run this with an Admin Read & Write token, or add the rule in the\n` +
        `Cloudflare dashboard: R2 → ${bucket()} → Settings → Object lifecycle rules →\n` +
        `Add rule, prefix "${PENDING_PREFIX}", delete objects ${EXPIRE_AFTER_DAYS} day after upload.`,
    );
  } else {
    console.error(error);
  }
  process.exitCode = 1;
});
