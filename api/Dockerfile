FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Só o código da API: nada de .env, testes ou arquivos locais na imagem
COPY app.py .
COPY findpets_api ./findpets_api

# Roda sem ser root; a pasta de fotos (volume) pertence a esse usuário
RUN useradd --create-home --uid 10001 findpets \
    && mkdir -p /data/uploads \
    && chown findpets /data/uploads
USER findpets

EXPOSE 5000

# Servidor de produção (o "python app.py" é só para desenvolvimento)
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "2", "--access-logfile", "-", "app:app"]
