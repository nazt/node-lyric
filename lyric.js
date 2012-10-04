#!/usr/bin/env node

var applescript = require("applescript")
var _ = require('lodash')
var url = require('url')
var async = require('async')
var keyword
var finder = require('lyric-finder')
var args = process.argv.slice(2)
  , argc = args.length
  , argv = require('optimist')
    .usage('Usage: $0 [keyword] [options]')
    .alias('c', 'clean')
    .alias('i', 'itunes')
    .alias('s', 'set')
    .alias('t', 'title')
    .describe('i', 'Get song name from itunes')
    .describe('c', 'Show only lyric')
    .describe('s', 'Set lyric of current song to itunes')
    .describe('t', 'Show song title')
    .check(function (argv) {
      if ( !argv.i && _.isEmpty(argv._)) {
        throw ''
      }
    }).argv


if (argv.i) {
  async.parallel([
      function(callback) {
        var song_name = 'tell application "iTunes" to name of current track as string'
        applescript.execString(song_name, function(err, rtn) {
          if (err) {
            callback(err, null)
          }
          else {
            callback(null, rtn)
          }
        })
      },
      function(callback) {
        var song_artist = 'tell application "iTunes" to artist of current track as string'
        applescript.execString(song_artist, function(err, rtn) {
          if (err) {
            callback(err, null)
          }
          else {
            callback(null, rtn)
          }
        })
      }],
      function(err, results) {
        var keyword = results.join (' ') + " lyrics"
        if (!argv.c) {
          console.log ("Looking for [", keyword, "]")
        }
        finder.findLyric(keyword, function (err, lyric) {
          console.log(lyric)
        })
      }
  )
}
else {
    keyword = argv['_'].join(' ') + ' ' + 'lyrics'
    if (!argv.c) {
      console.log ("Looking for [", keyword, "]")
    }
    finder.findLyric(keyword, function(err, lyric) {
      console.log(lyric)
    })
}

return 0

function printLyric (lyric) {
  console.log(lyric)
}