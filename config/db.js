const mongoose = require('mongoose');
mongoose.set('strictQuery', true);

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URL_USER)

        console.log(`MongoDB connected: ${conn.connection.host}`.green.underline);
    } catch (error) {
        console.log(`ERROR: ${error}`.red);
        process.exit(1)
    }
}

module.exports = connectDB;