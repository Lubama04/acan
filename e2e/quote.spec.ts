import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// Writes to the database only when E2E_ALLOW_WRITE=1 (there is no separate staging database).

test.describe("quote request journey", () => {
  test("validates each step before moving on", async ({ page }) => {
    await page.goto("/devis");
    await expect(page.getByText("Étape 1 sur 4")).toBeVisible();
    await page.getByRole("button", { name: "Continuer" }).click();
    await expect(page.getByText("Choisissez un type d'organisation")).toBeVisible();

    await page.getByLabel("Vous représentez").selectOption("ong");
    await page.getByRole("button", { name: "Continuer" }).click();
    await expect(page.getByText("Étape 2 sur 4")).toBeVisible();

    await page.getByRole("button", { name: "Continuer" }).click();
    await expect(page.getByText("Choisissez au moins un service")).toBeVisible();
    await page.getByLabel("Production photo et vidéo").check();
    await page.getByLabel("Décrivez votre besoin").fill("Trop court");
    await page.getByRole("button", { name: "Continuer" }).click();
    await expect(page.getByText(/20 caractères minimum/)).toBeVisible();

    await page
      .getByLabel("Décrivez votre besoin")
      .fill("Couverture photo d'une activité terrain à Abéché en mars.");
    await page.getByRole("button", { name: "Continuer" }).click();
    await expect(page.getByText("Étape 3 sur 4")).toBeVisible();
    await page.getByRole("button", { name: "Retour" }).click();
    await expect(page.getByText("Étape 2 sur 4")).toBeVisible();
  });

  test("server rejects a submission without consent and returns to the right step", async ({ page }) => {
    await page.goto("/devis?service=relations-presse");
    await page.getByLabel("Vous représentez").selectOption("entreprise");
    await page.getByRole("button", { name: "Continuer" }).click();
    await expect(page.getByLabel("Relations presse")).toBeChecked();
    await page
      .getByLabel("Décrivez votre besoin")
      .fill("Organisation d'une conférence de presse pour un lancement.");
    await page.getByRole("button", { name: "Continuer" }).click();
    await page.getByRole("button", { name: "Continuer" }).click();
    await page.getByLabel("Nom et prénom").fill("Test E2E");
    await page.getByLabel("Adresse e-mail").fill("e2e@example.org");
    await page.waitForTimeout(3100); // minimum fill time
    await page.getByRole("button", { name: "Envoyer ma demande" }).click();
    await expect(page.getByText("Certains champs sont à corriger.")).toBeVisible();
    await expect(page.getByText(/Votre accord est nécessaire/)).toBeVisible();
  });

  test("a complete request is accepted", async ({ page }) => {
    test.skip(process.env.E2E_ALLOW_WRITE !== "1", "writes to the database");
    await page.goto("/devis");
    await page.getByLabel("Vous représentez").selectOption("association");
    await page.getByRole("button", { name: "Continuer" }).click();
    await page.getByLabel("Rédaction de contenus").check();
    await page
      .getByLabel("Décrivez votre besoin")
      .fill("Test automatisé E2E : rédaction d'un communiqué de presse.");
    await page.getByRole("button", { name: "Continuer" }).click();
    await page.getByRole("button", { name: "Continuer" }).click();
    await page.getByLabel("Nom et prénom").fill("Test E2E");
    await page.getByLabel("Adresse e-mail").fill("e2e-test@example.org");
    await page.getByRole("checkbox", { name: /J'accepte/ }).check();
    await page.waitForTimeout(3100);
    await page.getByRole("button", { name: "Envoyer ma demande" }).click();
    await expect(page.getByText(/Votre demande est enregistrée/)).toBeVisible();
  });

  test("honeypot submissions are silently discarded", async ({ page }) => {
    test.skip(process.env.E2E_ALLOW_WRITE !== "1", "exercises the server action");
    await page.goto("/contact");
    await page.locator('input[name="website"]').fill("http://spam.example", { force: true });
    await page.getByLabel("Nom et prénom").fill("Bot");
    await page.getByLabel("Adresse e-mail").fill("bot@example.org");
    await page.getByLabel("Message").fill("Message automatique de test");
    await page.getByRole("checkbox", { name: /J'accepte/ }).check();
    await page.getByRole("button", { name: "Envoyer" }).click();
    // Bots get a success message; the server discards the submission (see actions/forms.ts guard()).
    await expect(page.getByText(/bien été envoyé/)).toBeVisible();
  });
});

test.describe("accessibility (axe, WCAG 2.2 AA)", () => {
  for (const path of ["/", "/devis", "/contact", "/services", "/journal", "/confidentialite"]) {
    test(`${path} has no serious accessibility violations`, async ({ page }) => {
      await page.goto(path);
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze();
      const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`)).toEqual(
        [],
      );
    });
  }
});
