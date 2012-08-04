#!/usr/bin/env node 

var google = require('google')
  , jsdom = require('jsdom')
  , applescript = require("applescript")
  , fs = require('fs')
  , _ = require('lodash')
  , url = require('url')
  , async = require('async')
  , args = process.argv.slice(2)
  , argv = args.length
  , keyword = args.join(' ') + ' ' + 'lyrics';


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
    printLyric: function() {
      processor[processorName]();
    }
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

if (argv == 0) {
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
            callback(null, rtn );
          }
        });
      }],
      function(err, results){
        var keyword = results.join (' ')
        findLyric(keyword);
      }
      
  );
}
else {
  findLyric(keyword);
}

return 0;
function findLyric (keyword) {
    console.log ("FINDING ", keyword);
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
              scripts: [ 'http://code.jquery.com/jquery-1.7.2.min.js' ],
              done: function(errors, window) {
                var $ = window.$
                  , content
                  , hasLink
                  , processor;

                processor = processorService(reqObj.processor, content, $);
                console.log("--------------------------------------------------")
                console.log("- " + reqObj.title + " -");
                console.log("--------------------------------------------------\n")

                processor.printLyric();
                
              }
            });
        }
    });
}
