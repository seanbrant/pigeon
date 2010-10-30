from redis import Redis

from pigeon.utils import json_dumps


class Pigeon(object):

    def __init__(self, db=None, host='localhost', port=6379):
        self.db = db or Redis(host=host, port=port)

    def publish(self, channel, body=None):
        payload = json_dumps({
            'channel': channel,
            'body': body,
        })
        self.db.publish('pigeon:publish', payload)
