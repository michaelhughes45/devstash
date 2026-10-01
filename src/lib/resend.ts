import { Resend } from "resend";

// Resend's shared test sender; only delivers to the Resend account's own address
export const EMAIL_FROM = "DevStash <onboarding@resend.dev>";

export const resend = new Resend(process.env.RESEND_API_KEY);
