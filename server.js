const express = require('express');
const colors = require('colors');
const dotenv = require('dotenv').config();
const connectDB = require('./config/db');
const cors = require('cors');

connectDB();

const PORT = process.env.PORT


const app = express();
app.use(cors());
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/prog', require('./routes/routes'));

app.listen(PORT, () => {
    console.log(`Server started on PORT ${PORT}`.green);
})