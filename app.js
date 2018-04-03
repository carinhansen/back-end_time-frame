require('dotenv').config();
const express = require('express');
const app = express();
const fetch = require("node-fetch");
const data = require("./MOCK_DATA.json");

const origin = "Rotterdam";
const destination = "Amsterdam";

app.get('/packages/:packageid', (req, res) => {
  let departureTime;
  console.log(req.params);

  for(var i = 0; i < data.length; i++)
  {
    if(data[i].packageid == req.params.packageid)
    {
      departureTime = data[i].departure_time;

      return fetch("https://maps.googleapis.com/maps/api/distancematrix/json?units=imperial&origins=" + origin + "&destinations=" + destination + "mode=driving&departure_time=" + departureTime + "&key=" + process.env.GOOGLE_KEY).then((response) => {
        return response.json();

      })
        .then((response) => {
          let result = {
            google: response,
            packageData: data[i]
          }
          return res.json(result);
        });

    } else {
        return res.status(404).send("Not found");
    }
  }
});

app.listen(8000, () => console.log('Example app listening on port 3000!'))


