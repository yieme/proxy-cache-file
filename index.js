/** Proxy and cache a file and related headers
 *
 *  @copyright  Copyright (C) 2015 by Yieme
 *  @module     proxy-cache-file
 */
 (function() {
  'use strict';
  function ProxyCacheFileError(message) { // ref: https://stackoverflow.com/questions/1382107/whats-a-good-way-to-extend-error-in-javascript
    /*jshint validthis: true */
    this.constructor.prototype.__proto__ = Error.prototype
    Error.captureStackTrace(this, this.constructor)
    this.name = this.constructor.name
    this.message = message
  }

  /** Proxy cache file
   *  @class
   *  @param      {object} options - The options
   *  @return     {object}
   */
  function proxyCacheFileClass(options) {
    /*jshint validthis: true */
    var self = this
    options = options || {}
    self.value = options
    return self
  }



  /** Proxy cache file
   *  @constructor
   *  @param      {object} options - The options
   *  @return     {object}
   */
  function proxyCacheFile(options) {
    return new proxyCacheFileClass(options).value
  }


  module.exports = proxyCacheFile
})();
