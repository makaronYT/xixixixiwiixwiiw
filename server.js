const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

let latestAlert = null;

// receive webhook from Make.com
app.post("/webhook", (req, res) => {
    latestAlert = req.body;
    console.log("New alert:", latestAlert);
    res.sendStatus(200);
});

// serve OBS overlay page
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/overlay.html");
});

// provide latest data
app.get("/data", (req, res) => {
    res.json(latestAlert || {});
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Running on " + PORT));
