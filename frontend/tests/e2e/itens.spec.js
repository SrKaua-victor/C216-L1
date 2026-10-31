import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

async function cadastrar(page, nome, descricao = "") {
  await page.getByLabel("Nome", { exact: true }).fill(nome);
  await page.getByLabel(/descrição/i).fill(descricao);
  await page.getByRole("button", { name: "Adicionar" }).click();
}

test("mostra o estado vazio ao abrir a página", async ({ page }) => {
  await expect(page).toHaveTitle("C216 L1 - Cadastro de itens");
  await expect(page.getByRole("heading", { name: "Cadastro de itens" })).toBeVisible();
  await expect(page.getByText("Nenhum item cadastrado ainda.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Itens cadastrados 0" })).toBeVisible();
});

test("cadastra um item, exibe na lista e avisa", async ({ page }) => {
  await cadastrar(page, "Caderno", "Capa dura");

  const lista = page.getByRole("list", { name: "Itens cadastrados" });
  await expect(lista.getByRole("listitem")).toHaveCount(1);
  await expect(lista).toContainText("Caderno");
  await expect(lista).toContainText("Capa dura");
  await expect(page.getByText("Nenhum item cadastrado ainda.")).toBeHidden();
  await expect(page.getByRole("status")).toHaveText("“Caderno” foi adicionado.");
  await expect(page.getByLabel("Nome", { exact: true })).toHaveValue("");
  await expect(page.getByLabel("Nome", { exact: true })).toBeFocused();
});

test("mostra o erro de validação e não cadastra item sem nome", async ({ page }) => {
  await page.getByRole("button", { name: "Adicionar" }).click();

  await expect(page.getByRole("alert")).toHaveText("Informe o nome do item.");
  await expect(page.getByLabel("Nome", { exact: true })).toBeFocused();
  await expect(page.getByText("Nenhum item cadastrado ainda.")).toBeVisible();
});

test("impede cadastrar um nome repetido", async ({ page }) => {
  await cadastrar(page, "Caderno");
  await cadastrar(page, "caderno");

  await expect(page.getByRole("alert")).toHaveText("Já existe um item com esse nome.");
  await expect(page.getByRole("listitem")).toHaveCount(1);
});

test("remove um item e volta ao estado vazio", async ({ page }) => {
  await cadastrar(page, "Caderno");
  await cadastrar(page, "Caneta");

  await page.getByRole("button", { name: "Remover Caderno" }).click();
  await expect(page.getByRole("listitem")).toHaveCount(1);
  await expect(page.getByRole("status")).toHaveText("“Caderno” foi removido.");

  await page.getByRole("button", { name: "Remover Caneta" }).click();
  await expect(page.getByText("Nenhum item cadastrado ainda.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Itens cadastrados 0" })).toBeVisible();
});

test("o aviso some sozinho depois de alguns segundos", async ({ page }) => {
  await cadastrar(page, "Caderno");
  await expect(page.getByRole("status")).toHaveText("“Caderno” foi adicionado.");
  await expect(page.getByRole("status")).toHaveText("", { timeout: 6000 });
});

test("aplica os estilos do Tailwind", async ({ page }) => {
  const botao = page.getByRole("button", { name: "Adicionar" });
  await expect(botao).toHaveCSS("background-color", /oklch|rgb/);
  await expect(botao).not.toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
});

test.describe("no celular", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("empilha o formulário acima da lista e permite cadastrar", async ({ page }) => {
    const formulario = await page.getByRole("heading", { name: "Novo item" }).boundingBox();
    const lista = await page.getByRole("heading", { name: /^Itens cadastrados/ }).boundingBox();
    expect(lista.y).toBeGreaterThan(formulario.y);

    await cadastrar(page, "Caderno");
    await expect(page.getByRole("listitem")).toHaveCount(1);
  });
});
