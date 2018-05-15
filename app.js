require('dotenv').config();
const express = require('express');
const app = express();
const fetch = require("node-fetch");
const data = require("./MOCK_DATA.json");

app.get('/packages/:packageid', (req, res) => {
  let departureTime;
  let origin;
  let destination;

  console.log(req.params);

  for(var i = 0; i < data.length; i++)
  {
    if(data[i].packageid == req.params.packageid)
    {
      departureTime = data[i].departure_time;
      origin = data[i].origin;
      destination = data[i].destination;

      return fetch("https://maps.googleapis.com/maps/api/distancematrix/json?units=imperial&origins=" + origin + "&destinations=" + destination + "mode=driving&departure_time=" + departureTime + "&key=" + process.env.GOOGLE_KEY).then((response) => {
        return response.json();

      })
        .then((response) => {

          let durationDelivery = response.rows[0].elements[0].duration_in_traffic.value;
          let preciseArrival = departureTime + durationDelivery;

          let minArrival = preciseArrival - 900;
          let maxArrival = preciseArrival + 900;

          let result = {
            google: response,
            packageData: data[i],
            preciseArrival: preciseArrival,
            minArrival: minArrival,
            maxArrival: maxArrival,
          }
          return res.json(result);
        });

    } else {
        return res.status(404).send("Not found");
    }
  }
});

app.listen(8000, () => console.log('Example app listening on port 8000!'))


