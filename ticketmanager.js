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
        return template_cache[type];
    }
}

function getUserTemplate(type) {
    let template = getTemplate(type);
    let temp = {};
    for (let item in template) {
        if (!template[item].internal) temp[item] = template[item];
    }
    return temp;
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

    getUserTemplate(type) {
        return getUserTemplate(type);
    }

    getTicketList() {
        this.ticketList = fs.readdirSync("tickets/open");
        this.ticketList.push(...fs.readdirSync("tickets/closed"));
        let max = this.lastTicket;
        for (let ticket of this.ticketList) {
            let num = parseInt(ticket.substr(1));
            if (num > max) max = num;
        }
        this.lastTicket = max;
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
        let prefix = "K";
        switch (type) {
            case CONTACT:
                prefix = "C";
                break;
            case QUEST:
                prefix = "Q";
                break;
        }
        this.lastTicket += 10;
        this.lastTicket = Math.floor(this.lastTicket / 10) * 10;
        this.lastTicket += Math.floor(Math.random() * 10);
        return prefix + this.lastTicket.toString();
    }

    newTicket(data, type) {
        let template = getTemplate(type);
        let verify = this.verifyTicket(data, template);

        if (verify.success) {
            let id = this.genTicketNumber(type);

            verify.data.id = id;

            let ticket = new Ticket(id, verify.data);
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