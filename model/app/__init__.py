from flask import Flask, jsonify, request

from app import model

app = Flask(__name__)

@app.route('/generate', methods=['POST'])
def generate():
    gens, zs, conditions = model.gen(request.json['genres'])
    return jsonify({'gens': str(gens), 'zs': str(zs), 'conditions': str(conditions)})

### App error handling

@app.errorhandler(400)
def handle_bad_request(error):
    response = jsonify({'error': str(error)})
    return response, 400

@app.errorhandler(500)
def handle_internal_server(error):
    response = jsonify({'error': str(error)})
    return response, 500
