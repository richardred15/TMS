let fs = require("fs");

class Ticket {
    constructor(id, data) {
        this.id = id;
        this.data = data;

        this.save();
    }

    save() {
        fs.writeFileSync("tickets/" + this.id, JSON.stringify(this.data));
    }
}

module.exports = Ticket;