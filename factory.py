# factory.py
from dao_usuario import UsuarioDAO
from dao_playlist import PlaylistDAO

class DAOFactory:
    """
    Factory simple para obtener DAOs por nombre.
    """
    @staticmethod
    def get_dao(name, pool):
        """
        name: 'usuario' | 'playlist'
        pool: instancia de MySQLConnectionPool (singleton)
        """
        name = name.lower()
        if name == "usuario" or name == "usuarios":
            return UsuarioDAO(pool)
        elif name == "playlist" or name == "playlists":
            return PlaylistDAO(pool)
        else:
            raise ValueError(f"DAO desconocido: {name}")
