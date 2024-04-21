const express = require('express');
require('dotenv').config();
const { Client } = require('pg');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

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

db.on('error', (err) => {
    console.error('Databasfel:', err);
});

db.connect((err) => {
    //Stäng ner anslutning om det går fel
    if (err) {
        console.log('Anslutning till databasen misslyckades: ' + err);
        db.end((error) => {
            if (error) {
                console.error('Något gick fel vid nedkoppling från databas:', error);
                db.destroy();
                return;
            }
            console.log('Databasanslutning avslutad');
        });
    } else {
        console.log('Anslutning till databasen lyckades');
    }
});

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
    //Error-meddelanden: (de behöver ändå återställas)
    let errors = {
        https_response: {
            message: '',
            code: '',
        },
        message: '',
        details: '',
    };
    //Hämta data ur cv-tabell och formattera datumet snyggare
    db.query(
        `SELECT id, employer, title, description, TO_CHAR(start_date, 'YYYY-MM-DD') AS start_date, TO_CHAR(end_date, 'YYYY-MM-DD') AS end_date FROM cv;
    `,
        (err, results) => {
            if (err) {
                //Hantera error
                errors.https_response.message = `Internal server error: ${err}`;
                errors.https_response.code = 500;

                res.status(errors.https_response.code).json({ error: errors });
                console.log('Error from get api/CV:', err);
                return;
            }
            //Kontrollera att data finnes
            if (results.rows.length === 1) {
                errors.https_response.message = 'Not found';
                errors.https_response.code = 404;
                errors.message = 'No data to show';

                res.status(errors.https_response.code).json({ error: errors });
                return;
            } else {
                //Visa resultat
                res.json(results.rows);
            }
        }
    );
});

//Specifikt jobb
app.get('/api/cv/:id', (req, res) => {
    //Lagra param
    let id = req.params.id;
    //Error-meddelanden: (de behöver ändå återställas)
    let errors = {
        https_response: {
            message: '',
            code: '',
        },
        message: '',
        details: '',
    };

    db.query(
        `SELECT id, employer, title, description, TO_CHAR(start_date, 'YYYY-MM-DD') AS start_date, TO_CHAR(end_date, 'YYYY-MM-DD') AS end_date FROM cv WHERE id=$1;`,
        [id],
        (err, result) => {
            if (err) {
                errors.https_response.message = `Internal server error: ${err}`;
                errors.https_response.code = 500;

                res.status(errors.https_response.code).json({ error: errors });
                console.log('Error from get api/cv/:id select query:', err);
                return;
            }
            if (result.rows.length === 0) {
                errors.https_response.message = 'Not found';
                errors.https_response.code = 404;
                errors.message = 'No data to show';

                res.status(errors.https_response.code).json({ error: errors });
                return;
            } else {
                //Visa resultat
                res.json(result.rows);
            }
        }
    );
});

//Lägg till nytt jobb
app.post('/api/cv', (req, res) => {
    //Lagra datan i variabler
    let employer = req.body.employer;
    let title = req.body.title;
    let description = req.body.description;
    let startDate = req.body.startDate;
    let endDate = req.body.endDate;

    if (endDate === null) {
        endDate = 'Anställning pågående';
    }

    //Error-meddelanden: (de behöver ändå återställas)
    let errors = {
        https_response: {
            message: '',
            code: '',
        },
        message: '',
        details: '',
    };

    //Validering/felhantering
    if (!employer) {
        errors.https_response.message = 'Bad request';
        errors.https_response.code = 400;
        errors.message = 'Input missing';
        errors.details = 'You must fill out name of employer';
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
    } else if (!startDate || startDate === undefined || startDate === null) {
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
            `INSERT INTO cv (employer, title, description, start_date, end_date)
            VALUES ($1, $2, $3, $4, $5);`,
            [employer, title, description, startDate, endDate],
            (err, result) => {
                if (err) {
                    //Hantera error
                    errors.https_response.message = `Internal server error: ${err}`;
                    errors.https_response.code = 500;
                    console.log(err);

                    res.status(errors.https_response.code).json({ error: errors });
                    console.log('Error from post api/CV:', err);
                    return;
                }
                //Gör jobb-objekt att visa i thunderclient
                let job = {
                    employer: employer,
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
    //Error-meddelanden: (de behöver ändå återställas)
    let errors = {
        https_response: {
            message: '',
            code: '',
        },
        message: '',
        details: '',
    };
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
    let employer = req.body.employer;
    let title = req.body.title;
    let description = req.body.description;
    let startDate = req.body.startDate;
    let endDate = req.body.endDate;

    //Error-meddelanden:
    let errors = {
        https_response: {
            message: '',
            code: '',
        },
        message: '',
        details: '',
    };

    //Validering/felhantering
    if (!employer) {
        errors.https_response.message = 'Bad request';
        errors.https_response.code = 400;
        errors.message = 'Input missing';
        errors.details = 'You must fill out name of employer';
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
        db.query(`SELECT * FROM cv WHERE id=$1`, [id], (err, result) => {
            //error
            if (err) {
                errors.https_response.message = 'Internal server error';
                errors.https_response.code = 500;
                res.status(errors.https_response.code).json({ error: errors });
                console.log('Error from PUT api/cv SELECT query:', err);
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
                `UPDATE cv 
                SET employer=$1, title=$2, description=$3, start_date=$4, end_date=$5 
                WHERE id=$6;`,
                [employer, title, description, startDate, endDate, id],
                (err, result) => {
                    if (err) {
                        errors.https_response.message = 'Internal server error';
                        errors.https_response.code = 500;
                        res.status(errors.https_response.code).json({ error: errors });
                        console.log('Error from PUT api/cv UPDATE query:', err);
                        return;
                    }
                    //Gör jobbinstans
                    let job = {
                        employer: employer,
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

    //Välj ut post med det ID:et
    db.query(`SELECT * FROM cv WHERE id=$1`, [id], (err, result) => {
        if (err) {
            errors.https_response.message = 'Internal server error';
            errors.https_response.code = 500;
            res.status(errors.https_response.code).json({ error: errors });
            console.log('Error from delete /api/cv:id SELECT query', err);
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
        db.query(`DELETE FROM cv WHERE id=$1`, [id], (err, result) => {
            if (err) {
                errors.https_response.message = 'Internal server error';
                errors.https_response.code = 500;
                res.status(errors.https_response.code).json({ error: errors });
                console.log('Error from delete /api/cv:id DELETE query', err);
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
