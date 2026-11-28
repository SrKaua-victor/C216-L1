# Biblioteca e Empréstimos

Projeto final da disciplina **C216 L1 - Sistemas Distribuídos**.

Aplicação web para uma biblioteca controlar seu acervo, seus leitores e os empréstimos de livros. O backend é uma API REST em FastAPI com PostgreSQL, o frontend é uma aplicação React, e os três serviços sobem juntos com Docker Compose.

**Vídeo de apresentação:** https://youtu.be/WO4fHPyLC-o

## Funcionalidades

- **Livros:** cadastro, edição, remoção, busca por título ou autor e exibição dos exemplares disponíveis.
- **Leitores:** cadastro, edição, remoção e busca por nome ou e-mail.
- **Empréstimos:** registro, renovação, devolução com cálculo de multa e filtro por situação (ativos, atrasados ou devolvidos).

### Regras de negócio

| Regra | Valor |
|---|---|
| Prazo do empréstimo | 14 dias |
| Renovação | Mais 7 dias, no máximo 2 vezes, e não é permitida com o empréstimo atrasado |
| Multa por atraso | R$ 1,00 por dia, calculada na devolução |
| Empréstimos ativos por leitor | No máximo 3 |
| Leitor com empréstimo atrasado | Não pode fazer novos empréstimos |
| Mesmo livro para o mesmo leitor | Não pode ter dois empréstimos ativos |
| Livro sem exemplar disponível | Não pode ser emprestado |
| Remoção de livro ou leitor | Bloqueada enquanto houver empréstimo ativo |
| Total de exemplares | Não pode ficar menor que a quantidade emprestada |

Quando uma regra é violada, a API responde `409` com a mensagem do motivo, e o frontend mostra essa mensagem na tela. Dados inválidos retornam `422` e registros inexistentes retornam `404`.

## Tecnologias

| Parte | Tecnologias |
|---|---|
| Backend | Python 3.13, FastAPI, SQLAlchemy, Alembic, Pydantic, Poetry, Ruff |
| Banco de dados | PostgreSQL 16 |
| Frontend | React 19, Vite, Tailwind CSS, Biome |
| Testes | Pytest, Vitest, Testing Library, Playwright |
| Infraestrutura | Docker, Docker Compose, Nginx, Makefile, GitHub Actions |

## Estrutura

```
.
├── backend
│   ├── app
│   │   ├── core            configuração lida das variáveis de ambiente
│   │   ├── db              engine e sessão do SQLAlchemy
│   │   ├── models          modelos ORM (livro, leitor, empréstimo)
│   │   ├── schemas         validação de entrada e saída com Pydantic
│   │   ├── repositories    consultas ao banco
│   │   ├── services        regras de negócio
│   │   ├── routes          endpoints da API
│   │   └── main.py         criação da aplicação e configuração do CORS
│   ├── migrations          migrations do Alembic
│   ├── tests               testes unitários e de integração
│   └── Dockerfile
├── frontend
│   ├── src
│   │   ├── pages           telas de livros, leitores e empréstimos
│   │   ├── components      formulário, tabela, mensagens e campos
│   │   ├── hooks           carregamento das listas
│   │   ├── services        chamadas à API
│   │   ├── validacao.js    validação dos formulários
│   │   └── formatacao.js   formatação de datas, valores e telefone
│   ├── tests               testes unitários, de integração e E2E
│   └── Dockerfile
├── .github/workflows       CI do backend e do frontend
├── compose.yml
├── Makefile
└── .env.example
```

## Pré-requisitos

Para rodar com Docker:

- Docker e Docker Compose
- Make (no Windows, o Makefile usa o shell do Git Bash)

Para rodar sem Docker ou executar os testes:

- Python 3.13 e Poetry
- Node.js 24 e npm

## Variáveis de ambiente

Copie os exemplos antes de rodar. Todos já vêm com valores que funcionam localmente.

```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

| Arquivo | Usado por | Variável | Descrição |
|---|---|---|---|
| `.env` | Docker Compose e Makefile | `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | Usuário, senha e nome do banco |
| | | `POSTGRES_PORT` | Porta do PostgreSQL na máquina (padrão `5433`) |
| | | `API_PORT` | Porta da API na máquina (padrão `8000`) |
| | | `FRONTEND_PORT` | Porta do frontend na máquina (padrão `5173`) |
| | | `VITE_API_URL` | Endereço da API usado no build do frontend |
| | | `CORS_ORIGINS` | Origens que podem chamar a API, separadas por vírgula |
| `backend/.env` | API e Alembic fora do Docker | `DATABASE_URL`, `CORS_ORIGINS` | Conexão com o banco e origens liberadas |
| `frontend/.env` | Vite fora do Docker | `VITE_API_URL` | Endereço da API |

O CORS libera apenas as origens listadas e apenas os métodos usados pelo frontend (`GET`, `POST`, `PUT` e `DELETE`). O curinga `*` é recusado.

## Como executar

```bash
make up-build
```

