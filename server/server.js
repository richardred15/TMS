let TicketManager = require("./my_modules/ticketmanager");
let Mail = require("./my_modules/mail");
var https = require('https');
var fs = require('fs');
var md5 = require("md5");
var bcrypt = require("bcrypt");
let User = require("./my_modules/user");
let Configuration = require("./my_modules/configuration");

let options = {
    key: fs.readFileSync(Configuration.get("https").key),
    cert: fs.readFileSync(Configuration.get("https").cert),
    ca: fs.readFileSync(Configuration.get("https").ca)
};

var app = https.createServer(options, handler);
var io = require('socket.io')(app);
app.listen(3009);

/* let Mailer = new Mail();

Mailer.send("richardred15@gmail.com", "Test Email", `<h2><center>Testing Test Test</center></h2><div><pre>OH HAPPY DAY</pre></div>`);

console.log("TEST"); */

process.stdin.on("data", function (data) {
    let input = data.toString().trim();
    let parts = input.split(" ");
    let cmd = parts.length > 0 ? parts[0] : input;
    switch (cmd) {
        case "new":
            if (parts.length > 1) {
                bcrypt.hash(parts[1], 10, function (err, hash) {
                    if (err) {
                        return err;
                    } else {
                        console.log(hash);
                    }
                });
            } else {
                console.log("Invalid command options");
            }
            break;
        case "test":
            if (parts.length > 2) {
                let pass = parts[1];
                let hash = parts[2];
                bcrypt.compare(pass, hash, function (err, result) {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log(result);
                    }
                });
            }
    }
});

fs.watchFile("template.json", {}, function (event) {
    tm.updateTemplates();
});

/**
 * @returns {string}
 * @description Generate a new nonce
 */
function getNONCE() {
    return md5((new Date()).toString() + "salajsdfghagha;lksjdglaksjfat");
}

let admins = [];
let admin_nonces = {

};

function emitAdmins(event, data) {
    for (let admin of admins) {
        io.sockets.to(admin).emit(event, data)
    }
}

function informAdminTicket(ticket_id) {
    let ticket = tm.getTicket(ticket_id);
    if (ticket) {
        emitAdmins('ticket_update', {
            id: ticket_id,
            data: ticket.data
        });
    }
}

function informAdminCall(data) {
    emitAdmins('call_update', data);
}


