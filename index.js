'use strict';


/** Proxy and cache a file and related headers
 *
 *  @copyright  Copyright (C) 2015 by Yieme
 *  @module     proxyCacheFile
 */
var _              = require('lodash')
var fs             = require('fs')
var mkdirp         = require('mkdirp')
var MD5            = require('MD5')
var request        = require('superagent')
var path           = require('path')
var logger      = {
  info:  function(msg) { console.log('info:', msg) },
  debug: function(msg) { console.log('debug:', msg) },
  warn:  function(msg) { console.warn('warn:', msg) },
  error: function(msg) { console.error('error:', msg) },
  log:   console.log,
}
var options        = {
  dir:        './tmp', // falsely to disable file cache
  logger:     logger,
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

  options.logger.debug('proxyCacheFile: ' + req.url)

  function cacheFile(filePath, headers, data) {
    options.logger.debug('cacheFile: ' + req.url + ' to ' + filePath)

    function writeFile() {
      if ('string' == typeof data) {
        fs.writeFile(filePath, data, 'utf-8', function(err) {
          if (err) return callback(err)
        })
      } else {
        var writeStream = fs.createWriteStream(filePath)
        data.pipe(writeStream)
      }
      fs.writeFile(filePath + '.json', JSON.stringify(headers), 'utf-8', function(err) {
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
        }
      })
    }
  }

  function errorBody(code) {
    return (code) ? JSON.stringify({ code: code, message: 'Unable to proxy: ' + req.url }) : ''
  }

  function tryProxy(filePath) {
    options.logger.debug('tryProxy: ' + req.url)

    request.head(req.url).end(function tryProxyHead(err, res) {
      if (err) return callback(err)
      var headers   = {
        code: res.status,
        type: res.type
      }
      var result = { headers: headers }
      if (!res.ok) {
        result.body = errorBody(res.status)
        return callback(null, result)
      }
      if (req.asStream) {
        var stream = request.get(req.url)
        cacheFile(filePath, headers, stream)
        result.stream = stream
        callback(null, result)
      } else {
        request.get(req.url).buffer().end(function (err, res) {
          if (err) return callback(err)
          cacheFile(filePath, headers, res.text)
          result.body = res.text
          callback(null, result)
        })
      }
    })
  }

  function tryFileCache(filePath) {
    options.logger.debug('tryFileCache: ' + req.url + ' from ' + filePath)

    fs.exists(filePath, function(exists) {
      if (exists) {
        fs.readFile(filePath + '.json', 'utf-8', function(err, headers) {
          if (err) return callback(err)
          headers = JSON.parse(headers)
          var result = { headers: headers, body: errorBody(headers.code), cache: 'file' }
          if (req.returnUrl) result.url = req.url
          if (headers.code !== 200) return callback(null, result)
          if (req.asStream) {
            result.stream = fs.createReadStream(filePath)
            callback(null, result)
          } else {
            fs.readFile(filePath, 'utf-8', function(err, body) {
              if (err) return callback(err)
              result.body = body
              callback(null, result)
            })
          }
        })
      } else {
        tryProxy(filePath)
      }
    })
  }

  if (!req.url)                   return callback('Missing req.url')
  if (req.url.indexOf('..') >= 0) return callback('Invalid req.url: ' + req.url)
	if (req.dir) {
    tryFileCache(path.normalize(req.dir + '/' + MD5(req.url)))
	} else {
    tryProxy(req)
  }
}


module.exports = proxyCacheFile
