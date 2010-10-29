from pigeon.channels import Channel
from pigeon.utils import json_dumps, json_loads


class InvalidActionError(Exception):
    pass


class Action(object):

    type_mapper = {
        'subscribe': 'on_subscribe',
        'unsubscribe': 'on_unsubscribe',
    }

    def __init__(self, action_type, channel):
        self.channel = Channel.find_or_create(channel)
        self.type = action_type
        self.perform = getattr(self, self.type_mapper.get(self.type))

    @classmethod
    def from_json(cls, json):
        try:
            payload = json_loads(json)
        except TypeError, ValueError:
            raise InvalidActionError("Invalid Action")

        try:
            action_type = payload['type']
            channel = payload['channel']
        except KeyError:
            raise InvalidActionError("Action must contain "
                "a type and a channel.")

        if action_type not in cls.type_mapper:
            raise InvalidActionError("Action type must "
                "be one of %r" % self.type_mapper.keys())

        return cls(action_type, channel)

    def to_json(self):
        return json_dumps({
            'type': self.type,
            'channel': self.channel,
        })

    def on_subscribe(self, handler):
        self.channel.subscribe(handler)

    def on_unsubscribe(self, handler):
        self.channel.unsubscribe(handler)
