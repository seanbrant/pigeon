from pigeon.utils import json_dumps


class Channel(object):

    channels = {}

    def __init__(self, name):
        self.name = name
        self.handlers = set()

    @classmethod
    def find_or_create(cls, name):
        if name not in cls.channels:
            cls.channels[name] = cls(name)
        return cls.channels[name]

    @classmethod
    def unsubscribe_from_all(cls, client):
        for channel in cls.channels.values():
            channel.unsubscribe(client)

    def subscribe(self, handler):
        self.handlers.add(handler)

    def unsubscribe(self, handler):
        try:
            self.handlers.remove(handler)
        except KeyError:
            pass
