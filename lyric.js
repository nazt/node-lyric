#!/usr/bin/env node 

var google = require('google')
,   jsdom = require('jsdom')
,   fs = require('fs')
,   _ = require('lodash')
,   url = require('url')
,   args = process.argv.slice(2)
,   keyword = args.join(' ') + ' ' + 'lyrics'


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
google(keyword, function (err, next, links) {
    var reqObj,
        utilService;
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
            ,   content
            ,   hasLink
            ,   processor;

            processor = processorService(reqObj.processor, content, $);
            console.log("--------------------------------------------------")
            console.log("- " + reqObj.title + " -");
            console.log("--------------------------------------------------\n")

            processor.printLyric();
            
          }
        });
    }
});
