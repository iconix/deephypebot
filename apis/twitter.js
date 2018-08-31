var Twit = require('twit');

var MAX_COUNT = 200;
var TIMEOUT_MS = 60*1000; // 60s

var bot = new Twit({
    consumer_key: process.env.DEEPHYPEBOT_TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.DEEPHYPEBOT_TWITTER_CONSUMER_SECRET,
    access_token: process.env.DEEPHYPEBOT_TWITTER_ACCESS_TOKEN,
    access_token_secret: process.env.DEEPHYPEBOT_TWITTER_ACCESS_TOKEN_SECRET,
    timeout_ms: TIMEOUT_MS
});

var get_tweets = (req, res) => {
    if (!req || !req.body) {
      return res.status(400).send('Request body required');
    }

    var key = 'tweet_id';
    var tweet_id = req.body[key];

    return get_bot_timeline(res, tweet_id);
}

function get_bot_timeline(res, since_id = undefined) {
    console.log(`get bot timeline since ${since_id}`);
    bot.get('statuses/home_timeline', {count: MAX_COUNT, tweet_mode: 'extended', since_id: since_id}, function(err, data){
        if (err) {
            return res.status(500).send(err);
        } else {
            tweets = [];
            data.forEach((d) => {
                tweets.push({
                    'full_text': d.full_text,
                    'id_str': d.id_str,
                    'source': d.user.screen_name
                });
            });

            // reverse to get in true chronological order
            return res.send(tweets.reverse());
        }
    });
}

module.exports = { get_tweets: get_tweets };
