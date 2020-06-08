Element.prototype.addClass = function (name) {
    if (!this.hasClass(name)) this.className = (this.className + " " + name).trim();
}

Element.prototype.removeClass = function (name) {
    this.className = this.className.replace(name, "").replace("  ", " ").trim();
}

Element.prototype.hasClass = function (name) {
    return this.className.indexOf(name) !== -1;
}

Element.prototype.toggleClass = function (name) {
    if (this.hasClass(name)) {
        this.removeClass(name);
    } else {
        this.addClass(name);
    }
}

/* function toggleClass(elm, clss) {
    let className = elm.className;
    if (className.indexOf(clss) == -1) {
        className += " " + clss;
    } else {
        className = className.replace(clss, "").replace("  ", " ");
    }
    elm.className = className.trim();
} */





let keys_down = [];
window.onkeydown = function (e) {
    if (keys_down.indexOf(e.keyCode) == -1)
        keys_down.push(e.keyCode);
}
window.onkeyup = function (e) {
    let i = keys_down.indexOf(e.keyCode);
    keys_down.splice(i, 1);
}
window.onblur = function () {
    keys_down = [];
}

function isKeyDown(keyCode) {
    let isIt = keys_down.indexOf(keyCode) != -1;
    return isIt;
}

class Helper {
    static formatTime(time) {
        return ("0" + time).substr(-2);
    }

    static formatDuration(start, end) {
        let duration = (new Date(end)) - (new Date(start));
        let seconds = Math.floor(duration / 1000);
        let minutes = Math.floor(seconds / 60);
        let hours = Math.floor(minutes / 60);
        return `${Helper.formatTime(hours)}:${Helper.formatTime(minutes%60)}:${Helper.formatTime(seconds%60)}`;
    }
}
class StyleParser {
    static getStyle(elm) {
        var css = window.getComputedStyle(elm);
        let div = document.createElement("div");
        elm.parentElement.insertBefore(div, elm);
        var comp = window.getComputedStyle(div);
        var style = ""
        for (var i = 0; i < css.length; i++) {
            if (css.getPropertyValue(css[i]) != comp.getPropertyValue(css[i])) {
                style += `${css[i]}:${css.getPropertyValue(css[i])};`;
            }
        }
        div.remove();
        return style;
    }

    static getSelector(elm) {
        let selector = elm.tagName.toLowerCase();
        if (elm.id != "") selector += `#${elm.id}`;
        if (elm.className != "") selector += "." + elm.className.split(" ").join(".")
        return selector;
    }

    static getStyles(element = document.body) {
        let styles = {};
        for (let elm of element.childNodes) {
            if (elm.tagName == "SCRIPT" || !elm.tagName) continue;
            styles[getSelector(elm)] = getStyles(elm);
        }
        let style = getStyle(element);
        styles[getSelector(element)] = style;
        return styles;
    }

    static getStyleArray(styles, parent = "") {
        let final = parent.trim();
        let children = [];
        for (let selector in styles) {
            if (typeof styles[selector] != "string") {
                children.push(getStyleArray(styles[selector], parent + " " + selector));
            } else {
                //final += " " + selector;
            }
        }
        return [final, children];
    }

    static applyStyles(data) {
        let selector = data[0];
        let children = data[1];
        if (children.length > 0) {
            for (let child of children) {
                applyStyles(child);
            }
        } else {
            console.log(selector);
            //document.querySelector(selector).style.color = "red";
        }
    }
}

