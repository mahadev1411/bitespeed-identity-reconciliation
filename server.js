const express = require("express")
const cors = require("cors")

require("./src/db/database")

const identifyRoutes = require("./src/routes/identifyRoutes")

const app = express()

app.use(cors())
app.use(express.json())

app.use("/", identifyRoutes)

app.get("/", (req, res) => {
  res.send("Bitespeed Identity Service Running")
})

app.listen(3000, () => {
  console.log("Server running on port 3000")
})