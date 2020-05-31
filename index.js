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

fs.watchFile("template.json", {}, function (event) {
    tm.updateTemplates();
});


io.on('connection', function (socket) {
    console.log("CONNECTED");

    socket.on('user_template', function (data) {
        socket.emit('user_template', {
            data: tm.getUserTemplate(data.type)
        })
    });

    socket.on('submit_user', function (data) {
        let result = tm.newTicket(data.data, data.type);
        socket.emit('result_user', {
            result: typeof result == "string" ? "success" : "failure",
            data: result
        });
    });
});

function handler(req, res) {
    res.writeHead(200, {
        "Access-Control-Allow-Origin": "https://richard.works",
        "Content-Type": "text/plain"
    });
    res.end();
};

let tm = new TicketManager();

console.log(tm.getTicket("Q13434"));