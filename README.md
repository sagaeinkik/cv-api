# CV-API

Av S.E.K för DT207G

## Installation

Mitt API använder PostgreSQL som databashanterare. Variablerna ligger i en .env-fil. Du kan se vilka variabler du behöver nedan.

```
DB_HOST=YOUR_HOST
DB_NAME=YOUR_DB_NAME
DB_PORT=YOUR_DB_PORT
DB_USERNAME=YOUR_USERNAME
DB_PASSWORD=YOUR_PASSWORD
PORT=YOUR_PORT
```

För att testa lokalt finns installationsfilen `install.js` som du kör med kommandot `npm run install`.
_Observera att detta tar bort tabellen "cv" om det finns en, så använd med försiktighet._  
Pga SSL behöver man stänga anslutningen manuellt i terminalen/kommandotolken.

Tabellen som skapas ser ut som följande:
| ID :key: | company | title | description | start_date | end_date |
| ------------- | ----------- | ----------- | ------------ | ------------ | ---------- |
| Int not null | varchar(50) | varchar(50) | varchar(255) | date | date |

## Användning

API:et nås med URL-queryn /api följt av någon av dessa metoder/queries:

| Metod  | Ändpunkt | Beskrivning                               |
| ------ | -------- | ----------------------------------------- |
| GET    |  /cv     |  Hämtar all data                          |
| GET    |  /cv/:id |  Hämtar all data tillhörande specifikt ID |
| POST   |  /cv     |  Lagrar ny jobbinstans                    |
| PUT    |  /cv/:id |  Uppdaterar jobbinstans med specifikt ID  |
| DELETE |  /cv/:id |  Tar bort jobbinstans med specifikt ID    |

API:et svarar i JSON-format:

```
[
  {
    "id": 1,
    "company": "Firma 1",
    "title": "Jobb 1",
    "description": "Klappade katter",
    "start_date": "2023-04-14",
    "end_date": "2024-01-01"
  }
]
```

## INFO

Har bytt från MySQL till PostgreSQL via Render pga för många haverier.
