import time

class UserFactory:

    @staticmethod
    def create(name, email, password):
        return {
            "name": name,
            "email": email,
            "password": password,
            "created_at": time.time()
        }