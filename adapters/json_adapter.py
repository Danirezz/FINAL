import json

class JsonAdapter:

    def read(self, path):
        with open(path, "r") as f:
            return json.load(f)

    def write(self, path, data):
        with open(path, "w") as f:
            json.dump(data, f, indent=2)