# Spotify Lyrics Player

## Description
The player will poll the Spotify server every 5 seconds to see if there is a change in the current song being played.
If so, it will get the song's name and artist, and use the web scraping library to go to azlyrics and get the latest lyrics for the song. It will also go to Ultimate-Guitar and get the highest rated tab for that particular song, preferring the Chords version.
It will then render those onto a webpage.

