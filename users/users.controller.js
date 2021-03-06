const express = require('express');
const router = express.Router();

const userService = require('./user.service');

// routes
router.post('/authenticate', authenticate);
router.post('/register', register);
router.get('/', getAll);
router.get('/current', getCurrent);
router.get('/:id', getById);
router.put('/:id', update);
router.post('/sendrequest', sendRequest);
router.post('/confirmrequest', confirmRequest);
router.delete('/:id', _delete);

module.exports = router;

function authenticate(req, res, next) {
    userService.authenticate(req.body)
        .then(user => user ? res.json(user) : res.status(400).json({ message: 'Username or password is incorrect' }))
        .catch(err => next(err));
}
function register(req, res, next) {
    userService.create(req.body)
        .then(() => res.json({}))
        .catch(err => next(err));
}
function getAll(req, res, next) {
    userService.getAll()
        .then(users => res.json(users))
        .catch(err => next(err));
}
function getCurrent(req, res, next) {
    userService.getById(req.user.sub)
        .then(user => user ? res.json(user) : res.sendStatus(404))
        .catch(err => next(err));
}
function getById(req, res, next) {
    userService.getById(req.params.id)
        .then(user => user ? res.json(user) : res.sendStatus(404))
        .catch(err => next(err));
}
function update(req, res, next) {
    userService.update(req.user.id, req.params.id, req.body)
        .then(() => res.json({}))
        .catch(err => next(err));
}
function _delete(req, res, next) {
    userService.delete(req.user.id, req.params.id)
        .then(() => res.json({}))
        .catch(err => next(err));
}
function sendRequest(req, res, next) {
    userService.sendRequest(req)
        .then(() => res.json({}))
        .catch(err => next(err));
}
function confirmRequest(req, res, next) {
    userService.confirmRequest(req)
        .then(() => res.json({}))
        .catch(err => next(err));
}