class DisplayController {
    constructor() {
        this.UIData = {
            "ticket": [
                ["admin.TA.newTicket()", "New Ticket"],
                ["admin.TA.closeTicket()", "Close Ticket"],
                ["admin.TA.hideTicket()", "Hide Ticket"],
                ["admin.TA.requestPopout()", "Popout Ticket"],
                ["admin.TA.showOpenDisplayData()", "Open"],
                ["admin.TA.showClosedDisplayData()", "Closed"]
            ],
            "user": [
                ["", "New User"],
                ["", "Clone User"],
                ["", "Hide User"],
                ["", "Popout User"],
                ["", "Staff"],
                ["", "Customers"]
            ]
        }

        this.template = `
        <div class="nav">
            <ul>
                <li onclick="$0">$1</li>
                <li onclick="$0">$1</li>
                <li onclick="$0">$1</li>
                <li onclick="$0">$1</li>
            </ul>
            <input id="$type_search_box" class="search_box" placeholder="Search" />
        </div>
        <div id="$type_tabs" class="tab_container">
            <div onclick="$0" class="tab open selected">$1</div>
            <div onclick="$0" class="tab closed">$1</div>
        </div>
        <div id="$type_list" class="list"></div>
        <div id="$type" class="$type data_container"></div>
        <div id="loader" class="loader"></div>
        `;
    }

    getTemplate(type) {
        let data = this.UIData[type];
        let lines = this.template.split("\n")
        let index = 0;
        let newLines = "";
        for (let line of lines) {
            line = line.replace(/\$type/g, type);
            if (line.indexOf("$0") !== -1) {
                for (let i in data[index]) {
                    let item = data[index][i];
                    line = line.replace("$" + i, item);
                }
                index++;
            }
            newLines += line + "\n";
        }
        return newLines;
    }

    generateUI() {
        let panel_container = document.createElement("div");
        panel_container.id = "panel_container";
        let ticket_panel = document.createElement("div");
        ticket_panel.id = "ticket_panel";
        ticket_panel.className = "panel";
        let user_panel = document.createElement("div");
        user_panel.id = "user_panel";
        user_panel.className = "panel";
        let template = this.getTemplate("ticket");
        ticket_panel.innerHTML = template;
        template = this.getTemplate("user");
        user_panel.innerHTML = template;
        panel_container.appendChild(ticket_panel);
        //panel_container.appendChild(user_panel);
        document.body.appendChild(panel_container);
    }
}

class UserAdmin {
    constructor() {

    }

}

class Admin {
    constructor(server_url, connect = true) {
        this.display = new DisplayController();
        this.display.generateUI();
        this.server_url = server_url;
        this.socket = false;
        if (connect) this.connect();
        this.TA = new TicketAdmin(this.socket);
        this.UA = new UserAdmin(this.socket);
    }

    connect() {
        let socket = io(this.server_url);
        this.socket = socket;
    }

    on(event, func) {
        if (this.connect) {
            this.socket.on(event, func);
        }
    }
}

class TicketAdmin {
    constructor(socket) {
        this.ticket_container = document.getElementById("ticket");
        this.ticket_list_container = document.getElementById("ticket_list");
        this.ticket_tabs = document.getElementById("ticket_tabs");
        this.ticket_panel = document.getElementById("ticket_panel");
        this.search_box = document.getElementById("ticket_search_box");
        this.audio = document.createElement("audio");
        this.audio.src = "ding.wav";
        this.ticket_type = "questionnaire";
        this.ticket_data = {};
        this.ticket_id = "";
        this.call_id = "";
        this.form_templates = {};
        this.current_tab = "open";
        this.logged_in = false;
        this.notes_timeout = undefined;
        this.call_notes_timeout = undefined;
        this.awaiting_call = false;
        this.type_elements = {
            "text": "input",
            "message": "textarea",
            "selection": "select",
            "phone": "input",
            "email": "input",
            "password": "password"
        }
        this.internal_list = {};
        this.connect(socket);
        this.history = {
            tickets: [],
            index: -1
        };
        this.time_timeouts = [];
        if (this.search_box) {
            let parent = this;
            this.search_box.oninput = function (e) {
                parent.searchBoxInput(e);
            };
        }
    }

    setTimes() {
        for (let timeout of this.time_timeouts) {
            clearTimeout(this.time_timeouts);
        }
        let parent = this;
        document.querySelectorAll(".timeago").forEach(function (e) {
            parent.setTime(e);
        });
    }

