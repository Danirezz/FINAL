from functools import wraps
import time

def log_action(func):

    @wraps(func)
    def wrapper(*args, **kwargs):
        print(f"[LOG] Ejecutando {func.__name__}")
        start = time.time()

        result = func(*args, **kwargs)

        print(f"[LOG] Tiempo: {time.time() - start}")
        return result

    return wrapper