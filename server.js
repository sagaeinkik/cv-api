const express = require('express');
require('dotenv').config();
const mysql = require('mysql');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

//Databas-anslutning
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
});

db.connect((err) => {
    if (err) {
        console.log('Anslutning till databasen misslyckades: ' + err);
    } else {
        console.log('Anslutning till databasen lyckades');
    }
});

//Error-meddelanden:
let errors = {
    https_response: {
        message: '',
        code: '',
    },
    message: '',
    details: '',
};

/* Routing */

//bara api
app.get('/api', (req, res) => {
    res.json({ message: 'Välkommen till mitt API. Du hittar dokumentationen på Github' });
});

app.get('/api/cv', (req, res) => {
    //Hämta data ur cv-tabell och formattera datumet snyggare
    db.query(
        `SELECT id, company, title, description, DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date, DATE_FORMAT(end_date, '%Y-%m-%d') AS end_date FROM cv;
    `,
        (err, results) => {
            if (err) {
                //Hantera error
                errors.https_response.message = 'Internal server error';
                errors.https_response.code = 500;

                res.status(errors.https_response.code).json({ error: errors });
                return;
            }
            //Kontrollera att data finnes
            if (results.length === 0) {
                errors.https_response.message = 'Not found';
                errors.https_response.code = 404;
                errors.message = 'No data to show';

                res.status(errors.https_response.code).json({ error: errors });
                return;
            } else {
                //Visa resultat
                res.json(results);
            }
        }
    );
});

app.post('/api/cv', (req, res) => {
    //Lagra datan i variabler
    let company = req.body.company;
    let title = req.body.title;
    let desc = req.body.desc;
    let startDate = req.body.startDate;
    let endDate = req.body.endDate;

    if (endDate === null) {
        endDate = 'Anställning pågående';
    }

    //Validering/felhantering
    if (!company) {
        errors.https_response.message = 'Bad request';
        errors.https_response.code = 400;
        errors.message = 'Input missing';
        errors.details = 'You must fill out name of company';
    } else if (!title) {
        errors.https_response.message = 'Bad request';
        errors.https_response.code = 400;
        errors.message = 'Input missing';
        errors.details = 'You must fill out jobtitle';
    } else if (!desc) {
        errors.https_response.message = 'Bad request';
        errors.https_response.code = 400;
        errors.message = 'Input missing';
        errors.details = 'You must fill out job description';
    } else if (!startDate || startDate === undefined) {
        errors.https_response.message = 'Bad request';
        errors.https_response.code = 400;
        errors.message = 'Input missing';
        errors.details = 'You must fill out start date';
    }
    //Inget error för end date för att man kanske har pågående anställning

    //Om error finns, skicka det som svar
    if (errors.message !== '') {
        res.status(errors.https_response.code).json({ error: errors });
        return;
    } else {
        //Om error inte finns, lägg till data i tabellen
        db.query(
            `INSERT INTO cv
        (company, title, description, start_date, end_date)
        VALUES
        (?, ?, ?, ?, ?);`,
            [company, title, desc, startDate, endDate],
            (err, result) => {
                if (err) {
                    //Hantera error
                    errors.https_response.message = 'Internal server error';
                    errors.https_response.code = 500;

                    res.status(errors.https_response.code).json({ error: errors });
                    return;
                }
                let job = {
                    company: company,
                    title: title,
                    description: desc,
                    startDate: startDate,
                    endDate: endDate,
                };

                res.json({ message: 'Job added successfully', job });
            }
        );
    }
});

app.put('/api/cv/:id', (req, res) => {
    res.json({ message: 'Put lyckades med id: ' + req.params.id });
});

app.delete('/api/cv/:id', (req, res) => {
    res.json({ message: 'Delete lyckades med id: ' + req.params.id });
});

app.listen(port, (error) => {
    if (error) {
        console.error(error);
    } else {
        console.log('Ansluten till servern på port ' + port);
    }
});
