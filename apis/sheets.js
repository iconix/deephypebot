var GoogleSpreadsheet = require('google-spreadsheet');
var async = require('async');

// spreadsheet key is the long id in the sheets URL
var doc = new GoogleSpreadsheet(process.env.DEEPHYPEBOT_SHEETS_ID);
var sheet;

var get_tweet = (req, res) => {
  if (!req || !req.body) {
    return res.status(400).send('Request body required');
  }

  var key = 'tweet_num';
  var tweet_num = req.body[key];
  if (tweet_num == undefined) {
    return res.status(400).send(`Request JSON must contain "${key}" as a key`);
  }

  return get_tweet_from_sheet(res, tweet_num);
}

var save_gen = (req, res) => {
  if (!req || !req.body) {
    return res.status(400).send('Request body required');
  }

  var num_key = 'tweet_num';
  var tweet_num = req.body[num_key];
  if (tweet_num == undefined) {
    return res.status(400).send(`Request JSON must contain "${num_key}" as a key`);
  }

  var gen_key = 'gen';
  var gen = req.body[gen_key];
  if (gen == undefined) {
    return res.status(400).send(`Request JSON must contain "${gen_key}" as a key`);
  }

  var query_key = 'q';
  var query = req.body[query_key];
  if (query == undefined) {
    return res.status(400).send(`Request JSON must contain "${query_key}" as a key`);
  }

  var genres_key = 'genres';
  var genres = req.body[genres_key];
  if (genres == undefined) {
    return res.status(400).send(`Request JSON must contain "${genres_key}" as a key`);
  }

  var source_key = 'source';
  // TODO: source

  return save_gen_to_sheet(res, tweet_num, gen, query, genres);
}

// TODO: cache tweet list (although this code should all go away)
function get_tweet_from_sheet(res, num_param) {
  sheet_title = 'gens';
  col_name = 'tweet';

  tweet_num = num_param;

  async.series([
    set_auth,
    get_worksheet,
    read_column
  ], (err, results) => {
      if (err) {
        res.status(500).send(`error: ${err}`);
      } else {
        results = results.reduce((acc, val) => acc.concat(val), []).filter(Boolean);

        if (tweet_num >= results.length) {
          res.status(400).send(`tweet_num (${tweet_num}) must be less than num of tweets available (${results.length})`);
        } else {
          res.send(results[tweet_num]);
        }
      }
  });
}

function save_gen_to_sheet(res, num_param, gen_param, query_param, genres_param) {
  sheet_title = 'gens';
  date_col_name = 'date';
  gen_col_name = 'commentary';
  query_col_name = 'spotifyquery';
  genres_col_name = 'spotifygenres';

  tweet_num = num_param;
  gen = gen_param;
  query = query_param;
  genres = genres_param;

  async.series([
    set_auth,
    get_worksheet,
    write_column
  ], (err, results) => {
      if (err) {
        res.status(500).send(`error: ${err}`);
      } else {
        results = results.reduce((acc, val) => acc.concat(val), []).filter(Boolean);

        if (!results) {
          res.status(400).send(`tweet_num (${tweet_num}) must be less than num of tweets available (${results.length})`);
        } else {
          res.send(results[tweet_num]);
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

var read_column = (step) => {
  // google provides some query options
  sheet.getRows({
    offset: 1
  }, (err, rows) => {
    if (err) {
      step(err);
    }

    console.log(`read ${rows.length} rows`);

    var vals = [];

    rows.forEach(row => {
      vals.push(row[col_name]);
    });

    step(null, vals);
  });
}

var write_column = (step) => {
  // google provides some query options
  sheet.getRows({
    offset: 1
  }, (err, rows) => {
    if (err) {
      step(err);
    }

    console.log(`read ${rows.length} rows`);

    rows[tweet_num][date_col_name] = new Date().toUTCString();
    rows[tweet_num][gen_col_name] = gen;
    rows[tweet_num][query_col_name] = query;
    rows[tweet_num][genres_col_name] = genres;

    rows[tweet_num].save((err) => {
      if (err) {
        step(err);
      }
      else {
        var msg = `#${tweet_num} '${rows[tweet_num][query_col_name]}' generated: ${rows[tweet_num][gen_col_name]}`;
        console.log(`saved! ${msg}`);
        step(null, msg);
      }
    });
  });
}

module.exports = { get_tweet: get_tweet, save_gen: save_gen };
