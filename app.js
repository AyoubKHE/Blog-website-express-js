require('dotenv').config();

const express = require('express');
const connectDB = require("./server/config/db.js").connectDB;
const setMiddlewars = require("./server/middlewares/main.js").setMiddlewars;

const app = express();
const PORT = process.env.APP_PORT;


(async function () {
    await connectDB();
    app.listen(PORT, () => {
        console.log(`App listening on port ${PORT}`);
    });
})();

setMiddlewars(app);

app.set('layout', './layouts/main');
app.set('view engine', 'ejs');

