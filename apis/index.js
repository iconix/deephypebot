// index.js - serve API endpoints that communicate with Spotify, Google Sheets, and Twitter
var express = require('express');

var sheets = require('./sheets.js');
var spotify = require('./spotify.js');
var twitter = require('./twitter.js');

var demo = require('./demo.js');

var app = express();
app.use(express.json());

app.get('/get_last_gen', sheets.get_last_gen);
app.post('/save_gen', sheets.save_gen);

app.post('/get_genres', spotify.get_genres);

app.post('/get_tweets', twitter.get_tweets);

app.post('/demo', demo.run);

port_num = process.env.PORT || 8888;
console.log(`Listening on ${port_num}`);
app.listen(port_num);
