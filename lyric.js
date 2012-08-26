#!/usr/bin/env node 

var google = require('google')
  , fs = require('fs')
  , path = require('path')
  , jsdom = require('jsdom')
  , applescript = require("applescript")
  , _ = require('lodash')
  , url = require('url')
  , async = require('async')
  , lib  = path.join(path.dirname(fs.realpathSync(__filename)), '/lib')
  , jquery = fs.readFileSync(lib + "/jquery-1.7.2.min.js").toString()
  , args = process.argv.slice(2)
  , argc = args.length
  , argv
  , keyword
  , Processor

  argv = require('optimist')
    .usage('Usage: $0 keyword [options]')
    .alias('c', 'clean')
    .alias('i', 'itunes')
    .alias('t', 'title')
    .describe('i', 'Get song name from itunes')
    .describe('c', 'Show only lyric')
    .describe('t', 'Show song title')
    .check(function (argv) {
      if ( !argv.i && _.isEmpty(argv._)) {
        throw ''
      }
    }).argv

Processor = function() {
  var urlList;
  var processor = {};
  var processorList
  var process;
  var mapped;
  var $;

  processor['metrolyrics.com'] = function () {
    var content
    $('#lyrics-body p br').parent().contents().each(function (k, obj) {
        content = obj.textContent; 
        hasLink = content.indexOf("From:") !== -1
        if (obj._nodeName === 'br') {
          console.log ("\n");
        }
        else if (obj._nodeName === 'span' && !hasLink) {
          console.log(content); 
        }
    });
  }

  processorList = _.keys(processor)

  process = function() {
    mapped = urlList.filter(function(obj) {
      if (!obj.link) { return false; }
      var hostname = url.parse(obj.link).hostname
        , startWithPrefix = /^www.(.*)/g
        , match = startWithPrefix.exec(hostname);
      obj.processor = match && match[1]
      return match && _.contains(processorList, match[1])
    });
  }

  this.setLinks = function(urls) {
    // urlList = _.pluck(urls, 'link');
    urlList = urls;
    process();
  }

  this.getReqObj = function () {
    return mapped[0];
  }

  this.printLyric = function (jQuery) {
    var processorName = mapped[0].processor
    $ = jQuery;
    processor[processorName]();
  }
}

if (argv.i) {
  async.parallel([
      function(callback) {
        var song_name = 'tell application "iTunes" to name of current track as string';
        applescript.execString(song_name, function(err, rtn) {
          if (err) {
            callback(err, null);
          }
          else {
            callback(null, rtn);
          }
        });
      },
      function(callback) {
        var song_artist = 'tell application "iTunes" to artist of current track as string';
        applescript.execString(song_artist, function(err, rtn) {
          if (err) {
            callback(err, null);
          }
          else {
            callback(null, rtn);
          }
        });
      }],
      function(err, results) {
        var keyword = results.join (' ') + " lyrics";
        findLyric(keyword);
      }
      
  );
}
else {
  keyword = argv['_'].join(' ') + ' ' + 'lyrics';
  findLyric(keyword);
}

return 0;

function findLyric (keyword) {
    if (!argv.c) {
      console.log ("Looking for [", keyword, "]");
    }
    google(keyword, function (err, next, links) {
        var reqObj
          , processor = new Processor;

        if (err) {
          console.error(err);
        }
        else {
            processor.setLinks(links)
            reqObj = processor.getReqObj()
            if (!reqObj) {
              console.log("NOT FOUND!")
              return false;
            }
            jsdom.env({
              html: reqObj.link,
              src: [ jquery ],
              done: function(errors, window) {
                var $ = window.$
                  , content
                  , hasLink;

                if (argv.t || !argv.c) {
                  console.log("--------------------------------------------------")
                  console.log("- " + reqObj.title + " -");
                  console.log("--------------------------------------------------\n")
                }
                processor.printLyric($);
              }
            });
        }
    });
}
