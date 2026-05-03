const express = require("express");

const app = express();
app.use(express.json());

let latestAlert = null;

// webhook from Tip4Serv
app.post("/webhook", (req, res) => {
    try {
        const data = req.body;

        latestAlert = {
            player: data?.data?.user?.username || "Unknown",
            item: data?.data?.basket?.[0]?.name || "Item",
            price: data?.data?.amount?.total_paid || 0
        };

        console.log("Alert:", latestAlert);

        res.sendStatus(200);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});

// overlay page
app.get("/", (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<body style="margin:0;background:transparent;">
<div id="alert" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:40px;color:white;background:rgba(0,0,0,0.7);padding:20px;border-radius:10px;display:none;"></div>

<script>
let last = "";

async function load() {
    const res = await fetch("/data");
    const data = await res.json();

    if (!data.player) return;

    const str = JSON.stringify(data);
    if (str === last) return;
    last = str;

    const box = document.getElementById("alert");
    box.innerText = data.player + " bought " + data.item + " for " + data.price + " PLN";
    box.style.display = "block";

    setTimeout(() => box.style.display = "none", 5000);
}

setInterval(load, 1000);
</script>
</body>
</html>
`);
});

// data endpoint
app.get("/data", (req, res) => {
    res.json(latestAlert || {});
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Running on " + PORT));