    setTime(elm) {
        let time_string = elm.getAttribute("value");
        elm.innerHTML = timeAgo(time_string);
        let time_diff = (new Date()) - (new Date(time_string));
        let timeout = this.calculateTimeout(time_diff);
        let timeout_id = setTimeout(function (parent) {
            parent.setTime(elm);
        }, timeout, this);
        elm.setAttribute("timeout", timeout_id);
    }

    calculateTimeout(diff) {
        diff /= 1000;
        if (diff < 5) {
            return 5000 - (diff * 1000);
        } else if (diff < 30) {
            return 1000;
        } else if (diff < 60) {
            return 5000;
        } else if (diff < 3600) {
            return 60000;
        } else {
            return 300000;
        }
    }

    showLogin() {
        this.ticket_container.innerHTML = "";
        this.ticket_list_container.innerHTML = "";
        this.ticket_tabs.removeClass("logged_in");
        let loginForm = document.createElement("form");
        loginForm.id = "ticket_form";
        loginForm.addClass("form_container")
        loginForm.setAttribute('onsubmit', 'return false;');
        let html = `
            <label>Username:</label><input type="text" name="username" />
            <label>Password:</label><input type="password" name="password" />
            <button onclick='admin.TA.login()'>Login</button>
        `;
        loginForm.innerHTML = html;
        this.ticket_container.appendChild(loginForm);
        this.clearSelectedOption();
    }

    login() {
        let username = this.ticket_container.querySelector("[name=username]").value;
        let password = this.ticket_container.querySelector("[name=password]").value;
        this.ticket_panel.addClass("waiting");
        //this.ticket_panel.className = "waiting";
        this.socket.emit('login', {
            username: username,
            password: password
        });
    }

    closeTicket() {
        if (!this.logged_in) return false;
        if (this.ticket_id != "") {
            let data = this.getFormData();
            data.status = "closed";
            let packet = {
                id: this.ticket_id,
                type: this.ticket_type,
                data: data
            }
            this.socket.emit('admin_update_ticket', packet);
            this.hideTicket();
            this.ticket_id = "";
        }
    }

    hideTicket(ticket_id = this.ticket_id) {
        this.clearSelectedOption();
        this.ticket_container.innerHTML = `<h2 style="margin-left:20px;">Please select a ticket</h2>`;
    }

    updateTicket() {
        if (!this.logged_in) return false;
        let packet = {
            id: this.ticket_id,
            type: this.ticket_type,
            data: this.getFormData()
        }
        this.socket.emit('admin_update_ticket', packet);
    }

    updateNotes() {
        if (!this.logged_in || this.ticket_id == "") return false;
        let packet = {
            id: this.ticket_id,
            notes: this.ticket_container.querySelector("[name=notes]").value
        }
        this.socket.emit('admin_update_notes', packet);
    }

    newTicket() {
        if (!this.logged_in) return false;
        this.clearSelectedOption();
        this.populateDisplay("admin");
        this.ticket_type = "admin";
        this.ticket_id = "";
        let button = this.ticket_panel.querySelector(".action_container button");
        let parent = this;
        button.onclick = () => {
            parent.submitNew()
        };
        button.innerHTML = "Submit";
    }

    submitNew() {
        if (!this.logged_in) return false;
        let packet = {
            type: this.ticket_type,
            data: this.getFormData()
        }
        this.socket.emit('submit_user', packet);
    }

    requestTemplate() {
        if (!this.logged_in) return false;
        this.socket.emit('admin_templates');
    }

    requestListAll() {
        if (!this.logged_in) return false;
        this.socket.emit('admin_list_all');
    }

    requestDisplayData() {
        if (!this.logged_in) return false;
        this.current_tab = "open";
        this.selectTab("open");
        let list = this.internal_list.open.slice();
        list.push(...this.internal_list.closed);
        this.socket.emit('admin_get_display_data', {
            list: list
        });
    }

    showOpenDisplayData() {
        if (!this.logged_in) return false;
        this.current_tab = "open";
        this.selectTab("open");
        this.ticket_list.className = "";
    }

