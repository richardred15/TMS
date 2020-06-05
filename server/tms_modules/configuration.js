let fs = require("fs");

class Configuration {
    constructor(path = "config.json") {
        this.path = path;
        this.data = {};
        this.load();
    }

    get(key) {
        return this.data[key];
    }

    getAll() {
        return this.data;
    }

    load() {
        if (fs.existsSync(this.path)) {
            this.data = JSON.parse(fs.readFileSync(this.path));
        } else {
            this.save();
        }
    }

    save() {
        fs.writeFileSync(this.path, JSON.stringify(this.data));
    }
}

let Conf = new Configuration();

module.exports = Conf;