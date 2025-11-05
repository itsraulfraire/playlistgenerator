# backend/playlist_factory.py
class Playlist:
    def __init__(self, id, nombre, descripcion, url):
        self.id = id
        self.nombre = nombre
        self.descripcion = descripcion
        self.url = url

class PlaylistFactory:
    @staticmethod
    def crear_playlist(row):
        return Playlist(row[0], row[1], row[2], row[3])
