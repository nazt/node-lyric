#!/usr/bin/env node 

var google = require('google')
  , fs = require('fs')
  , jsdom = require('jsdom')
  , applescript = require("applescript")
  , _ = require('lodash')
  , url = require('url')
  , async = require('async')
  , jquery = fs.readFileSync("./jquery-1.7.2.min.js").toString()
  , args = process.argv.slice(2)
  , argc = args.length
  , argv
  , keyword

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

processorService = function (processorName, content, $) {
  var processor = { };
  
  processor['metrolyrics.com'] = function (content) {
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

  return {
    printLyric: function() { processor[processorName](); }
  }
}

Util = function () {
  this.metrolyrics = function (links) {
    return _.find(links, function (page) { 
    var processor = url.parse(page.link).hostname
    ,   startWithPrefix = /^www.(.*)/g
    ,   match = startWithPrefix.exec(processor);

    if (match === null) {
        console.log("unmatch .... ", processor); 
    }
    else { 
        processor = match[1];
    } 
        page.processor = processor
        return processor == 'metrolyrics.com'; 
    });
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
        var keyword = results.join (' ');
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
    if (!argv.clean || !argv.c) {
      console.log ("Looking for [", keyword, "]");
    }
    google(keyword, function (err, next, links) {
        var reqObj
          , utilService;

        if (err) {
          console.error(err);
        }
        else {
            utilService = new Util();
            reqObj = utilService.metrolyrics(links);
            jsdom.env({
              html: reqObj.link,
              src: [ jquery ],
              done: function(errors, window) {
                var $ = window.$
                  , content
                  , hasLink
                  , processor;

                processor = processorService(reqObj.processor, content, $);

                if (argv.t || !argv.c) {
                  console.log("--------------------------------------------------")
                  console.log("- " + reqObj.title + " -");
                  console.log("--------------------------------------------------\n")
                }
                processor.printLyric();
              }
            });
        }
    });
}
