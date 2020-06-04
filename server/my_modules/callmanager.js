let Call = require("./call");
let fs = require("fs");

class CallManager {
    constructor(ticket_id) {
        this.ticket_id = ticket_id;
        this.calls = {};
        this.lastCall = 1001;
        this.path = "./calls/" + ticket_id;
        this.has_directory = false;
        this.init();
    }

    init() {
        if (fs.existsSync(this.path)) {
            this.has_directory = true;
            this.getLastCallID();
        } else {

        }
    }

    /**
     * 
     * @returns {string}
     * @description Generate the next call id
     */
    genCallID() {
        let prefix = "PH";
        this.lastCall += 10;
        this.lastCall = Math.floor(this.lastCall / 10) * 10;
        this.lastCall += Math.floor(Math.random() * 10);
        return prefix + this.lastCall.toString();
    }

    getLastCallID() {
        let calls = fs.readdirSync(this.path);
        let max = this.lastCall;
        for (let call of calls) {
            this.calls[call] = new Call(call, this.ticket_id);
            let num = parseInt(call.substr(2));
            if (num > max) max = num;
        }
        this.lastCall = max;
    }

    generateControls() {
        let template = `<div class='call_control'><button>New Call</button>`;
        let end = "<button class='end'>End Call</button>";
        for (let call_id in this.calls) {
            let call = this.calls[call_id];
            template += `<div class='call'>
                            <label class='id'>${call_id}</label>
                            <div class='call_info'>
                                <label class='info'>Start Time:</label><div class='time'>${call.startTime}</div>
                                |
                                <label class='info'>End Time:</label><div class='time'>${call.endTime}</div>
                                <br>
                                <div onclick="toggleClass(this,'showing')" class="drop_down">
                                    <label>Notes:</label>
                                    <textarea ${call.ongoing ? "" : "disabled"}>${call.notes}</textarea>
                                </div>
                            </div>
                            ${call.ongoing ? end : ""}
                        </div>`;

        }
        template += "</div>";
        return template;
    }

    /**
     * 
     * @param {string} id 
     * @returns {Call}
     */
    getCall(id) {
        let call = this.calls[id];
        if (call) {
            return call;
        }
        return false;
    }

    newCall(start = true) {
        if (!this.has_directory) {
            fs.mkdirSync(this.path);
            this.has_directory = true;
        }
        let id = this.genCallID();
        let call = new Call(id, this.ticket_id);
        this.calls[id] = call;
        if (start) call.startCall();
        return call;
    }
}

module.exports = CallManager;