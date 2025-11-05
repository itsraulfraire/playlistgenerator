from flask_sqlalchemy import SQLAlchemy

class Database:
    _instance = None
    db = None

    def __new__(cls, app=None):
        if not cls._instance:
            cls._instance = super(Database, cls).__new__(cls)
            if app:
                cls.db = SQLAlchemy(app)
        return cls._instance
