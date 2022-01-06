require('rootpath')();
const express = require('express');
const app = express();
const cors = require('cors');
expressPaginate = require('express-paginate'); 
const bodyParser = require('body-parser');
const jwt = require('_helpers/jwt');
const errorHandler = require('_helpers/error-handler');

app.use(express.urlencoded({extended: false}));
app.use(express.json())
app.use(cors());
app.use(expressPaginate.middleware(10, 100));

// use JWT auth to secure the api
app.use(jwt());

// use dotenv to configure for different environments
if(process.env.NODE_ENV !== "production"){
    require('dotenv').config();
}

// api routes
app.use('/users', require('./users/users.controller'));

// global error handler
app.use(errorHandler);
module.exports = app;