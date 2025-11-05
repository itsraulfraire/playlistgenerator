from flask import Flask, jsonify, request, render_template
from config.database import DatabaseConnection
from config.playlist_factory import PlaylistFactory
from flask_cors import CORS
import jwt
import datetime
from functools import wraps

app = Flask(__name__)
app.secret_key = "ultra_secret"
CORS(app)

# Verificación del token
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None

        if 'Authorization' in request.headers:
            token = request.headers['Authorization'].split(" ")[1]

        if not token:
            return jsonify({'error': 'Token requerido'}), 401

        try:
            data = jwt.decode(token, app.secret_key, algorithms=["HS256"])
            usuario_id = data['usuario_id']
        except:
            return jsonify({'error': 'Token inválido'}), 401

        return f(usuario_id, *args, **kwargs)
    return decorated


@app.route('/')
def login_page():
    return render_template("login.html")


# LOGIN con JWT
@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data["email"]
    contrasena = data["contrasena"]

    conn = DatabaseConnection.get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM usuarios WHERE email=%s AND contrasena=%s",
                   (email, contrasena))
    user = cursor.fetchone()

    if not user:
        return jsonify({"error": "Credenciales incorrectas"}), 401

    token = jwt.encode({
        "usuario_id": user["id_usuario"],
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=2)
    }, app.secret_key, algorithm="HS256")

    return jsonify({"token": token})


# R: Mostrar playlists
@app.route('/api/playlists', methods=['GET'])
@token_required
def obtener_playlists(usuario_id):
    conn = DatabaseConnection.get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(
        "SELECT idPlaylist, nombre, descripcion, url FROM playlists WHERE id_usuarios = %s",
        (usuario_id,)
    )
    filas = cursor.fetchall()

    playlists = [PlaylistFactory.create(p).__dict__ for p in filas]
    return jsonify(playlists)


@app.route('/playlists')
def playlists_view():
    return render_template("playlists.html")


if __name__ == "__main__":
    app.run(debug=True)
