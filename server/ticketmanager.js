let Ticket = require("./ticket");
var fs = require('fs');
const CONTACT = "contact";
const QUEST = "questionnaire";
const DEFAULT = "default";

let templates = JSON.parse(fs.readFileSync("template.json"));
let template_cache = {};

function updateTemplates() {
    templates = JSON.parse(fs.readFileSync("template.json"));
    template_cache = {};
}

function getTemplate(type) {
    if (template_cache[type] == undefined) {
        if (templates[type] !== undefined) {
            let def = Object.assign({}, templates[DEFAULT]);
            let obj = Object.assign(def, templates[type]);
            let sorted = {};
            let sortable = [];
            for (let item in obj) {
                sortable.push([item, obj[item].priority]);
            }
            sortable.sort(function (a, b) {
                return a[1] - b[1];
            });
            sortable.forEach(function (item) {
                sorted[item[0]] = obj[item[0]];
            });

            template_cache[type] = sorted;
            return sorted;
        } else {
            return false;
        }
    } else {
        return template_cache[type];
    }
}

function getUserTemplate(type) {
    let template = getTemplate(type);
    if (template) {
        let temp = {};
        for (let item in template) {
            if (!template[item].internal) temp[item] = template[item];
        }
        return temp;
    } else {
        return false;
    }
}

class TicketManager {
    constructor() {
        this.ticketList = [];
        this.tickets = [];
        this.lastTicket = 13425;
        this.getTicketList();
    }

    updateTemplates() {
        updateTemplates();
    }

    getTemplate(type) {
        return getTemplate(type);
    }

    getUserTemplate(type, nonce) {
        let template = getUserTemplate(type);
        if (template) {
            return Object.assign(template, {
                nonce: nonce
            });
        } else {
            return false;
        }
    }

    getTicketList() {
        this.ticketList = {};
        let files = fs.readdirSync("tickets/open");
        files.sort(function (a, b) {
            return parseInt(b.substr(1)) - parseInt(a.substr(1));
        });
        this.ticketList["open"] = files;
        files = fs.readdirSync("tickets/closed");
        files.sort(function (a, b) {
            return parseInt(b.substr(1)) - parseInt(a.substr(1));
        });
        this.ticketList["closed"] = files;
        let max = this.lastTicket;
        let maxOpen = 0;
        let maxClosed = 0;
        if (this.ticketList.open.length > 0) {
            maxOpen = parseInt(this.ticketList["open"][0].substr(1));
        }

        if (this.ticketList.closed.length > 0) {
            maxClosed = parseInt(this.ticketList["closed"][0].substr(1));
        }

        max = Math.max(max, maxOpen, maxClosed);
        this.lastTicket = max;
        console.log(max, maxOpen, maxClosed);
    }

    getTicket(id) {
        if (this.tickets[id]) {
            return this.tickets[id];
        } else {
            return this.loadTicket(id);
        }
    }

    loadTicket(id) {
        let ticket = new Ticket(id);
        if (ticket.loaded) {
            this.tickets[id] = ticket;
            return ticket;
        } else {
            return false;
        }
    }

    genTicketNumber(type) {
        let prefix = this.getTemplate(type).letter_code.data;
        this.lastTicket += 10;
        this.lastTicket = Math.floor(this.lastTicket / 10) * 10;
        this.lastTicket += Math.floor(Math.random() * 10);
        return prefix + this.lastTicket.toString();
    }

    updateTicket(id) {
        let ticket = this.getTicket(id);
        if (ticket.open && ticket.data.status == "closed") {
            this.ticketList.closed.push(id);
            this.ticketList.open.splice(this.ticketList.open.indexOf(id), 1);
        }
        console.log(this.ticketList.closed);
        ticket.update();
    }

    newTicket(data, type) {
        let template = getTemplate(type);
        let verify = this.verifyTicket(data, template);

        if (verify.success) {
            let id = this.genTicketNumber(type);

            verify.data.id = id;

            let ticket = new Ticket(id, verify.data, type);
            this.ticketList.open.unshift(id);
            this.tickets[id] = ticket;
            return id;
        } else {
            return verify.failed;
        }
    }

    verifyTicket(data, template) {
        let failed = [];
        for (let field in template) {
            let check = template[field];
            if (check.required) {
                if (!data[field] || data[field].trim() == "") {
                    failed.push(field);
                }
            }
            if (check.verify) {
                let reg = new RegExp(check.verify);
                if (!reg.test(data[field]) && !failed.includes(field)) {
                    failed.push(field);
                }
            }
            if (!data[field]) data[field] = "";
        }
        if (failed.length > 0) {
            return {
                success: false,
                failed: failed
            }
        } else {
            return {
                success: true,
                data: data
            }
        }
    }
}

module.exports = TicketManager;