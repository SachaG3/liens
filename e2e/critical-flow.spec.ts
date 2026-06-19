import { expect, test, type Page } from "@playwright/test";

async function register(page: Page, name: string, email: string) {
  await page.goto("/register");
  await page.getByLabel("Votre nom").fill(name);
  await page.getByLabel("Adresse e-mail").fill(email);
  await page.getByLabel("Mot de passe").fill("mot-de-passe-solide");
  await page.getByRole("button", { name: "Créer mon espace" }).click();
  await expect(page.getByRole("heading", { name: new RegExp(`Bonjour ${name.split(" ")[0]}`) })).toBeVisible();
}

test("parcours principal et isolation entre comptes", async ({ page }) => {
  await register(page, "Alice Martin", "alice@example.test");

  await page.getByRole("button", { name: "Personne", exact: true }).click();
  await page.getByRole("textbox", { name: "Prénom", exact: true }).fill("Camille");
  await page.getByLabel("Nom", { exact: true }).fill("Durand");
  await page.getByRole("button", { name: "Ajouter la personne" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();

  await page.goto("/contacts");
  await page.getByRole("link", { name: /Camille Durand/ }).click();
  await expect(page.getByRole("heading", { name: "Camille Durand" })).toBeVisible();
  const contactPath = new URL(page.url()).pathname;

  await page.getByTitle("Déconnexion").click();
  await expect(page.getByRole("heading", { name: "Connectez-vous" })).toBeVisible();
  await page.getByLabel("Adresse e-mail").fill("alice@example.test");
  await page.getByLabel("Mot de passe").fill("mot-de-passe-solide");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page.getByRole("heading", { name: "Bonjour Alice." })).toBeVisible();

  await page.getByTitle("Déconnexion").click();
  await register(page, "Bob Petit", "bob@example.test");
  const response = await page.goto(contactPath);
  expect(response?.status()).toBe(404);
});

test("page 404 lisible sur une route inconnue", async ({ page }) => {
  const response = await page.goto("/ce-chemin-n-existe-pas");

  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Page introuvable" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Accueil" })).toBeVisible();
});
