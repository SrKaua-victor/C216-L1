-include .env

POETRY := poetry
COMPOSE := docker compose
BACKEND_DIR := backend
API_SERVICE := api
DB_SERVICE := db
DB_USER := $(or $(POSTGRES_USER),postgres)
DB_NAME := $(or $(POSTGRES_DB),biblioteca)
APP := app.main
HOST := 0.0.0.0
PORT := 8000

ifeq ($(OS),Windows_NT)
SHELL := C:/Program Files/Git/bin/sh.exe
endif

.DEFAULT_GOAL := help

.PHONY: help install run test test-unit test-integration test-v test-k lint format lock clean build up up-build down restart logs ps shell db-up db-down db-shell migrate migration downgrade migrate-check db-current

help:
	@echo "Comandos disponiveis:"
	@echo "  make install           - instala as dependencias do backend"
	@echo "  make run               - roda a API com uvicorn"
	@echo "  make test              - executa todos os testes com pytest"
	@echo "  make test-unit         - executa apenas os testes unitarios"
	@echo "  make test-integration  - executa apenas os testes de integracao"
	@echo "  make test-v            - executa os testes em modo verboso"
	@echo "  make test-k            - executa os testes que casam com K (ex: make test-k K=cors)"
	@echo "  make lint              - verifica estilo e formatacao com o Ruff"
	@echo "  make format            - formata o codigo e corrige o que o Ruff consegue sozinho"
	@echo "  make lock              - atualiza o poetry.lock"
	@echo "  make clean             - remove caches e arquivos temporarios"
	@echo ""
	@echo "Docker Compose:"
	@echo "  make build             - constroi as imagens docker"
	@echo "  make up                - sobe os containers em segundo plano"
	@echo "  make up-build          - constroi as imagens e sobe tudo, esperando ficar saudavel"
	@echo "  make down              - para e remove os containers"
	@echo "  make restart           - reinicia os containers"
	@echo "  make logs              - acompanha os logs da api"
	@echo "  make ps                - lista os containers e o estado de saude"
	@echo "  make shell             - abre um shell no container da api"
	@echo ""
	@echo "Banco de dados:"
	@echo "  make db-up             - sobe apenas o PostgreSQL com Docker Compose"
	@echo "  make db-down           - para o PostgreSQL"
	@echo "  make db-shell          - abre o psql no container do banco"
	@echo ""
	@echo "Migrations:"
	@echo "  make migrate           - aplica as migrations pendentes"
	@echo "  make migration         - gera uma migration a partir dos modelos (ex: make migration M=\"cria tabela livros\")"
	@echo "  make downgrade         - desfaz a ultima migration"
	@echo "  make migrate-check     - verifica se as migrations correspondem aos modelos"
	@echo "  make db-current        - mostra a migration atual do banco"
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
	find . -type d -name ".pytest_cache" -exec rm -rf {} +
	find . -type d -name ".ruff_cache" -exec rm -rf {} +

build:
	$(COMPOSE) build

up:
	$(COMPOSE) up -d

up-build:
	$(COMPOSE) up -d --build --wait

down:
	$(COMPOSE) down

restart:
	$(COMPOSE) restart

logs:
	$(COMPOSE) logs -f $(API_SERVICE)

ps:
	$(COMPOSE) ps

shell:
	$(COMPOSE) exec $(API_SERVICE) sh

db-up:
	$(COMPOSE) up -d --wait $(DB_SERVICE)

db-down:
	$(COMPOSE) stop $(DB_SERVICE)

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

db-current:
	cd $(BACKEND_DIR) && $(POETRY) run alembic current
