let bcrypt = require("bcrypt");
let Encryption = require("./encryption");
let fs = require("fs");
let user_data = {
    username: "",
    password: "",
    email: "",
    phone: "",
    contact_method: "",
    teams: [],
    is_admin: false,
    uuid: ""
}

class User {
    constructor(username, password) {
        this.username = username;
        this.logged_in = false;
        this.exists = false;
        this.data = {};
        this.login(username, password);
    }

    login(username, password) {
        this.exists = User.user_exists(username);
        if (this.exists) {
            try {
                let file_data = fs.readFileSync("users/" + username);
                let data = Encryption.decrypt(file_data).toString();
                data = JSON.parse(data);
                if (bcrypt.compareSync(password, data.password)) {
                    this.logged_in = true;
                    this.data = Object.assign(Object.assign({}, user_data), data);

                    this.save();
                } else {
                    return false;
                }
            } catch (e) {
                return false;
            }

        } else {
            return false;
        }
    }

    isAdmin() {
        return this.data.is_admin;
    }

    update(key, value) {
        this.data[key] = value;
        this.save();
    }

    setAdmin(boolean) {
        if (typeof boolean == "boolean")
            this.update("is_admin", boolean);
    }

    save() {
        let data = Encryption.encrypt(JSON.stringify(this.data));
        fs.writeFileSync("users/" + this.username, data);
    }

    static generateUUID(len = 32) {
        let uuid = "";
        for (let i = 0; i < len; i++) {
            uuid += Math.floor(Math.random() * 16).toString(16);
        }
        return uuid;
    }

    static create(username, password, options) {
        username = username.trim();
        password = password.trim();
        if (username == "" || password == "") return false;
        if (User.user_exists(username)) {
            return false;
        } else {
            let new_user = Object.assign({}, user_data);
            new_user.username = username;
            new_user.password = bcrypt.hashSync(password, 10);
            new_user.uuid = User.generateUUID();
            for (let option in options) {
                    new_user[option] = options[option];
            }

            fs.writeFileSync("users/" + username, Encryption.encrypt(JSON.stringify(new_user)));
            return new User(username, password);
        }
    }

    static user_exists(username) {
        return fs.existsSync("users/" + username);
    }
}

module.exports = User;