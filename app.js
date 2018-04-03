require('dotenv').config();
const express = require('express');
const app = express();
const fetch = require("node-fetch");

const origin = "Rotterdam";
const destination = "Haarlem";
const departureTime = "1522774800";

app.get('/', (req, res) => {

  fetch("https://maps.googleapis.com/maps/api/distancematrix/json?units=imperial&origins=" + origin + "&destinations=" + destination + "mode=driving&departure_time=" + departureTime + "&key=" + process.env.GOOGLE_KEY).then((response) => {
    return response.json();
  })
  .then((response) => {
    return res.json(response);
  })
});

app.listen(8000, () => console.log('Example app listening on port 3000!'))
