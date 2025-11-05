# backend/database.py
import sqlite3

class Database:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = sqlite3.connect("playlists.db", check_same_thread=False)
        return cls._instance
