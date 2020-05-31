let TicketManager = require("./ticketmanager");

var https = require('https');
var fs = require('fs');
var md5 = require("md5");
var bcrypt = require("bcrypt");
let options = {
    key: fs.readFileSync('/etc/letsencrypt/live/richard.works/privkey.pem'),
    cert: fs.readFileSync('/etc/letsencrypt/live/richard.works/cert.pem'),
    ca: fs.readFileSync('/etc/letsencrypt/live/richard.works/chain.pem')
};

var app = https.createServer(options, handler);
var io = require('socket.io')(app);
app.listen(3009);

process.stdin.on("data", function (data) {
    let input = data.toString();
    let cmd = input.split(" ")[0];
    switch (cmd) {

    }
});

fs.watchFile("template.json", {}, function (event) {
    tm.updateTemplates();
});

function getNONCE() {
    return md5((new Date()).toString() + "salajsdfghagha;lksjdglaksjfat");
}

io.on('connection', function (socket) {
    console.log("CONNECTED");
    let nonce = getNONCE();
    let expected;
    let admin = false;
    if (socket.handshake.address == "::ffff:35.133.9.238") {
        admin = true;
    }
    socket.on('user_template', function (data) {
        let template = tm.getUserTemplate(data.type, nonce);
        if (template) {
            expected = nonce;

            socket.emit('user_template', {
                data: template
            });
            nonce = getNONCE();
        } else {
            socket.emit('user_template', {
                data: {
                    "error": "No such form"
                }
            });
        }
    });

    socket.on('submit_user', function (data) {
        console.log(data.nonce, expected);
        if (data.nonce == expected) {
            let result = tm.newTicket(data.data, data.type);
            socket.emit('result_user', {
                result: typeof result == "string" ? "success" : "failure",
                data: result
            });
            if (typeof result == "string") socket.disconnect();
        } else {
            socket.emit('result_user', {
                result: "failure",
                data: ["nonce"]
            });
        }
    });

    socket.on('admin_update_ticket', function (data) {
        if (admin) {
            let ticket = tm.getTicket(data.id);
            let template = tm.getTemplate(data.type);
            for (let item in data.data) {
                console.log(item);
                if (!template[item] || !template[item].disabled)
                    ticket.data[item] = data.data[item];
            }
            tm.updateTicket(data.id);
        }
    });

    socket.on('admin_get_display_data', function (data) {
        if (admin) {
            let out = {};
            for (let ticket of data.list) {
                let data = tm.getTicket(ticket).data;
                out[ticket] = {
                    status: data.status,
                    name: data.name,
                    type: tm.getTicket(ticket).type
                };
            }
            socket.emit('admin_display_data', {
                data: out
            });
        }
    });

    socket.on('admin_templates', function (data) {
        if (admin) {
            socket.emit('admin_templates', {
                data: {
                    "default": tm.getTemplate("default"),
                    "contact": tm.getTemplate("contact"),
                    "questionnaire": tm.getTemplate("questionnaire")
                }
            });
        }
    });

    socket.on('admin_get_ticket', function (data) {
        if (admin) {
            let id = data.id;
            let d = tm.getTicket(id);
            socket.emit('admin_ticket_data', {
                id: id,
                data: d.data,
                type: d.type
            });
        }
    });

    socket.on('admin_list_all', function (data) {
        if (admin) {
            socket.emit('list_all', {
                data: tm.ticketList
            });
        }
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

console.log(tm.getTicket("Q13626"));