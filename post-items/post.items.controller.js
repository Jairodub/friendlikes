const express = require('express');
const router = express.Router();
const url = require('url');
const { v4: uuidv4 } = require('uuid');
const CacheControl = require("express-cache-control");

const postItemService = require('./post.item.service');

// routes
router.post('/create', create);
router.get('/', getAll);
router.get('/:id', getById);
router.get('/:id/children', getChildren);
router.post('/:id/like', like);
router.delete('/:id/unlike', unlike);
router.put('/:id', update);
router.delete('/:id',_delete);

module.exports = router;

function create(req, res, next) {
    // check for spoofing
    // console.log(req.user.id);
    // if (req.body.id !== req.user.userId) throw 'User mismatch';
    req.body.poster=req.user.id;
    postItemService.create(req.body)
        .then(postitem => res.json(postitem))
        .catch(err => next(err));
}

function getAll(req, res, next) {
    if(!req.query.parent) req.query.parent=null;
    postItemService.paginate(req.query.page, req.query.limit, req.query)
        .then(postitems => res.json(postitems))
        .catch(err => next(err));
}

function getChildren(req, res, next) {
    postItemService.getChildren(req.params.id)
        .then(postitems => res.json(postitems))
        .catch(err => next(err));
}

function getById(req, res, next) {
    postItemService.getById(req.params.id)
        .then(postitem => postitem ? res.json(postitem) : res.sendStatus(404)) 
        .catch(err => next(err));
}

function update(req, res, next) {
    postItemService.update(req.user.id, req.params.id, req.body)
        .then(() => res.json({}))
        .catch(err => next(err));
}

function _delete(req, res, next) {
    postItemService.delete(req.user.id, req.params.id)
        .then(() => res.json({}))
        .catch(err => next(err));
}
function like(req, res, next){
    postItemService.like(req.user.id, req.params.id)
        .then(() => res.json({}))
        .catch(err => next(err));
}
function unlike(req, res, next){
    postItemService.unlike(req.user.id, req.params.id)
        .then(() => res.json({}))
        .catch(err => next(err));
}
