class TicketAdmin {
    constructor(server_url = 'https://richard.works:3009') {
        this.server_url = server_url;
        this.ticket_container = document.getElementById("ticket");
        this.ticket_list_container = document.getElementById("ticket_list");
        this.ticket_type = "questionnaire";
        this.ticket_id = "";
        this.form_templates = {};
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
        this.requestListAll();
        this.requestTemplate();
    }

    updateTicket() {
        let packet = {
            id: this.ticket_id,
            type: this.ticket_type,
            data: this.getFormData()
        }
        this.socket.emit('admin_update_ticket', packet);
    }

    requestOpenDisplayData() {
        console.log(this.internal_list);
        this.socket.emit('admin_get_display_data', {
            list: this.internal_list.open
        });
    }

    requestTemplate() {
        this.socket.emit('admin_templates');
    }

    requestListAll() {
        this.socket.emit('admin_list_all');
    }

    connect() {
        let socket = io(this.server_url);
        this.socket = socket;
        let parent = this;

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
    }

    handleDisplayData(data) {
        let parent = this;
        this.ticket_list = document.createElement("select");
        this.ticket_list.multiple = "multiple";
        this.ticket_list.onchange = function (e) {
            parent.getTicket(e.target.value);
        }
        console.log(data.data);
        for (let ticket in data.data) {
            let opt = document.createElement("option");
            opt.value = ticket;
            opt.innerHTML = `${ticket} - ${data.data[ticket].name.split(" ")[0]}`;
            opt.id = ticket;
            this.ticket_list.appendChild(opt);
        }
        this.ticket_list_container.innerHTML = "";
        this.ticket_list_container.appendChild(this.ticket_list);
    }

    handleList(data) {
        this.internal_list = data.data;
        this.requestOpenDisplayData();
    }

    handleTemplate(data) {
        for (let temp in data.data) {
            console.log(temp);
            this.form_templates[temp] = data.data[temp];
        }
    }

    handleTicket(data) {
        console.log(data);
        this.populateDisplay(data.type);
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
        this.name_box.innerHTML = `${data.data.name} - ${data.data.id}<h4>${data.type}</h4>`;
    }

    populateDisplay(type) {
        this.ticket_container.innerHTML = "";
        this.ticket_container.appendChild(this.generateForm(this.form_templates[type]));
    }

    getTicket(id) {
        this.socket.emit('admin_get_ticket', {
            id: id
        });
    }

    getFormData() {
        let form_data = new FormData(this.form);
        let packet = {};
        for (var pair of form_data.entries()) {
            packet[pair[0]] = pair[1];
        }
        return packet;
    }

    generateForm(template) {
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
            let itemDiv = document.createElement("div");
            let itemLabel = document.createElement("label");
            itemLabel.innerHTML = template[item].label ? template[item].label : item;
            let itemInput = document.createElement(this.type_elements[template[item].type]);
            if (template[item].disabled) itemInput.setAttribute("readonly", "readonly");
            itemInput.name = item;
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