"""Envio e leitura das fotos (dos registros e dos perfis)."""

from pathlib import Path

from flask import Blueprint, current_app, jsonify, request, send_from_directory, url_for

from ..auth.guard import require_auth
from ..errors import ApiError
from ..validation import new_id

blueprint = Blueprint("uploads", __name__, url_prefix="/uploads")

EXTENSIONS = {"jpg", "jpeg", "png", "webp"}


def upload_dir():
    return Path(current_app.config["UPLOAD_DIR"])


def extension_of(file):
    extension = Path(file.filename or "").suffix.lower().lstrip(".")
    if extension not in EXTENSIONS:
        raise ApiError(400, "Envie uma imagem JPG, PNG ou WEBP.")
    return extension


@blueprint.post("")
@require_auth
def upload():
    """
    Envia uma foto e devolve o endereço dela
    ---
    tags: [Fotos]
    security: [{Bearer: []}]
    consumes: [multipart/form-data]
    parameters:
      - {name: file, in: formData, type: file, required: true}
    responses:
      201: {description: Foto salva; devolve a url}
      400: {description: Arquivo ausente ou que não é imagem}
      413: {description: Arquivo maior que 5 MB}
    """
    file = request.files.get("file")
    if file is None:
        raise ApiError(400, "Envie a foto no campo 'file'.")
    # Nome gerado pelo servidor: o nome original nunca vira caminho de arquivo
    name = f"{new_id()}.{extension_of(file)}"
    upload_dir().mkdir(parents=True, exist_ok=True)
    file.save(upload_dir() / name)
    url = url_for("uploads.get_upload", name=name, _external=True)
    return jsonify({"url": url}), 201


@blueprint.get("/<name>")
def get_upload(name):
    """
    Devolve uma foto enviada
    ---
    tags: [Fotos]
    parameters:
      - {name: name, in: path, type: string, required: true}
    responses:
      200: {description: A imagem}
      404: {description: Foto não encontrada}
    """
    # send_from_directory recusa caminhos que saiam da pasta (ex.: ../)
    return send_from_directory(upload_dir().resolve(), name)
