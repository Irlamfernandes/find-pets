"""Rotas de cadastro e login."""

from flask import Blueprint, g, jsonify

from ..errors import ApiError
from ..validation import json_body, required_password, required_text
from . import repository
from .guard import require_auth
from .passwords import check_password, hash_password
from .tokens import create_token

blueprint = Blueprint("auth", __name__, url_prefix="/auth")


# E-mail (em minúsculas) e senha enviados no cadastro ou no login
def read_credentials():
    data = json_body()
    email = required_text(data, "email").lower()
    if "@" not in email or "." not in email.split("@")[-1]:
        raise ApiError(400, "Informe um e-mail válido.")
    return email, required_password(data, "password")


# Resposta de cadastro e login: o token de acesso e o e-mail da conta
def session_response(user, status):
    return jsonify({"token": create_token(user), "email": user["email"]}), status


@blueprint.post("/register")
def register():
    """
    Cria uma conta e já devolve o token de acesso
    ---
    tags: [Autenticação]
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          required: [email, password]
          properties:
            email: {type: string, example: ana@email.com}
            password: {type: string, example: senha123}
    responses:
      201: {description: Conta criada; devolve token e e-mail}
      400: {description: Dados inválidos}
      409: {description: E-mail já cadastrado}
    """
    email, password = read_credentials()
    user = repository.create_user(email, hash_password(password))
    return session_response(user, 201)


@blueprint.post("/login")
def login():
    """
    Entra na conta (em qualquer celular) e devolve o token de acesso
    ---
    tags: [Autenticação]
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          required: [email, password]
          properties:
            email: {type: string, example: ana@email.com}
            password: {type: string, example: senha123}
    responses:
      200: {description: Login feito; devolve token e e-mail}
      401: {description: E-mail ou senha incorretos}
    """
    email, password = read_credentials()
    user = repository.find_by_email(email)
    if not user or not check_password(password, user["password_hash"]):
        raise ApiError(401, "E-mail ou senha incorretos.")
    return session_response(user, 200)


@blueprint.put("/password")
@require_auth
def change_password():
    """
    Troca a senha da conta conectada (vale para todos os celulares)
    ---
    tags: [Autenticação]
    security: [{Bearer: []}]
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          required: [newPassword]
          properties:
            newPassword: {type: string, example: novaSenha123}
    responses:
      204: {description: Senha trocada}
      400: {description: Senha ausente ou longa demais}
      401: {description: Sem login}
    """
    password = required_password(json_body(), "newPassword")
    repository.update_password(g.user["id"], hash_password(password))
    return "", 204
