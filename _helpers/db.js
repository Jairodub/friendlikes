const config = require('config.json');
const mongoose = require('mongoose');

const connectionOptions = { useCreateIndex: true, useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false };
var connection = mongoose.connect(process.env.MONGODB_URI || config.connectionString, connectionOptions);

module.exports = {
    User: require('../_models/user.model'),
    Message: require ('../_models/message.model'),
    PostItem: require ('../_models/post.item.model'),
    connection: connection
};