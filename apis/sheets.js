var GoogleSpreadsheet = require('google-spreadsheet');
var async = require('async');

// spreadsheet key is the long id in the sheets URL
var doc = new GoogleSpreadsheet(process.env.DEEPHYPEBOT_SHEETS_ID);
sheet_title = 'gens';
var sheet;

var get_last_row = (req, res) => {
  async.series([
    set_auth,
    get_worksheet,
    read_last_row
  ], (err, results) => {
      if (err) {
        res.status(500).send(`error: ${err}`);
      } else {
        results = results.reduce((acc, val) => acc.concat(val), []).filter(Boolean);
        res.send(results[0]);
      }
  });
}

var save_gen = (req, res) => {
  if (!req || !req.body) {
    return res.status(400).send('Request body required');
  }

  var gen_key = 'gen';
  gen = req.body[gen_key];
  if (gen == undefined) {
    return res.status(400).send(`Request JSON must contain "${gen_key}" as a key`);
  }

  var query_key = 'q';
  query = req.body[query_key];
  if (query == undefined) {
    return res.status(400).send(`Request JSON must contain "${query_key}" as a key`);
  }

  var genres_key = 'genres';
  genres = req.body[genres_key];
  if (genres == undefined) {
    return res.status(400).send(`Request JSON must contain "${genres_key}" as a key`);
  }

  var tweetid_key = 'tweet_id';
  tweet_id = req.body[tweetid_key];
  if (tweet_id == undefined) {
    return res.status(400).send(`Request JSON must contain "${tweetid_key}" as a key`);
  }

  var tweet_key = 'tweet';
  tweet = req.body[tweet_key];
  if (tweet == undefined) {
    return res.status(400).send(`Request JSON must contain "${tweet_key}" as a key`);
  }

  var source_key = 'source';
  source = req.body[source_key];
  if (source == undefined) {
    return res.status(400).send(`Request JSON must contain "${source_key}" as a key`);
  }

  return save_gen_to_sheet(res);
}

function save_gen_to_sheet(res) {
  async.series([
    set_auth,
    get_worksheet,
    write_row
  ], (err, results) => {
      if (err) {
        res.status(500).send(`error: ${err}`);
      } else {
        results = results.reduce((acc, val) => acc.concat(val), []).filter(Boolean);
        if (!results) {
          res.status(500).send(`no save`);
        } else {
          res.send(results);
        }
      }
  });
}

var set_auth = (step) => {
  var creds_json = {
    client_email: process.env.DEEPHYPEBOT_SHEETS_CLIENT_EMAIL,
    private_key: process.env.DEEPHYPEBOT_SHEETS_PRIVATE_KEY
  }

  doc.useServiceAccountAuth(creds_json, step);
}

var get_worksheet = (step) => {
  doc.getInfo((err, info) => {
    if (err) {
      step(err);
    }

    console.log(`loaded doc: '${info.title}' by ${info.author.email}`);

    for (var ws of info.worksheets) {
      if (ws.title == sheet_title) {
        sheet = ws;
        break;
      }
    }

    console.log(`found sheet '${sheet.title}' ${sheet.rowCount} x ${sheet.colCount}`);
    step(null);
  });
}

var read_last_row = (step) => {
  // google provides some query options
  sheet.getRows({
    offset: 1
  }, (err, rows) => {
    if (err) {
      step(true, err);
    }

    console.log(`read ${rows.length} rows`);

    step(null, rows[rows.length - 1]);
  });
}

var write_row = (step) => {
  sheet.addRow({
    date: new Date().toUTCString(),
    spotifyquery: query,
    spotifygenres: genres,
    commentary: gen,
    tweetid: tweet_id,
    tweet: tweet,
    source: source
  }, step);
}

module.exports = { get_last_row: get_last_row, save_gen: save_gen };
