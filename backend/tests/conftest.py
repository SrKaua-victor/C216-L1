import pytest

TIPOS_DE_TESTE = ("unit", "integration")


@pytest.hookimpl(tryfirst=True)
def pytest_collection_modifyitems(config, items):
    sem_tipo = []
    for item in items:
        partes = item.path.relative_to(config.rootpath).parts
        tipo = partes[1] if len(partes) > 2 else None
        if tipo in TIPOS_DE_TESTE:
            item.add_marker(getattr(pytest.mark, tipo))
        else:
            sem_tipo.append(item.nodeid)
    if sem_tipo:
        raise pytest.UsageError(
            "Todo teste deve ficar em tests/unit ou tests/integration. Fora do lugar: "
            + ", ".join(sem_tipo)
        )
