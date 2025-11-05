# singleton.py
from threading import Lock
import mysql.connector.pooling

class SingletonMeta(type):
    _instances = {}
    _lock: Lock = Lock()

    def __call__(cls, *args, **kwargs):
        # doble-checked locking
        if cls not in cls._instances:
            with cls._lock:
                if cls not in cls._instances:
                    instance = super().__call__(*args, **kwargs)
                    cls._instances[cls] = instance
        return cls._instances[cls]

class MySQLConnectionPool(metaclass=SingletonMeta):
    """
    Singleton wrapper for mysql.connector.pooling.MySQLConnectionPool
    """
    def __init__(self, pool_name="my_pool", pool_size=5, **dbconfig):
        # si ya existe el pool (ejecuciones repetidas), no recrear
        if hasattr(self, "_pool") and self._pool is not None:
            return

        self._dbconfig = dbconfig
        self._pool_name = pool_name
        self._pool_size = pool_size
        self._pool = mysql.connector.pooling.MySQLConnectionPool(
            pool_name=self._pool_name,
            pool_size=self._pool_size,
            **self._dbconfig
        )

    def get_connection(self):
        return self._pool.get_connection()
