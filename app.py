from flask import Flask, render_template, request, jsonify, session, make_response
from flask_cors import CORS
from functools import wraps
from config.database import DatabaseSingleton

app = Flask(__name__)
app.secret_key = "super-secret-playlist-2025"
CORS(app)

class Playlist:
    def __init__(self, idPlaylist, nombre, descripcion, url, id_usuarios):
        self.idPlaylist = idPlaylist
        self.nombre = nombre
        self.descripcion = descripcion
        self.url = url
        self.id_usuarios = id_usuarios

class PlaylistFactory:
    @staticmethod
    def crear(row):
        return Playlist(
            row["idPlaylist"],
            row["nombre"],
            row["descripcion"],
            row["url"],
            row["id_usuarios"]
        )

def login_required(fun):
    @wraps(fun)
    def decorador(*args, **kwargs):
        if not session.get("login"):
            return jsonify({"estado": "error", "mensaje": "No has iniciado sesión"}), 401
        return fun(*args, **kwargs)
    return decorador

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/login")
def loginView():
    return render_template("login.html")

@app.route("/playlists")
@login_required
def playlistView():
    return render_template("playlists.html")

@app.route("/api/login", methods=["POST"])
def login():
    user = request.json.get("usuario")
    password = request.json.get("contrasena")

    db = DatabaseSingleton.get_instance().get_connection()
    cursor = db.cursor(dictionary=True)

    query = """
        SELECT id_usuarios, username
        FROM usuarios
        WHERE username = %s AND password = %s 
    """
    cursor.execute(query, (user, password))
    result = cursor.fetchone()
    cursor.close()

    if result:
        session["login"] = True
        session["id_usuario"] = result["id_usuarios"]
        session["username"] = result["username"]
        return jsonify({"estado": "ok", "usuario": result})

    return jsonify({"estado": "error", "mensaje": "Credenciales incorrectas"})

@app.route("/api/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"estado": "ok"})

@app.route("/api/playlists", methods=["GET"])
@login_required
def listarPlaylists():
    user_id = session.get("id_usuario")
    db = DatabaseSingleton.get_instance().get_connection()
    cursor = db.cursor(dictionary=True)

    query = """
        SELECT idPlaylist, nombre, descripcion, url, id_usuarios
        FROM playlists
        WHERE id_usuarios = %s
    """
    cursor.execute(query, (user_id,))
    rows = cursor.fetchall()
    cursor.close()

    playlists = [PlaylistFactory.crear(r).__dict__ for r in rows]
    return jsonify(playlists)

@app.route("/api/session")
def estado_sesion():
    return jsonify({
        "login": session.get("login", False),
        "usuario": session.get("username","")
    })

if __name__ == "__main__":
    app.run(debug=True)
