class TicketClient {
    constructor(server_url = 'https://richard.works:3009') {
        this.server_url = server_url;
        this.form_container = document.getElementById("form_container");
        this.output = document.getElementById("output");
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
            type: "contact"
        });
    }

    updatePage(data) {
        this.form_container.innerHTML = "";
        this.form_container.appendChild(this.generateForm(data.data));
    }

    handleResult(data) {
        this.output.innerHTML = "";
        if (data.result == "failure") {
            for (let item of data.data) {
                document.querySelector(`[name=${item}]`).style.backgroundColor = "#ffaaaa";
            }
            this.output.appendChild(this.failureData(data.data));
        } else {
            this.output.innerHTML = `<label>SUCCESS</label><label>Ticket ID: ${data.data}</label>`;
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
        let form_data = new FormData(this.form);
        let packet = {};
        for (var pair of form_data.entries()) {
            packet[pair[0]] = pair[1];
        }
        this.socket.emit('submit_user', {
            type: "contact",
            data: packet
        });
    }

    generateForm(template) {
        let formDiv = document.createElement("div");
        this.form = document.createElement("form");
        this.form.setAttribute("onsubmit", "return false;");
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
            }
            itemDiv.appendChild(itemLabel);
            itemDiv.appendChild(itemInput);
            this.form.appendChild(itemDiv);
        }
        formDiv.appendChild(this.form);
        return formDiv;
    }
}