var should = require('should');
var bshPool = require('bsh-mongo-pool');
var bshMongoToken = require('./node_modules/bsh-mongo-token/bsh-mongo-token.js');
var bshToken = require('./index');
bshToken.implementation(bshMongoToken);

beforeEach(function() {
    return bshPool.init('mongodb://localhost/tokenTest');
});

describe('BSH Token Tests', function () {
    it('should create a token', function () {
        return bshToken.createToken('testContext','someUser',['all']);
    });
});