class EmailObserver:

    def update(self, data):
        print(f"Enviando email a {data['email']}")