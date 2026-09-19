<div align="center">

# C216 – Laboratório 

![Status](https://img.shields.io/badge/status-em%20desenvolvimento-yellow)
![Disciplina](https://img.shields.io/badge/disciplina-C216-blue)
![Uso](https://img.shields.io/badge/uso-academico-lightgrey)

Repositório referente ao Laboratório da disciplina **C216**.

</div>

---

## Testes

Os testes ficam em `backend/tests` e são executados com Pytest.

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
| `make test-v` | Executa em modo verboso, listando cada teste |
| `make test-k K=404` | Executa apenas os testes cujo nome casa com `404` |

Sem o Make, direto pelo Poetry:

```bash
cd backend
poetry install
poetry run pytest -v
```

### Integração contínua

O workflow [`.github/workflows/ci-backend.yml`](.github/workflows/ci-backend.yml) executa a suíte automaticamente no GitHub Actions a cada `push` e a cada `pull_request`. Ele configura o Python 3.13, instala as dependências com o Poetry e roda o Pytest. O resultado aparece na aba **Actions** do repositório e como check nos Pull Requests.

## Autor

**Kauã Victor Garcia Siécola**

Projeto desenvolvido como atividade avaliativa da disciplina **C216**.

## Licença

Este projeto tem finalidade exclusivamente acadêmica.
