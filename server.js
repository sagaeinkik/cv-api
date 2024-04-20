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
    //Stäng ner anslutning om det går fel
    if (err) {
        console.log('Anslutning till databasen misslyckades: ' + err);
        db.end((error) => {
            if (error) {
                console.error('Något gick fel vid nedkoppling från databas:', error);
                return;
            }
            console.log('Databasanslutning avslutad');
        });
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
    res.json({
        message:
            'Välkommen till mitt API. Det skapades under moment 2 i Backendbaserad Webbutveckling (DT207G) på Mittuniversitet 2024. Du hittar dokumentationen på Github: https://github.com/sagaeinkik/cv-api',
    });
});

//Hämta alla jobb
app.get('/api/cv', (req, res) => {
    //Hämta data ur cv-tabell och formattera datumet snyggare
    db.query(
        `SELECT id, company, title, description, DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date, DATE_FORMAT(end_date, '%Y-%m-%d') AS end_date FROM cv;
    `,
        (err, results) => {
            if (err) {
                //Hantera error
                errors.https_response.message = `Internal server error: ${err}`;
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

//Specifikt jobb
app.get('/api/cv/:id', (req, res) => {
    //Lagra param
    let id = req.params.id;

    db.query(
        `SELECT id, company, title, description, DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date, DATE_FORMAT(end_date, '%Y-%m-%d') AS end_date FROM cv WHERE id=?`,
        [id],
        (err, result) => {
            if (err) {
                errors.https_response.message = `Internal server error: ${err}`;
                errors.https_response.code = 500;

                res.status(errors.https_response.code).json({ error: errors });
                return;
            }
            if (result.length === 0) {
                errors.https_response.message = 'Not found';
                errors.https_response.code = 404;
                errors.message = 'No data to show';

                res.status(errors.https_response.code).json({ error: errors });
                return;
            } else {
                //Visa resultat
                res.json(result);
            }
        }
    );
});

//Lägg till nytt jobb
app.post('/api/cv', (req, res) => {
    //Lagra datan i variabler
    let company = req.body.company;
    let title = req.body.title;
    let description = req.body.description;
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
    } else if (!description) {
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
            [company, title, description, startDate, endDate],
            (err, result) => {
                if (err) {
                    //Hantera error
                    errors.https_response.message = `Internal server error: ${err}`;
                    errors.https_response.code = 500;

                    res.status(errors.https_response.code).json({ error: errors });
                    return;
                }
                //Gör jobb-objekt att visa i thunderclient
                let job = {
                    company: company,
                    title: title,
                    description: description,
                    startDate: startDate,
                    endDate: endDate,
                };

                res.json({ message: 'Job added successfully', job });
            }
        );
    }
});

/* Uppdatering */
//ange id
app.put('/api/cv', (req, res) => {
    errors.https_response.message = 'Bad request';
    errors.https_response.code = 400;
    errors.message = 'URL query missing';
    errors.details = 'You must supply an id to update';
    res.status(errors.https_response.code).json({ error: errors });
});

//Uppdatera rad
app.put('/api/cv/:id', (req, res) => {
    //Variabler
    let id = req.params.id;
    let company = req.body.company;
    let title = req.body.title;
    let description = req.body.description;
    let startDate = req.body.startDate;
    let endDate = req.body.endDate;

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
    } else if (!description) {
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

    //Om det finns ett error-meddelande, avbryt och skicka med error
    if (errors.message !== '') {
        res.status(errors.https_response.code).json({ error: errors });
        return;
    } else {
        //Leta upp rad som ska ändras
        db.query(`SELECT * FROM cv WHERE id=?`, [id], (err, result) => {
            //error
            if (err) {
                errors.https_response.message = 'Internal server error';
                errors.https_response.code = 500;
                res.status(errors.https_response.code).json({ error: errors });
                return;
            } else if (result.length < 1) {
                //Kontrollera längd; om det inte gav något resultat så finns inte den posten
                errors.https_response.message = 'Not found';
                errors.https_response.code = 404;
                errors.message = 'Matching data not found';
                errors.details = 'There is no post in the database with that ID';
                res.status(errors.https_response.code).json({ error: errors });
                return;
            }
            //Allt är bra hittills så då uppdaterar vi
            db.query(
                `UPDATE cv SET company=?, title=?, description=?, start_date=?, end_date=? WHERE id=?`,
                [company, title, description, startDate, endDate, id],
                (err, result) => {
                    if (err) {
                        errors.https_response.message = 'Internal server error';
                        errors.https_response.code = 500;
                        res.status(errors.https_response.code).json({ error: errors });
                        return;
                    }
                    //Gör jobbinstans
                    let job = {
                        company: company,
                        title: title,
                        description: description,
                        startDate: startDate,
                        endDate: endDate,
                    };
                    //Kolla om det funka
                    res.json({ message: 'Updated job with id: ' + id, job, result });
                }
            );
        });
    }
});

/* Radera jobb */

//Routing för om man inte angett parameter
app.delete('/api/cv', (req, res) => {
    errors.https_response.message = 'Bad request';
    errors.https_response.code = 400;
    errors.message = 'URL query missing';
    errors.details = 'You must supply an id to delete';
    res.status(errors.https_response.code).json({ error: errors });
});

//Routing för att radera id
app.delete('/api/cv/:id', (req, res) => {
    let id = req.params.id;

    //Här försökte jag få till validering för id men den hade ingen effekt så jag gjorde en ny route istället
    /* if (id === '') {
        errors.https_response.message = 'Bad request';
        errors.https_response.code = 400;
        errors.message = 'URL query missing';
        errors.details = 'You must supply an id to delete';
        res.status(errors.https_response.code).json({ error: errors });
        return;
    } */

    //Välj ut post med det ID:et
    db.query(`SELECT * FROM cv WHERE id=?`, [id], (err, result) => {
        if (err) {
            errors.https_response.message = 'Internal server error';
            errors.https_response.code = 500;
            res.status(errors.https_response.code).json({ error: errors });
            return;
        } else if (result.length < 1) {
            //Kontrollera längd; om det inte gav något resultat så finns inte den posten
            errors.https_response.message = 'Not found';
            errors.https_response.code = 404;
            errors.message = 'Matching data not found';
            errors.details = 'There is no post in the database with that ID';
            res.status(errors.https_response.code).json({ error: errors });
            return;
        }
        //Om vi har kommit såhär långt så tar vi bort den raden ur tabellen
        db.query(`DELETE FROM cv WHERE id=?`, [id], (err, result) => {
            if (err) {
                errors.https_response.message = 'Internal server error';
                errors.https_response.code = 500;
                res.status(errors.https_response.code).json({ error: errors });
                return;
            }
            //Kolla om det funka
            res.json({ message: 'delete mot id: ' + id, result });
        });
    });
});

//Starta app
app.listen(port, (error) => {
    if (error) {
        console.error(error);
    } else {
        console.log('Ansluten till servern på port ' + port);
    }
});
