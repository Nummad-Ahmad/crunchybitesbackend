const cron = require("node-cron");
const axios = require("axios");
const moment = require("moment");

cron.schedule("0 11 22,28 * *", async () => {
    console.log("Running lucky draw...");

    try {
        const formattedDate = moment().format("YYYY-MM-DD");
        const response = await axios.post("http://localhost:3000/winner", { date: formattedDate });

        console.log(response.data.message);
    } catch (error) {
        console.error("Error running lucky draw:", error);
    }
});
