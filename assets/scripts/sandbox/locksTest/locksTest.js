import { fetchAllLocksForSpecificChannel, fetchChannel } from "../../data.js";

async function main() {
    // // partie fetch
    const channelData = await fetchChannel();

    const loksForChannel = {};

    for (const channel of channelData.results) {
        loksForChannel[channel.voie_navigable] = await fetchAllLocksForSpecificChannel(channel.voie_navigable);
    }

    console.log(loksForChannel);


    // partie créeation de la map
    // Carte
    const map = L.map("map").setView([47.2184, -1.5536], 8);

    // Fond
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    const colors = ["red", "blue", "green", "orange", "purple", "cyan"];


    const layer_geo_point = L.layerGroup().addTo(map);
    const layer_geo_shape = L.layerGroup().addTo(map);
    const layer_point_geo_bief = L.layerGroup().addTo(map);

    const layerControl = {
        point_geo_bief: layer_point_geo_bief,
        geo_point: layer_geo_point,
        geo_shape: layer_geo_shape,
    };

    Object.entries(loksForChannel).forEach(([channelName, locks], index) => {

        // point_geo_bief
        locks.forEach(lock => {
            if (!lock.point_geo_bief) return;

            const geo = lock.point_geo_bief;
            L.circleMarker([geo.lat, geo.lon], {
                radius: 8,
                color: colors[0],
                fillColor: colors[0],
                fillOpacity: 1
            }).bindPopup(`${Object.entries(lock).map(([key, valeur]) => `<p class='popup'>${key}: ${valeur}</p>`).join("")}`)
                .addTo(layer_point_geo_bief);
        });

        // geo_point
        locks.forEach(lock => {
            if (!lock.geo_point) return;

            const geo = lock.geo_point.split(",").map(Number);
            L.circleMarker([geo[0], geo[1]], {
                radius: 8,
                color: colors[1],
                fillColor: colors[1],
                fillOpacity: 1
            }).bindPopup(`${Object.entries(lock).map(([key, valeur]) => `<p class='popup'>${key}: ${valeur}</p>`).join("")}`)
                .addTo(layer_geo_point);
        });

        // geo_shape
        locks.forEach(lock => {
            if (!lock.geo_shape) return;

            const geo = JSON.parse(lock.geo_shape);
            L.circleMarker([geo.coordinates[1], geo.coordinates[0]], {
                radius: 8,
                color: colors[2],
                fillColor: colors[2],
                fillOpacity: 1
            }).bindPopup(`${Object.entries(lock).map(([key, valeur]) => `<p class='popup'>${key}: ${valeur}</p>`).join("")}`)
                .addTo(layer_geo_shape);
        });

    });

    // Contrôle layers
    L.control.layers(null, layerControl).addTo(map);

    map.invalidateSize();
}

document.addEventListener("DOMContentLoaded", () => {
    main();
});