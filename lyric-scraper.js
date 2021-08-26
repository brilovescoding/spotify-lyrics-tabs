//Borrowed from https://github.com/larryamiel/node_lyrics_scraper/

const request = require('request');
const cheerio = require('cheerio');
const qs = require('querystring');
const h2p = require('html2plaintext')

const baseURL = 'http://search.azlyrics.com'

function getLyricsUrlFromQuery(query){
    let url = baseURL + '/search.php?q=' + qs.escape(query);
    console.log("The search query URL is " + url)
    return new Promise((resolve, reject) => {
        request.get(url, function (err, res, body) {
            if (err) {
                return reject(err)
            }
            $ = cheerio.load(body);
            lyricsURL = $('td.text-left a').attr('href');
            console.log("the query gave this URL: " + lyricsURL)
            return resolve(lyricsURL)
        })
    })
}

function getLyricsFromUrl(url){

    console.log('Getting lyrics from: ', url);
    return new Promise((resolve, reject) => {
        request.get(url, function(err, res, body){
          if (err) {
              return reject(err)
          }
          $ = cheerio.load(body);
          $('div:not([class])').each(function(){
            var lyrics = $(this).html(); 
            if(lyrics != ''){
                return resolve(lyrics)
            }
        });
        })
    })
}

module.exports = {getLyricsUrlFromQuery, getLyricsFromUrl}
