const params = new URLSearchParams(window.location.search);
const hospitalName = params.get("nama");

window.onload = function () {
  const hospitalNameElement = document.getElementById("hospital-name");
  if (hospitalNameElement) hospitalNameElement.innerText = hospitalName || "-";

  const map = L.map("hospital-map").setView([-3.85, 102.3], 13);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  let userMarker, hospitalMarker, routeLayer;

  function getUserLocation(callback) {
    navigator.geolocation.getCurrentPosition(
      pos => callback(pos.coords.latitude, pos.coords.longitude),
      () => {
        // Jika lokasi gagal didapatkan
        alert("Lokasi pengguna tidak ditemukan.");
  
        // Tampilkan popup di posisi default
        const defaultLat = -3.85;
        const defaultLng = 102.3;
        callback(defaultLat, defaultLng);
  
        // Tambahkan popup ke peta
        L.popup()
          .setLatLng([defaultLat, defaultLng])
          .setContent("📍 Lokasi pengguna tidak ditemukan. Menampilkan lokasi default.")
          .openOn(map);
      }
    );
  }
  

  fetch("rumah_sakit.geojson")
    .then(res => res.json())
    .then(data => {
      const selectedHospital = data.features.find(h => h.properties.name.trim() === hospitalName?.trim());
      if (!selectedHospital) return;

      document.getElementById("rs-name").innerText = selectedHospital.properties["name"] || "-";
      document.getElementById("rs-city").innerText = selectedHospital.properties["addr:city"] || "-";
      document.getElementById("rs-address").innerText = selectedHospital.properties["addr:full"] || "-";
      document.getElementById("rs-operator").innerText = selectedHospital.properties["operator:type"] || "-";
      document.getElementById("rs-phone").innerText = selectedHospital.properties["phone"] || "-";

      const websiteLink = document.getElementById("rs-website");
      websiteLink.href = selectedHospital.properties.website || "#";
      websiteLink.innerText = selectedHospital.properties.website ? "Kunjungi Situs" : "-";

      const hospitalLat = selectedHospital.geometry.coordinates[1];
      const hospitalLng = selectedHospital.geometry.coordinates[0];

      hospitalMarker = L.marker([hospitalLat, hospitalLng]).addTo(map)
        .bindPopup(`<b>${hospitalName}</b>`).openPopup();

      const navigateBtn = document.getElementById("navigate-btn");
      navigateBtn.href = `https://www.google.com/maps/dir/?api=1&destination=${hospitalLat},${hospitalLng}`;
      navigateBtn.target = "_blank";

      getUserLocation((userLat, userLng) => {
        userMarker = L.marker([userLat, userLng]).addTo(map)
          .bindPopup("Lokasi Anda").openPopup();

        getRoute(userLat, userLng, hospitalLat, hospitalLng, map);
      });
    });
};

// Fungsi untuk decode polyline
function decodePolyline6(encoded) {
  let index = 0, lat = 0, lng = 0, coordinates = [];

  while (index < encoded.length) {
    let b, shift = 0, result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lat += ((result & 1) ? ~(result >> 1) : (result >> 1));

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lng += ((result & 1) ? ~(result >> 1) : (result >> 1));

    coordinates.push([lat / 1e6, lng / 1e6]);
  }

  return coordinates;
}

// Fungsi untuk menentukan emoji berdasarkan instruksi
function getDirectionEmoji(instruction) {
  const text = instruction.toLowerCase();
  if (text.includes("start")) return "🧭";
  if (text.includes("roundabout")) return "🔁";
  if (text.includes("slight left")) return "↖️";
  if (text.includes("slight right")) return "↗️";
  if (text.includes("sharp left")) return "↩️";
  if (text.includes("sharp right")) return "↪️";
  if (text.includes("left")) return "⬅️";
  if (text.includes("right")) return "➡️";
  if (text.includes("straight") || text.includes("continue") || text.includes("head")) return "⬆️";
  if (text.includes("u-turn") && text.includes("left")) return "↩️";
  if (text.includes("u-turn") && text.includes("right")) return "↪️";
  if (text.includes("arrive") || text.includes("destination")) return "🏁";
  return "➡️";
}

// Fungsi untuk mengambil rute dari Valhalla
function getRoute(userLat, userLng, hospitalLat, hospitalLng, map) {
  const url = "https://valhalla1.openstreetmap.de/route";
  const requestBody = {
    locations: [
      { lat: userLat, lon: userLng },
      { lat: hospitalLat, lon: hospitalLng }
    ],
    costing: "auto",
    directions_options: { units: "kilometers" }
  };

  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody)
  })
    .then(response => response.json())
    .then(data => {
      const shape = data.trip.legs[0].shape;
      const coordinates = decodePolyline6(shape);

      if (window.routeLayer) map.removeLayer(window.routeLayer);
      window.routeLayer = L.polyline(coordinates, { color: "green", weight: 5 }).addTo(map);
      map.fitBounds(window.routeLayer.getBounds());

      const distance = data.trip.summary.length.toFixed(2);
      document.getElementById("route-distance").innerText = `Jarak: ${distance} km`;

      const steps = data.trip.legs[0].maneuvers;
      const directionsList = document.getElementById("directions-list");
      if (directionsList) {
        let html = "<ul style='list-style: none; padding-left: 0;'>";
        steps.forEach(step => {
          const icon = getDirectionEmoji(step.instruction);
          html += `<li style="margin-bottom: 8px;">${icon} ${step.instruction}</li>`;
        });
        html += "</ul>";
        directionsList.innerHTML = html;
      }
    })
    .catch(error => console.error("Error fetching route:", error));
}

// Tampilkan/Sembunyikan Info & Rute
document.addEventListener("DOMContentLoaded", () => {
  const showBtn = document.getElementById("show-route-btn");
  const backBtn = document.getElementById("back-to-info-btn");
  const infoDiv = document.getElementById("hospital-info");
  const routeDiv = document.getElementById("route-info");

  if (showBtn && backBtn && infoDiv && routeDiv) {
    showBtn.addEventListener("click", (e) => {
      e.preventDefault();
      infoDiv.style.display = "none";
      routeDiv.style.display = "block";
    });

    backBtn.addEventListener("click", (e) => {
      e.preventDefault();
      infoDiv.style.display = "block";
      routeDiv.style.display = "none";
    });
  }
});
