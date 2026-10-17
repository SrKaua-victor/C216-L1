<div align="center">

# C216 – Laboratório 

![Status](https://img.shields.io/badge/status-em%20desenvolvimento-yellow)
![Disciplina](https://img.shields.io/badge/disciplina-C216-blue)
![Uso](https://img.shields.io/badge/uso-academico-lightgrey)

Repositório referente ao Laboratório da disciplina **C216**.

</div>

---

## Testes

Os testes ficam em `backend/tests` e são executados com Pytest, separados em dois tipos:

| Tipo | Pasta | O que testa |
|---|---|---|
| Unitário | `tests/unit` | Services e schemas isoladamente, sem HTTP |
| Integração | `tests/integration` | Todos os endpoints de ponta a ponta, via `TestClient` |

Cada teste recebe automaticamente o marcador `unit` ou `integration` de acordo com a pasta em que está. Um teste fora dessas duas pastas interrompe a execução com erro, o que garante que nenhum teste fique sem classificação.

### Executando localmente

Pré-requisitos: Python 3.13+ e Poetry instalados.

```bash
make install
make test
```

Comandos disponíveis:

| Comando | Descrição |
|---|---|
| `make test` | Executa toda a suíte |
| `make test-unit` | Executa apenas os testes unitários |
| `make test-integration` | Executa apenas os testes de integração |
| `make test-v` | Executa em modo verboso, listando cada teste |
| `make test-k K=404` | Executa apenas os testes cujo nome casa com `404` |

Sem o Make, direto pelo Poetry:

```bash
cd backend
poetry install
poetry run pytest -v
poetry run pytest -m unit
poetry run pytest -m integration
```

### Integração contínua

O workflow [`.github/workflows/ci-backend.yml`](.github/workflows/ci-backend.yml) executa a suíte automaticamente no GitHub Actions a cada `push` e a cada `pull_request`. Ele configura o Python 3.13, instala as dependências com o Poetry e executa os testes unitários e os de integração em passos separados. O passo de integração roda mesmo se o unitário falhar, para que o resultado dos dois fique visível. Juntos, os dois passos cobrem a suíte inteira. O resultado aparece na aba **Actions** do repositório e como check nos Pull Requests.

## Autor

**Kauã Victor Garcia Siécola**

Projeto desenvolvido como atividade avaliativa da disciplina **C216**.

## Licença

Este projeto tem finalidade exclusivamente acadêmica.
