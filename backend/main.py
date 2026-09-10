from fastapi import FastAPI

app = FastAPI(title="C216 L1 - Backend")


@app.get("/")
def raiz():
    return {"mensagem": "Backend C216 L1 no ar"}


@app.get("/health")
def health():
    return {"status": "ok"}
