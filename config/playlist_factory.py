class Playlist:
    def __init__(self, idPlaylist, nombre, descripcion, url):
        self.idPlaylist = idPlaylist
        self.nombre = nombre
        self.descripcion = descripcion
        self.url = url

class PlaylistFactory:
    @staticmethod
    def create(data):
        return Playlist(
            data["idPlaylist"],
            data["nombre"],
            data["descripcion"],
            data["url"]
        )
