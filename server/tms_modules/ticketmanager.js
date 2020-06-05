let Ticket = require("./ticket");
let CallManager = require("./callmanager");
var fs = require('fs');
const CONTACT = "contact";
const QUEST = "questionnaire";
const DEFAULT = "default";

let templates = JSON.parse(fs.readFileSync("template.json"));
let template_cache = {};
class Template {
    constructor() {

    }
}
/**
 * @description Re-read template file
 */
function updateTemplates() {
    templates = JSON.parse(fs.readFileSync("template.json"));
    template_cache = {};
}

/**
 * 
 * @param {string} type 
 * @description Get template data
 */
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


/**
 * 
 * @param {string} type 
 * @description Get template less internal values
 */
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
/**
 * @description Manages tickets
 */
class TicketManager {
    constructor() {
        this.ticketList = [];
        this.tickets = [];
        this.lastTicket = 13425;
        this.getTicketList();
    }

    /**
     * @description Refresh template cache
     */
    updateTemplates() {
        updateTemplates();
    }

    /**
     * @description Get all raw templates
     * @returns {Template}
     */
    getAllTemplates() {
        let out = {};
        for (let type in templates) {
            out[type] = getTemplate(type);
        }
        return out;
    }

    /**
     * 
     * @param {string} type 
     * @description Get single raw template
     * @returns {Template}
     */
    getTemplate(type) {
        return getTemplate(type);
    }

    /**
     * 
     * @param {string} type 
     * @param {string} nonce 
     * @description Prepare and fetch a template for user
     * @returns {Template}
     */
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

    /**
     * @description Build internal ticket lists
     */
    getTicketList() {
        this.ticketList = {};
        let files = fs.readdirSync("tickets/open");
        this.sortTickets(files);
        this.ticketList["open"] = files;
        files = fs.readdirSync("tickets/closed");
        this.sortTickets(files);
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
    }

    sortTickets(tickets) {
        tickets.sort(function (a, b) {
            return parseInt(b.substr(1)) - parseInt(a.substr(1));
        });
    }

    sortTicketLists() {
        let parent = this;
        for (let list in this.ticketList) {
            this.sortTickets(this.ticketList[list]);
        }
    }

    getAllData() {
        let tickets = this.ticketList.open.slice();
        tickets.push(...this.ticketList.closed);
        console.log(tickets);
        let packet = {};
        for (let ticket of tickets) {
            packet[ticket] = this.getTicket(ticket).getAllData();
        }
        return {
            tickets: packet
        };
    }

    /**
     * 
     * @param {string} id 
     * @returns {Ticket}
     * @description Get a Ticket
     */
    getTicket(id) {
        if (this.tickets[id]) {
            return this.tickets[id];
        } else {
            return this.loadTicket(id);
        }
    }

    getUserTicket(id) {
        let ticket = this.getTicket(id);
        let template = getTemplate(ticket.type);
        if (template) {
            let temp = {};
            for (let item in template) {
                if (!template[item].internal) temp[item] = ticket.data[item];
            }
            temp["type"] = ticket.type;
            temp.status = ticket.data.status;
            return temp;
        } else {
            return false;
        }
    }

    /**
     * 
     * @param {string} id 
     * @returns {Ticket}
     * @description Initialize and read a ticket
     */
    loadTicket(id) {
        let ticket = new Ticket(id);
        if (ticket.loaded) {
            this.tickets[id] = ticket;
            return ticket;
        } else {
            return false;
        }
    }

    /**
     * 
     * @param {string} type 
     * @returns {string}
     * @description Generate the next ticket number
     */
    genTicketNumber(type) {
        let prefix = this.getTemplate(type).letter_code.data;
        this.lastTicket += 10;
        this.lastTicket = Math.floor(this.lastTicket / 10) * 10;
        this.lastTicket += Math.floor(Math.random() * 10);
        return prefix + this.lastTicket.toString();
    }

    /**
     * 
     * @param {string} id 
     * @returns {boolean}
     * @description Trigger an update to a ticket
     */
    updateTicket(id) {
        let ticket = this.getTicket(id);
        if (ticket.open && ticket.data.status == "closed") {
            this.ticketList.closed.push(id);
            this.ticketList.open.splice(this.ticketList.open.indexOf(id), 1);
            this.sortTicketLists();
        } else if (!ticket.open && ticket.data.status != "closed") {
            this.ticketList.open.push(id);
            this.ticketList.closed.splice(this.ticketList.closed.indexOf(id), 1);
            this.sortTicketLists();
        }
        return ticket.update();
    }

    /**
     * 
     * @param {Object} data 
     * @param {string} type 
     * @returns {*}
     * @description Generate a new ticket and if successful return the id
     */
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

    searchTickets(value) {
        let results = [];
        for (let ticket_id of this.ticketList.open) {
            let ticket = this.getTicket(ticket_id);
            if (ticket) {
                let match = ticket.simpleMatch(value);
                if (match) {
                    results.push(ticket_id);
                }
            }
        }
        return results;
    }

    /**
     * 
     * @param {Object} data 
     * @param {string} template 
     * @description Verify the contents of a new ticket against its template
     * @returns {*}
     */
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