    showClosedDisplayData() {
        if (!this.logged_in) return false;
        this.current_tab = "closed";
        this.selectTab("closed");
        this.ticket_list.className = "closed";
    }

    selectTab(name) {
        document.querySelectorAll("#ticket_tabs .tab").forEach(function (elm) {
            elm.className = elm.className.replace("selected", "").replace("  ", "").trim();
        });
        document.querySelector("#ticket_tabs ." + name).className += " selected";
    }

    connect(socket) {
        if (socket) {
            let parent = this;

            socket.on('connect', function (data) {
                parent.showLogin();
            });

            socket.on('disconnect', function (data) {
                parent.showLogin();
            });

            socket.on('list_all', function (data) {
                parent.handleList(data);
            });

            socket.on('admin_templates', function (data) {
                parent.handleTemplate(data);
            });

            socket.on('admin_ticket_data', function (data) {
                parent.handleTicket(data);
            });

            socket.on('admin_display_data', function (data) {
                parent.handleDisplayData(data);
            });

            socket.on('search_results', function (data) {
                parent.handleSearchResults(data);
            });

            socket.on('note_update_status', function (data) {
                if (data.status == "success") {
                    parent.ticket_container.querySelector("[name=notes].outdated").className = "";
                }
            });

            socket.on('call_update', function (data) {
                parent.handleCallUpdate(data);
            });

            socket.on('ticket_update', function (data) {
                let opt = document.getElementById(data.id);
                let selected = false;
                if (opt) {
                    if (opt.className.indexOf("selected") !== -1) selected = true;
                    opt.className = "option" + (selected ? " selected" : "");
                    opt.className += " " + data.data.status;
                    parent.placeOption(opt, data.data.status == "closed");
                } else {
                    let opt = parent.generateOption(data.id, data.data);
                    parent.setTime(opt.querySelector(".timeago"));
                    parent.placeOption(opt, data.data.status == "closed");
                    parent.internal_list[data.data.status == "closed" ? "closed" : "open"].push(data.id);
                    parent.audio.play();
                }
                if (parent.ticket_id == data.id) {
                    parent.fillForm({
                        type: parent.ticket_type,
                        data: data.data
                    });
                }
            });

            socket.on('login', function (data) {
                if (data.status === "success") {
                    document.querySelectorAll(".nav ul").forEach(e => e.addClass("logged_in")); //toggleClass(e, "logged_in"));
                    document.querySelectorAll(".tab_container").forEach(e => e.addClass("logged_in")); //toggleClass(e, "logged_in"));
                    parent.ticket_container.innerHTML = `<h2 style="margin-left:20px;">Please select a ticket</h2>`;
                    parent.logged_in = true;
                    parent.requestListAll();
                    parent.requestTemplate();
                    parent.server_url = data.server_url;
                } else {
                    alert(data.message);
                }
                parent.ticket_panel.removeClass("waiting");
                //toggleClass(parent.ticket_panel, "waiting");
                //parent.ticket_panel.className = "";
            });

            socket.on('result_user', (data) => this.handleResult(data));
            socket.on('admin_nonce', (data) => this.handlePopout(data));
            this.socket = socket;
        }
    }

    placeOption(opt, closed = false) {
        let selector = ".option" + (closed ? ".closed" : "");
        let opts = this.ticket_list.querySelectorAll(selector);
        let placed = false;
        for (let e of opts) {
            if (parseInt(e.id.substr(1)) < parseInt(opt.id.substr(1))) {
                this.ticket_list.insertBefore(opt, e);
                placed = true;
                break;
            }
        }
        if (!placed) {
            this.ticket_list.appendChild(opt);
        }
    }

    searchBoxInput(e) {
        clearTimeout(this.search_timeout);
        this.search_timeout = setTimeout(function (value, ta) {
            ta.setSelectedOption("");
            ta.search(value);
        }, 300, e.target.value, this)
    }

