# dao_usuario.py
class UsuarioDAO:
    def __init__(self, pool):
        self.pool = pool

    def get_by_credentials(self, nombre_usuario, contrasena):
        """
        Devuelve el registro del usuario si coincide usuario+pass, o None.
        """
        con = None
        cursor = None
        try:
            con = self.pool.get_connection()
            cursor = con.cursor(dictionary=True)
            sql = """
                SELECT id_usuarios, nombre_usuario, tipo_usuario
                FROM usuarios
                WHERE nombre_usuario = %s
                AND contrasena = %s
                LIMIT 1
            """
            cursor.execute(sql, (nombre_usuario, contrasena))
            row = cursor.fetchone()
            return row
        except Exception as e:
            # idealmente loggear
            return None
        finally:
            if cursor:
                cursor.close()
            if con and con.is_connected():
                con.close()
