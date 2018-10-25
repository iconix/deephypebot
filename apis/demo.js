var async = require('async');

var t_utils = require('../workers/twitter_utils.js');

/*
* TODO:
*/
var run = (req, res) => {
    if (!req || !req.body) {
      return res.status(400).send('Request body required');
    }

    var key = 'q';
    var q = req.body[key];
    if (q == undefined) {
      return res.status(400).send(`Request JSON must contain "${key}" as a key`);
    }

    t_utils.get_genres(q, (err, genre_res) => {
      if (err) {
        genre_res.status(500).send(`get_genres error ${err}`);
      } else if (genre_res) {
        t_utils.generate(genre_res, (err, gen_res) => {
          if (err) {
            res.status(500).send(`generate error ${err}`);
          } else {
            res_dict = {'samples': JSON.parse(gen_res), 'genres': genre_res, 'query': q};
            console.log(res_dict);
            res.send(res_dict);
          }
        });
      } else {
        res.status(200).send(`Sorry, no genres found on Spotify for "${q}"`);
      }
    });
}

module.exports = { run: run };
