# vae.py - launch a simple PyTorch model server with Flask

import torch

from pytorchtextvae import generate # https://github.com/iconix/pytorch-text-vae

def init():
    ### Load my pre-trained PyTorch model from another package (TODO: slow)
    print('Loading model')
    global device, vae, input_side, output_side, pairs, dataset, z_size, random_state
    device = torch.device('cpu') # CPU inference
    # TODO: load model from Quilt
    vae, input_side, output_side, pairs, dataset, z_size, random_state = generate.load_model('reviews_and_metadata_5yrs_state.pt', 'reviews_and_metadata_5yrs_stored_info.pkl', device, cache_path='.')

def get_gan_reqs():
    return vae, output_side, dataset, z_size

# not used anymore
def gen(genres, num_sample=1):
    gens, zs, conditions = generate.generate(vae, input_side, output_side, pairs, dataset, z_size, random_state, device, genres=genres, num_sample=num_sample)

    conditions = dataset.decode_genres(conditions[0])

    return gens, zs, conditions
