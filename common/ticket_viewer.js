let type_elements = {
    "text": "input",
    "message": "textarea",
    "selection": "select",
    "phone": "input",
    "email": "input",
    "password": "password"
}
let container = document.getElementById("form_container");


function fillForm(data) {
    for (let item in data) {
        let elm = document.querySelector(`[name=${item}]`);
        if (elm) {
            elm.value = data[item];
        }
    }
    //name_box.innerHTML = `${data.data.name} <label class='small'>[${data.data.id}]</label><h4>${data.type}</h4>`;
}

function startViewer() {
    let view_template = {
        "ticket_id": {
            type: "text",
            label: "Ticket ID",
            disabled: false
        }
    }

    let form = generateForm(view_template, true);
    container.innerHTML = "";
    container.appendChild(form);
}

function submitForm() {
    let url = config.host + "/projects/TMS/common/ticket_viewer.html?ticket=" + container.querySelector("[name=ticket_id]").value;
    window.location.href = url;
}

function generateForm(template, view_another = false) {
    let action_container = document.createElement("div");
    action_container.id = "action_container";
    action_container.className = "action_container";
    let output = document.createElement("div");
    output.id = "output";
    let submit_button = document.createElement("button");
    let parent = this;
    submit_button.onclick = view_another ? submitForm : startViewer;
    submit_button.innerHTML = view_another ? "Submit" : "View Another";
    action_container.appendChild(submit_button);
    let formDiv = document.createElement("div");
    formDiv.id = "ticket_panel";
    formDiv.className = "client";
    form = document.createElement("form");
    form.className = "form_container";
    form.setAttribute("onsubmit", "return false;");
    form.id = "ticket_form";
    for (let item in template) {
        let itemDiv = document.createElement("div");
        let itemLabel = document.createElement("label");
        if (template[item].label !== false) {
            itemLabel.innerHTML = template[item].label ? template[item].label : item;
        }
        let itemInput = document.createElement(type_elements[template[item].type]);
        itemInput.name = item;
        if (item != "ticket_id") itemInput.disabled = "disabled";
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
        form.appendChild(itemDiv);
    }
    formDiv.appendChild(output);
    formDiv.appendChild(form);
    formDiv.appendChild(action_container);
    return formDiv;
}