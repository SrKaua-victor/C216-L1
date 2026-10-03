POETRY := poetry
COMPOSE := docker compose
BACKEND_DIR := backend
BACKEND_SERVICE := backend
DB_SERVICE := db
DB_USER := postgres
DB_NAME := c216
APP := main
HOST := 0.0.0.0
PORT := 8000

ifeq ($(OS),Windows_NT)
SHELL := C:/Program Files/Git/bin/sh.exe
endif

.DEFAULT_GOAL := help

.PHONY: help install run test test-v test-k lock clean build up down restart logs ps shell db-shell

help:
	@echo "Comandos disponiveis:"
	@echo "  make install   - instala as dependencias do projeto"
	@echo "  make run       - roda a aplicacao com uvicorn"
	@echo "  make test      - executa os testes com pytest"
	@echo "  make test-v    - executa os testes em modo verboso"
	@echo "  make test-k    - executa os testes que casam com K (ex: make test-k K=404)"
	@echo "  make lock      - atualiza o poetry.lock"
	@echo "  make clean     - remove caches e arquivos temporarios"
	@echo "  make build     - constroi as imagens docker"
	@echo "  make up        - sobe os containers em segundo plano"
	@echo "  make down      - para e remove os containers"
	@echo "  make restart   - reinicia os containers"
	@echo "  make logs      - acompanha os logs do backend"
	@echo "  make ps        - lista os containers do projeto"
	@echo "  make shell     - abre um shell no container do backend"
	@echo "  make db-shell  - abre o psql no container do banco"
	@echo "  make help      - mostra esta mensagem"

install:
	cd $(BACKEND_DIR) && $(POETRY) install

run:
	cd $(BACKEND_DIR) && $(POETRY) run uvicorn $(APP):app --host $(HOST) --port $(PORT) --reload

test:
	cd $(BACKEND_DIR) && $(POETRY) run pytest

test-v:
	cd $(BACKEND_DIR) && $(POETRY) run pytest -v

test-k:
	cd $(BACKEND_DIR) && $(POETRY) run pytest -k "$(K)" -v

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

db-shell:
	$(COMPOSE) exec $(DB_SERVICE) psql -U $(DB_USER) -d $(DB_NAME)
