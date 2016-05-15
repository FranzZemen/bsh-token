var should = require('should');
var bshPool = require('bsh-mongo-pool');
var bshMongoToken = require('./node_modules/bsh-mongo-token/bsh-mongo-token.js');
var bshToken = require('./index');
bshToken.implementation(bshMongoToken);

beforeEach(function() {
  return bshPool.init('mongodb://localhost/tokenTest');
});

describe('BSH Token Tests', function () {
  it('should create a token', function (done) {
    bshToken.createToken('testContext','someUser',['all'])
      .then(function (token){
        if (token) {
          done();
        }
      })
  });
  
  it ('should touch a created token', function (done) {
    bshToken.createToken('testContext','someUser',['all'])
      .then(function (token){
        if (token) {
          bshToken.touchToken(token)
            .then(function (backToken) {
              done();
            });
        }
      })
  });
  it ('should check a created token', function () {
    return bshToken.createToken('testContext','someUser',['all'])
      .then(function (token){
        if (token) {
          return bshToken.checkToken(token, undefined, true)
            .then(function (found) {
              should.exist(found);
              found.should.equal(true);
              return true;
            });
        }
      })
  });

  it ('should fail check a dummy token', function () {
    return bshToken.checkToken('dummy')
      .then(function (found) {
        should.exist(found);
        found.should.equal(false);
        return true;
        ;
      });
  });
});