from redis import Redis
from pigeon.utils import json_dumps


class Publisher(object):

    def __init__(self, redis=None, redis_host='localhost', redis_port=6379):
        self.db = redis or Redis(host=redis_host, port=redis_port)

    def publish(self, channel, body=None):
        payload = json_dumps({
            'channel': channel,
            'body': body,
        })
        self.db.publish('pigeon:publish', payload)
