from flask import Flask, render_template, jsonify, make_response, request, abort
from firebase import firebase
from jose import jwt

app = Flask(__name__)

firebase = firebase.FirebaseApplication('https://jwt-multitenancy.firebaseio.com/', None)
''' Firebase database:
{
  "users" : [ {
    "id" : "id-1",
    "username" : "user1"
  }, {
    "id" : "id-2",
    "username" : "user2"
  } ]
}
'''
jwtsecret = "the-secret"

@app.route('/app', defaults={'path': ''})
@app.route('/app/<path:path>')
def index(path):
    return render_template('index.html')


@app.route('/app/switch/<username>')
def switcher(username):
    try:
        jwtguard = request.cookies.get("jwtguard", None)
        decoded_payload = jwt.decode(request.args.get("jwt", None), jwtsecret)
        if decoded_payload['principal'] != jwtguard:
            abort(403)
    except: # Signature failure
        abort(403)

    result = firebase.get('/users', None)
    users = filter(lambda x: x['username'] == username, result)
    if len(users) != 1:
        return make_response("Not Found", 404)
    decoded_payload['profile'] = users.pop()
    return render_template('switch.html', jwt=jwt.encode(decoded_payload, key=jwtsecret), decoded_payload=decoded_payload)


@app.route('/api/login/<username>')
def login(username):
    result = firebase.get('/users', None)
    users = filter(lambda x: x['username'] == username, result)
    if len(users) != 1:
        return make_response("Not Found", 404)
    user = users.pop()
    payload = {
        "principal": user['id'],
        "profile": user
    }
    response = jsonify({
        "jwt": jwt.encode(payload, jwtsecret)
    })
    response.set_cookie('jwtguard', value=str(user["id"])) # Which should be signed and secure
    return response

@app.route('/app/logout')
def logout():
    response = make_response(render_template("logout.html"))
    response.set_cookie("jwtguard", value=str(""))
    return response


@app.route('/api/profile')
def profile():
    try:
        jwtguard = request.cookies.get("jwtguard", None)
        decoded_payload = jwt.decode(request.headers['authentication'], jwtsecret)
        if decoded_payload['principal'] != jwtguard:
            abort(403)
    except:
        abort(403)

    return jsonify(decoded_payload['profile'])

if __name__ == '__main__':
    app.run(debug=True)
