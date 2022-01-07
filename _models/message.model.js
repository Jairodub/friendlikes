const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    message : String,
    sender  : String,
    reciever: String,
    date    : Date
});

module.exports = mongoose.model('Message', schema);