let Ticket = require("./ticket");
var fs = require('fs');
const CONTACT = "contact";
const QUEST = "questionnaire";
const DEFAULT = "default";

let templates = JSON.parse(fs.readFileSync("template.json"));
let template_cache = {};

function getTemplate(type) {
    if (template_cache[type] == undefined) {
        let obj = Object.assign(templates[DEFAULT], templates[type]);
        template_cache[type] = obj;
        return obj;
    } else {
        return template_cache[type];
    }
}

class TicketManager {
    constructor() {
        this.ticketList = [];
        this.tickets = [];
        this.lastTicket = 13425;
        this.getTicketList();

        this.newTicket({
            "name": "Richard",
            "email": "richardred15@gmail.com"
        }, CONTACT);
    }

    getTicketList() {
        this.ticketList = fs.readdirSync("tickets");
        let max = this.lastTicket;
        for (let ticket of this.ticketList) {
            let num = parseInt(ticket.substr(1));
            if (num > max) max = num;
        }
        this.lastTicket = max;
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
            console.log(verify.data);
            let id = this.genTicketNumber(type);
            this.tickets[id] = new Ticket(id, verify.data);
        } else {
            console.log("FAILED");
            console.log(verify.failed);
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