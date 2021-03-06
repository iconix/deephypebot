// twitter.js - trigger Twitter-monitoring workflow on a regular schedule
var request = require('request');
var async = require('async');

var utils = require('./twitter_utils.js');

var num_gens = 5;

var get_last_gen = (step) => {
  var get_last_gen_opts = {
    uri: `${process.env.DEEPHYPEBOT_API_BASEURL}/get_last_gen`
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

/*
* parse song title + artist
*/
var process_tweet = (tweet, cb) => {
  // TODO: second regex with optional non-capturing group can miss artists
  // TODO: use user mention screen names
  // TODO: remove 'feat.' in addition to the 'and'
  const regex = /["'](.*)["'] by ([^ http]*)|(?:.*, )?(.*)'s ["'](.*)["']/gm;
  r = regex.exec(tweet.full_text);
  if (!r) {
    console.warn(`tweet not parseable: ${JSON.stringify(tweet)}`);
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
      // TODO: ignore deephypebot tweets
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

var get_genres_list = (step) => {
  async.map(qs, utils.get_genres, function(err, results) {
    if (err) {
      step(true, err);
    } else {
      results.forEach((g, i) => {
        agg_results[i]['genres'] = g;
      });

      agg_results = agg_results.filter(r => r.genres);

      genres_list = [];
      agg_results.forEach(r => genres_list.push(r.genres));

      step();
    }
  });
}

var generate_multi = (step) => {
  async.mapSeries(genres_list, utils.generate, function(err, results) {
    if (err) {
      step(true, err);
    } else {
      results.forEach((g, i) => {
        agg_results[i]['gen'] = g;
      });

      agg_results = agg_results.filter(r => r.gen);

      gens = [];
      agg_results.forEach(r => gens.push(r.gen));

      step();
    }
  });
}

var save_gen = (res, cb) => {
  // TODO: even if no new tweets found, save last tweet_id read somewhere
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

      console.warn(`save NOT successful for '${JSON.stringify(get_save_opts)}': ${error}`);
      cb(false, undefined);
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

// main processing/workflow loop -
schedule_seconds = 60

// TODO: temporarily backoff schedule if 'no new tweets found' is frequently occurring

loop_started = false
function loop(){
  if (!loop_started) {
    loop_started = true

    async.series([
      get_last_gen,
      get_tweets,
      get_genres_list,
      generate_multi,
      save_gens
    ], (err, res) => {
      if (err) {
        console.error(`error ${res}`);
      } else {
        if (gens.length) {
          console.log(`saved [${gens}]`);
        } else {
          console.warn('no new tweets found');
        }
      }
      loop_started = false
    });
  } else {
    console.warn('previous loop still running...');
  }
}

loop();
setInterval(function(){
  loop();
}, schedule_seconds*1000);
