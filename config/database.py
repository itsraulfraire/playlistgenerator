import mysql.connector

class DatabaseSingleton:
    __instance = None

    @staticmethod
    def get_instance():
        if DatabaseSingleton.__instance is None:
            DatabaseSingleton()
        return DatabaseSingleton.__instance

    def __init__(self):
        if DatabaseSingleton.__instance is not None:
            raise Exception("Esta clase es un Singleton!")
        else:
            DatabaseSingleton.__instance = self
            self.connection = mysql.connector.connect(
                host="185.232.14.52",
                user="u760464709_23005270_usr",
                password="$x[QjFu>Lt9H",
                database="u760464709_23005270_bd"
            )

    def get_connection(self):
        return self.connection
