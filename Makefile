POETRY := poetry
BACKEND_DIR := backend
APP := main
HOST := 0.0.0.0
PORT := 8000

ifeq ($(OS),Windows_NT)
SHELL := C:/Program Files/Git/bin/sh.exe
endif

.DEFAULT_GOAL := help

.PHONY: help install run test clean

help:
	@echo "Comandos disponiveis:"
	@echo "  make install  - instala as dependencias do projeto"
	@echo "  make run      - roda a aplicacao com uvicorn"
	@echo "  make test     - executa os testes com pytest"
	@echo "  make clean    - remove caches e arquivos temporarios"
	@echo "  make help     - mostra esta mensagem"

install:
	cd $(BACKEND_DIR) && $(POETRY) install

run:
	cd $(BACKEND_DIR) && $(POETRY) run uvicorn $(APP):app --host $(HOST) --port $(PORT) --reload

test:
	cd $(BACKEND_DIR) && $(POETRY) run pytest

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
