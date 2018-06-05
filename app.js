require('dotenv').config();
const express = require('express');
const app = express();
const fetch = require("node-fetch");
const data = require("./MOCK_DATA.json");
const fs = require('fs');

app.get('/generate/:deliveryid', (req, res) => {
  
  data.deliveries.forEach(delivery => {

    if (delivery.id == req.params.deliveryid) {

      let origins = ['3011WN 99'];
      let destinations = [];

      delivery.packages.forEach(package => {

        const address = package.customer.address.street + " " + package.customer.address.street_number + " " + package.customer.address.postal_code;

        origins.push(address);
        destinations.push(address);

      });

      origins_string = origins.join('|');
      destinations_string = destinations.join('|');
      departureTime = Date.now();

      const url = encodeURI("https://maps.googleapis.com/maps/api/distancematrix/json?units=metric&origins=" + origins_string + "&destinations=" + destinations_string + "&mode=driving&departure_time=" + departureTime + "&key=" + process.env.GOOGLE_KEY);

      return fetch(url).then((response) => {
        return response.json();
      })
      .then((response) => {

        let durations = [];

        for (let i = 0; i < response.rows.length; i++) {
          durations.push(
            {
              package: delivery.packages[i],
              address: destinations[i],
              durations: response.rows[i].elements[i],
              departure_time: delivery.departure_time,
            }
          );
        }

        durations.pop();

        fs.writeFile('delivery_' + delivery.id + '.json', JSON.stringify(durations, null, 2), 'utf8', (err, data) => {
          if (err) {
            console.log("er is een error bitch");
          }
        });

        return res.send(JSON.parse(fs.readFileSync('delivery_' + delivery.id + '.json', 'utf8')));
      })
      .catch((error) => {

        console.log(error);

      });

    }

  });

});


app.get('/deliveries/:deliveryid/packages/:packageid', (req, res) => {
  let departureTime;
  let origins;
  let destinations;

  console.log(req.params);

  data.deliveries.forEach(delivery => {

    delivery.packages.forEach(package => {

      // Package found!
      if (package.id == req.params.packageid) {

        const json = JSON.parse(fs.readFileSync('delivery_' + req.params.deliveryid + '.json', 'utf8'));

        let index = delivery.packages.indexOf(package);

        // Add all previous packages durations in traffic + delay time
        let total_time = 0;
        for (let i = 0; i < index; i++) {
          // Voeg de duration_in_traffic van de package toe aan total_time
          total_time = total_time + json[i].durations.duration_in_traffic.value;

          // Voeg de delay_time van de package toe aan total_time
          total_time += json[i].package.delivery_delay;
        }

        let preciseArrival = json[index].departure_time + total_time;

        let minArrival = preciseArrival - 900;
        let maxArrival = preciseArrival + 900;

        let result = {
          packageData: package,
          preciseArrival: preciseArrival,
          totalTime: total_time,
          minArrival: minArrival,
          maxArrival: maxArrival,
        }

        return res.json(result);
      } 
      // else {
      //     return res.status(404).send("Not found");
      // }


    });
  });

});

app.listen(8000, () => console.log('Example app listening on port 8000!'))