    search(term) {
        if (this.logged_in) {
            term = term.trim();
            if (term == "") {
                this.ticket_container.innerHTML = `<h2 style="margin-left:20px;">Please select a ticket</h2>`;
            } else {
                this.socket.emit('admin_search', {
                    term: term
                });
            }
        }
    }

    handleCallUpdate(data) {
        if (data.id != this.editing_call_notes) {
            if (data.ticket_id == this.ticket_id) {
                let elm = document.getElementById(data.id);
                let newElm = this.generateCallContainer(data);
                if (elm) {
                    this.call_control_container.insertBefore(newElm, elm);
                    if (elm.querySelector(".drop_down").className.indexOf("showing") != -1) {
                        newElm.querySelector(".drop_down").className += " showing";
                    }
                    if (elm.className.indexOf("showing") != -1) {
                        newElm.className += " showing";
                    }
                    elm.querySelectorAll(".duration .time").forEach(e => {
                        if (e.hasAttribute("interval")) {
                            let interval = e.getAttribute("interval");
                            clearInterval(interval);
                        }
                    });
                    elm.remove();

                } else {
                    this.call_control_container.appendChild(newElm);
                }
                if (this.awaiting_call) {
                    let label = newElm.querySelector("label");
                    label.click();
                    this.awaiting_call = false;
                }
            }
        } else {
            //this.editing_call_notes = "";
        }
    }

    handleSearchResults(data) {
        this.ticket_container.innerHTML = "";
        if (data.results == undefined || data.results.length == 0) {
            this.ticket_container.innerHTML = `
                <div class='search_result'>
                    <h2>No results</h2>
                    <h4>Try another term or select a ticket</h4>
                </div>
            `;
        } else {
            for (let result_data of data.results) {
                let result = document.createElement("div");
                let parent = this;
                result.onclick = function () {
                    parent.getTicket(result_data.id);
                }
                result.className = "search_result";
                let header = document.createElement("h2");
                header.innerHTML = result_data.id;
                let name = document.createElement("h4");
                name.innerHTML = `${result_data.name} | ${result_data.email} | ${result_data.phone}`;
                let posted = document.createElement("label");
                posted.className = "small";
                posted.innerHTML = timeAgo(result_data.posted);
                result.appendChild(header);
                result.appendChild(name);
                result.appendChild(posted);
                this.ticket_container.appendChild(result);
            }
        }
    }

    handlePopout(data) {
        let ticket = data.ticket;
        let id = this.socket.id;
        let nonce = data.nonce;
        let url = `${this.server_url}/admin/viewticket?ticket=${ticket}&id=${id}&nonce=${nonce}`;
        window.open(url, "", "width=800,height=800");
    }

    requestPopout(ticket_id) {
        if (this.logged_in) {
            this.socket.emit('admin_nonce', {
                ticket: ticket_id || this.ticket_id
            });
        }
    }

    handleResult(data) {
        this.output.innerHTML = "";
        if (data.result == "failure") {
            for (let item of data.data) {
                if (item == "nonce") continue;
                document.querySelector(`[name=${item}]`).style.backgroundColor = "#ffaaaa";
            }
            this.output.appendChild(this.failureData(data.data));
            this.output.className = "failure";
        } else {
            this.submitted = true;
            this.form.addClass("success");
            this.output.addClass("success");
            this.submit_button.style.display = "none";
            let i = 5;
            this.output.innerHTML = `<label>Ticket Number: ${data.data}</label><label>SUCCESS<label id="redirect_countdown">Selecting in ${i} seconds (click to cancel)</label></label>`;
            let parent = this;
            let interval;
            let redirect_label = document.getElementById("redirect_countdown");
            this.output.onclick = function () {
                redirect_label.innerHTML = "Selection Canceled";
                clearInterval(interval);
                setTimeout(function () {
                    parent.hideTicket();
                    parent.output.onclick = undefined;
                }, 500);
            }
            interval = setInterval(function () {
                i--;
                redirect_label.innerHTML = `Selecting in ${i} seconds (click to cancel)`;
                if (i <= 0) {
                    clearInterval(interval);
                    parent.requestListAll();
                    parent.getTicket(data.data);
                    parent.output.onclick = undefined;
                }
            }, 1000);
        }
    }

