from adapters.json_adapter import JsonAdapter

class UserRepository:

    def __init__(self):
        self.adapter = JsonAdapter()

    def get_users(self, path):
        return self.adapter.read(path)

    def save_users(self, path, data):
        self.adapter.write(path, data)