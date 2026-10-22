"""Rotas dos registros de pets."""

from flask import Blueprint, g, jsonify, request

from ..auth.guard import require_auth
from ..clock import normalize_iso
from ..errors import ApiError
from ..validation import json_body, require_uuid
from . import repository, service
from .mapper import to_json
from .payload import read_post

blueprint = Blueprint("posts", __name__, url_prefix="/posts")


# Registros ativos ou, com ?since=, o que mudou desde a data
def list_posts():
    since = request.args.get("since")
    if since is None:
        return repository.list_active()
    return repository.list_changed_since(normalize_iso(since, "since"))


@blueprint.get("")
@require_auth
def get_posts():
    """
    Lista os registros de todos os usuários
    ---
    tags: [Registros]
    security: [{Bearer: []}]
    parameters:
      - name: since
        in: query
        type: string
        required: false
        description: >
          Para sincronizar: devolve só o que mudou a partir desta data
          (serverUpdatedAt), inclusive os excluídos (deletedAt preenchido).
          Sem ele, devolve os registros ativos, do mais novo para o mais antigo.
    responses:
      200: {description: Lista de registros}
      401: {description: Sem login}
    """
    return jsonify([to_json(post) for post in list_posts()]), 200


@blueprint.get("/<post_id>")
@require_auth
def get_post(post_id):
    """
    Um registro específico
    ---
    tags: [Registros]
    security: [{Bearer: []}]
    parameters:
      - {name: post_id, in: path, type: string, required: true}
    responses:
      200: {description: Registro encontrado}
      404: {description: Registro não encontrado ou excluído}
    """
    post = repository.find(require_uuid(post_id))
    if post is None:
        raise ApiError(404, "Registro não encontrado.")
    return jsonify(to_json(post)), 200


@blueprint.put("/<post_id>")
@require_auth
def put_post(post_id):
    """
    Cria ou atualiza um registro (o id é gerado no app)
    ---
    tags: [Registros]
    security: [{Bearer: []}]
    description: >
      Pode ser repetido sem criar duplicatas, o que permite reenviar o que foi
      feito offline. Se o servidor já tiver uma versão mais nova (updatedAt),
      ela é mantida e devolvida.
    parameters:
      - {name: post_id, in: path, type: string, required: true}
      - name: body
        in: body
        required: true
        schema:
          type: object
          properties:
            petName: {type: string, example: Rex}
            species: {type: string, example: Cachorro}
            status: {type: string, enum: [Perdido, Encontrado]}
            latitude: {type: number}
            longitude: {type: number}
            location: {type: string}
            images: {type: array, items: {type: string}}
            updatedAt: {type: string, example: "2026-10-15T14:30:00.000Z"}
    responses:
      201: {description: Registro criado}
      200: {description: Registro atualizado (ou versão mais nova do servidor)}
      400: {description: Dados inválidos}
      403: {description: O registro é de outra pessoa}
    """
    row, images = read_post(json_body())
    post, created = service.save_post(g.user, require_uuid(post_id), row, images)
    return jsonify(to_json(post)), 201 if created else 200


@blueprint.delete("/<post_id>")
@require_auth
def delete_post(post_id):
    """
    Exclui logicamente um registro (fica no banco com deletedAt)
    ---
    tags: [Registros]
    security: [{Bearer: []}]
    parameters:
      - {name: post_id, in: path, type: string, required: true}
    responses:
      200: {description: Registro excluído}
      403: {description: O registro é de outra pessoa}
      404: {description: Registro não encontrado}
    """
    post = service.delete_post(g.user, require_uuid(post_id))
    return jsonify(to_json(post)), 200
