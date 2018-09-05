## Motivation

[@deephypebot](https://twitter.com/deephypebot) is a music commentary generator. It is essentially a _language model_, trained on past human music writing from the web and conditioned on attributes of the referenced music. There is an additional training step that attempts to encourage a certain type of descriptive, almost flowery writing commonly found in this genre.

Our goal is to teach this language model to generate consistently good and entertaining new writing about songs.

## Project Achievements

- Functional, documented pipeline code
- Inference through trained LC-GAN + VAE architecture
- A technical white paper (_coming soon_)

## Components

A detailed breakdown of the project architecture can be found at [**proposal.md**](https://github.com/iconix/deephypebot/blob/master/proposal.md).

## Future Work

Here are things I didn't get to - but would love to if I get the chance!

- [ ] A second worker agent to automatically post human-approved retweets to bot account
- [ ] A Docker-ized pipeline
- [ ] Enable @ tweets of the bot to trigger on-demand samples
- [ ] Try out conditioning VAE on audio features instead of genre
- [ ] Try out sentiment from deepmoji as an automatic rewards functions for the LC-GAN
- [ ] Online learning with tweet likes
- [ ] Further data source diversity (e.g, from Tumblr, SoundCloud comments, etc.)
- [ ] Use a VAE pretrained on Wikipedia or some other large, relevant corpus (if possible?)
