let Encryption = require("./encryption");
let fs = require("fs");

class Call {
    constructor(id, ticket_id) {
        this.startTime = "";
        this.endTime = "";
        this.ongoing = false;
        this.id = id;
        this.ticket_id = ticket_id;
        this.notes = "";
        this.path = `./calls/${ticket_id}/${this.id}`;
        this.init();
    }

    init() {
        if (fs.existsSync(this.path)) {
            this.load();
        } else {
            this.create();
        }
    }

    updateNotes(notes) {
        this.notes = notes;
        this.save();
    }

    endCall() {
        this.endTime = (new Date()).getTime();
        this.ongoing = false;
        this.save();
    }

    startCall() {
        this.startTime = (new Date()).getTime();
        this.ongoing = true;
        this.save();
    }

    create() {
        this.save();
    }

    load() {
        let data = fs.readFileSync(this.path);
        data = Encryption.decrypt(data);
        data = JSON.parse(data);
        this.startTime = data.start;
        this.endTime = data.end;
        this.notes = data.notes;
        this.ticket_id = data.ticket_id;
        console.log(data);
    }

    save() {
        let packet = {
            start: this.startTime,
            end: this.endTime,
            notes: this.notes,
            ongoing: this.ongoing,
            ticket_id: this.ticket_id
        }
        console.log(packet);
        let data = Encryption.encrypt(JSON.stringify(packet));
        fs.writeFileSync(this.path, data);
    }
}

module.exports = Call;