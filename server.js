const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

let latestAlert = null;

// receive data from Make.com
app.post("/webhook", (req, res) => {
    const data = req.body;

    // extract real Tip4Serv data
    latestAlert = {
        player: data.data.user.username,
        item: data.data.basket[0].name,
        price: data.data.amount.total_paid
    };

    console.log("Processed alert:", latestAlert);

    res.sendStatus(200);
});
