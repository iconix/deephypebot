from flask import Flask, jsonify, request

from app import model

app = Flask(__name__)

@app.route('/generate', methods=['POST'])
def generate():
    genres = request.json['genres']
    num_sample = request.json['num_sample'] if 'num_sample' in request.json else 1

    gens, zs, conditions = model.gen(genres, num_sample)
    return jsonify({'gens': gens, 'zs': str(zs), 'conditions': conditions})

### App error handling

@app.errorhandler(400)
def handle_bad_request(error):
    response = jsonify({'error': str(error)})
    return response, 400

@app.errorhandler(500)
def handle_internal_server(error):
    response = jsonify({'error': str(error)})
    return response, 500
