var request = require('request');

num_gens = 5;

var generate = (genres, cb) => {
  var get_gen_opts = {
    uri: `${process.env.DEEPHYPEBOT_MODEL_BASEURL}/generate`,
    json: {
      'genres': genres,
      'num_sample': num_gens
    }
  };

  request.post(get_gen_opts, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      gens = body['gens'];

      gens.forEach((gen, i) => {
        // remove 1) UNKs, 2) consecutive duplicated words
        // TODO: replace artist and song_title ?
        // TODO: replace UNKs with artist and song_title at random ?
        gens[i] = gen.replace(/UNK/g, '').split(/\s+/).filter((value, i, arr) => { return value != arr[i+1]}).join(" ");
      });

      cb(false, JSON.stringify(gens));
    } else {
      if (!error) {
        error = body;
      }

      console.warn(`generations NOT received for '${JSON.stringify(genres)}': ${error}`);
      cb(false, undefined);
    }
  });
}

var get_genres = (q, cb) => {
  var get_spotify_opts = {
    uri: `${process.env.DEEPHYPEBOT_API_BASEURL}/get_genres`,
    json: {
      'q': q
    }
  };

  request.post(get_spotify_opts, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      genres = body;
      console.log(`genres for '${q}': ${genres}`);
      cb(false, genres);
    } else {
      if (!error) {
        error = body;
      }

      console.warn(`genres NOT received for '${q}': ${error}`);
      cb(false, undefined);
    }
  });
}

module.exports = { get_genres: get_genres, generate: generate };
