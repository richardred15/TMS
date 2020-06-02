class TicketClient {
    constructor(server_url = 'https://richard.works:3009') {
        this.server_url = server_url;
        this.form_container = document.getElementById("form_container");
        this.type = this.form_container.getAttribute("type");
        this.type_elements = {
            "text": "input",
            "message": "textarea",
            "selection": "select",
            "phone": "input",
            "email": "input",
            "password": "password"
        }
        this.connect();
        this.requestTemplate();
        this.submitted = false;
    }

    connect() {
        let socket = io(this.server_url);
        this.socket = socket;
        let parent = this;
        this.socket.on('connect', function () {
            parent.onconnected();
        });
        this.socket.on('user_template', function (data) {
            parent.updatePage(data);
        });
        this.socket.on('result_user', function (data) {
            parent.handleResult(data);
        });
    }

    onconnected() {
        console.log("connected");
    }

    requestTemplate() {
        this.socket.emit('user_template', {
            type: this.type
        });
    }

    updatePage(data) {
        this.form_container.innerHTML = "";

        if (!data.data.error) {
            this.nonce = data.data.nonce;
            delete(data.data.nonce);
            this.form_container.appendChild(this.generateForm(data.data));
        } else {
            let form = document.createElement("form");
            form.id = "ticket_form";
            let error = document.createElement("div");
            let label = document.createElement("label");
            label.innerHTML = "Error";
            let info = document.createElement("div");
            info.innerHTML = data.data.error;
            error.appendChild(label);
            error.appendChild(info);
            form.appendChild(error);
            this.form_container.appendChild(form);
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

    submitForm() {
        if (this.submitted !== false) return false;
        let form_data = new FormData(this.form);
        let packet = {};
        for (var pair of form_data.entries()) {
            packet[pair[0]] = pair[1];
        }
        this.socket.emit('submit_user', {
            type: this.type,
            data: packet,
            nonce: this.nonce
        });
    }

    generateForm(template) {
        this.action_container = document.createElement("div");
        this.action_container.id = "action_container";
        this.output = document.createElement("div");
        this.output.id = "output";
        this.submit_button = document.createElement("button");
        let parent = this;
        this.submit_button.onclick = function () {
            parent.submitForm();
        };
        this.submit_button.innerHTML = "Submit";
        this.action_container.appendChild(this.submit_button);
        let formDiv = document.createElement("div");
        formDiv.id = "ticket_panel";
        formDiv.className = "client";
        this.form = document.createElement("form");
        this.form.setAttribute("onsubmit", "return false;");
        this.form.id = "ticket_form";
        for (let item in template) {
            let itemDiv = document.createElement("div");
            let itemLabel = document.createElement("label");
            itemLabel.innerHTML = template[item].label ? template[item].label : item;
            let itemInput = document.createElement(this.type_elements[template[item].type]);
            itemInput.name = item;
            if (template[item].type == "selection") {
                for (let opt in template[item].options) {
                    let itemOption = document.createElement("option");
                    itemOption.innerHTML = template[item].options[opt];
                    itemOption.value = opt;
                    itemInput.appendChild(itemOption);
                }
                if (template[item].has_other) {
                    let trigger = template[item].other_trigger;
                    if (trigger == undefined) trigger = "other";
                    else trigger = trigger.toLowerCase();
                    console.log(trigger, item);
                    itemInput.onchange = function (e) {

                        if (e.target.value.toLowerCase() == trigger) {
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
        formDiv.appendChild(this.output);
        formDiv.appendChild(this.form);
        formDiv.appendChild(this.action_container);
        return formDiv;
    }
}