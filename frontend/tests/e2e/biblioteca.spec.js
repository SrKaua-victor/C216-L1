import { expect, test } from "@playwright/test";
import { API_URL } from "./ambiente.js";

async function listar(request, caminho) {
  const resposta = await request.get(`${API_URL}${caminho}`);
  expect(resposta.ok()).toBeTruthy();
  return resposta.json();
}

async function criar(request, caminho, dados) {
  const resposta = await request.post(`${API_URL}${caminho}`, { data: dados });
  expect(resposta.status()).toBe(201);
  return resposta.json();
}

test.beforeEach(async ({ request }) => {
  for (const emprestimo of await listar(request, "/emprestimos?situacao=ativos")) {
    await request.post(`${API_URL}/emprestimos/${emprestimo.id}/devolucao`);
  }
  for (const livro of await listar(request, "/livros")) {
    await request.delete(`${API_URL}/livros/${livro.id}`);
  }
  for (const leitor of await listar(request, "/leitores")) {
    await request.delete(`${API_URL}/leitores/${leitor.id}`);
  }
});

function abrirAba(page, nome) {
  return page
    .getByRole("navigation", { name: "Seções" })
    .getByRole("button", { name: nome })
    .click();
}

function linhaDoLivro(page, titulo) {
  return page.getByRole("row", { name: new RegExp(titulo) });
}

test("empresta e devolve um livro pela interface com os dados salvos no banco", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page).toHaveTitle("Biblioteca");

  await page.getByLabel("Título").fill("Dom Casmurro");
  await page.getByLabel("Autor").fill("Machado de Assis");
  await page.getByLabel("ISBN").fill("978-85-359-1066-7");
  await page.getByLabel("Ano de publicação").fill("1899");
  await page.getByRole("button", { name: "Cadastrar livro" }).click();
  await expect(page.getByRole("status")).toHaveText('Livro "Dom Casmurro" cadastrado.');

  await abrirAba(page, "Leitores");
  await page.getByLabel("Nome").fill("Ana Souza");
  await page.getByLabel("E-mail").fill("ana@email.com");
  await page.getByLabel("Telefone (opcional)").fill("(35) 99876-5432");
  await page.getByRole("button", { name: "Cadastrar leitor" }).click();
  await expect(page.getByRole("status")).toHaveText('Leitor "Ana Souza" cadastrado.');

  await abrirAba(page, "Empréstimos");
  await page.getByLabel("Livro").selectOption({ label: "Dom Casmurro (1 de 1 disponíveis)" });
  await page.getByLabel("Leitor").selectOption({ label: "Ana Souza (ana@email.com)" });
  await page.getByRole("button", { name: "Registrar empréstimo" }).click();
  await expect(page.getByRole("status")).toContainText(
    'Empréstimo de "Dom Casmurro" para Ana Souza',
  );

  await page.reload();
  await expect(linhaDoLivro(page, "Dom Casmurro")).toContainText("0 de 1");
  await abrirAba(page, "Empréstimos");
  const emprestimo = linhaDoLivro(page, "Dom Casmurro");
  await expect(emprestimo).toContainText("Ana Souza");
  await expect(emprestimo).toContainText("Ativo");

  await emprestimo
    .getByRole("button", { name: "Devolver empréstimo de Dom Casmurro para Ana Souza" })
    .click();
  await expect(page.getByRole("status")).toHaveText("Devolução registrada sem multa.");

  await page.reload();
  await expect(linhaDoLivro(page, "Dom Casmurro")).toContainText("1 de 1");
  await abrirAba(page, "Empréstimos");
  await expect(linhaDoLivro(page, "Dom Casmurro")).toContainText(
    /Devolvido em \d{2}\/\d{2}\/\d{4}/,
  );
});

test("mostra a regra do backend ao tentar remover um livro emprestado", async ({
  page,
  request,
}) => {
  const livro = await criar(request, "/livros", {
    titulo: "O Cortiço",
    autor: "Aluísio Azevedo",
    isbn: "9788572322270",
    ano_publicacao: 1890,
  });
  const leitor = await criar(request, "/leitores", {
    nome: "Bruno Lima",
    email: "bruno@email.com",
  });
  await criar(request, "/emprestimos", { livro_id: livro.id, leitor_id: leitor.id });

  await page.goto("/");
  page.once("dialog", (dialogo) => dialogo.accept());
  await page.getByRole("button", { name: "Remover O Cortiço" }).click();

  await expect(page.getByRole("alert")).toHaveText(
    "Não é possível remover um livro com empréstimos ativos.",
  );
  await page.reload();
  await expect(linhaDoLivro(page, "O Cortiço")).toContainText("0 de 1");
});
