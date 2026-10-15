"""Erros da API, sempre respondidos como JSON: {"error": "mensagem"}."""

from flask import jsonify
from werkzeug.exceptions import HTTPException


class ApiError(Exception):
    def __init__(self, status, message):
        super().__init__(message)
        self.status = status
        self.message = message


def register_error_handlers(app):
    @app.errorhandler(ApiError)
    def handle_api_error(error):
        return jsonify({"error": error.message}), error.status

    # Erros do próprio Flask (rota inexistente, arquivo grande demais...)
    @app.errorhandler(HTTPException)
    def handle_http_error(error):
        return jsonify({"error": error.description}), error.code
