let fs = require("fs");

process.stdout.write("   \x1b[32m============================================================\n");
process.stdout.write("   ==   @@@@@@@@@@@@@@  |||\\\\\\        ///|||   |||@@@@@|||   ==\n");
process.stdout.write("   ==        @@@        ||| \\\\\\      /// |||   |||           ==\n");
process.stdout.write("   ==        @@@        |||  \\\\\\    ///  |||   |||@@@@@|||   ==\n");
process.stdout.write("   ==        @@@        |||   \\\\\\  ///   |||           |||   ==\n");
process.stdout.write("   ==        @@@        |||    \\\\\\///    |||           |||   ==\n");
process.stdout.write("   ==        @@@        |||              |||   |||@@@@@|||   ==\n");
process.stdout.write("   ============================================================\n");
process.stdout.write(`
                                    __ _       
                                   / _(_)      
                    ___ ___  _ __ | |_ _  __ _ 
                   / __/ _ \\| '_ \\|  _| |/ _\` |
                  | (_| (_) | | | | | | | (_| |
                   \\___\\___/|_| |_|_| |_|\\__, |
                                          __/ |
                                         |___/ 
                  
`);
process.stdout.write("\x1b[0m");

let selection = `abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789\/.,<>;":-=_+[]{}`;

function random_key() {
    let sel = selection.split('').sort(function (a, b) {
        return Math.random() - Math.random();
    }).join('');
    selection = sel;
    let key = "";
    for (let i = 0; i < 32; i++) {
        let accum = 0;
        for (let j = 0; j < 100; j++) {
            accum += Math.random();
        }
        accum = Math.floor((accum % 1) * selection.length);
        key += selection[accum];
    }
    return key;
}
let url = "http://";
let config = {
    "algorithm": "aes-256-ctr",
    "key": "",
    "mail": {
        "host": "",
        "port": 587,
        "user": "",
        "pass": "",
        "from": ""
    },
    "host": "",
    "port": 3009,
    "path": "",
    "https": {
        "key": "",
        "cert": "",
        "ca": ""
    }
}

let current_request = 0;
let sub_request = 0;
let request = ["host",
    "port",
    "path",
    ["https", ["enable", "key", "cert", "ca"]],
    ["mail", ["enable", "host", "port", "user", "pass", "from"]],
    "key"
];
let requesting = false;
let complete = false;

let prompts = {
    "host": "Please enter server hostname e.g. richard.works",
    "port": `Please enter Node Server Port (${config.port})`,
    "path": "Please enter path to TMS files e.g. /var/www/TMS",
    "https": {
        "enable": "Type 'y' to enabled HTTPS",
        "key": "Please enter key file path",
        "cert": "Please enter certificate file path",
        "ca": "Please enter chain file path"
    },
    "mail": {
        "enable": "Type 'y' to enabled SMTP",
        "host": "SMTP Server e.g. smtp-relay.sendinblue.com",
        "port": `SMTP Server Port (${config.mail.port})`,
        "user": "SMTP User Name",
        "pass": "SMTP Password",
        "from": "SMTP Default From Address"
    },
    "key": "Master data encryption key (press enter to generate)"
}

let rules = {
    port: function (test) {
        if (test == "") test = config.port;
        test = parseInt(test);
        if (isNaN(test)) {
            console.log(`Port "${test}" is not a number!`);
            return false;
        }
        return test;
    },
    host: function (test) {
        if (test == "") {
            console.log("Hostname cannot be blank!");
            return false;
        }
        return test;
    },
    path: function (test) {
        if (test.substr(-1) == "/") test = test.substr(0, test.length - 1);
        return test;
    },
    https: {
        enable: (test) => {
            test = test.toLowerCase();
            if (test.indexOf("y") == 0) {
                url = "https://" + config.host;
                config.host = url;
                return true;
            } else {
                url += config.host;
                console.log("HTTPS Disabled!");
                config.host = url;
                return false
            }
        },
        key: (test) => {
            if (test == "") {
                console.log("Key path cannot be blank!");
                return false;
            }
            return test;
        },
        cert: (test) => {
            if (test == "") {
                console.log("Certificate path cannot be blank!");
                return false;
            }
            return test;
        },
        ca: (test) => {
            if (test == "") {
                console.log("Chain file path cannot be blank!");
                return false;
            }
            return test;
        }
    },
    mail: {
        enable: (test) => {
            test = test.toLowerCase();
            if (test.indexOf("y") == 0)
                return true;
            else {
                console.log("Email Disabled!");
                return false
            }
        },
        host: (test) => {
            return test;
        },
        port: (test) => {
            if (test == "") test = config.mail.port;
            test = parseInt(test);
            if (isNaN(test)) {
                console.log(`Port "${test}" is not a number!`);
                return false;
            }
            return test;
        },
        user: (test) => {
            return test;
        },
        pass: (test) => {
            return test;
        },
        from: (test) => {
            return test;
        },
    },
    key: (test) => {
        if (test == "") {
            test = random_key();
            console.log(`Key ${test} generated...`);
        } else if (test.length != 32) {
            console.log("Key length must be 32 characters!");
            return false;
        }
        return test;
    }
}

