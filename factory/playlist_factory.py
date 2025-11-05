class Playlist:
    def __init__(self, idPlaylist, nombre, descripcion, url):
        self.idPlaylist = idPlaylist
        self.nombre = nombre
        self.descripcion = descripcion
        self.url = url


class PlaylistFactory:
    @staticmethod
    def crear_playlist(idPlaylist, nombre, descripcion, url):
        return Playlist(idPlaylist, nombre, descripcion, url)