io.on('connection', function (socket) {
    let nonce = getNONCE();
    let expected;
    let admin = false;
    let user = false;

    socket.on('disconnect', function (data) {
        if (admin) {
            console.log("ADMIN OUT");
            admins.splice(admins.indexOf(socket.id), 1);
            if (admin_nonces[socket.id]) delete(admin_nonces[socket.id]);
        }
    });

    socket.on('login', function (data) {
        user = new User(data.username, data.password);
        let status = "failed";
        let message = "Login Failed";
        if (user.logged_in === false) {

        } else {
            admin = user.isAdmin();
            if (admin) {
                console.log("ADMIN IN");
                admins.push(socket.id);
            }
            status = "success";
            message = "Logged in Successfully!";
        }
        socket.emit('login', {
            status: status,
            message: message
        });
    });

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
        if (data.nonce == expected || admin) {
            let result = tm.newTicket(data.data, data.type);
            socket.emit('result_user', {
                result: typeof result == "string" ? "success" : "failure",
                data: result
            });
            if (typeof result == "string") {
                informAdminTicket(result);
                if (!admin) socket.disconnect();
            }
        } else {
            socket.emit('result_user', {
                result: "failure",
                data: ["nonce"]
            });
        }
    });

    socket.on('start_call', function (data) {
        if (admin) {
            let ticket = tm.getTicket(data.ticket);
            if (ticket && ticket.open) {
                let call = ticket.startCall(data.number);
                informAdminCall(call.getData());
            }
        }
    });

    socket.on('call_notes', function (data) {
        if (admin) {
            let ticket = tm.getTicket(data.ticket_id);
            if (ticket) {
                let call_data = ticket.updateCallNotes(data.id, data.notes);
                informAdminCall(call_data);
            }
        }
    });

    socket.on('end_call', function (data) {
        if (admin) {
            let ticket = tm.getTicket(data.ticket);
            if (ticket && ticket.open) {
                let call = ticket.endCall(data.call);
                informAdminCall(call.getData());
            }
        }
    });

    socket.on('admin_nonce', function (data) {
        if (admin) {
            let ticket = tm.getTicket(data.ticket);
            if (ticket) {
                let nonce = getNONCE();
                let packet = {
                    ticket: data.ticket,
                    nonce: nonce
                }
                admin_nonces[socket.id] = packet;
                socket.emit('admin_nonce', packet);
            }
        }
    });

    socket.on('admin_update_ticket', function (data) {
        if (admin) {
            let ticket = tm.getTicket(data.id);
            let template = tm.getTemplate(data.type);
            for (let item in data.data) {
                if (!template[item] || !template[item].disabled)
                    ticket.data[item] = data.data[item];
            }
            tm.updateTicket(data.id);
            informAdminTicket(data.id);
        }
    });

    socket.on('admin_update_notes', function (data) {
        if (admin) {
            let ticket = tm.getTicket(data.id);
            ticket.data.notes = data.notes;
            let success = tm.updateTicket(data.id);
            informAdminTicket(data.id);
            socket.emit('note_update_status', {
                status: success ? "success" : "failure"
            });
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
                    type: data.type,
                    posted: data.posted
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
                data: tm.getAllTemplates()
            });
        }
    });

    socket.on('admin_get_ticket', function (data) {
        if (admin) {
            let id = data.id;
            let ticket = tm.getTicket(id);
            if (ticket.data.status == "unread") {
                ticket.data.status = "read";
                tm.updateTicket(id);
                informAdminTicket(data.id);
            }
            socket.emit('admin_ticket_data', {
                id: id,
                data: ticket.data,
                type: ticket.type,
                call_data: ticket.getCallData()
            });
        }
    });

    socket.on('admin_search', function (data) {
        if (admin) {
            let matches = tm.searchTickets(data.term);
            let result_data = [];
            for (let match of matches) {
                let ticket = tm.getTicket(match);
                let packet = {
                    id: match,
                    name: ticket.data.name,
                    posted: ticket.data.posted,
                    email: ticket.data.email,
                    phone: ticket.data.phone
                }
                result_data.push(packet);
            }
            socket.emit('search_results', {
                results: result_data
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
        "Content-Type": "text/html"
    });
    let url = new URL(req.url, `http://${req.headers.host}`);
    if (url.pathname == "/admin/viewticket") {
        let socket = url.searchParams.get('id');
        let expected = admin_nonces[socket];
        if (expected) {
            let ticket = url.searchParams.get('ticket');
            if (ticket == expected.ticket) {
                let nonce = url.searchParams.get('nonce');
                if (nonce == expected.nonce) {
                    delete(admin_nonces[socket]);
                    let ticket_object = tm.getTicket(ticket);
                    let ticket_data = JSON.stringify(ticket_object);
                    let ticket_template = JSON.stringify(tm.getTemplate(ticket_object.type))
                    let html = fs.readFileSync("./pages/admin_view.html").toString();
                    res.write(html.replace("'${ticket_data}'", ticket_data).replace("'${ticket_template}'", ticket_template));
                }
            }
        } else {
            res.write("Are you sure you're supposed to be here?");
        }
    }
    if (url.pathname == "/viewticket") {
        let ticket = url.searchParams.get('ticket');
        let ticket_object = tm.getUserTicket(ticket);
        console.log(ticket_object);
        let ticket_data = ticket_object;
        let ticket_template = tm.getUserTemplate(ticket_object.type);
        res.write(JSON.stringify({
            data: ticket_data,
            template: ticket_template
        }));
    }
    res.end();
};

let tm = new TicketManager();

/* let packet = {
    tickets: tm.getAllData(),
    users: {}
}

console.log(JSON.stringify(packet, {}, "    ")); */