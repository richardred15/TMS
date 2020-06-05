let bcrypt = require("bcrypt");
let Encryption = require("./encryption");
let fs = require("fs");
let user_data = {
    username: "",
    password: "",
    email: "",
    phone: "",
    contact_method: "",
    is_admin: false
}

class User {
    constructor(username, password) {
        this.username = username;
        this.logged_in = false;
        this.data = {};
        this.login(username, password);
    }

    login(username, password) {
        if (User.user_exists(username)) {

            try {
                let file_data = fs.readFileSync("users/" + username);
                let data = Encryption.decrypt(file_data).toString();
                data = JSON.parse(data);
                if (bcrypt.compareSync(password, data.password)) {
                    this.logged_in = true;
                    this.data = data;
                    this.save();
                } else {
                    return false;
                }
            } catch (e) {
                console.log(e);
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
            for (let option in options) {
                if (options[option].trim() != "")
                    new_user[option] = options[option];
            }

            fs.writeFileSync("users/" + username, JSON.stringify(new_user));
            return new User(username, password);
        }
    }

    static user_exists(username) {
        return fs.existsSync("users/" + username);
    }
}

module.exports = User;