    failureData(data) {
        let div = document.createElement("div");
        for (let item of data) {
            let label = document.createElement("label");
            label.innerHTML = `Please enter a valid ${item}!`;
            div.appendChild(label);
        }
        return div;
    }

    handleDisplayData(data) {
        if (!this.logged_in) return false;
        let parent = this;
        let wrapper = document.createElement("div");
        this.ticket_list = document.createElement("div");
        for (let ticket in data.data) {
            let opt = this.generateOption(ticket, data.data[ticket]);
            this.ticket_list.appendChild(opt);
        }
        if (this.ticket_id != "") this.ticket_list.querySelector("#" + this.ticket_id).className += " selected";
        this.ticket_list_container.innerHTML = "";
        wrapper.appendChild(this.ticket_list);
        this.ticket_list_container.appendChild(wrapper);
        this.setTimes();
    }

    generateOption(ticket, data) {
        let opt = document.createElement("div");
        opt.value = ticket;
        opt.className = "option " + data.status;
        opt.innerHTML = `<label class="small"></label> ${ticket} <label class="timeago" value="${data.posted}">${timeAgo(data.posted)}</label>`;

        opt.id = ticket;
        let parent = this;
        opt.onclick = function (e) {
            parent.getTicket(ticket);
        }
        return opt;
    }

    handleList(data) {
        if (!this.logged_in) return false;
        this.internal_list = data.data;
        //this.requestOpenDisplayData();
        this.requestDisplayData();
    }

    handleTemplate(data) {
        if (!this.logged_in) return false;
        for (let temp in data.data) {
            this.form_templates[temp] = data.data[temp];
        }
    }

    handleTicket(data) {
        if (!this.logged_in) return false;
        clearTimeout(this.waiting_timeout);
        this.waiting_timeout = setTimeout(function () {
            this.ticket_panel.removeClass("waiting");
        }, 500);

        this.ticket_type = data.type;
        this.ticket_data = data;
        this.populateDisplay(data.type);
        this.fillForm(data);

        this.call_control_container = this.generateCallControls(data.call_data, data.data.status != "closed");
        this.form.prepend(this.call_control_container);
        this.setSelectedOption(data.data.id);
    }

    updateCallNotes(call_id, notes) {
        clearTimeout(this.call_notes_timeout);
        setTimeout(function (parent) {
            parent.sendNotes(call_id, notes);
        }, 300, this);
    }

    sendNotes(call_id, notes) {
        this.socket.emit('call_notes', {
            ticket_id: this.ticket_id,
            id: call_id,
            notes: notes
        });
    }

    endCall(call_id) {
        this.socket.emit('end_call', {
            ticket: this.ticket_id,
            call: call_id
        });
    }

    startCall() {
        if (this.ticket_data.data.status != "closed") {
            let number = prompt("Number You are Calling", `${this.ticket_data.data.phone}`);
            if (number) {
                this.socket.emit('start_call', {
                    ticket: this.ticket_id,
                    number: number
                });
                this.awaiting_call = true;
            }
        }
    }

    generateCallControls(calls, open = true) {
        let call_control_container = document.createElement("div");
        call_control_container.className = "call_control drop_down";
        call_control_container.innerHTML = `<label onclick="this.parentElement.toggleClass('showing')">Customer Interactions</label>`;
        if (open) {
            let new_call_button = document.createElement("button");
            new_call_button.innerHTML = "New Call";
            let parent = this;
            new_call_button.onclick = function () {
                parent.startCall();
            }
            call_control_container.appendChild(new_call_button);

            let new_email_button = document.createElement("button");
            new_email_button.innerHTML = "New Email";
            new_email_button.onclick = function () {
                parent.newEmail();
            }
            call_control_container.appendChild(new_email_button);
        }
        for (let call of calls) {
            let callDiv = this.generateCallContainer(call, open);
            call_control_container.appendChild(callDiv);
        }
        return call_control_container;
    }

