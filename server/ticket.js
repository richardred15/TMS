let fs = require("fs");
let Encryption = require("./encryption");

class Ticket {
    constructor(id, data, type = "unknown") {
        this.id = id;
        this.open = true;
        this.archived = false;
        this.type = type;

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

    archive() {
        if (!this.open) {
            fs.unlinkSync("tickets/archive/" + this.id);
            this.archived = true;
            this.data.status = "archived";
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
        else if (!this.archived) path += "closed/";
        else path += "archive/";
        return path;
    }

    load() {
        if (fs.existsSync("tickets/closed/" + this.id)) this.open = false;
        else if (!fs.existsSync("tickets/open/" + this.id)) return false;
        let data = fs.readFileSync(this.path() + this.id);
        data = Encryption.decrypt(data);
        this.data = JSON.parse(data);
        if (this.type == "unknown") {
            let idKey = this.id.substr(0, 1);
            switch (idKey) {
                case "C":
                    this.type = "contact";
                    break;
                case "Q":
                    this.type = "questionnaire";
                    break;
                case "A":
                    this.type = "admin";
                    break;
            }
        }
        return true;
    }

    update() {
        if (this.open && this.data.status == "closed") {
            this.close();
        }
        return this.save();
    }

    save() {
        try {
            let data = JSON.stringify(this.data);
            data = Encryption.encrypt(data);
            console.log("Save Data:");
            console.log(data);
            fs.writeFileSync(this.path() + this.id, data);
            return true;
        } catch (e) {
            console.log(e);
            return false
        }
    }
}

module.exports = Ticket;