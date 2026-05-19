import hashlib
from strategies.hash_strategy import HashStrategy

class SHA256Strategy(HashStrategy):

    def hash(self, password):
        return hashlib.sha256(password.encode()).hexdigest()