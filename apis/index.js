// index.js - launch API endpoints that communicate with Spotify, Google Sheets, and Twitter
var express = require('express');

var spotify = require('./spotify.js');
var sheets = require('./sheets.js');

var app = express();
app.use(express.json());

// takes in a string query, returns associated genres
app.post('/get_genres', spotify.get_genres);

// takes in a tweet num, returns tweet at that index in Google Sheets
// TODO: replace with getting tweets from Twitter
app.post('/get_tweet', sheets.get_tweet);
// TODO: batching - /save_gens
app.post('/save_gen', sheets.save_gen);


port_num = 8888;
console.log(`Listening on ${port_num}`);
app.listen(process.env.PORT || port_num);
