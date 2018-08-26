var request = require('request');
var async = require('async');

var gen;
var genres;
var q;

var get_tweet = (step) => {
  // grab tweet
  tweet_num = 2

  var get_tweet_opts = {
    uri: 'http://localhost:8888/get_tweet',
    json: {
      'tweet_num': tweet_num
    }
  };

  request.post(get_tweet_opts, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      tweet = body;

      // parse song title + artist
      const regex = /\"(.*)\" by ([^ http]*)|(.*)'s \"(.*)\"/gm;
      res = regex.exec(tweet);
      if (res[1]) {
        q = `${res[1]} ${res[2]}`;
      } else if (res[3]) {
        q = `${res[3]} ${res[4]}`;
      } // TODO: else?? this could be better
      step();
    } else {
      step(error);
    }
  });
}

var get_genres = (step) => {
  var get_spotify_opts = {
    uri: 'http://localhost:8888/get_genres',
    json: {
      'q': q
    }
  };

  request.post(get_spotify_opts, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      genres = body;
      step();
    } else {
      step(error);
    }
  });
}

var generate = (step) => {
  var get_gen_opts = {
    uri: 'http://localhost:4444/predict',
    json: {
      'genres': genres
    }
  };

  request.post(get_gen_opts, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      gen = JSON.stringify(JSON.parse(body['gens'].replace(/'/g, '"'))[0]);
      step();
    } else {
      step(error);
    }
  });
}

var save_gen = (step) => {
  var get_save_opts = {
    uri: 'http://localhost:8888/save_gen',
    json: {
      'tweet_num': tweet_num,
      'gen': gen
    }
  };

  request.post(get_save_opts, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      step();
    } else {
      step(error);
    }
  });
}

function loop(){
  async.series([
    get_tweet,
    get_genres,
    generate,
    save_gen
  ], (err) => {
    if (err) {
      console.log(`error ${err}`)
    } else {
      console.log(`saved ${gen}`);
    }
  });
}

setInterval(function(){
  loop();
}, 60*1000);