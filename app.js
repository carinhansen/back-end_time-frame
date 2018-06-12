require('dotenv').config();
const express = require('express');
const app = express();
const fetch = require("node-fetch");
const data = require("./MOCK_DATA.json");
const fs = require('fs');
const synaptic = require('synaptic');

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
          if (delivery.packages[i]) {
            delivery.packages[i].delivery_delay = getDelayTime(delivery.packages[i]);
            const package_with_delay = delivery.packages[i];
            durations.push(
              {
                package: package_with_delay,
                address: destinations[i],
                durations: response.rows[i].elements[i],
                departure_time: delivery.departure_time,
              }
            );
          }
        }

        durations.pop();

        fs.writeFile('delivery_' + delivery.id + '.json', JSON.stringify(durations, null, 2), 'utf8', (err, data) => {
          if (err) {
            console.log("er is een error bitch");
          }
        });

        let result = fs.readFile('delivery_' + delivery.id + '.json', 'utf8', (err, data) => {
          if(err){
            console.error(err); 
            return 
          }

          return res.json(JSON.parse(data));

        } ); 
        
      })
      .catch((error) => {

        console.log(error);

      });

    }

  });

});


app.get('/deliveries/:deliveryid/packages/:packageid', (req, res) => {

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

function getDelayTime(package) {

  const network = new synaptic.Architect.Perceptron(5, 3, 1);
  const trainer = new synaptic.Trainer(network);

  // Training
  const importData = new Promise(async (resolve, reject) => {
    console.log('getDelayTime', 'Importing data...');
    try {
      const request = await fetch('training_data/training_data.json');
      const data = await request.json();
      resolve(data);
    } catch (err) {
      reject(err);
    }
  });

  const formatData = new Promise(async (resolve, reject) => {
    const data = await importData;
    console.log('getDelayTime', 'Formatting data...');

    const mappedData = data.deliveries[0].packages.map(package => {
      const fragile = package.fragile ? 1 : 0;
      return {
        input: [
          // Weight
          package.weight / 68,
          // Width
          package.dimensions.width / 274,
          // Height
          package.dimensions.height / 274,
          // Depth
          package.dimensions.depth / 274,
          // Fragile
          fragile,
        ],
        output: [package.delivery_delay / 3600]
      }
    });

    resolve(mappedData);
  });

  const train = async (trainer) => {
    const settings = {
      rate: 0.3,
      iterations: 1000,
      error: 0.005,
      shuffle: true,
      log: 100,
      cost: synaptic.Trainer.cost.CROSS_ENTROPY,
    }
    const data = await formatData;
    console.log('getDelayTime, Training using ', data);
    trainer.train(data, settings);
  }

  train(trainer);

  const output = network.activate([package.weight / 68, package.dimensions.width / 274, package.dimensions.height / 274, package.dimensions.depth / 274, package.fragile]);

  return Math.floor(output[0] * 3600);
}

app.listen(8000, () => console.log('Timeframe Back-end listening on port 8000!'))
