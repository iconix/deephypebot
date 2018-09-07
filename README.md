## Motivation

[@deephypebot](https://twitter.com/deephypebot) is a music commentary generator. It is essentially a _language model_, trained on past human music writing from the web and conditioned on attributes of the referenced music. There is an additional training step that attempts to encourage a certain type of descriptive, almost flowery writing commonly found in this genre.

Our goal is to teach this language model to generate consistently good and entertaining new writing about songs.

## Project Achievements

- Functional, documented pipeline code
- Model inference through trained LC-GAN + VAE deep learning architecture
- A technical white paper (_coming soon_)

## Architecture

![Software architecture](deephypebot_software.svg)

### Training data

My training data consists of ~20,000 blog posts with writing about individual songs. The count started at about 80K post links from 5 years of popular songs on the music blog aggregator [Hype Machine](https://hypem.com/) - then I filtered for English, non-aggregated (i.e., excluding "round up"-style posts about multiple songs) posts about songs that can be found on Spotify. There was some additional attrition due to many post links no longer existing. I did some additional manual cleanup of symbols, markdown, and writing that I deemed _non_-commentary.

From there, I split the commentary into ~104,500 sentences, which are a good length for a _variational autoencoder_ (VAE) model to encode.

### Neural network

A _language model_ (LM) is an approach to generating text by estimating the probability distribution over sequences of linguistic units (characters, words, sentences). This project centers around a _sequence-to-sequence conditional variational autoencoder_ ([seq2seq CVAE](https://iconix.github.io/dl/2018/06/29/energy-and-vae#seq2seq-vae-for-text-generation)) model that generates text conditioned on a thought vector `z` + attributes of the referenced music `a` (simply concatenated together as `cat(z, a)`). The conditioned embedding fed into the CVAE is provided by an additional _latent constraints generative adversarial network_ ([LC-GAN](https://iconix.github.io/dl/2018/07/28/lcgan)) model that helps control aspects of the text generated.

The CVAE consists of an LSTM-based encoder and decoder, and once trained, the decoder can be used independently as a language model conditioned on latent space `cat(z, a)` (more on seq2seq VAEs [here](https://iconix.github.io/dl/2018/06/29/energy-and-vae#seq2seq-vae-for-text-generation)). The musical attributes info conditions only the VAE decoder.

![seq2seq text VAE architecture](seq2seq_vae_text.png)
<small>An *un*conditioned seq2seq text VAE. Replace `z` with `cat(z, a)` for a CVAE. Figure taken from Bowman et al., 2016. [_Generating Sentences from a Continuous Space_](https://arxiv.org/abs/1511.06349).</small>

The LC-GAN is used to determine which conditioned embeddings `cat(z, a)` to this LM tend to generate samples with particular attributes (more on the LC-GAN [here](https://iconix.github.io/dl/2018/07/28/lcgan)). This project uses LDA topic modeling as its automatic reward function for encouraging samples of a descriptive, almost flowery style (more on LDA topic modeling [here](https://iconix.github.io/dl/2018/08/24/project-notes-2)). The LDA topic distribution for the sentence associated with the `cat(z, a)` input provides the label `v`. The generator is trained to fool the discriminator with "fake" (e.g., not from training data) samples, ostensibly from the desired topic distribution. Once trained, the generator can be used independently to provide these conditioned embeddings to the CVAE for inference.

![LC-GAN architecture](LC-GAN_conditioned.svg)
<small>LC-GAN architecture.</small>

The CVAE code used for this project is available here: **<https://github.com/iconix/pytorch-text-vae>**.

The LC-GAN code used for this project is available here: **<https://github.com/iconix/openai/blob/master/nbs/lcgan.ipynb>**.

### Making inference requests to the network

Once the neural network is trained and deployed, this project uses it to generate new writing conditioned on [genre](https://developer.spotify.com/documentation/web-api/reference/artists/get-artist/) information pulled from the Spotify API.

This requires detecting the song and artist discussed in tweets that show up on [@deephypebot](http://twitter.com/deephypebot)'s timeline and then sending this information to Spotify. Then Spotify's response is sent to the neural network.

### From samples to tweets

Text generation is [a notoriously messy affair](https://iconix.github.io/dl/2018/06/20/arxiv-song-titles#text-generation-is-a-messy-affair) where "you will not get quality generated text 100% of the time, even with a heavily-trained neural network." While much effort will be put into having as automated and clean a pipeline as possible, some human supervision is prudent.

Once multiple generations for a new proposed tweet are available, they are added to a spreadsheet where the human curator (me) can select which samples are released to [@deephypebot](http://twitter.com/deephypebot) for tweeting.

**TODO**: samples

Check out <a class="twitter-timeline" href="https://twitter.com/deephypebot?ref_src=twsrc%5Etfw">tweets by @deephypebot</a> for more!

## Resources

**Software…**
- [PyTorch](https://pytorch.org/) for deep learning
- [Quilt](https://quiltdata.com/) for versioning and deploying data
- [Conda](https://conda.io/docs/) and [npm](https://www.npmjs.com/) for package and environment management in Python and JavaScript
- [Flask](http://flask.pocoo.org/) for a lightweight Python web (model) server
- [Express.js](https://expressjs.com/) for a lightweight Node.js web (API) server
- [Twit](https://github.com/ttezel/twit) for Node.js Twitter API access
- [Spotify Web API Node](https://github.com/thelinmichael/spotify-web-api-node) for Node.js Spotify Web API access
- [Node Google Spreadsheet](https://github.com/theoephraim/node-google-spreadsheet) for Node.js Google Sheets API access

## Future Work

Here are some ideas that I didn't quite get to but would love to in the future!

- [ ] A second worker agent to automatically post human-approved retweets to bot account
- [ ] A Docker-ized pipeline
- [ ] Enable @ tweets of the bot to trigger on-demand samples
- [ ] Try out conditioning VAE on audio features instead of genre
- [ ] Try out sentiment from deepmoji as an automatic rewards functions for the LC-GAN
- [ ] Online learning with tweet likes
- [ ] Further data source diversity (e.g, from Tumblr, SoundCloud comments, etc.)
- [ ] Try out a VAE pre-trained on Wikipedia or some other large, relevant corpus
