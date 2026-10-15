"""Rotas do perfil da conta conectada."""

import re

from flask import Blueprint, g, jsonify

from ..auth.guard import require_auth
from ..errors import ApiError
from ..validation import json_body, optional_text, required_text
from . import repository

blueprint = Blueprint("profiles", __name__, url_prefix="/profile")

# Código do país (2) + DDD (2) + número (8 ou 9), só dígitos
WHATSAPP = re.compile(r"^\d{12,13}$")


def to_json(row):
    return {
        "name": row["name"],
        "whatsapp": row["whatsapp"],
        "photoUrl": row["photo_url"],
        "updatedAt": row["updated_at"],
    }


def read_profile():
    data = json_body()
    whatsapp = required_text(data, "whatsapp")
    if not WHATSAPP.match(whatsapp):
        raise ApiError(400, "Informe o WhatsApp só com dígitos, com país e DDD.")
    return {
        "name": required_text(data, "name", max_length=120),
        "whatsapp": whatsapp,
        "photo_url": optional_text(data, "photoUrl", max_length=500),
    }


@blueprint.get("")
@require_auth
def get_profile():
    """
    Perfil da conta conectada
    ---
    tags: [Perfil]
    security: [{Bearer: []}]
    responses:
      200: {description: Perfil encontrado}
      401: {description: Sem login}
      404: {description: A conta ainda não tem perfil}
    """
    row = repository.find_by_user(g.user["id"])
    if not row:
        raise ApiError(404, "Perfil não encontrado.")
    return jsonify(to_json(row)), 200


@blueprint.put("")
@require_auth
def save_profile():
    """
    Cria ou atualiza o perfil da conta conectada
    ---
    tags: [Perfil]
    security: [{Bearer: []}]
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          required: [name, whatsapp]
          properties:
            name: {type: string, example: Ana}
            whatsapp: {type: string, example: "5511999999999"}
            photoUrl: {type: string}
    responses:
      200: {description: Perfil salvo}
      400: {description: Dados inválidos}
      401: {description: Sem login}
    """
    row = repository.save(g.user["id"], read_profile())
    return jsonify(to_json(row)), 200
