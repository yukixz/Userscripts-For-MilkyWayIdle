import express from "express";
import cors from "cors";

let LAST_API_TIMESTAMP = 0;
let APIJson = null;

const app = express();
const port = 5500;
app.use(express.json());
app.use(cors());

app.get("/apijson", async (req, res) => {
    console.log("GET /apijson: " + req.originalUrl);
    res.status(200).json(await getJson());
});

app.listen(port, () => {
    console.log(`MWIMarketAPICache app listening on port ${port}`);
});

async function getJson() {
    if (!APIJson || Date.now() - LAST_API_TIMESTAMP > 600000) {
        APIJson = await API_fetch();
    }
    return APIJson;
}

async function API_fetch() {
    LAST_API_TIMESTAMP = Date.now();
    console.log("API_fetch start");
    const response = await fetch(`https://raw.githubusercontent.com/holychikenz/MWIApi/main/medianmarket.json`);
    if (!response) {
        console.error("API_fetch response null");
        return null;
    }
    const json = await response.json();
    if (!json) {
        console.error("API_fetch parse json null");
        return null;
    }
    console.log("API_fetch done");
    return json;
}
