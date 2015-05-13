var should = require('chai').should()
var proxyCacheFile

describe('proxy-cache-file', function() {
  it('should eaual load', function(done) {
    proxyCacheFile = require('..')
    done();
  });


  it('should eaual initialize', function(done) {
    proxyCacheFile({dir:0})
    done();
  });
});
