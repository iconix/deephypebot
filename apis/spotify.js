var spotify_web_api = require('spotify-web-api-node');

var client_id = process.env.DEEPHYPEBOT_SPOTIFY_CLIENT_ID,
client_secret = process.env.DEEPHYPEBOT_SPOTIFY_CLIENT_SECRET;

// create the api object with the credentials
var spotify_api = new spotify_web_api({
  clientId: client_id,
  clientSecret: client_secret
});

var expiry_date;

/*
* takes in a string query containing song title and artists, returns list of associated genres
*/
var get_genres = (req, res) => {
  if (!req || !req.body) {
    return res.status(400).send('Request body required');
  }

  var key = 'q';
  var q = req.body[key];
  if (q == undefined) {
    return res.status(400).send(`Request JSON must contain "${key}" as a key`);
  }

  var now = new Date();

  if (spotify_api.getAccessToken() && expiry_date > now) {
    get_genres_by_query(q).then((search_res) => {
      res.send(search_res);
    }, (err) => {
      res.status(500).send(`error: ${err}`);
    });
  } else {
    // retrieve an access token
    spotify_api.clientCredentialsGrant().then((data) => {
      expiry_date = new Date(now.getTime() + data.body['expires_in'] * 1000);

      console.log(`The access token expires at ${expiry_date}`);
      console.log(`The access token is ${data.body['access_token']}`);

      // save the access token so that it's used in future calls
      spotify_api.setAccessToken(data.body['access_token']);

      get_genres_by_query(q).then((search_res) => {
        res.send(search_res);
      }, (err) => {
        res.status(500).send(`error: ${err}`);
      });
    },
    (err) => {
      res.status(500).send(`Something went wrong when retrieving an access token: ${err}`);
    });
  }
}

// helper functions below

// search tracks whose name, album or artist contains the query
function get_genres_by_query(query) {
  console.log(`query: ${query}`);
  return spotify_api.searchTracks(query).then((data) => {
    if (data.body) {
      var track = data.body['tracks']['items'][0]; // TODO: always getting the first track result, maybe use popularity?
      var artist_ids = []
      for (var artist of track['artists']) {
        artist_ids.push(artist['id']);
      }

      // get multiple artists
      return spotify_api.getArtists(artist_ids).then((data) => {
        var genres = []
        for (var artist of data.body['artists']) {
          genres.push(...artist['genres'])
        }

        // unique genre list
        genres = [...new Set(genres)];

        return Promise.resolve(genres);
      }, (err) => {
        return Promise.reject(err);
      });
    }
  }, (err) => {
    return Promise.reject(err);
  });
}

module.exports = { get_genres: get_genres };
