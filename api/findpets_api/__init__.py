"""API do FindPets: contas, perfis, registros de pets e fotos."""

from flasgger import Swagger
from flask import Flask, jsonify
from flask_cors import CORS

from . import csrf
from .auth.routes import blueprint as auth_blueprint
from .config import load_settings, require_secret
from .database import init_database
from .errors import register_error_handlers
from .posts.routes import blueprint as posts_blueprint
from .profiles.routes import blueprint as profiles_blueprint
from .uploads.routes import blueprint as uploads_blueprint

BLUEPRINTS = (auth_blueprint, profiles_blueprint, posts_blueprint, uploads_blueprint)

# Documentação interativa em /apidocs
SWAGGER_TEMPLATE = {
    "info": {
        "title": "FindPets API",
        "description": "Contas, perfis, registros de pets perdidos e fotos.",
        "version": "1.0.0",
    },
    "securityDefinitions": {
        "Bearer": {
            "type": "apiKey",
            "name": "Authorization",
            "in": "header",
            "description": "Digite: Bearer <token recebido no login>",
        }
    },
}


def enable_cors(app):
    """Libera o navegador só para os sites listados em CORS_ORIGINS."""
    origins = app.config["CORS_ORIGINS"]
    if origins:
        CORS(app, origins=origins)


# Monta a API: configurações, CORS, CSRF, Swagger, erros, banco e rotas.
# `overrides` troca configurações (usado nos testes).
def create_app(overrides=None):
    app = Flask(__name__)
    app.config.update(load_settings())
    app.config.update(overrides or {})
    require_secret(app.config)

    enable_cors(app)
    csrf.init_app(app)
    Swagger(app, template=SWAGGER_TEMPLATE)
    register_error_handlers(app)
    init_database(app)
    for blueprint in BLUEPRINTS:
        app.register_blueprint(blueprint)

    @app.get("/health")
    def health():
        """
        Verifica se a API está no ar
        ---
        tags: [Status]
        responses:
          200: {description: API funcionando}
        """
        return jsonify({"status": "ok"}), 200

    return app
