const express = require("express")
const app = express()
const pharmacyList = require("./apothekenliste.json")
// const muellerList = require("./muellerliste.json")
const kadeweList = require("./kadeweliste.json")
const douglasList = require("../douglasliste.json")
const zipList = require("./zipcode.json")

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

async function geotodata(req, res) {
  const { lat: centerLatitude, lng: centerLongitude } = req.query
  try {
    const { retailerStoreList: pharmacyStoreList } = await pharmacyList
    // const { retailerStoreList: muellerStoreList } = await muellerList
    const { retailerStoreList: kadeweStoreList } = await kadeweList
    const { retailerStoreList: douglasStoreList } = await douglasList
    const retailerStoreList = [
      ...pharmacyStoreList,
      // ...muellerStoreList,
      ...kadeweStoreList,
      ...douglasStoreList,
    ]
    const apothekenWithDistance = retailerStoreList.map((store) => {
      const { storeCoordinates } = store
      const { latitude, longitude } = storeCoordinates
      const distance = getDistance(
        centerLatitude,
        centerLongitude,
        latitude,
        longitude
      )
      return { ...store, distance }
    })
    const apothekenWithSortedDistance = apothekenWithDistance.sort(
      (a, b) => a.distance - b.distance
    )
    const truncatedApothekenWithDistance = apothekenWithSortedDistance.filter(
      (store) => store.distance <= 15
    )
    const truncatedApotheken = truncatedApothekenWithDistance.map((store) => {
      const { distance, ...remainingStore } = store
      return { ...remainingStore }
    })
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.setHeader("Content-Type", "application/json")
    return res
      .status(200)
      .json({ retailerName: "Apotheke", retailerStoreList: truncatedApotheken })
  } catch (err) {
    return res.status(500).json({ error: { message: err } })
  }
}

async function ziptodata(req, res) {
  const { zip: zipCode } = req.query
  const { latitude: centerLatitude, longitude: centerLongitude } =
    zipList[`${zipCode}`]
  const { retailerStoreList: pharmacyStoreList } = await pharmacyList
  // const { retailerStoreList: muellerStoreList } = await muellerList
  const { retailerStoreList: kadeweStoreList } = await kadeweList
  const { retailerStoreList: douglasStoreList } = await douglasList
  const retailerStoreList = [
    ...pharmacyStoreList,
    // ...muellerStoreList,
    ...kadeweStoreList,
    ...douglasStoreList,
  ]
  const apothekenWithDistance = await retailerStoreList.map((store) => {
    const { storeCoordinates } = store
    const { latitude, longitude } = storeCoordinates
    const distance = getDistance(
      centerLatitude,
      centerLongitude,
      latitude,
      longitude
    )
    return { ...store, distance }
  })
  const apothekenWithSortedDistance = apothekenWithDistance.sort(
    (a, b) => a.distance - b.distance
  )
  const truncatedApothekenWithDistance = apothekenWithSortedDistance.filter(
    (store) => store.distance <= 15
  )
  const truncatedApotheken = truncatedApothekenWithDistance.map((store) => {
    const { distance, ...remainingStore } = store
    return { ...remainingStore }
  })
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Content-Type", "application/json")
  return res
    .status(200)
    .json({ retailerName: "Apotheke", retailerStoreList: truncatedApotheken })
}

function wrongEndpoint(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Content-Type", "application/json")
  return res
    .status(400)
    .json({ error: { message: "The endpoint you used does not exist." } })
}

app.get("/zip", (req, res) => ziptodata(req, res))
app.get("/geo", (req, res) => geotodata(req, res))
app.all("*", (req, res) => wrongEndpoint(req, res))

const port = 3000
app.listen(port, () => console.log(`App listening on port ${port}...`))
