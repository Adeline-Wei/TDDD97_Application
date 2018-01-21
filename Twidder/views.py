__author__ = 'linwe991'
print("views.py")

from Twidder import app
import random
from flask import Flask, jsonify, request
from Twidder import database_helper
from gevent.wsgi import WSGIServer
from geventwebsocket.handler import WebSocketHandler
from geventwebsocket.websocket import WebSocketError
import json

app = Flask(__name__)


# Store webSockets
active_connections = dict()


@app.route("/")
def index():
    print("views.py - index")
    return app.send_static_file('client.html')


@app.route("/sign_in", methods=['POST'])
def sign_in():
    """
    :return: status 200 and a token if sign in successfully, otherwise status 400.
    """
    print("views.py - sign_in")
    data = request.get_json()
    result = database_helper.find_user(data['email'], password=data['password'], status='LOGIN')
    if result:
        letters = "abcdefghiklmnopqrstuvwwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890"
        token = ""
        for i in range(0, 36):
            token += letters[random.randint(0, 61)]
        database_helper.add_sign_in_user(data['email'], token)
        return jsonify({"status": 200, "token": token})
    else:
        return jsonify({"status": 400})


@app.route("/sign_up", methods=['POST'])
def sign_up():
    """
    :return: status 200 if sign up successfully, otherwise 400.
    """
    print("views.py - sign_up")
    data = request.get_json()
    print(data)
    result = database_helper.add_user(data['email'], data['password'], data['firstname'], data['familyname'], data['gender'], data['city'], data['country'])

    if result:
        return jsonify({"status": 200})
    else:
        return jsonify({"status": 404})


@app.route("/sign_out")
def sign_out():
    """
    :return: status 200 if sign out successfully, otherwise 400.
    """
    print("views.py - sign_out")
    token = request.args.get('token')
    result = database_helper.remove_sign_in_user(token)
    if result:
        return jsonify({"status": 200})
    else:
        return jsonify({"status": 400})


@app.route("/change_password", methods=['POST'])
def change_password():
    """
    :return: status 200 if change password successfully, otherwise 400.
    """
    print("views.py - change_password")
    data = request.get_json()
    result = database_helper.change_password(data['token'], data['old_pw'], data['new_pw'])
    if result:
        return jsonify({"status": 200})
    else:
        return jsonify({"status": 400})


@app.route("/get_user_data_by_token")
def get_user_data_by_token():
    """
    :return: status 200 and user information if get user data successfully, otherwise status 400.
    """
    print("views.py - get_user_data_by_token")
    token = request.args.get('token')
    result = database_helper.find_sign_in_user(token)
    if result:
        return jsonify({"data":{"email":result[0],"firstname":result[1],"familyname":result[2],"gender":result[3],"city":result[4],"country":result[5]}, "status": 200})
    else:
        return jsonify({"status": 400})


@app.route("/get_user_data_by_email")
def get_user_data_by_email():
    """
    :return: status 200 and user information (except his/her password) if get data successfully, otherwise status 400.
    """
    print("views.py - get_user_data_by_email")
    token = request.args.get('token')
    email = request.args.get('email')
    result = database_helper.find_sign_in_user(token)
    if result:
        result = database_helper.find_user(email)
        if result:
            return jsonify({"status": 200, "result": result})
        else:
            return jsonify({"status": 400})
    else:
        return jsonify({"status": 400})


@app.route("/get_user_messages_by_token")
def get_user_messages_by_token():
    """
    :return: finding result and messages of a user if get messages successfully, otherwise status 400.
    """
    print("views.py - get_user_messages_by_token")
    token = request.args.get('token')
    print('current_user[UP]:', token)
    result, messages = database_helper.find_user_message(token)
    if result:
        return jsonify(result=result, messages=messages)
    else:
        return jsonify({"status": 400})


@app.route("/get_user_messages_by_email")
def get_user_messages_by_email():
    """
    :return: finding result and messages of a user if get messages successfully, otherwise status 400.
    """
    print("views.py - get_user_messages_by_email")
    token = request.args.get('token')
    email = request.args.get('email')
    result, messages = database_helper.find_user_message(token=token,search_email=email)
    if result:
        return jsonify(result=result,messages=messages)
    else:
        return jsonify({"status": 400})


@app.route("/post_message", methods=['POST'])
def post_message():
    """
    :return: posting result if post a message successfully, otherwise status 400.
    """
    print("views.py - post_message")
    data = request.get_json()
    result = database_helper.add_message(data['token'], data['message'], data['email'])
    if result:
        return jsonify(result=result)
    else:
        return jsonify({"status": 400})


@app.route('/send_notification')
def send_notification():
    """
    Send notifications to corresponding users according to different situations.
    :return: None
    """
    print("views.py - send_notification")
    if request.environ.get('wsgi.websocket'):
        ws = request.environ['wsgi.websocket']
        while True:
            try:
                message = ws.receive()
                try:
                    message = json.loads(message)
                    if message['signal'] == 'NOTIFY_LOGIN':
                        if database_helper.find_sign_in_user(message['data'][1]):
                            if message['data'][0] in active_connections.keys():
                                try:
                                    active_connections[message['data'][0]].send('BYE')
                                except WebSocketError:
                                    print("[WEB_SOCKET_ERROR] DUE_TO_REFRESH")
                            active_connections[message['data'][0]] = ws
                            for active_connection in active_connections.keys():
                                active_connections[active_connection].send('NEW_LOGIN')
                    elif message['signal'] == 'NOTIFY_LOGOUT':
                        del active_connections[message['data'][0]]
                        for active_connection in active_connections.keys():
                            active_connections[active_connection].send('NEW_LOGOUT')
                    elif message['signal'] == 'NOTIFY_POST':
                        if database_helper.find_sign_in_user(message['data'][1]):
                            try:
                                active_connections[message['data'][0]].send('NEW_POST')
                            except KeyError:
                                pass
                    else:
                        pass
                except TypeError:
                    print('[SEND_NOTIFICATION] JSON DECODE')
            except WebSocketError:
                print('[WEB_SOCKET_ERROR] CONNECTION IS ALREADY CLOSED')
                break
    return


@app.route('/add_viewed_time')
def add_viewed_time():
    """
    :return: adding view result
    """
    print("views.py - add_viewed_time")
    viewed_email = request.args.get('viewed_email')
    result = database_helper.add_viewed_time(viewed_email)
    return jsonify(result=result)


@app.route('/show_chart')
def show_chart():
    """
    :return: number of current online users, number of posts of a user, and number of views of a user.
    """
    print("views.py - show_chart")
    email = request.args.get('email')
    num_cur_onlines, num_posts, num_views = database_helper.show_chart(email)
    return jsonify({'num_cur_onlines': num_cur_onlines, 'num_posts': num_posts, 'num_views': num_views})


DATABASE = 'database.db'


def init_database():
    print("views.py - init_database")
    with app.app_context():
        database_helper.init_db(DATABASE)


if __name__ == "__main__":
    print("views.py - __main__")
    init_database()
    # app.run(port=5004, debug=1)
    http_server = WSGIServer(('', 5004), app, handler_class=WebSocketHandler)
    http_server.serve_forever()