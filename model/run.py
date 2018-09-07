# run.py - serve API endpoint that fronts a pre-trained model (GAN/VAE combo)
# for generating descriptive music commentary
from app import app, vae, gan

# TODO: hardcoding
embed_size = 144

if __name__ == '__main__':
    vae.init()
    gan.init(embed_size)
    app.run()
