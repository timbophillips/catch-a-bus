import './css/classless-theme-milligram.css'
import './css/classless.css'
import './css/lucy.css';
import './css/leaflet.css';

import pageHTML from './html/page.html?raw';
import { whichPointIsNearest } from './lib/geoPosition';
import { busStopsGeoPositions } from './busStopsGeoPositions';
import * as L from 'leaflet';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = pageHTML;

const startButton = document.getElementById(
  'catchBusButton'
) as HTMLButtonElement;
const mainContainer = document.getElementById(
  'main-container'
) as HTMLDivElement;
const destinationContainer = document.getElementById(
  'destination-container'
) as HTMLDivElement;
const findLocationButton = document.getElementById(
  'findLocationButton'
) as HTMLButtonElement;
const nearestBusStopBox = document.getElementById(
  'nearestBusStopBox'
) as HTMLInputElement;
const destinationBox = document.getElementById(
  'desiredDestination'
) as HTMLSelectElement;
const requestBusButton = document.getElementById(
  'okButton'
) as HTMLButtonElement;
const messageText = document.getElementById('message') as HTMLDivElement;
const busMap = document.getElementById('LMap1') as HTMLDivElement;

startButton.onclick = function () {
  busStopsGeoPositions.forEach((busStop) => {
    const option = document.createElement('option');
    option.text = busStop.name;
    destinationBox.add(option);
  });
  messageText.innerText = '';
  mainContainer.style.display = 'none';
  destinationContainer.style.display = 'flex';
};

findLocationButton.onclick = async () => {
  const nearestStop = await whichPointIsNearest({
    points: busStopsGeoPositions,
  });
  nearestBusStopBox.value = 'finding nearest stop...';

  // assign the nearest city
  nearestBusStopBox.value = nearestStop.point.name;

  destinationBox.disabled = false;

  /// map test
  console.log('map time');
  const LMap1 = L.map(busMap);
  LMap1.setView([nearestStop.point.position.coords.latitude,nearestStop.point.position.coords.longitude], 13);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(LMap1);
  // LMap1.fitWorld();

  console.log(LMap1);
  //
};

destinationBox.oninput = () => {
  requestBusButton.disabled = false;
};

requestBusButton.onclick = function () {
  messageText.innerText = `Catch-a-Bus is on its way to ${nearestBusStopBox.value} to take you to ${destinationBox.value}!`;
};