    generateCallContainer(call, open = true) {
        let startDate = (new Date(call.start));
        let startStr = ` ${startDate.toLocaleTimeString()}  <label class='small'>${startDate.toLocaleDateString()}</label>`;
        let endStr;
        if (call.end != 0) {
            let endDate = (new Date(call.end));
            endStr = ` ${endDate.toLocaleTimeString()}  <label class='small'>${endDate.toLocaleDateString()}</label>`;
        } else {
            endStr = `ongoing`;
        }
        let parent = this;
        let callDiv = document.createElement("div");
        callDiv.className = "call drop_down";
        callDiv.id = call.id;
        let notes = document.createElement("textarea");
        notes.disabled = call.ongoing ? false : "disabled";
        notes.innerHTML = call.notes;
        if (call.ongoing) {
            callDiv.className += " ongoing";
            notes.onmousedown = function (e) {
                parent.editing_call_notes = call.id;
            }
            notes.oninput = function (e) {
                parent.editing_call_notes = call.id;
                parent.updateCallNotes(call.id, notes.value);
            }
            notes.onblur = function (e) {
                parent.editing_call_notes = "";
            }
        }
        callDiv.innerHTML = `
                        <label class='id'>${call.id}</label>
                        <div class='call_info ${call.ongoing ? "" : "ended"}'>
                            <div>
                                <label class='info'>Start</label> <div class='time'> ${startStr}</div>  
                            </div>                                                        
                            <div>
                                <label class='info'>End</label> <div class='time'> ${endStr}</div>
                            </div>      
                      
                            <div class='duration'>
                                <label class='info'>Duration:</label> <div class='time'>${call.ongoing ? Helper.formatDuration(call.start, (new Date()).getTime()) : Helper.formatDuration(call.start, call.end)}</div>
                            </div>
                            <div><label class='info'>Number:</label><div><input disabled type='text' value='${call.number}'/></div></div>
                            <div class="drop_down">
                                <label>Notes:</label>
                            </div>
                        </div>
                    `;
        callDiv.querySelector("label").onclick = function (e) {
            parent.toggleDropDown(e.target.parentElement, !isKeyDown(17));
        }
        let notes_dropdown = callDiv.querySelector(".drop_down");
        notes_dropdown.querySelector("label").onclick = function (e) {
            parent.toggleDropDown(e.target.parentElement, false);
        }
        notes_dropdown.appendChild(notes);
        if (call.ongoing && open) {
            let timeDiv = callDiv.querySelector(".duration .time");
            if (timeDiv) {
                let interval = setInterval(function (elm) {
                    elm.innerHTML = Helper.formatDuration(call.start, (new Date()).getTime())
                }, 1000, timeDiv)
                timeDiv.setAttribute("interval", interval);
            }
            let end = document.createElement("button");
            end.className = "end";
            end.innerHTML = "End Call";

            end.onclick = function () {
                parent.endCall(call.id)
            };
            callDiv.appendChild(end);
        }
        return callDiv;
    }

    toggleDropDown(elm, collapse) {
        if (elm.hasClass("showing")) {
            elm.removeClass("showing");

        } else {
            this.openDropDown(elm, collapse);

        }
    }

    openDropDown(elm, collapse = true) {
        if (collapse) this.collapseDropDowns(this.call_control_container);
        elm.addClass("showing");
    }

    collapseDropDowns(in_elm) {
        if (in_elm == undefined) {
            in_elm = this.ticket_panel;
        }
        in_elm.querySelectorAll(".drop_down.showing").forEach(e => {
            e.removeClass("showing");
        });
    }

    clearSelectedOption() {
        if (this.ticket_list)
            this.ticket_list.querySelectorAll(".option.selected").forEach((e) => e.className = e.className.replace("selected", "").trim().replace("  ", " "));
    }

    setSelectedOption(id) {
        this.clearSelectedOption();
        if (id != "") {
            let opt = document.getElementById(id);
            if (opt) opt.className += " selected";
        }
    }

