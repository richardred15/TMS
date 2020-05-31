let fs = require("fs");

class Ticket {
    constructor(id, data) {
        this.id = id;
        this.open = true;
        if (data !== undefined) {
            this.data = data;
            this.data.posted = (new Date()).toString();
            this.data.status = 'unread';
            this.save();
            this.loaded = true;
        } else {
            this.loaded = this.load();
        }
    }

    close() {
        if (this.open) {
            fs.unlinkSync("tickets/open/" + this.id);
            this.open = false;
            this.data.status = "closed";
            this.save();
        }
    }

    setStatus(status) {
        this.data.status = status;
        this.save();
    }

    path() {
        let path = "tickets/";
        if (this.open) path += "open/";
        else path += "closed/";
        return path;
    }

    load() {
        if (fs.existsSync("tickets/closed/" + this.id)) this.open = false;
        else if (!fs.existsSync("tickets/open/" + this.id)) return false;
        this.data = JSON.parse(fs.readFileSync(this.path() + this.id));
        return true;
    }

    save() {

        fs.writeFileSync(this.path() + this.id, JSON.stringify(this.data));
    }
}

module.exports = Ticket;