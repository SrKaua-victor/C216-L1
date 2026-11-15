import { expect, test } from "@playwright/test";
import { API_URL } from "./ambiente.js";

test.beforeEach(async ({ request }) => {
  const resposta = await request.get(`${API_URL}/items/`);
  expect(resposta.ok()).toBeTruthy();
  for (const item of await resposta.json()) {
    await request.delete(`${API_URL}/items/${item.id}`);
  }
});

async function cadastrar(page, nome, descricao = "") {
  await page.getByLabel("Nome", { exact: true }).fill(nome);
  await page.getByLabel(/descrição/i).fill(descricao);
  await page.getByRole("button", { name: "Adicionar" }).click();
}

async function criarPelaApi(request, nome, descricao = "") {
  const resposta = await request.post(`${API_URL}/items/`, { data: { nome, descricao } });
  expect(resposta.status()).toBe(201);
}

function lista(page) {
  return page.getByRole("list", { name: "Itens cadastrados" });
}

test.describe("com o backend real", () => {
  test("mostra o estado vazio quando não há itens no banco", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle("C216 L1 - Cadastro de itens");
    await expect(page.getByText("Nenhum item cadastrado ainda.")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Itens cadastrados 0" })).toBeVisible();
  });

  test("o item cadastrado continua na lista depois de recarregar a página", async ({ page }) => {
    await page.goto("/");
    await cadastrar(page, "Caderno", "Capa dura");
    await expect(lista(page).getByRole("listitem")).toHaveCount(1);
    await expect(page.getByRole("status")).toHaveText("“Caderno” foi adicionado.");

    await page.reload();

    await expect(lista(page).getByRole("listitem")).toHaveCount(1);
    await expect(lista(page)).toContainText("Caderno");
    await expect(lista(page)).toContainText("Capa dura");
    await expect(page.getByRole("heading", { name: "Itens cadastrados 1" })).toBeVisible();
  });

  test("a remoção também persiste depois de recarregar a página", async ({ page, request }) => {
    await criarPelaApi(request, "Caderno");
    await criarPelaApi(request, "Caneta");
    await page.goto("/");

    await page.getByRole("button", { name: "Remover Caderno" }).click();
    await expect(page.getByRole("status")).toHaveText("“Caderno” foi removido.");
    await expect(lista(page).getByRole("listitem")).toHaveCount(1);

    await page.reload();

    await expect(lista(page).getByRole("listitem")).toHaveCount(1);
    await expect(lista(page)).toContainText("Caneta");
    await expect(lista(page)).not.toContainText("Caderno");
  });

  test("exibe itens criados diretamente na API", async ({ page, request }) => {
    await criarPelaApi(request, "Mochila", "Criada sem passar pela tela");
    await page.goto("/");
    await expect(lista(page)).toContainText("Mochila");
    await expect(lista(page)).toContainText("Criada sem passar pela tela");
  });

  test("impede cadastrar um nome que já está no banco", async ({ page, request }) => {
    await criarPelaApi(request, "Caderno");
    await page.goto("/");
    await cadastrar(page, "caderno");

    await expect(page.getByRole("alert")).toHaveText("Já existe um item com esse nome.");
    await expect(lista(page).getByRole("listitem")).toHaveCount(1);
  });

  test("mostra o erro de validação e não cadastra item sem nome", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Adicionar" }).click();

    await expect(page.getByRole("alert")).toHaveText("Informe o nome do item.");
    await expect(page.getByLabel("Nome", { exact: true })).toBeFocused();
    await page.reload();
    await expect(page.getByText("Nenhum item cadastrado ainda.")).toBeVisible();
  });
});

test.describe("estados de carregamento e erro", () => {
  test("mostra o carregamento enquanto a API não responde", async ({ page }) => {
    await page.route(`${API_URL}/items/`, async (rota) => {
      await new Promise((esperar) => setTimeout(esperar, 1000));
      await rota.continue();
    });
    await page.goto("/");

    await expect(page.getByText("Carregando itens...")).toBeAttached();
    await expect(page.getByText("Nenhum item cadastrado ainda.")).toBeVisible();
    await expect(page.getByText("Carregando itens...")).not.toBeAttached();
  });

  test("mostra o erro quando a API está fora do ar e permite tentar de novo", async ({ page }) => {
    await page.route(`${API_URL}/items/`, (rota) => rota.abort());
    await page.goto("/");

    await expect(page.getByRole("alert")).toContainText("Não foi possível carregar os itens.");
    await expect(page.getByRole("alert")).toContainText("Não foi possível conectar ao servidor");

    await page.unroute(`${API_URL}/items/`);
    await page.getByRole("button", { name: "Tentar novamente" }).click();
    await expect(page.getByText("Nenhum item cadastrado ainda.")).toBeVisible();
  });
});

test.describe("interface", () => {
  test("o aviso some sozinho depois de alguns segundos", async ({ page }) => {
    await page.goto("/");
    await cadastrar(page, "Caderno");
    await expect(page.getByRole("status")).toHaveText("“Caderno” foi adicionado.");
    await expect(page.getByRole("status")).toHaveText("", { timeout: 6000 });
  });

  test("aplica os estilos do Tailwind", async ({ page }) => {
    await page.goto("/");
    const botao = page.getByRole("button", { name: "Adicionar" });
    await expect(botao).toHaveCSS("background-color", /oklch|rgb/);
    await expect(botao).not.toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  });

  test.describe("no celular", () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test("empilha o formulário acima da lista e permite cadastrar", async ({ page }) => {
      await page.goto("/");
      const formulario = await page.getByRole("heading", { name: "Novo item" }).boundingBox();
      const titulo = await page.getByRole("heading", { name: /^Itens cadastrados/ }).boundingBox();
      expect(titulo.y).toBeGreaterThan(formulario.y);

      await cadastrar(page, "Caderno");
      await expect(lista(page).getByRole("listitem")).toHaveCount(1);
    });
  });
});