    fillForm(data) {
        for (let item in data.data) {
            if (item == "id") {
                this.ticket_id = data.data.id;
                continue;
            }
            let elm = document.querySelector(`[name=${item}]`);
            if (elm) {
                elm.value = data.data[item];
            }
        }
        this.name_box.innerHTML = `${data.data.name} <label class='small'>[${data.data.id}]</label><h4>${data.type}</h4>`;
    }

    populateDisplay(type) {
        if (!this.logged_in) return false;
        this.ticket_container.innerHTML = "";
        if (type == "unknown") type = "default";
        let form = this.generateForm(this.form_templates[type]);
        this.ticket_container.appendChild(form);
        window.scrollTo(0, 0);

    }

    getTicket(id) {
        if (!this.logged_in) return false;
        this.search_box.value = "";
        //this.ticket_panel.className = "waiting";
        this.ticket_panel.addClass("waiting");
        this.socket.emit('admin_get_ticket', {
            id: id
        });
    }

    getFormData() {
        if (!this.logged_in) return false;
        let form_data = new FormData(this.form);
        let packet = {};
        for (var pair of form_data.entries()) {
            packet[pair[0]] = pair[1];
        }
        return packet;
    }

    generateForm(template, action_container = true) {
        if (!this.logged_in) return false;
        this.action_container = document.createElement("div");
        this.action_container.id = "action_container";
        this.action_container.addClass("action_container");
        this.output = document.createElement("div");
        this.output.id = "output";
        this.submit_button = document.createElement("button");
        let parent = this;
        this.submit_button.onclick = function () {
            parent.updateTicket();
        };
        this.submit_button.innerHTML = "Update";
        this.action_container.appendChild(this.output);
        this.action_container.appendChild(this.submit_button);
        let formDiv = document.createElement("div");
        this.name_box = document.createElement("h1");
        this.name_box.className = "customer_name";
        this.form = document.createElement("form");
        this.form.appendChild(this.name_box);
        this.form.setAttribute("onsubmit", "return false;");
        this.form.id = "ticket_form";
        this.form.addClass("form_container");
        for (let item in template) {
            if (template[item].hidden) continue;
            let itemDiv = document.createElement("div");
            let itemLabel = document.createElement("label");
            itemLabel.innerHTML = template[item].label ? template[item].label : item;
            let itemInput = document.createElement(this.type_elements[template[item].type]);
            if (template[item].disabled) itemInput.disabled = "disabled"; //itemInput.setAttribute("readonly", "readonly");
            itemInput.name = item;
            if (item == "notes") {
                itemInput.oninput = function (e) {
                    if (parent.ticket_id != "") {
                        itemInput.className = "outdated";
                        clearTimeout(parent.notes_timeout);
                        parent.notes_timeout = setTimeout(function () {
                            parent.updateNotes();
                        }, 300);
                    }
                }
            }
            if (item == "status") {
                itemInput.onchange = function (e) {
                    parent.updateTicket();
                }
            }
            if (template[item].type == "selection") {
                for (let opt in template[item].options) {
                    let itemOption = document.createElement("option");
                    itemOption.innerHTML = template[item].options[opt];
                    itemOption.value = opt;
                    itemInput.appendChild(itemOption);
                }
                if (template[item].has_other) {
                    itemInput.onchange = function (e) {
                        if (e.target.value.toLowerCase() == "other") {
                            e.target.parentElement.querySelector(".other").className = "other showing";
                        } else {
                            e.target.parentElement.querySelector(".other").className = "other";
                        }
                    }
                }
            }

            itemDiv.appendChild(itemLabel);
            itemDiv.appendChild(itemInput);
            if (template[item].has_other) {
                let inp = document.createElement("input");
                inp.setAttribute("type", "text");
                inp.name = item + "_other";
                inp.className = "other";
                itemDiv.appendChild(inp);
            }
            this.form.appendChild(itemDiv);
        }
        formDiv.appendChild(this.form);
        if (action_container) formDiv.appendChild(this.action_container);
        return formDiv;
    }
}