var request = require('request');
var async = require('async');

var num_gens = 5;

var get_last_gen = (step) => {
  var get_last_gen_opts = {
    uri: `${process.env.DEEPHYPEBOT_API_BASEURL}/get_last_row`
  };

  request.get(get_last_gen_opts, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      try {
        tweet_id = JSON.parse(body).tweetid;
        step();
      } catch (err) {
        step(true, err);
      }
    } else {
      if (!error) {
        error = body;
      }
      step(true, error);
    }
  });
}

var process_tweet = (tweet, cb) => {
  // parse song title + artist

  // TODO: second regex with optional non-capturing group can miss artists
  const regex = /["'](.*)["'] by ([^ http]*)|(?:.*, )?(.*)'s ["'](.*)["']/gm;
  r = regex.exec(tweet.full_text);
  if (!r) {
    console.log(`tweet not parseable: ${JSON.stringify(tweet)}`);
    cb(false, undefined);
    return;
  } else if (r[1]) { // "title" by artist
    q = `${r[1]} ${r[2].replace(/ and /g, ' ')}`;
  } else if (r[3]) { // artist's "title"
    q = `${r[3].replace(/ and /g, ' ')} ${r[4]}`;
  } // TODO: else?? this could be better

  cb(false, q);
}

var get_tweets = (step) => {
  var get_tweet_opts = {
    uri: `${process.env.DEEPHYPEBOT_API_BASEURL}/get_tweets`,
    json: {
      'tweet_id': tweet_id
    }
  };

  request.post(get_tweet_opts, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      agg_results = [];
      body.forEach(t => agg_results.push({'tweet': t}));

      async.map(body, process_tweet, function(err, results) {
        if (err) {
          step(true, err);
        } else {
          results.forEach((q, i) => {
            agg_results[i]['q'] = q;
          });

          agg_results = agg_results.filter(r => r.q);

          tweets = [];
          agg_results.forEach(r => tweets.push(r.tweet));

          qs = [];
          agg_results.forEach(r => qs.push(r.q));

          step();
        }
      });
    } else {
      if (!error) {
        error = body;
      }
      step(true, error);
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
      cb(true, error);
    }
  });
}

var get_genres_list = (step) => {
  async.map(qs, get_genres, function(err, results) {
    if (err) {
      step(true, err);
    } else {
      genres_list = results;

      genres_list.forEach((r, i) => {
        agg_results[i]['genres'] = r;
      });

      step();
    }
  });
}

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
        gens[i] = gen.replace(/UNK/g, '').split(/\s+/).filter((value, i, arr) => { return value != arr[i+1]}).join(" ");
      });

      cb(false, JSON.stringify(gens));
    } else {
      if (!error) {
        error = body;
      }
      cb(true, error);
    }
  });
}

var generate_multi = (step) => {
  async.mapSeries(genres_list, generate, function(err, results) {
    if (err) {
      step(true, err);
    } else {
      gens = results;

      gens.forEach((r, i) => {
        agg_results[i]['gen'] = r;
      });

      step();
    }
  });
}

var save_gen = (res, cb) => {
  var get_save_opts = {
    uri: `${process.env.DEEPHYPEBOT_API_BASEURL}/save_gen`,
    json: {
      'gen': res.gen,
      'q': res.q,
      'genres': res.genres,
      'tweet_id': res.tweet.id_str,
      'tweet': res.tweet.full_text,
      'source': res.tweet.source
    }
  };

  request.post(get_save_opts, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      cb();
    } else {
      if (!error) {
        error = body;
      }
      cb(true, error);
    }
  });
}

var save_gens = (step) => {
  async.mapSeries(agg_results, save_gen, function(err, results) {
    if (err) {
      step(true, err);
    } else {
      step();
    }
  });
}

function loop(){
  async.series([
    get_last_gen,
    get_tweets,
    get_genres_list,
    generate_multi,
    save_gens
  ], (err, res) => {
    if (err) {
      console.log(`error ${res}`);
    } else {
      if (gens.length) {
        console.log(`saved [${gens}]`);
      } else {
        console.log('no new tweets found');
      }
    }
  });
}

loop();
setInterval(function(){
  loop();
}, 60*1000);