import { describe, expect, it } from "vitest";
import { contactSchema, fieldErrors, newsletterSchema, quoteSchema } from "./forms";

const validQuote = {
  segment: "ong",
  organization: "ONG Exemple",
  services: ["production-photo-video"],
  message: "Nous cherchons une couverture photo d'une activité terrain à Abéché.",
  budget_range: "1m-3m",
  timeline: "1-mois",
  location: "province",
  full_name: "Amina Test",
  email: "Amina@Example.org ",
  phone: "+235 66 00 00 00",
  consent: true,
};

describe("quoteSchema", () => {
  it("accepts a complete request and normalises the e-mail", () => {
    const r = quoteSchema.parse(validQuote);
    expect(r.email).toBe("amina@example.org");
  });

  it("requires consent", () => {
    const r = quoteSchema.safeParse({ ...validQuote, consent: false });
    expect(r.success).toBe(false);
    if (!r.success) expect(fieldErrors(r.error).consent).toMatch(/accord/);
  });

  it("rejects unknown fields (mass assignment)", () => {
    expect(quoteSchema.safeParse({ ...validQuote, status: "won" }).success).toBe(false);
    expect(quoteSchema.safeParse({ ...validQuote, admin_notes: "x" }).success).toBe(false);
  });

  it("rejects services outside the catalogue and empty selections", () => {
    expect(quoteSchema.safeParse({ ...validQuote, services: ["hack"] }).success).toBe(false);
    expect(quoteSchema.safeParse({ ...validQuote, services: [] }).success).toBe(false);
  });

  it("rejects control characters and oversized messages", () => {
    expect(quoteSchema.safeParse({ ...validQuote, message: "Bonjour\u0000 nous voulons un devis complet" }).success).toBe(false);
    expect(quoteSchema.safeParse({ ...validQuote, message: "x".repeat(4001) }).success).toBe(false);
  });

  it("rejects an invalid phone number but accepts an empty one", () => {
    expect(quoteSchema.safeParse({ ...validQuote, phone: "abc" }).success).toBe(false);
    expect(quoteSchema.safeParse({ ...validQuote, phone: "" }).success).toBe(true);
  });
});

describe("contactSchema and newsletterSchema", () => {
  it("validates a contact message", () => {
    expect(
      contactSchema.safeParse({
        full_name: "Mahamat",
        email: "m@example.org",
        topic: "question",
        message: "Quels sont vos délais ?",
        consent: true,
      }).success,
    ).toBe(true);
  });

  it("rejects an invalid newsletter e-mail", () => {
    expect(newsletterSchema.safeParse({ email: "pas-un-email", consent: true }).success).toBe(false);
  });
});