let awaiting = "";

process.stdin.on('data', function (data) {
    let str = data.toString().trim();
    if (complete) {
        if (str == "") {
            finish(true);
        } else {
            finish(false);
        }
    } else if (requesting) {
        //let result = test(request[current_request], str);
        let req = request[current_request];
        let test;
        let sub = false;
        if (typeof req == "string")
            test = rules[req];
        else {
            test = rules[req[0]][req[1][sub_request]];
            sub = true;
        }
        let result = test(str);
        if (result !== false) {
            if (sub) {
                if (sub_request > 0) {
                    config[req[0]][req[1][sub_request]] = result;
                }
                sub_request++;
                if (req[1].length - 1 < sub_request) {
                    sub_request = 0;
                    current_request++;
                }
            } else {
                config[req] = result;
                current_request++;
            }
        } else {
            if (sub) {
                if (sub_request == 0) {
                    current_request++;
                }
            }
        }
        requesting = false;
        request_next()
    }
});

function test(rule, value) {
    return rules[rule](value);
}

function prompt(text) {
    process.stdout.write(`${text}: `)
}

function request_next() {
    if (current_request > request.length - 1) {
        console.log("SETUP COMPLETE");
        console.log("Please review the following configuration: ")
        console.log(config);
        prompt("Please press [enter] to save or 'n' to cancel")
        complete = true;
    } else {
        let req = request[current_request];
        let name = req;
        let next;
        if (typeof req == "string")
            next = prompts[req];
        else {
            name = req[0];
            next = prompts[name];
        }
        if (typeof next == "string") {
            prompt(next);
        } else {
            if (sub_request == 0) {
                prompt(next.enable)
            } else {
                prompt(next[request[current_request][1][sub_request]])
            }
        }
        requesting = true;
    }
}

process.on('SIGINT', function () {
    finish();
});

function finish(installed) {
    if (installed) {
        let copied_server = false;
        let copied_common = false;
        if (fs.existsSync("server/config.json")) {
            fs.writeFileSync("config.json", JSON.stringify(config, {}, '\t'));
        } else {
            fs.writeFileSync("server/config.json", JSON.stringify(config, {}, '\t'));
            copied_server = true;
        }
        if (fs.existsSync("server/config.js")) {
            fs.writeFileSync("config.js", "let config = " + JSON.stringify({
                host: config.host,
                port: config.port
            }));
        } else {
            fs.writeFileSync("common/config.js", "let config = " + JSON.stringify({
                host: config.host,
                port: config.port
            }));
            copied_common = true;
        }

        process.stdout.write("   config.json written...\n\n");
        if (!copied_server) process.stdout.write(`   Copy \x1b[33m./config.json\x1b[0m to \x1b[33m./server/config.json\x1b[0m if it is correct\n\n`);

        process.stdout.write("   config.js written...\n\n");
        if (!copied_common) process.stdout.write(`   Copy \x1b[33m./config.js\x1b[0m to \x1b[33m./common/config.js\x1b[0m if it is correct\n\n`);

        process.stdout.write(`   To start the server on port \x1b[36m${config.port}\x1b[0m run:\n\n`);
        process.stdout.write(`           \x1b[35mcd server\x1b[0m\n\n`);
        process.stdout.write(`           \x1b[35msudo npm install\x1b[0m\n\n`);
        process.stdout.write(`           \x1b[35mnode server.js\x1b[0m\n\n`);

        process.stdout.write(`   Your admin panel is accessible at \x1b[32m${url}${config.path}/admin\x1b[0m\n\n`);

        process.stdout.write(`   Clients can connect to the default panel at \x1b[32m${url}${config.path}/client\x1b[0m\n`);
        process.stdout.write(`      Copy contents of \x1b[33m./client\x1b[0m folder to\n`);
        process.stdout.write(`         \x1b[33mthis directory\x1b[0m to make client url \x1b[32m${url}${config.path}/\n\n`);
    } else {
        process.stdout.write("\n   Configuration canceled...\n\n");
    }
    process.stdout.write(`   \x1b[33m
        ___                     __     
         | |__| /\\ |\\ ||_/  \\_//  \\/  \\
         | |  |/--\\| \\|| \\   | \\__/\\__/
                          \x1b[0m\n`);
    process.exit();
}

/* for (let i = 0; i < 100; i++) {
    console.log(random_key());
    //random_key();
} */
request_next()