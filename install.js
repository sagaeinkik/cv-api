const { Client } = require('pg');
require('dotenv').config();

//Databas-anslutning
const db = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: {
        rejectUnauthorized: false,
    },
});

db.connect((err) => {
    if (err) {
        console.log('Anslutning till databasen misslyckades: ' + err);
        return;
    }
    console.log('Anslutning till databasen lyckades');
});

db.query('DROP TABLE IF EXISTS cv;', (err, result) => {
    if (err) {
        console.error('Drop table-query: Något gick fel. ', err);
        return;
    }
    console.log('Drop table-query: Query lyckades.', result);
});

db.query(
    `
    CREATE TABLE IF NOT EXISTS cv (
        id SERIAL PRIMARY KEY, 
        company VARCHAR(50), 
        title VARCHAR(50), 
        description VARCHAR(255), 
        start_date DATE, 
        end_date DATE
    );`,
    (err, result) => {
        if (err) {
            console.log('Create table: Något gick fel.', err);
            return;
        }
        console.log('Create table: Query lyckades.', result);
    }
);

/* db.end();
 */
