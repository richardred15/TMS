class TicketAdmin {
    constructor(server_url = 'https://richard.works:3009') {
        this.server_url = server_url;
        this.ticket_container = document.getElementById("ticket");
        this.ticket_list_container = document.getElementById("ticket_list");
        this.ticket_tabs = document.getElementById("ticket_tabs");
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
        this.connect();
        this.history = {
            tickets: [],
            index: -1
        };
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
        this.socket.emit('login', {
            username: username,
            password: password
        });
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

    requestOpenDisplayData() {
        if (!this.logged_in) return false;
        this.current_tab = "open";
        console.log(this.internal_list);
        this.selectTab("open");
        this.socket.emit('admin_get_display_data', {
            list: this.internal_list.open
        });
    }

    requestClosedDisplayData() {
        if (!this.logged_in) return false;
        this.current_tab = "closed";
        console.log(this.internal_list);
        this.selectTab("closed");
        this.socket.emit('admin_get_display_data', {
            list: this.internal_list.closed
        });
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
            } else {
                let opt = parent.generateOption(data.id, data.data);
                parent.ticket_list.prepend(opt);
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
        });

        this.socket.on('result_user', (data) => this.handleResult(data));
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
    }

    generateOption(ticket, data) {
        let opt = document.createElement("div");
        opt.value = ticket;
        opt.className = "option " + data.status;
        opt.innerHTML = `<label class="small">[${ticket}]</label> ${data.name.split(" ")[0]}`;
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
        this.requestOpenDisplayData();
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
        this.ticket_list.querySelectorAll(".option.selected").forEach((e) => e.className = e.className.replace("selected", "").trim().replace("  ", " "));
        let opt = document.getElementById(data.data.id);
        if (opt) opt.className += " selected";
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

    generateForm(template) {
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
            if (template[item].disabled) itemInput.setAttribute("readonly", "readonly");
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
        formDiv.appendChild(this.action_container);
        return formDiv;
    }
}