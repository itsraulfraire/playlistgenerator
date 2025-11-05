import mysql.connector

class DatabaseConnection:
    _instance = None

    @staticmethod
    def get_connection():
        if DatabaseConnection._instance is None:
            DatabaseConnection()
        return DatabaseConnection._instance

    def __init__(self):
        if DatabaseConnection._instance is not None:
            return
        DatabaseConnection._instance = mysql.connector.connect(
            host="185.232.14.52",
            user="u760464709_23005270_usr",
            password="$x[QjFu>Lt9H",
            database="u760464709_23005270_bd"
        )
