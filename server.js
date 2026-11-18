const express = require('express');

const app = express();

const PORT = 3000;

app.get('/', (req, res) => {
    res.send('Welcome to PuthagamCircle!');
});

app.listen(PORT, () => {
    console.log(`PuthagamCircle server running on port ${PORT}`);
});