const express = require("express")
const app = express()
// const fsNdjson = require("fs-ndjson")
const z1p = require("z1p")
const apothekenliste = require("./apothekenliste.json")

function getDistance(lat_a, lng_a, lat_b, lng_b) {
  // bring angles from degrees to radians
  const [lar_a, lnr_a, lar_b, lnr_b] = [lat_a, lng_a, lat_b, lng_b].map(
    (angle) => (angle * Math.PI) / 180
  )
  const distance =
    6371 *
    Math.acos(
      Math.sin(lar_a) * Math.sin(lar_b) +
        Math.cos(lar_a) * Math.cos(lar_b) * Math.cos(lnr_b - lnr_a)
    )
  return distance
}

function geotodata(req, res) {
  const { lat: centerLatitude, lng: centerLongitude } = req.query
  const apotheken = apothekenliste.storeList
    .map((store) => {
      const { latitude, longitude } = store
      const distance = getDistance(
        centerLatitude,
        centerLongitude,
        latitude,
        longitude
      )
      return { ...store, distance }
    })
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 20)
    .map((store) => {
      const { distance, ...remainingStore } = store
      return { ...remainingStore }
    })
  return res
    .status(200)
    .json({ retailerName: "Apotheke", retailerStoreList: apothekenliste })
}

function ziptodata(req, res) {
  const zipCode = req.query
  const zipPlaces = z1p(["DE"]).findBy("zip_code", `${zipCode}`)
  const [zipPlace] = zipPlaces
  const { latitude: centerLatitude, longitude: centerLongitude } = zipPlace
  const apotheken = apothekenliste.storeList
    .map((store) => {
      const { latitude, longitude } = store
      const distance = getDistance(
        centerLatitude,
        centerLongitude,
        latitude,
        longitude
      )
      return { ...store, distance }
    })
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 20)
    .map((store) => {
      const { distance, ...remainingStore } = store
      return { ...remainingStore }
    })
  return res
    .status(200)
    .json({ retailerName: "Apotheke", retailerStoreList: apothekenliste })
}

function wrongEndpoint(req, res) {
  return res
    .status(400)
    .json({ error: { message: "The endpoint you used does not exist." } })
}

app.get("/zip", (req, res) => ziptodata(req, res))
app.get("/geo", (req, res) => geotodata(req, res))
app.all("*", (req, res) => wrongEndpoint(req, res))

const port = 3000
app.listen(port, () => console.log(`App listening on port ${port}...`))
