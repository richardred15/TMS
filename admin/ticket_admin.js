class TicketAdmin {
    constructor(server_url = 'https://richard.works:3009', connect = true) {
        this.server_url = server_url;
        this.ticket_container = document.getElementById("ticket");
        this.ticket_list_container = document.getElementById("ticket_list");
        this.ticket_tabs = document.getElementById("ticket_tabs");
        this.ticket_panel = document.getElementById("ticket_panel");
        this.search_box = document.getElementById("search_box");
        this.audio = document.createElement("audio");
        this.audio.src = "ding.wav";
        this.ticket_type = "questionnaire";
        this.ticket_id = "";
        this.form_templates = {};
        this.current_tab = "open";
        this.logged_in = false;
        this.notes_timeout = undefined;
        this.type_elements = {
            "text": "input",
            "message": "textarea",
            "selection": "select",
            "phone": "input",
            "email": "input",
            "password": "password"
        }
        this.internal_list = {};
        if (connect) this.connect();
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

    updateTimes() {
        /* document.querySelectorAll(".timeago").forEach(function (e) {
            let time = e.getAttribute("value");
            e.innerHTML = timeAgo(time);
        }); */
    }

    showLogin() {
        this.ticket_container.innerHTML = "";
        this.ticket_list_container.innerHTML = "";
        this.ticket_tabs.className = "";
        let loginForm = document.createElement("form");
        loginForm.id = "ticket_form";
        loginForm.setAttribute('onsubmit', 'return false;');
        let html = `
            <label>Username:</label><input type="text" name="username" />
            <label>Password:</label><input type="password" name="password" />
            <button onclick='TA.login()'>Login</button>
        `;
        loginForm.innerHTML = html;
        this.ticket_container.appendChild(loginForm);
    }

    login() {
        let username = this.ticket_container.querySelector("[name=username]").value;
        let password = this.ticket_container.querySelector("[name=password]").value;
        this.ticket_panel.className = "waiting";
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
        let opt = document.getElementById(ticket_id);
        if (opt) {
            opt.className = opt.className.replace("selected").replace("  ", "");
            this.ticket_container.innerHTML = `<h2 style="margin-left:20px;">Please select a ticket</h2>`;
        }
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
        console.log(packet);
        this.socket.emit('admin_update_notes', packet);
    }

    newTicket() {
        if (!this.logged_in) return false;
        this.populateDisplay("admin");
        this.ticket_type = "admin";
        this.ticket_id = "";
        let button = document.querySelector("#action_container button");
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

    requestDisplayData() {
        if (!this.logged_in) return false;
        this.current_tab = "open";
        this.selectTab("open");
        let list = this.internal_list.open.slice();
        list.push(...this.internal_list.closed);
        console.log(list);
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

    requestTemplate() {
        if (!this.logged_in) return false;
        this.socket.emit('admin_templates');
    }

    requestListAll() {
        if (!this.logged_in) return false;
        this.socket.emit('admin_list_all');
    }

    connect() {
        let socket = io(this.server_url);
        this.socket = socket;
        let parent = this;

        this.socket.on('connect', function (data) {
            parent.showLogin();
        });

        this.socket.on('disconnect', function (data) {
            parent.showLogin();
        });

        this.socket.on('list_all', function (data) {
            parent.handleList(data);
        });

        this.socket.on('admin_templates', function (data) {
            parent.handleTemplate(data);
        });

        this.socket.on('admin_ticket_data', function (data) {
            parent.handleTicket(data);
        });

        this.socket.on('admin_display_data', function (data) {
            parent.handleDisplayData(data);
        });

        this.socket.on('search_results', function (data) {
            parent.handleSearchResults(data);
        });

        this.socket.on('note_update_status', function (data) {
            console.log(data);
            if (data.status == "success") {
                parent.ticket_container.querySelector("[name=notes].outdated").className = "";
            }
        });

        this.socket.on('ticket_update', function (data) {
            console.log("Ticket Update");
            console.log(data);
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

        this.socket.on('login', function (data) {
            console.log(data);
            if (data.status === "success") {
                document.querySelector("#nav ul").className = "logged_in";
                document.querySelector("#ticket_tabs").className = "logged_in";
                parent.ticket_container.innerHTML = `<h2 style="margin-left:20px;">Please select a ticket</h2>`;
                parent.logged_in = true;
                parent.requestListAll();
                parent.requestTemplate();
            } else {
                alert(data.message);
            }
            parent.ticket_panel.className = "";
        });

        this.socket.on('result_user', (data) => this.handleResult(data));
        this.socket.on('admin_nonce', (data) => this.handlePopout(data));
    }

    placeOption(opt, closed = false) {
        let selector = ".option" + (closed ? ".closed" : "");
        let opts = this.ticket_list.querySelectorAll(selector);
        console.log(selector, closed);
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
        let url = `https://richard.works:3009/admin/viewticket?ticket=${ticket}&id=${id}&nonce=${nonce}`;
        window.open(url, "", "width=800,height=800");
    }

    requestPopout(ticket_id) {
        if (this.logged_in) {
            //https://richard.works:3009/admin/viewticket?ticket=C13529&id=fjaslkdfjlsdkaf&nonce=jfasldkfjalskjflaksjdf

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
            this.form.className = "success";
            this.output.className = "success";
            this.submit_button.style.display = "none";
            this.output.innerHTML = `<label>Ticket Number: ${data.data}</label><label>SUCCESS</label>`;
            let parent = this;
            setTimeout(function () {
                parent.requestListAll();
                parent.getTicket(data.data);
                console.log(data.data);
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
        console.log(data.data);
        for (let ticket in data.data) {
            let opt = this.generateOption(ticket, data.data[ticket]);
            this.ticket_list.appendChild(opt);
        }
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
        console.log(data.data);
        this.internal_list = data.data;
        //this.requestOpenDisplayData();
        this.requestDisplayData();
    }

    handleTemplate(data) {
        if (!this.logged_in) return false;
        for (let temp in data.data) {
            console.log(temp);
            this.form_templates[temp] = data.data[temp];
        }
    }

    handleTicket(data) {
        if (!this.logged_in) return false;
        console.log(data);
        this.ticket_type = data.type;
        this.populateDisplay(data.type);
        this.fillForm(data);
        setTimeout(function () {
            this.ticket_panel.className = "";
        }, 500);
        this.form.innerHTML = data.call_controls + this.form.innerHTML;
        this.setSelectedOption(data.data.id);
    }

    setSelectedOption(id) {
        this.ticket_list.querySelectorAll(".option.selected").forEach((e) => e.className = e.className.replace("selected", "").trim().replace("  ", " "));
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
        this.ticket_panel.className = "waiting";
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
        console.log(template);
        this.action_container = document.createElement("div");
        this.action_container.id = "action_container";
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