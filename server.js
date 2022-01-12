// Import app
var app = require ('./app');
const http = require('http').Server(app);
const io = require('socket.io')(http);

// start server
const port = process.env.NODE_ENV === 'production' ? (process.env.PORT || 80) : 4000;
const server = http.listen(port, function () {
    console.log('Server listening on port ' + port);
});
