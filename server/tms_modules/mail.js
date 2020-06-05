let nodemailer = require("nodemailer");
let Configuration = require("./configuration");
class Mail {
    constructor(from) {
        if (!from) {
            from = Configuration.get("mail").from;
        }
        this.transporter = nodemailer.createTransport({
            host: Configuration.get("mail").host,
            port: Configuration.get("mail").port,
            secureConnection: false, // use SSL
            auth: {
                user: Configuration.get("mail").user,
                pass: Configuration.get("mail").pass
            },
            tls: {
                ciphers: 'SSLv3'
            }
        });
        this.from = from;


    }

    async send(to, subject, message) {
        if (to && subject && message) {
            let info = await this.transporter.sendMail({
                from: this.from, // sender address
                to: to, // list of receivers
                subject: subject, // Subject line
                text: message.replace(/<[^>]*>?/gm, ''), // plain text body
                html: message, // html body
            });
            console.log(info);
        }
    }
}

module.exports = Mail;