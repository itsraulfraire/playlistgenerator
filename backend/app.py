# backend/app.py
from flask import Flask, jsonify
from database import Database
from playlist_factory import PlaylistFactory

app = Flask(__name__)

@app.route("/playlists", methods=["GET"])
def obtener_playlists():
    db = Database()
    cursor = db.cursor()
    cursor.execute("SELECT * FROM playlists")
    rows = cursor.fetchall()

    playlists = [PlaylistFactory.crear_playlist(row).__dict__ for row in rows]
    return jsonify(playlists)

if __name__ == "__main__":
    app.run(debug=True)
