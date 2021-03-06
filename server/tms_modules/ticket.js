let fs = require("fs");
let Encryption = require("./encryption");
let CallManager = require("./callmanager");

class Ticket {
    constructor(id, data, type = "unknown") {
        this.id = id;
        this.open = true;
        this.archived = false;
        this.type = type;
        this.fulltext = "";
        this.fulltext_items = ["name", "email", "phone", "notes", "comments", "id", "user_id"];
        this.call_manager = new CallManager(this.id);
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

    startCall(number) {
        let call = this.call_manager.newCall(number ? number : this.data.phone);
        return call;
    }

    endCall(id) {
        let call = this.call_manager.getCall(id);
        if (call) {
            call.endCall();
        }
        return call;
    }

    updateCallNotes(id, notes) {
        let call = this.call_manager.getCall(id);
        if (call) {
            call.updateNotes(notes);
            return call.getData();
        }
        return false;
    }

    getCallData() {
        return this.call_manager.getCallData();
    }

    getAllData() {
        let packet = {
            ticket_data: this.data,
            call_data: this.call_manager.getCallData()
        }
        return packet;
    }

    getCallControls() {
        return this.call_manager.generateControls();
    }

    setClosed() {
        if (this.open) {
            fs.unlinkSync("tickets/open/" + this.id);
            this.open = false;
            this.data.status = "closed";
            this.save();
        }
    }

    setOpen() {
        if (!this.open) {
            fs.unlinkSync("tickets/closed/" + this.id);
            this.open = true;
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
        try {
            if (fs.lstatSync("tickets/closed/" + this.id).isDirectory()) return false;
        } catch {}
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
        this.generateFulltext();
        return true;
    }

    update() {
        if (this.open && this.data.status == "closed") {
            this.setClosed();
        } else if (!this.open && this.data.status != "closed") {
            this.setOpen();
        }
        return this.save();
    }

    simpleMatch(term) {
        let reg = new RegExp(`.*${term}.*`, "gi");
        return reg.test(this.fulltext);
    }

    generateFulltext() {
        this.fulltext = "";
        for (let item of this.fulltext_items) {
            if (this.data[item]) {
                this.fulltext += this.data[item].toString();
            }
        }
    }

    save() {
        try {
            this.generateFulltext();
            let data = JSON.stringify(this.data);
            data = Encryption.encrypt(data);
            fs.writeFileSync(this.path() + this.id, data);
            return true;
        } catch (e) {
            console.log(e);
            return false
        }
    }
}

module.exports = Ticket;