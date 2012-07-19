#!/usr/bin/env node 

var google = require('google');
var jsdom = require('jsdom');
var fs = require('fs');
var _ = require('lodash'); 

var args = process.argv.slice(2)

var keyword = args.join(' ') + ' ' + 'lyrics'


console.log ("\n" + "Searching for " + keyword + "....\n");
google(keyword, function (err, next, links) {
    var reqObj;
    if (err) {
        console.error(err);
    }
    else {
        reqObj = _.find(links, function (page) {return page.link.indexOf("metrolyrics.com") !== -1; });
        jsdom.env({
          html: reqObj.link,
          scripts: [ 'http://code.jquery.com/jquery-1.7.2.min.js' ],
          done: function(errors, window) {
            var $ = window.$
            ,   content
            ,   hasLink;

            console.log("--------------------------------------------------")
            console.log("- " + reqObj.title + " -");
            console.log("--------------------------------------------------\n")

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
        });
    }
});
