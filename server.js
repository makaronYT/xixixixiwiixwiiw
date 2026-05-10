const express = require("express");
const fs = require("fs");

const app = express();
app.use(express.json());

let latestAlert = null;
let alertTimeout = null;

const CONFIG_FILE = "config.txt";
const LAST_FILE = "Lastdonates.txt";

// default config
let settings = {
    tts: true,
    censor: true,
    tiers: [
        {
            min: 0,
            duration: 5000,
            gif: "",
            sound: "",
            color: "#ffffff"
        }
    ]
};

// load config if exists
if (fs.existsSync(CONFIG_FILE)) {
    settings = JSON.parse(fs.readFileSync(CONFIG_FILE));
}

// bad words
const badWords = [
    // english
    "fuck","bitch","nigger","shit","asshole",
    // polish
    "kurwa","chuj","jebać","pizda","skurwysyn"
];

function censorText(text) {
    if (!text) return "";

    let output = text;

    for (const word of badWords) {
        const regex = new RegExp(word, "gi");
        output = output.replace(regex, "****");
    }

    return output;
}

// save donation history
function saveLastDonate(data) {
    const line =
        `[${new Date().toISOString()}] ${data.player} | ${data.price} PLN | ${data.item}\n`;

    fs.appendFileSync(LAST_FILE, line);
}

// webhook
app.post("/webhook", (req, res) => {
    const d = req.body?.data;

    const price = d?.amount?.total_paid || 0;

    let tier = settings.tiers[0];

    for (const t of settings.tiers) {
        if (price >= t.min) tier = t;
    }

    const player = censorText(d?.user?.username || "Unknown");
    const item = censorText(d?.basket?.[0]?.name || "Item");

    latestAlert = {
        id: Date.now(),
        player,
        item,
        price,
        gif: tier.gif,
        sound: tier.sound,
        color: tier.color,
        duration: tier.duration,
        tts: settings.tts
    };

    // clear previous timer
    if (alertTimeout) clearTimeout(alertTimeout);

    // auto archive + clear
    alertTimeout = setTimeout(() => {
        saveLastDonate(latestAlert);
        latestAlert = null;
    }, tier.duration);

    res.sendStatus(200);
});

// current donation
app.get("/data", (req, res) => {
    res.json(latestAlert || {});
});

// last donations txt
app.get("/lastdonos", (req, res) => {
    if (!fs.existsSync(LAST_FILE)) {
        return res.send("No donations yet");
    }

    res.type("text/plain");
    res.send(fs.readFileSync(LAST_FILE, "utf8"));
});

// skip donation
app.post("/skip", (req, res) => {
    if (latestAlert) {
        saveLastDonate(latestAlert);
    }

    latestAlert = null;

    if (alertTimeout) clearTimeout(alertTimeout);

    res.sendStatus(200);
});

// settings save
app.post("/settings", (req, res) => {
    settings = req.body;

    fs.writeFileSync(CONFIG_FILE, JSON.stringify(settings, null, 2));

    res.sendStatus(200);
});

// settings load
app.get("/settings", (req, res) => {
    res.json(settings);
});

// overlay
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/overlay.html");
});

// panel
app.get("/panel", (req, res) => {
    res.sendFile(__dirname + "/panel.html");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Running on " + PORT);
});
