let TicketManager = require("./ticketmanager");

var https = require('https');
var fs = require('fs');
let options = {
    key: fs.readFileSync('/etc/letsencrypt/live/richard.works/privkey.pem'),
    cert: fs.readFileSync('/etc/letsencrypt/live/richard.works/cert.pem'),
    ca: fs.readFileSync('/etc/letsencrypt/live/richard.works/chain.pem')
};

var app = https.createServer(options, handler);
var io = require('socket.io')(app);
app.listen(3009);


io.on('connection', function (socket) {});

function handler(req, res) {
    res.writeHead(200, {
        "Access-Control-Allow-Origin": "https://richard.works",
        "Content-Type": "text/plain"
    });
};

let tm = new TicketManager();