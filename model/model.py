# model.py - launch a simple PyTorch model server with Flask

from flask import Flask, jsonify, request
import torch

from pytorchtextvae import generate # https://github.com/iconix/pytorch-text-vae

### Load my pre-trained PyTorch model from another package (TODO: slow)

print('Loading model')
DEVICE = torch.device('cpu') # CPU inference
# TODO: load model from Quilt
vae, input_side, output_side, pairs, dataset, Z_SIZE, random_state = generate.load_model('reviews_and_metadata_5yrs_state.pt', 'reviews_and_metadata_5yrs_stored_info.pkl', DEVICE, cache_path='.')
num_sample = 1

### Setup Flask app

app = Flask(__name__)

@app.route('/predict', methods=['POST'])
def predict():
    gens, zs, conditions = generate.generate(vae, input_side, output_side, pairs, dataset, Z_SIZE, random_state, DEVICE, genres=request.json['genres'], num_sample=1)
    return jsonify({'gens': str(gens), 'zs': str(zs), 'conditions': str(dataset.decode_genres(conditions[0]))})

### App error handling

@app.errorhandler(400)
def handle_bad_request(error):
    response = jsonify({'error': str(error)})
    return response, 400

@app.errorhandler(500)
def handle_internal_server(error):
    response = jsonify({'error': str(error)})
    return response, 500

### Run app

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=4444)
