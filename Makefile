-include .env

POETRY := poetry
BACKEND_DIR := backend
APP := app.main
HOST := 0.0.0.0
PORT := 8000

ifeq ($(OS),Windows_NT)
SHELL := C:/Program Files/Git/bin/sh.exe
endif

.DEFAULT_GOAL := help

.PHONY: help install run test test-unit test-integration test-v test-k lint format lock clean

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
