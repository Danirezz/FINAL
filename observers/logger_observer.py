class LoggerObserver:

    def update(self, data):
        print(f"Usuario registrado: {data['email']}")