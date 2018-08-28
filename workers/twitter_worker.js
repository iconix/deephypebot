var request = require('request');
var async = require('async');

var gen;
var genres;
var q;

var get_tweet = (step) => {
  tweet_num = -1;

  if (tweet_num < 0) { // random tweet mode
    tweet_num = Math.floor(Math.random() * 5);
    console.log(`random tweet #${tweet_num}`);
  }

  var get_tweet_opts = {
    uri: `${process.env.DEEPHYPEBOT_API_BASEURL}/get_tweet`,
    json: {
      'tweet_num': tweet_num
    }
  };

  request.post(get_tweet_opts, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      tweet = body;

      // parse song title + artist
      // TODO: second regex with optional non-capturing group can miss artists
      const regex = /\"(.*)\" by ([^ http]*)|(?:.*, )?(.*)'s \"(.*)\"/gm;
      res = regex.exec(tweet);
      if (!res) {
        step(`tweet not parseable: ${tweet}`)
        return;
      } else if (res[1]) { // "title" by artist
        q = `${res[1]} ${res[2].replace(/ and /g, ' ')}`;
      } else if (res[3]) { // artist's "title"
        q = `${res[3].replace(/ and /g, ' ')} ${res[4]}`;
      } // TODO: else?? this could be better

      step();
    } else {
      if (!error) {
        error = body;
      }
      step(true, error);
    }
  });
}

var get_genres = (step) => {
  var get_spotify_opts = {
    uri: `${process.env.DEEPHYPEBOT_API_BASEURL}/get_genres`,
    json: {
      'q': q
    }
  };

  request.post(get_spotify_opts, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      genres = body;
      step();
    } else {
      if (!error) {
        error = body;
      }
      step(true, error);
    }
  });
}

var generate = (step) => {
  var get_gen_opts = {
    uri: `${process.env.DEEPHYPEBOT_MODEL_BASEURL}/generate`,
    json: {
      'genres': genres
    }
  };

  request.post(get_gen_opts, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      gen = JSON.stringify(JSON.parse(body['gens'].replace(/'/g, '"'))[0]);

      // remove UNKs
      gen = gen.replace(/ UNK /g, ' ');

      step();
    } else {
      if (!error) {
        error = body;
      }
      step(true, error);
    }
  });
}

var save_gen = (step) => {
  var get_save_opts = {
    uri: `${process.env.DEEPHYPEBOT_API_BASEURL}/save_gen`,
    json: {
      'tweet_num': tweet_num,
      'gen': gen,
      'q': q,
      'genres': genres
    }
  };

  request.post(get_save_opts, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      step();
    } else {
      if (!error) {
        error = body;
      }
      step(true, error);
    }
  });
}

function loop(){
  async.series([
    get_tweet,
    get_genres,
    generate,
    save_gen
  ], (err, res) => {
    if (err) {
      console.log(`${res}`);
    } else {
      console.log(`saved ${gen}`);
    }
  });
}

setInterval(function(){
  loop();
}, 60*1000);