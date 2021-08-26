# Spotify Lyrics Player

## App Flow
The player will poll the Spotify server every 5 seconds to see if there is a change in the current song being played.
If so, it will get the song's name and artist, and use the web scraping library to go to azlyrics and get the latest lyrics for the song. 
It will then render those onto a webpage.


Have the webpage reload every 5 seconds, and check every time the '/' route loads it will get the song from the API

        var trackInfo = {
          previousTrackID: 0,
          currentTrackID: 0,

        }
        var userInfo = {
          name: "Default",
          imgURL: null
        }