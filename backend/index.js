require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const PORT = process.env.PORT || 3001;
const connectDB = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const orderRoutes = require('./routes/orderRoutes');
const itemRoutes = require('./routes/itemRoutes');
const winnerRoutes = require('./routes/winnerRoutes');
const adminRoutes = require('./routes/adminRoutes');
const dealsRoutes = require("./routes/dealsRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

const app = express();

connectDB();

const corsOptions = {
    origin: ['https://crunchy-bites.vercel.app', 'http://localhost:3000'],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(cookieParser());

app.use('/', authRoutes);
app.use('/', orderRoutes);
app.use('/', itemRoutes);
app.use('/', winnerRoutes);
app.use('/', adminRoutes);
app.use('/', dealsRoutes);
app.use('/', notificationRoutes);

app.get('/', (req, res) => {
    res.send('Backend deployed');
});

if (process.env.NODE_ENV !== "production") {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}
module.exports = app;