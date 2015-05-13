var should = require('chai').should(),
    proxyCacheFile = require('..')
;

describe('proxy-cache-file', function() {
  var expected = ["hello", "world"]
  var expectedString = JSON.stringify(expected)
  it('should eaual ' + expectedString, function(done) {
    var test = proxyCacheFile()
    var json = JSON.stringify(test)
    json.should.equal(expectedString);
    done();
  });
});
