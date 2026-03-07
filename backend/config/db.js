const mongoose = require('mongoose');

const mongoURI = process.env.MONGO_URI;

const connectDB = async () => {
    try {
        await mongoose.connect(mongoURI);
        console.log("DB Connected");
    } catch (err) {
        console.log(err);
    }
};

module.exports = connectDB;