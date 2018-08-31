import torch
import torch.nn as nn

from app import vae
from pytorchtextvae.datasets import EOS_token
from pytorchtextvae import model

# TODO: hardcoding
max_gen = 50
n_hidden = 1024
temp = 0.2

device = torch.device('cpu') # CPU inference

class LCGAN_G(nn.Module):
    '''Generator'''
    def __init__(self, n_embed, n_hidden=n_hidden):
        super(LCGAN_G, self).__init__()
        self.n_embed = n_embed

        self.i2h = nn.Linear(n_embed, n_hidden)
        self.h2h = nn.Linear(n_hidden, n_hidden)
        # hidden-to-gating mechanism
        self.h2g = nn.Linear(n_hidden, 2*n_embed)

        self.relu = nn.ReLU()
        self.sigmoid = nn.Sigmoid()

    def forward(self, emb):
        x = emb
        x = self.relu(self.i2h(x))
        x = self.relu(self.h2h(x))
        x = self.relu(self.h2h(x))
        x = self.h2g(x)

        # gating mechanism: allow network to remember/forget
        # what it wants to about the original emb(edding) and x
        emb_mid = x[:, self.n_embed:]
        gates = self.sigmoid(x[:, :self.n_embed])
        demb = gates * emb_mid # TODO: why naming?
        emb_prime = (1 - gates)*emb + demb

        return emb_prime

def to_embed(vae_model, z, condition):
    if condition.dim() == 1:
        condition = condition.unsqueeze(0)
    squashed_condition = vae_model.decoder.c2h(condition)
    return torch.cat([z, squashed_condition], 1)

def gan_generate(ganG, condition, max_gen=max_gen, temp=temp, max_sample=False, trunc_sample=True):
    with torch.no_grad():
        ganG.eval()
        z = torch.randn(1, z_size).to(device)
        decode_embed = to_embed(vae_model, z, condition).to(device)
        z_prime = ganG(decode_embed)

        generated = vae_model.decoder.generate_with_embed(z_prime, max_gen, temp, device, max_sample=max_sample, trunc_sample=trunc_sample)
        generated_str = model.float_word_tensor_to_string(output_side, generated)

        EOS_str = f' {output_side.index_to_word(torch.LongTensor([EOS_token]))} '

        if generated_str.endswith(EOS_str):
            generated_str = generated_str[:-5]

        # flip it back
        return generated_str[::-1], z, z_prime

def init(embed_size):
    # load GAN generator
    global ganG, vae_model, output_side, dataset, z_size
    ganG = LCGAN_G(embed_size).to(device)
    ganG.load_state_dict(torch.load('ganG_state.pt'))

    vae_model, output_side, dataset, z_size = vae.get_gan_reqs()

def generate(genres, n_sample, max_gen=max_gen, temp=temp):
    genre_tensor = torch.FloatTensor(dataset.encode_genres(genres))

    res = []
    for i in range(n_sample):
        res.append(gan_generate(ganG, genre_tensor, max_gen, temp)[0])

    return res
