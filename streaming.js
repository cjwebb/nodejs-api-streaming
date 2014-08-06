var app = require('http').createServer(handler);
var io = require('socket.io').listen(app);
var fs = require('fs');
var last;
var tick;
var bodyChunk;

/* Create config.js from config.js.default */
var config = require('./config.js');

var https;

if (config.domain.indexOf("stream-sandbox") > -1) {
  https = require('http');
} else {
  https = require('https');
}

var options = {
  host: config.domain,
  path: '/v1/prices?accountId=' + config.account_id + '&instruments=' + config.instruments,
  method: 'GET',
  headers: {"Authorization" : "Bearer " + config.access_token},
};

var request = https.request(options, function(response){
      response.on("data", function(chunk){
         bodyChunk = chunk.toString(); 
      });
      response.on("end", function(chunk){
         console.log("Error connecting to OANDA HTTP Rates Server");
         console.log("HTTP - " + response.statusCode);
         console.log(bodyChunk);
         process.exit(1);
      });
});

request.end();

app.listen(1337, '127.0.0.1');

function handler (req, res) {
  fs.readFile(__dirname + '/index.html',
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }
    res.writeHead(200);
    res.end(data);
  });
};

io.sockets.on('connection', function (socket) {
  setInterval(function(){
    if (bodyChunk !== last) {
      socket.emit('news', bodyChunk);
      last = bodyChunk;
    }
  }, 0.001);
});

