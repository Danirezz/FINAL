from abc import ABC, abstractmethod

class HashStrategy(ABC):

    @abstractmethod
    def hash(self, password):
        pass