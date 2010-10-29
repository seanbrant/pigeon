from threading import Thread
from redis import Redis
from pigeon.messages import Message, InvalidMessageError


class Listener(object):

    def __init__(self, redis=None, redis_host='localhost', redis_port=6379):
        self.db = redis or Redis(host=redis_host, port=redis_port)
        self.thread = Thread(target=self.listen)

    def start(self):
        self.thread.start()

    def stop(self):
        self.running = False

    def listen(self):
        self.db.subscribe('pigeon:publish')
        for response in self.db.listen():
            try:
                message = Message.from_json(response.get('data'))
                message.publish()
            except InvalidMessageError:
                pass
