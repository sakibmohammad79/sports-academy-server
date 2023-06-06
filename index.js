const express = require('express')
const cors = require('cors');
require('dotenv').config()
const app= express();
const port = process.env.PORT || 5000

//set Middlewar
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('smash server running');
})

app.listen(port, () => {
    console.log(`the smash server is running on ${port}`)
})