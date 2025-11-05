import base64

class PlaylistDAO:
    def __init__(self, pool):
        self.pool = pool

    def get_by_user(self, id_usuario, limit=100):
        con = None
        cursor = None
        try:
            con = self.pool.get_connection()
            cursor = con.cursor(dictionary=True)
            sql = """
                SELECT idPlaylist, nombre, descripcion, imagen, url, id_usuarios
                FROM playlists
                WHERE id_usuarios = %s
                ORDER BY idPlaylist DESC
                LIMIT %s
            """
            cursor.execute(sql, (id_usuario, limit))
            rows = cursor.fetchall()

            for row in rows:
                if row["imagen"] is not None:
                    row["imagen"] = "data:image/jpeg;base64," + base64.b64encode(row["imagen"]).decode("utf-8")

            return rows
        except Exception as e:
            return []
        finally:
            if cursor: cursor.close()
            if con and con.is_connected(): con.close()
