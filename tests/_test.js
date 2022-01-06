var expressApp = require('../app');
const { v4: uuidv4 } = require('uuid');
var chai = require('chai');
var chaiHttp = require('chai-http');
var mongoose = require('mongoose');
var should = chai.should();

//use a UUID generating tool to create unique random strings 
const itemId = uuidv4();
const testUserId = uuidv4();
const testHash = uuidv4();

var testUser = {
    "username": "user135",
    "userId": "testUserIdcvxvfd",
    "password": "testHash",
    "bio": "Test bio",
    "pic": "http://adadsa/adssadw.jpg"
};
var testUser2 = {
    "username": "user13522",
    "userId": "testUserIdcvxvfdsw",
    "password": "testHash",
    "bio": "Test bio",
    "pic": "http://adadsa/adssadw.jpg"
};

mongoose.createConnection('mongodb://127.0.0.1:27017/friendlikes-test');

chai.use(chaiHttp);

var agent = chai.request.agent(expressApp);
let token, token2;
let internalId, internalId2;

describe('test user', function() {
    it('should register first test user', function(done) {
        chai.request(expressApp)
            .post('/users/register')
            .send(testUser)
            .end(function(error, response) {
                should.equal(undefined, response.body.message);
                should.equal(200, response.status);
                done();
             });
    });
    it('should register second test user', function(done) {
        chai.request(expressApp)
            .post('/users/register')
            .send(testUser2)
            .end(function(error, response) {
                should.equal(undefined, response.body.message);
                should.equal(200, response.status);
                done();
             });
    });
    it('should login first user', function(done) {
        chai.request(expressApp)
            .post('/users/authenticate')
            .send({username:testUser.username, password:testUser.password})
            .end(function(error, response) {
                should.equal(undefined, response.body.message);
                should.equal(200, response.status);
                should.exist(response.body.token);
                token = response.body.token;
                testUser = response.body;
                done();
            })
          
    });
    it('should login second user', function(done) {
        chai.request(expressApp)
            .post('/users/authenticate')
            .send({username:testUser2.username, password:testUser2.password})
            .end(function(error, response) {
                should.equal(undefined, response.body.message);
                should.equal(200, response.status);
                should.exist(response.body.token);
                token2 = response.body.token;
                testUser2 = response.body;
                done();
            })
          
    });
    it('should get all users as first user', function(done) {
        chai.request(expressApp)
            .get('/users/')
            .auth(testUser.token, { type: 'bearer' })
            .end(function(error, response) {
                should.equal(undefined, response.body.message);
                should.equal(200, response.status);
                done();
            })          
    }); 
    it('should get users as second user', function(done) {
        chai.request(expressApp)
            .get('/users/')
            .auth(token2, { type: 'bearer' })
            .end(function(error, response) {
                should.equal(undefined, response.body.message);
                should.equal(200, response.status);
                done();
            })          
    }); 
    it('should not delete the first user as second user', function(done) {
        chai.request(expressApp)
          .delete('/users/'+ testUser2.id)
          .auth(token, { type: 'bearer' })
          .then((response) => {
            should.equal(400, response.status)
            done();
        }).catch((err) => done(err))
    });
});

describe('test user deletion', function() {
    it('should delete first user', function(done) {
        chai.request(expressApp)
          .delete('/users/'+ testUser.id)
          .auth(token, { type: 'bearer' })
          .then((response) => {
            should.equal(undefined, response.body.message)
            should.equal(200, response.status)
            done();
        }).catch((err) => done(err))
    });
    it('should delete second user', function(done) {
        chai.request(expressApp)
          .delete('/users/'+ testUser2.id)
          .auth(token2, { type: 'bearer' })
          .then((response) => {
            should.equal(undefined, response.body.message)
            should.equal(200, response.status)
            done();
        }).catch((err) => done(err))
    });
});





