#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var rest = require('restler');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";

var assertFileExists = function(infile) {
  var instr = infile.toString();
  if(!fs.existsSync(instr)) {
    console.log("Error: file %s does not exist. Exiting.", instr);
    process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
  }
  return instr;
};

var assertUrlExists = function(url) {
  var urlstr = url.toString();
  rest.head(urlstr).on('complete', function(result) {
    if (result instanceof Error) {
      console.log("Error: url %s not found (%s). Exiting.", urlstr, result.message);
      process.exit(1);
    }
  });
  return urlstr;
};

var checkUrl = function(url, checksfile) {
  rest.get(url).once('complete', function(result, response) {
    if (result instanceof Error) {
      console.log("Error: url %s not found (%s). Exiting.", urlstr, response.message);
      process.exit(1);
    } else {
      checkHtmlData(result, checksfile);
    }
  });
};

var checkFile = function(htmlfile, checksfile) {
  checkHtmlData(fs.readFileSync(htmlfile), checksfile);
};

var loadChecks = function(checksfile) {
  return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlData = function(htmldata, checksfile) {
  $ = cheerio.load(htmldata);
  var checks = loadChecks(checksfile).sort();
  var out = {};
  for(var ii in checks) {
    var present = $(checks[ii]).length > 0;
    out[checks[ii]] = present;
  }
  console.log(JSON.stringify(out, null, 4));
}

var clone = function(fn) {
  // Workaround for commander.js issue.
  // http://stackoverflow.com/a/6772648
  return fn.bind({});
};

if(require.main == module) {
  program
    .option('-c, --checks <check_file>', 'Path to checks file', clone(assertFileExists), CHECKSFILE_DEFAULT)
    .option('-f, --file [html_file]', 'Path to html file')
    .option('-u, --url [html_url]', 'Link to html file')
    .parse(process.argv);

  if (undefined !== program.url) {
    checkUrl(assertUrlExists(program.url), program.checks);
  }
  else
  if (undefined !== program.file) { 
    checkFile(assertFileExists(program.file), program.checks);
  }
  else {
    console.log("Error: must provide either file or url");
  }
} else {
  exports.checkHtmlData = checkHtmlData;
}
