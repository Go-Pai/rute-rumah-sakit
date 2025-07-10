document.addEventListener("DOMContentLoaded", function () {
    const hospitalGrid = document.querySelector(".hospital-grid");

    fetch("rumah_sakit.geojson")
        .then(response => response.json())
        .then(data => {
            data.features.forEach(feature => {
                const namaRS = feature.properties.name;
                const lokasiRS = feature.properties.lokasi || "Lokasi tidak tersedia";

                // Buat elemen rumah sakit baru
                const divRS = document.createElement("div");
                divRS.classList.add("hospital");

                // Isi konten rumah sakit
                divRS.innerHTML = `
                    <h3>${namaRS}</h3>
                    <p>Lokasi: ${lokasiRS}</p>
                    <a href="peta.html?nama=${encodeURIComponent(namaRS)}" class="hospital-button">Lihat Peta</a>
                `;
            });
        })
        .catch(error => console.error("Gagal memuat data rumah sakit:", error));
});
