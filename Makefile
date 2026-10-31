-include .env

POETRY := poetry
NPM := npm
COMPOSE := docker compose
BACKEND_DIR := backend
FRONTEND_DIR := frontend
BACKEND_SERVICE := backend
DB_SERVICE := db
DB_USER := $(or $(POSTGRES_USER),postgres)
DB_NAME := $(or $(POSTGRES_DB),c216)
APP := app.main
HOST := 0.0.0.0
PORT := 8000

ifeq ($(OS),Windows_NT)
SHELL := C:/Program Files/Git/bin/sh.exe
endif

.DEFAULT_GOAL := help

.PHONY: help install run test test-unit test-integration test-v test-k lint format lock clean build up down restart logs ps shell db-up db-shell migrate migration downgrade migrate-check frontend-install frontend-dev frontend-lint frontend-format frontend-check frontend-test frontend-test-e2e frontend-build check-all

help:
	@echo "Comandos disponiveis:"
	@echo "  make install           - instala as dependencias do projeto"
	@echo "  make run               - roda a aplicacao com uvicorn"
	@echo "  make test              - executa todos os testes com pytest"
	@echo "  make test-unit         - executa apenas os testes unitarios"
	@echo "  make test-integration  - executa apenas os testes de integracao"
	@echo "  make test-v            - executa os testes em modo verboso"
	@echo "  make test-k            - executa os testes que casam com K (ex: make test-k K=404)"
	@echo "  make lint              - verifica estilo e erros comuns no codigo com o Ruff"
	@echo "  make format            - formata o codigo e corrige o que o Ruff consegue sozinho"
	@echo "  make lock              - atualiza o poetry.lock"
	@echo "  make clean             - remove caches e arquivos temporarios"
	@echo "  make build             - constroi as imagens docker"
	@echo "  make up                - sobe os containers em segundo plano"
	@echo "  make down              - para e remove os containers"
	@echo "  make restart           - reinicia os containers"
	@echo "  make logs              - acompanha os logs do backend"
	@echo "  make ps                - lista os containers do projeto"
	@echo "  make shell             - abre um shell no container do backend"
	@echo "  make db-up             - sobe apenas o banco PostgreSQL"
	@echo "  make db-shell          - abre o psql no container do banco"
	@echo "  make migrate           - aplica as migrations pendentes"
	@echo "  make migration         - gera uma migration a partir dos modelos (ex: make migration M=\"adiciona telefone\")"
	@echo "  make downgrade         - desfaz a ultima migration"
	@echo "  make migrate-check     - verifica se as migrations correspondem aos modelos"
	@echo ""
	@echo "Frontend:"
	@echo "  make frontend-install   - instala as dependencias com npm ci"
	@echo "  make frontend-dev       - sobe o servidor de desenvolvimento do Vite"
	@echo "  make frontend-lint      - verifica o codigo com o linter do Biome"
	@echo "  make frontend-format    - formata o codigo com o Biome"
	@echo "  make frontend-check     - verifica lint e formatacao sem alterar arquivos"
	@echo "  make frontend-test      - executa os testes unitarios e de integracao com o Vitest"
	@echo "  make frontend-test-e2e  - executa os testes end-to-end com o Playwright"
	@echo "  make frontend-build     - gera o build de producao"
	@echo ""
	@echo "Projeto inteiro:"
	@echo "  make check-all          - backend (Ruff + Pytest) e frontend (Biome, Vitest, build, E2E)"
	@echo ""
	@echo "  make help              - mostra esta mensagem"

install:
	cd $(BACKEND_DIR) && $(POETRY) install

run:
	cd $(BACKEND_DIR) && $(POETRY) run uvicorn $(APP):app --host $(HOST) --port $(PORT) --reload

test:
	cd $(BACKEND_DIR) && $(POETRY) run pytest

test-unit:
	cd $(BACKEND_DIR) && $(POETRY) run pytest -m unit -v

test-integration:
	cd $(BACKEND_DIR) && $(POETRY) run pytest -m integration -v

test-v:
	cd $(BACKEND_DIR) && $(POETRY) run pytest -v

test-k:
	cd $(BACKEND_DIR) && $(POETRY) run pytest -k "$(K)" -v

lint:
	cd $(BACKEND_DIR) && $(POETRY) run ruff check .
	cd $(BACKEND_DIR) && $(POETRY) run ruff format --check .

format:
	cd $(BACKEND_DIR) && $(POETRY) run ruff check --fix .
	cd $(BACKEND_DIR) && $(POETRY) run ruff format .

lock:
	cd $(BACKEND_DIR) && $(POETRY) lock

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete

build:
	$(COMPOSE) build

up:
	$(COMPOSE) up -d

down:
	$(COMPOSE) down

restart:
	$(COMPOSE) restart

logs:
	$(COMPOSE) logs -f $(BACKEND_SERVICE)

ps:
	$(COMPOSE) ps

shell:
	$(COMPOSE) exec $(BACKEND_SERVICE) sh

db-up:
	$(COMPOSE) up -d --wait $(DB_SERVICE)

db-shell:
	$(COMPOSE) exec $(DB_SERVICE) psql -U $(DB_USER) -d $(DB_NAME)

migrate:
	cd $(BACKEND_DIR) && $(POETRY) run alembic upgrade head

migration:
	@test -n "$(M)" || (echo "Informe a descricao da migration: make migration M=\"descricao\"" && exit 1)
	cd $(BACKEND_DIR) && $(POETRY) run alembic revision --autogenerate -m "$(M)"

downgrade:
	cd $(BACKEND_DIR) && $(POETRY) run alembic downgrade -1

migrate-check:
	cd $(BACKEND_DIR) && $(POETRY) run alembic check

frontend-install:
	cd $(FRONTEND_DIR) && $(NPM) ci

frontend-dev:
	cd $(FRONTEND_DIR) && $(NPM) run dev

frontend-lint:
	cd $(FRONTEND_DIR) && $(NPM) run lint

frontend-format:
	cd $(FRONTEND_DIR) && $(NPM) run format

frontend-check:
	cd $(FRONTEND_DIR) && $(NPM) run check

frontend-test:
	cd $(FRONTEND_DIR) && $(NPM) test

frontend-test-e2e:
	cd $(FRONTEND_DIR) && $(NPM) run test:e2e

frontend-build:
	cd $(FRONTEND_DIR) && $(NPM) run build

check-all: lint test frontend-check frontend-test frontend-build frontend-test-e2e
	@echo "Backend e frontend verificados com sucesso."
