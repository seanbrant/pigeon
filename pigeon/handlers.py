from tornad_io import SocketIOHandler
from pigeon.channels import Channel
from pigeon.actions import Action, InvalidActionError


class PigeonHandler(SocketIOHandler):

    def on_message(self, data):
        try:
            action = Action.from_json(data)
        except InvalidActionError:
            self._abort(400)

        action.perform(self)

    def on_close(self):
        Channel.unsubscribe_from_all(self)

    def send(self, message):
        super(PigeonHandler, self).send(message.to_json())
