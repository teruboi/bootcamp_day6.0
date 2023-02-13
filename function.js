const pool = require("./db");

async function checkDuplicate(name) {
    const db = (await pool.query(`SELECT * FROM contacts WHERE LOWER(name) = LOWER('${name}')`)).rows
    console.log(db);
    if(db.length > 0) {
        return true
    } else return false
}

module.exports = { checkDuplicate }