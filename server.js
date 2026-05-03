const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

let latestAlert = null;

// receive data from Make.com
app.post("/webhook", (req, res) => {
    latestAlert = req.body;
    console.log("New alert:", latestAlert);
    res.sendStatus(200);
});

// OBS reads this
app.get("/alert", (req, res) => {
    res.json(latestAlert || {});
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});
