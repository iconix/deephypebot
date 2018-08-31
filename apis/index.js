// index.js - launch API endpoints that communicate with Spotify, Google Sheets, and Twitter
var express = require('express');

var sheets = require('./sheets.js');
var spotify = require('./spotify.js');
var twitter = require('./twitter.js');

var app = express();
app.use(express.json());

// takes in a string query, returns associated genres
app.post('/get_genres', spotify.get_genres);

// takes in a tweet id, returns new tweets on bot's home timeline since (max 200)
app.post('/get_tweets', twitter.get_tweets);

app.get('/get_last_row', sheets.get_last_row);
app.post('/save_gen', sheets.save_gen);


port_num = process.env.PORT || 8888;
console.log(`Listening on ${port_num}`);
app.listen(port_num);
