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

  var gen_key = 'gen';
  var gen = req.body[gen_key];
  if (gen == undefined) {
    return res.status(400).send(`Request JSON must contain "${gen_key}" as a key`);
  }

  var num_key = 'tweet_num';
  var num = req.body[num_key];
  if (num == undefined) {
    return res.status(400).send(`Request JSON must contain "${num_key}" as a key`);
  }

  return save_gen_to_sheet(res, num, gen);
}

// TODO: cache tweet list (although this code should all go away)
function get_tweet_from_sheet(res, num) {
  sheet_title = 'gens';
  col_name = 'tweet';

  async.series([
    set_auth,
    get_worksheet,
    read_column
  ], (err, results) => {
      if (err) {
        res.status(500).send(`error: ${err}`);
      } else {
        results = results.reduce((acc, val) => acc.concat(val), []).filter(Boolean);

        if (num >= results.length) {
          res.status(400).send(`tweet_num (${num}) must be less than num of tweets available (${results.length})`);
        } else {
          res.send(results[num]);
        }
      }
  });
}

function save_gen_to_sheet(res, num_param, gen_param) {
  sheet_title = 'gens';
  col_name = 'commentary';
  num = num_param;
  gen = gen_param;

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
          res.status(400).send(`tweet_num (${num}) must be less than num of tweets available (${results.length})`);
        } else {
          res.send(results[num]);
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

    rows[num][col_name] = gen;

    rows[num].save((err) => {
      if (err) {
        step(err);
      }
      else {
        console.log('saved!');
        step(null, rows[num][col_name]);
      }
    });
  });
}

module.exports = { get_tweet: get_tweet, save_gen: save_gen };
