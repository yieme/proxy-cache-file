'use strict';


/** Proxy cache middleware for Express
 *
 *  @copyright  Copyright (C) 2015 by Yieme
 *  @module     proxy-cache-middleware
 */

'use strict';
var _              = require('lodash')
var fs             = require('fs')
var mkdirp         = require('mkdirp')
var MD5            = require('MD5')
var request        = require('request')
var path           = require('path')
var forwardHeaders = ['content-type', 'content-encoding']
var options        = {
  dir:  '/tmp' // falsely to disable file cache
}

var ProxyCacheFileError = require('make-error')('ProxyCacheFileError')


/*
@param {object} request || config
- request contains: { url: 'https://domain.com/path/to/file', gzip: false }
- config contails:  { cacheDir: '/tmp' }
@param {function} callback
@return {object} result - { header: [{name:'', value: ''}], data: data || , piped: pipeData }
*/
function proxyCacheFile(req, callback) {
  if ('string' === typeof req) req = { url: req }
  req = req || {}
  console.log('req:', req)
  if ('undefined' !== typeof req.dir) {
    if (options.dir != req.dir) {
      options.dir = req.dir
      if (options.dir) {
        mkdirp.sync(options.dir)
      }
      options = _.extend(options, req)
    }
    if (!req.url) {
      return proxyCacheFile
      options = _.extend(options, req)
    }
  }
  req.dir = req.dir || options.dir

  function cacheFile(filePath, headers, data) {
    var writeStream = fs.createWriteStream(filePath)
    writeStream.write(data)
    writeStream.end()
    fs.writeFile(filePath + '.json', JSON.stringify(headers), 'utf8', function(err) {
      if (err) callback(new ProxyCacheFileError(err))
    })
  }

  function tryProxy(filePath) {
    request({ method: 'GET', gzip: req.gzip, uri: req.url })
    .on('error', function(err) {
      callback(err)
    })
    .on('response', function(response) {
      var headers       = response.headers
      var fileHeaders    = []
      for (var i=0, len = forwardHeaders.length; i < len; i++) {
        var headerName  = forwardHeaders[i]
        var header      = headers[headerName]
        if (header) {
          fileHeaders.push({ name: headerName, value: header })
        }
      }
//      if (cache.control) fileHeaders.push({ name: 'cache-control', value: 'public, max-age=' + cache.control })
      response.on('data', function(data) {
        console.log(req.url, 'received ' + data.length + ' bytes of compressed data', typeof data)
        if (filePath) cacheFile(filePath, fileHeaders, data)
        callback(null, { headers: fileHeaders, data: data, isBuffer: true })
      })
    })
  }

  function tryFileCache(filePath) {
    fs.exists(filePath, function(exists) {
      if (exists) {
        fs.readFile(filePath + '.json', 'utf8', function(err, headers) {
          if (err) throw new Error(err)
          console.log(filePath, 'from cache')
          headers = JSON.parse(headers)
          var readStream = fs.createReadStream(filePath)
          callback(null, { headers: headers, data: readStream })
        })
      } else {
        tryProxy(filePath)
      }
    })
  }

  if (!req.url) {
    callback(new ProxyCacheFileError('Missing URL'))
  } else if (req.url.indexOf('..') < 0) {
		if (req.dir) {
      tryFileCache(path.normalize(req.dir + '/' + MD5(req.url + (req.gzip) ? '.gz' : '')))
		} else {
      tryProxy(req)
    }
	} else {
		callback(new ProxyCacheFileError('Invalid URL: ' + req.url))
	}
}


module.exports = proxyCacheFile
