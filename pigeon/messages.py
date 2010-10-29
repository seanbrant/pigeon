from pigeon.channels import Channel
from pigeon.utils import json_dumps, json_loads


class InvalidMessageError(Exception):
    pass


class Message(object):

    def __init__(self, channel, body):
        self.channel = Channel.find_or_create(channel)
        self.body = body

    @classmethod
    def from_json(cls, json):
        try:
            payload = json_loads(json)
        except TypeError, ValueError:
            raise InvalidMessageError("Message invalid")

        try:
            channel = payload['channel']
        except KeyError:
            raise InvalidMessageError("Message must contain "
                "a channel.")

        body = payload.get('body')

        return cls(channel, body)

    def to_json(self):
        return json_dumps({
            'channel': self.channel.name,
            'body': self.body,
        })

    def publish(self):
        for handler in self.channel.handlers:
            handler.send(self)
