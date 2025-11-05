from flask import Flask, render_template, request, jsonify, make_response, session
from flask_cors import CORS
import mysql.connector
import datetime
import pytz
from functools import wraps

def get_connection():
    return mysql.connector.connect(
        host="185.232.14.52",
        database="u760464709_23005116_bd",
        user="u760464709_23005116_usr",
        password="z8[T&05u"
    )

app = Flask(__name__)
app.secret_key = "clave-super-secreta-2025"
CORS(app)

def login(fun):
    @wraps(fun)
    def decorador(*args, **kwargs):
        if not session.get("login"):
            return jsonify({
                "estado": "error",
                "respuesta": "No has iniciado sesión"
            }), 401
        return fun(*args, **kwargs)
    return decorador

@app.route("/")
def landingPage():
    con = get_connection()
    con.close()
    return render_template("index.html")

@app.route("/login")
def appLogin():
    return render_template("login.html")

@app.route("/fechaHora")
def fechaHora():
    tz    = pytz.timezone("America/Matamoros")
    ahora = datetime.datetime.now(tz)
    return ahora.strftime("%Y-%m-%d %H:%M:%S")

@app.route("/iniciarSesion", methods=["POST"])
def iniciarSesion():
    usuario = request.form["usuario"]
    contrasena = request.form["contrasena"]

    con = get_connection()
    cursor = con.cursor(dictionary=True)
    sql = """
    SELECT Id_Usuario, Nombre_Usuario, Tipo_Usuario
    FROM usuarios
    WHERE Nombre_Usuario = %s
    AND Contrasena = %s
    """
    val = (usuario, contrasena)

    cursor.execute(sql, val)
    registros = cursor.fetchall()
    cursor.close()
    con.close()

    session["login"] = False
    session["login-usr"] = None
    session["login-tipo"] = 0

    if registros:
        usuario = registros[0]
        session["login"] = True
        session["login-usr"] = usuario["Nombre_Usuario"]
        session["login-tipo"] = usuario["Tipo_Usuario"]

    return make_response(jsonify(registros))

@app.route("/cerrarSesion", methods=["POST"])
@login
def cerrarSesion():
    session.clear()
    return make_response(jsonify({}))

@app.route("/preferencias")
@login
def preferencias():
    return make_response(jsonify({
        "usr": session.get("login-usr"),
        "tipo": session.get("login-tipo", 2)
    }))
    
# ========================
# RUTAS PLAYLISTS
# ========================
@app.route("/playlists")
def padrinos():
    return render_template("playlists.html")

@app.route("/tbodyPlaylist")
@login
def tbodyPLaylist():
    con = get_connection()
    cursor = con.cursor(dictionary=True)
    sql    = """
    SELECT idPlaylist,
           nombre,
           descripcion,
           url,
           id_usuarios
    FROM playlists
    ORDER BY idPlaylist DESC
    LIMIT 10 OFFSET 0
    """
    cursor.execute(sql)
    registros = cursor.fetchall()
    cursor.close()
    con.close()
    return render_template("tbodyPlaylists.html", playlists=registros)

@app.route("/playlists/buscar", methods=["GET"])
@login
def buscarPlaylists():
    con = get_connection()
    args     = request.args
    busqueda = args["busqueda"]
    busqueda = f"%{busqueda}%"
    
    cursor = con.cursor(dictionary=True)
    sql    = """
    SELECT idPlaylist,
           nombre,
           descripcion,
           url,
           id_usuarios
    FROM playlists
    WHERE nombre LIKE %s
    OR    descripcion          LIKE %s
    OR    url LIKE %s
    ORDER BY idPlaylist DESC
    LIMIT 10 OFFSET 0
    """
    val    = (busqueda, busqueda, busqueda)

    try:
        cursor.execute(sql, val)
        registros = cursor.fetchall()
    except mysql.connector.errors.ProgrammingError as error:
        print(f"Ocurrió un error de programación en MySQL: {error}")
        registros = []
    finally:
        cursor.close()
        con.close()

    return make_response(jsonify(registros))


