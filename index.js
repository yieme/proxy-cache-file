'use strict';


/** Proxy and cache a file and related headers
 *
 *  @copyright  Copyright (C) 2015 by Yieme
 *  @module     proxyCacheFile
 */

'use strict';
var _              = require('lodash')
var fs             = require('fs')
var mkdirp         = require('mkdirp')
var MD5            = require('MD5')
var request        = require('request')
var path           = require('path')
var forwardHeaders = ['content-type']
var options        = {
  dir:       './tmp', // falsely to disable file cache
}
var dirExists = { }

var ProxyCacheFileError = require('make-error')('ProxyCacheFileError')


/*
@param {object} request || config
- request contains: { url: 'https://domain.com/path/to/file', returnUrl: false }
- config contails:  { cacheDir: '/tmp' }
@param {function} callback
@return {object} result - { header: [{name:'', value: ''}], data: data || , piped: pipeData }
*/
function proxyCacheFile(req, callback) {
  if ('string' === typeof req) req = { url: req }
  req = req || {}
  if ('undefined' !== typeof req.dir) {
    if (options.dir != req.dir) {
      options.dir = req.dir
      options = _.extend(options, req)
    }
    if (!req.url) {
      options = _.extend(options, req)
      return proxyCacheFile
    }
  }
  req.dir = req.dir || options.dir

  function cacheFile(filePath, headers, data) {
    function writeFile() {
      var writeStream = fs.createWriteStream(filePath)
      writeStream.write(data)
      writeStream.end()
      fs.writeFile(filePath + '.json', JSON.stringify(headers), 'utf8', function(err) {
        if (err) return callback(err)
      })
    }

    if (dirExists[options.dir] || !options.dir) {
      writeFile()
    } else {
      fs.exists(options.dir, function(exists) {
        if (exists) {
          writeFile()
        } else {
          mkdirp(options.dir, function (err) {
            if (err) return callback(err)
            dirExists[options.dir] = true
            writeFile()
          })
          writeFile()
        }
      })
    }
  }

  function tryProxy(filePath) {
    var param = { method: 'GET', gzip: true, uri: req.url }
    request(param, function (error, response, body) {
      if (error) return callback(error)
      var headers       = response.headers
      var fileHeaders    = []
      for (var i=0, len = forwardHeaders.length; i < len; i++) {
        var headerName  = forwardHeaders[i]
        var header      = headers[headerName]
        if (header) {
          fileHeaders.push({ name: headerName, value: header })
        }
      }
      if (filePath) cacheFile(filePath, fileHeaders, body)
      var result = { headers: fileHeaders, data: body }
      if (req.returnUrl) result.url = req.url
      callback(null, result)
    })
  }

  function tryFileCache(filePath) {
    fs.exists(filePath, function(exists) {
      if (exists) {
        fs.readFile(filePath + '.json', 'utf8', function(err, headers) {
          if (err) return callback(err)
          headers = JSON.parse(headers)
          fs.readFile(filePath, 'utf8', function(err, data) {
            if (err) return callback(err)
            var result = { headers: headers, data: data, cached: true }
            if (req.returnUrl) result.url = req.url
            callback(null, result)
          })
        })
      } else {
        tryProxy(filePath)
      }
    })
  }

  if (!req.url)                   return callback(new ProxyCacheFileError('Missing req.url'))
  if (req.url.indexOf('..') >= 0) return callback(new ProxyCacheFileError('Invalid req.url: ' + req.url))
	if (req.dir) {
    tryFileCache(path.normalize(req.dir + '/' + MD5(req.url)))
	} else {
    tryProxy(req)
  }
}


module.exports = proxyCacheFile
