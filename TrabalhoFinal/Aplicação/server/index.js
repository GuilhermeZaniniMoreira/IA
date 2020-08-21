const express = require('express')
const app = express();
const path = require('path');
var cors = require('cors');
const port = 3333;

app.use(cors());
app.use("/api", express.static(path.join(__dirname, "assets")));

app.listen(port, () => {
    console.log(`Listening at http://localhost:${port}`);
});