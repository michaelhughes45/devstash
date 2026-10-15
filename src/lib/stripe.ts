import Stripe from "stripe";

let client: Stripe | undefined;

// Created on first use, so importing this during build or tests never needs the key
export function stripe(): Stripe {
  if (!client) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
    client = new Stripe(key);
  }
  return client;
}
