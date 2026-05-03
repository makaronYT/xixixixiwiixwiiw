const express = require("express");
const app = express();

app.use(express.json());

let latestAlert = null;

// 🔧 SETTINGS (editable via panel)
let settings = {
    tiers: [
        { min: 0, gif: "https://i.imgur.com/1.gif", sound: "", color: "#ffffff" },
        { min: 50, gif: "https://i.imgur.com/2.gif", sound: "https://example.com/sound1.mp3", color: "#00ffcc" },
        { min: 100, gif: "https://i.imgur.com/3.gif", sound: "https://example.com/sound2.mp3", color: "#ffcc00" }
    ]
};

// webhook
app.post("/webhook", (req, res) => {
    const d = req.body?.data;

    const price = d?.amount?.total_paid || 0;

    // pick tier
    let tier = settings.tiers[0];
    for (let t of settings.tiers) {
        if (price >= t.min) tier = t;
    }

    latestAlert = {
        player: d?.user?.username || "Unknown",
        item: d?.basket?.[0]?.name || "Item",
        price,
        gif: tier.gif,
        sound: tier.sound,
        color: tier.color
    };

    res.sendStatus(200);
});

// data
app.get("/data", (req, res) => {
    res.json(latestAlert || {});
});

// panel (simple API)
app.post("/settings", (req, res) => {
    settings = req.body;
    res.sendStatus(200);
});

app.get("/settings", (req, res) => {
    res.json(settings);
});

// overlay
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/overlay.html");
});

// panel UI
app.get("/panel", (req, res) => {
    res.sendFile(__dirname + "/panel.html");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Running on " + PORT));
