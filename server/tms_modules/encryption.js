let Configuration = require("./configuration");
let crypto = require("crypto");
class Encryption {
    static encrypt(data) {
        if (typeof data !== "string") throw new Error("Can't encrypt that!");
        let buffer = Buffer.from(data);
        // Create an initialization vector
        const iv = crypto.randomBytes(16);
        // Create a new cipher using the algorithm, key, and iv
        const cipher = crypto.createCipheriv(Configuration.get("algorithm"), Configuration.get("key"), iv);
        // Create the new (encrypted) buffer
        const result = Buffer.concat([iv, cipher.update(buffer), cipher.final()]);
        return result;
    }

    static decrypt(encrypted) {
        // Get the iv: the first 16 bytes
        const iv = encrypted.slice(0, 16);
        // Get the rest
        encrypted = encrypted.slice(16);
        // Create a decipher
        const decipher = crypto.createDecipheriv(Configuration.get("algorithm"), Configuration.get("key"), iv);
        // Actually decrypt it
        const result = Buffer.concat([decipher.update(encrypted), decipher.final()]);
        return result;
    }
}

module.exports = Encryption;