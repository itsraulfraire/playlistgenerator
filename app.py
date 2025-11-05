# app.py
from functools import wraps
from flask import Flask, render_template, request, jsonify, make_response, session
from flask_cors import CORS
import pytz
import datetime

# patterns & DAOs
from singleton import MySQLConnectionPool
from factory import DAOFactory

# Configuración: ajusta si necesitas
DB_CONFIG = {
    "host": "185.232.14.52",
    "database": "u760464709_23005270_bd",   # <- TU BD
    "user": "u760464709_16005339_usr",      # asegúrate que las credenciales existan
    "password": "$x[QjFu>Lt9H"
}

app = Flask(__name__)
app.secret_key = "Test12345"
CORS(app)

# Inicializa el singleton del pool (se creará una sola vez)
pool = MySQLConnectionPool(
    pool_name="my_pool",
    pool_size=5,
    **DB_CONFIG
)

def login_required(fun):
    @wraps(fun)
    def wrapper(*args, **kwargs):
        if not session.get("login"):
            return jsonify({"estado": "error", "respuesta": "No has iniciado sesión"}), 401
        return fun(*args, **kwargs)
    return wrapper

# Root ahora devuelve el dashboard directamente (sin landing)
@app.route("/")
def dashboard():
    return render_template("index.html")

@app.route("/login")
def app_login():
    return render_template("login.html")

@app.route("/fechaHora")
def fecha_hora():
    tz = pytz.timezone("America/Matamoros")
    ahora = datetime.datetime.now(tz)
    return ahora.strftime("%Y-%m-%d %H:%M:%S")

@app.route("/iniciarSesion", methods=["POST"])
def iniciar_sesion():
    usuario = request.form.get("usuario", "")
    contrasena = request.form.get("contrasena", "")

    usuario_dao = DAOFactory.get_dao("usuario", pool)
    user = usuario_dao.get_by_credentials(usuario, contrasena)

    session["login"] = False
    session["login-usr"] = None
    session["login-tipo"] = 0
    session["login-id"] = None

    if user:
        session["login"] = True
        session["login-usr"] = user.get("nombre_usuario")
        session["login-tipo"] = user.get("tipo_usuario")
        session["login-id"] = user.get("id_usuarios")
        return make_response(jsonify([user]))
    else:
        return make_response(jsonify([]))

@app.route("/cerrarSesion", methods=["POST"])
@login_required
def cerrar_sesion():
    session["login"] = False
    session["login-usr"] = None
    session["login-tipo"] = 0
    session["login-id"] = None
    return make_response(jsonify({}))

@app.route("/preferencias")
@login_required
def preferencias():
    return make_response(jsonify({
        "usr": session.get("login-usr"),
        "tipo": session.get("login-tipo", 2),
        "id": session.get("login-id")
    }))

# Vista protegido playlists
@app.route("/playlists")
@login_required
def view_playlists():
    return render_template("playlists.html")

# API para obtener playlists del usuario logueado
@app.route("/api/playlists", methods=["GET"])
@login_required
def api_playlists():
    usuario_id = session.get("login-id")
    playlist_dao = DAOFactory.get_dao("playlist", pool)
    playlists = playlist_dao.get_by_user(usuario_id, limit=100)
    return make_response(jsonify(playlists))

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
