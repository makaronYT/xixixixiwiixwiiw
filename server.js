const express = require("express");
const fs = require("fs");

const app = express();

app.use(express.json());
app.use(express.static(__dirname));

let latestAlert = null;
let alertTimeout = null;

const CONFIG_FILE = "config.txt";
const LAST_FILE = "Lastdonates.txt";

// =========================
// DONATION SETTINGS
// =========================

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

// =========================
// GOAL CONFIG
// =========================

let goalConfig = {
    title: "NA SERWER MC",
    current: 5,
    goal: 500
};

// =========================
// LOAD CONFIG
// =========================

if (fs.existsSync(CONFIG_FILE)) {
    settings = JSON.parse(fs.readFileSync(CONFIG_FILE));
}

// =========================
// BAD WORDS
// =========================

// =========================
// CENSOR PANEL
// =========================

const CENSOR_FILE = "censor.txt";

// create file if missing
if (!fs.existsSync(CENSOR_FILE)) {
    fs.writeFileSync(CENSOR_FILE, "badword");
}

// load words
function getBadWords() {

    return fs
        .readFileSync(CENSOR_FILE, "utf8")
        .split("\n")
        .map(w => w.trim())
        .filter(Boolean);
}

// use loaded words
function censorText(text) {

    if (!text) return "";

    let output = text;

    const words = getBadWords();

    for (const word of words) {

        const regex =
            new RegExp(word, "gi");

        output =
            output.replace(regex, "****");
    }

    return output;
}

// GET words
app.get("/censor", (req, res) => {

    res.send(`
<!DOCTYPE html>
<html>

<body style="
font-family:sans-serif;
padding:20px;
background:#111;
color:white;
">

<h1>Censor Words</h1>

<p>
One word per line
</p>

<textarea id="words" style="
width:100%;
height:400px;
background:#222;
color:white;
font-size:18px;
padding:10px;
"></textarea>

<br><br>

<button onclick="save()" style="
font-size:20px;
padding:10px 20px;
cursor:pointer;
">
Save
</button>

<script>

async function load() {

    const res =
        await fetch("/censor-data");

    const txt =
        await res.text();

    document
        .getElementById("words")
        .value = txt;
}

async function save() {

    const words =
        document
        .getElementById("words")
        .value;

    await fetch("/censor-data", {

        method:"POST",

        headers:{
            "Content-Type":"text/plain"
        },

        body:words
    });

    alert("Saved!");
}

load();

</script>

</body>
</html>
`);
});

// GET censor file
app.get("/censor-data", (req, res) => {

    res.type("text/plain");

    res.send(
        fs.readFileSync(CENSOR_FILE, "utf8")
    );
});

// SAVE censor file
app.post("/censor-data", (req, res) => {

    fs.writeFileSync(
        CENSOR_FILE,
        req.body
    );

    res.sendStatus(200);
});

// =========================
// SAVE HISTORY
// =========================

function saveLastDonate(data) {
    const line =
        `[${new Date().toISOString()}] ${data.player} | ${data.price} PLN | ${data.item}\n`;

    fs.appendFileSync(LAST_FILE, line);
}

// =========================
// WEBHOOK
// =========================

app.post("/webhook", (req, res) => {

    const d = req.body?.data;

    const price = d?.amount?.total_paid || 0;

    let tier = settings.tiers[0];

    for (const t of settings.tiers) {
        if (price >= t.min) tier = t;
    }

    const player =
        censorText(d?.user?.username || "Unknown");

    const item =
        censorText(d?.basket?.[0]?.name || "Item");

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

    // ADD TO GOAL
    goalConfig.current += price;

    if (alertTimeout)
        clearTimeout(alertTimeout);

    alertTimeout = setTimeout(() => {

        saveLastDonate(latestAlert);

        latestAlert = null;

    }, tier.duration);

    res.sendStatus(200);
});

// =========================
// ALERT DATA
// =========================

app.get("/data", (req, res) => {
    res.json(latestAlert || {});
});

// =========================
// LAST DONATIONS
// =========================

app.get("/lastdonos", (req, res) => {

    if (!fs.existsSync(LAST_FILE)) {
        return res.send("No donations yet");
    }

    res.type("text/plain");

    res.send(
        fs.readFileSync(LAST_FILE, "utf8")
    );
});

// =========================
// SKIP ALERT
// =========================

app.post("/skip", (req, res) => {

    if (latestAlert) {
        saveLastDonate(latestAlert);
    }

    latestAlert = null;

    if (alertTimeout)
        clearTimeout(alertTimeout);

    res.sendStatus(200);
});

// =========================
// SETTINGS SAVE
// =========================

app.post("/settings", (req, res) => {

    settings = req.body;

    fs.writeFileSync(
        CONFIG_FILE,
        JSON.stringify(settings, null, 2)
    );

    res.sendStatus(200);
});

app.get("/settings", (req, res) => {
    res.json(settings);
});

// =========================
// GOAL CONFIG API
// =========================

app.get("/goal-config", (req, res) => {
    res.json(goalConfig);
});

app.post("/goal-config", (req, res) => {

    goalConfig = req.body;

    res.sendStatus(200);
});

// =========================
// START
// =========================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Running on " + PORT);
});
