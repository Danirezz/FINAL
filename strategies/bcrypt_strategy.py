import bcrypt
from strategies.hash_strategy import HashStrategy

class BcryptStrategy(HashStrategy):

    def hash(self, password):
        return bcrypt.hashpw(password.encode(), bcrypt.gensalt())