Esse comando constrói as imagens e sobe os três serviços, esperando todos ficarem saudáveis. Ao iniciar, a API aplica as migrations pendentes.

| Serviço | Endereço | Descrição |
|---|---|---|
| `frontend` | http://localhost:5173 | Aplicação React servida pelo Nginx |
| `api` | http://localhost:8000 | API FastAPI, com documentação em http://localhost:8000/docs |
| `db` | localhost:5433 | PostgreSQL, com os dados em um volume persistente |

Para acessar a aplicação, abra http://localhost:5173 no navegador.

| Comando | Descrição |
|---|---|
| `make ps` | Mostra os containers e o estado de saúde |
| `make logs` | Acompanha os logs da API |
| `make restart` | Reinicia os containers |
| `make down` | Para e remove os containers, mantendo os dados |

### Sem Docker

Com o banco rodando pelo Docker e a API e o frontend direto na máquina:

```bash
make db-up
make install
make migrate
make run
```

Em outro terminal:

```bash
make frontend-install
make frontend-dev
```

## Endpoints

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/health` | Verifica se a API está no ar |
| `GET` | `/livros?busca=` | Lista os livros, com busca opcional por título ou autor |
| `GET` | `/livros/{id}` | Busca um livro |
| `POST` | `/livros` | Cadastra um livro |
| `PUT` | `/livros/{id}` | Atualiza um livro |
| `DELETE` | `/livros/{id}` | Remove um livro |
| `GET` | `/leitores?busca=` | Lista os leitores, com busca opcional por nome ou e-mail |
| `GET` | `/leitores/{id}` | Busca um leitor |
| `POST` | `/leitores` | Cadastra um leitor |
| `PUT` | `/leitores/{id}` | Atualiza um leitor |
| `DELETE` | `/leitores/{id}` | Remove um leitor |
| `GET` | `/emprestimos?situacao=` | Lista os empréstimos, com filtro opcional (`ativos`, `atrasados` ou `devolvidos`) |
| `GET` | `/emprestimos/{id}` | Busca um empréstimo |
| `POST` | `/emprestimos` | Registra um empréstimo |
| `POST` | `/emprestimos/{id}/renovacao` | Renova um empréstimo |
| `POST` | `/emprestimos/{id}/devolucao` | Registra a devolução e calcula a multa |

## Migrações

As tabelas são versionadas com o Alembic, em `backend/migrations/versions`. No Docker, elas são aplicadas automaticamente quando a API sobe. Fora do Docker:

| Comando | Descrição |
|---|---|
| `make migrate` | Aplica as migrations pendentes |
| `make db-current` | Mostra a migration atual do banco |
| `make migration M="descricao"` | Gera uma migration a partir das mudanças nos modelos |
| `make downgrade` | Desfaz a última migration |
| `make migrate-check` | Verifica se as migrations correspondem aos modelos |

## Testes

### Backend

| Tipo | Pasta | O que testa |
|---|---|---|
| Unitário | `backend/tests/unit` | Regras de negócio dos services, com repositório falso, e validação dos schemas |
| Integração | `backend/tests/integration` | Endpoints, modelos, migrations e CORS com banco de dados (SQLite em memória ou PostgreSQL) |

```bash
make test
make lint
```

Os testes de integração usam SQLite em memória por padrão. Para rodá-los contra o PostgreSQL, crie um banco separado para os testes, já que eles apagam os dados das tabelas a cada teste, e informe-o em `TEST_DATABASE_URL`:

```bash
docker compose exec db createdb -U postgres biblioteca_test
TEST_DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5433/biblioteca_test make test-integration
```

### Frontend

| Tipo | Pasta | O que testa |
|---|---|---|
| Unitário | `frontend/tests/unit` | Validação, formatação, formulário e chamadas à API |
| Integração | `frontend/tests/integration` | Telas completas com a API simulada |
| E2E | `frontend/tests/e2e` | Navegador real com frontend, API e PostgreSQL rodando no Docker |

```bash
make frontend-test
make frontend-check
```

O teste E2E cadastra um livro e um leitor pela tela, registra e devolve um empréstimo e recarrega a página para confirmar que os dados foram salvos no banco. Ele sobe uma stack separada (`biblioteca-e2e`, nas portas 15173, 18000 e 15432), roda o Playwright e remove a stack ao final, sem mexer nos dados da aplicação principal:

```bash
cd frontend && npx playwright install chromium && cd ..
make e2e
```

## Integração contínua

Os workflows em `.github/workflows` rodam a cada push e pull request:

| Workflow | Jobs |
|---|---|
| `ci-backend.yml` | Lint com Ruff, testes com Pytest no PostgreSQL e subida completa com Docker Compose, conferindo saúde dos serviços, migrations, persistência e CORS |
| `ci-frontend.yml` | Lint com Biome, testes com Vitest, build de produção e teste E2E com Playwright |

## Autor

**Kauã Victor Garcia Siécola**

Projeto desenvolvido como atividade avaliativa da disciplina **C216**.

## Licença

Este projeto tem finalidade exclusivamente acadêmica.
