const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const userModel = require('./models/users');
const itemModel = require('./models/items');
const winnerModel = require('./models/winner');
const orderModel = require('./models/order');
const bcrypt = require('bcrypt');
const { sendVerificationCode } = require('./email');
const mongoURI = 'mongodb://localhost:27017/users';
require('dotenv').config();
const jwt = require('jsonwebtoken');
const moment = require("moment");
const cron = require("node-cron");
const http = require("http"); 
const { Server } = require("socket.io");

dotenv.config();
const app = express();
const server = http.createServer(app); 
const io = new Server(server, { cors: { origin: "*" } });
const port = 3000;

const corsOptions = {
    // origin: process.env.REACT_APP_FRONT_END || 'http://localhost:3002', 
    origin: '*',
    methods: ["GET", "POST", "PUT", "DELETE"],
};

app.use(cors(corsOptions));
app.use(express.json());

async function declareWinner() {
    const today = moment().format("YYYY-MM-DD");
    const currentDay = moment(today).date();

    const startDate = moment(today).startOf("month").toDate();
    const endDate = moment(today).endOf("month").toDate();

    try {
        const orders = await orderModel.find({
            date: { $gte: startDate, $lte: endDate }
        });

        if (orders.length === 0) {
            console.log("No orders found for this month.");
            return;
        }

        const totalByEmail = orders.reduce((acc, { sender, total }) => {
            acc[sender] = (acc[sender] || 0) + total;
            return acc;
        }, {});

        const highestEmail = Object.keys(totalByEmail).reduce((a, b) =>
            totalByEmail[a] > totalByEmail[b] ? a : b
        );

        const winnerUser = await userModel.findOneAndUpdate(
            { email: highestEmail },
            { $inc: { wins: 1 } },
            { new: true }
        );

        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        await winnerModel.create({
            email: highestEmail,
            name: winnerUser.name,
            orders: totalByEmail[highestEmail],
            verificationCode,
            isVerified: false,
            date: new Date(),
        });
        await sendVerificationCode(highestEmail, `Congrats ${winnerUser.name}. You won this months lucky draw. Your verification code is ${verificationCode}. Don't share it with others. Reach us for more details`, "Lucky draw won");
    } catch (error) {
    }
}
cron.schedule("59 23 * * *", async () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    if (tomorrow.getDate() == 1) {
        await declareWinner();
    }
}, {
    timezone: "Asia/Karachi"
});


app.get('/', async(req, res) => {
    res.send('Backend deployed')
})
app.get('/data', async (req, res) => {
    const { email, date } = req.query;
    const startDate = moment(date, "YYYY-MM-DD").startOf("month").toDate();
    const endDate = moment(date, "YYYY-MM-DD").endOf("month").toDate();
    try {
        const data = await orderModel.find({
            sender: email,
            date: { $gte: startDate, $lte: endDate }
        });
        res.status(200).json({ data });
    } catch (e) {
        res.status(500).json({ message: "An error occured" });
    }
});
app.get('/customerdata', async (req, res) => {
    try {
        const data = await userModel.find({});
        res.status(200).json({ data: data });
    } catch (e) {
        console.log(e);
        res.status(500).json({ message: "An error occured" });
    }
});
app.get('/itemdata', async (req, res) => {
    try {
        const itemData = await itemModel.find();
        res.status(200).json({ data: itemData });
    } catch (e) {
        res.status(500).json({ message: "An error occurred" });
    }
})
app.get('/winner', async (req, res) => {
    try {
        console.log('A');
        const latestWinner = await winnerModel.findOne().sort({ date: -1 });
        console.log('latestWinner', latestWinner);
        if (!latestWinner) {
            return res.status(404).json({ message: "No winner has been declared yet." });
        }
        res.status(200).json({ winner: latestWinner });
    } catch (error) {
        console.error("Error fetching latest winner:", error);
        res.status(500).json({ message: "An error occurred" });
    }
});
app.get('/showorders', async(req, res)=>{
    try{
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0)); 
        const endOfDay = new Date(today.setHours(23, 59, 59, 999)); 
        const orderData = await orderModel.find({
            date: { $gte: startOfDay, $lte: endOfDay } 
        });
        res.status(200).json({ data: orderData });
    }catch(e){
        console.log(e);
    }
})

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const existingUser = await userModel.findOne({ email });

        if (!existingUser) {
            return res.status(400).json({ error: 'User not found. Please sign up first.' });
        }
        const isPasswordValid = await bcrypt.compare(password, existingUser.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        res.status(200).json({ message: 'Login successful', user: existingUser });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'An error occurred while processing your request' });
    }
});

app.post('/signup', async (req, res) => {
    const { email, password, name } = req.body;
    try {
        const existingUser = await userModel.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already exists' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const newUser = await userModel.create({ email, password: hashedPassword, name, isVerified: false, verificationCode, orders: 0, wins: 0 });
        await sendVerificationCode(email, `Verify your email to get started. Your verification code is ${verificationCode}.`, "Verify your email");
        res.status(201).json(newUser);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'An error occurred while processing your request' });
    }
});

app.post('/verify', async (req, res) => {
    const { email, verificationCode } = req.body;
    try {
        const user = await userModel.findOneAndUpdate(
            { email, verificationCode },
            { $set: { isVerified: true }, $unset: { verificationCode: "" } },
            { new: true }
        );
        if (!user) {
            return res.status(404).json({ error: 'Invalid verification code' });
        }
        res.status(200).json({ message: 'Account verified successfully' });
    } catch (e) {
        console.error('Error:', e);
        res.status(500).json({ error: 'An error occurred while processing your request' });
    }
});
app.post('/updateorders', async (req, res) => {
    const { user } = req.body;
    try {

        res.status(200).json({ success: true, message: "Orders updated successfully", user: updatedUser });
    } catch (e) {
        res.status(500).json({ message: "An error occurred" });
    }
});

app.post('/forgotpassword', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        user.verificationCode = verificationCode;
        await user.save();
        await sendVerificationCode(email, verificationCode);
        return res.status(200).json({ message: 'Check your email for an OTP!' });
    } catch (error) {
        return res.status(500).json({ error: 'Server error. Please try again later.' });
    }
});
app.post('/verifyforgotpassword', async (req, res) => {
    const { email, verificationCode, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await userModel.findOneAndUpdate(
            { email, verificationCode },
            { $set: { password: hashedPassword }, $unset: { verificationCode: "" } },
            { new: true }
        );
        if (!user) {
            return res.status(404).json({ error: 'Invalid verification code' });
        }
        res.status(200).json({ message: 'Account verified successfully' });
    } catch (e) {
        console.error('Error:', e);
        res.status(500).json({ error: 'An error occurred while processing your request' });
    }
});
app.post('/order', async (req, res) => {
    const { email, date, items, price, time } = req.body;
    const sum = items.samosa + items.fries + items.cheesyFries + items.roll;
    console.log(items);
    try {
        const updatedUser = await userModel.findOneAndUpdate(
            { email: email },
            { $inc: { orders: 1 } },
            { new: true }
        );
        const newOrder = await orderModel.create({ sender: email, date, items, total: sum, price, time });
        res.status(201).json({ message: "Ordered successfully" });
    } catch (e) {
        console.log(e);
        res.status(500).json({ error: 'An error occurred while processing your request' });
    }
})
app.post('/updateitem', async (req, res) => {
    const { name, price } = req.body;
    try {
        const updatedItem = await itemModel.findOneAndUpdate(
            { name: name },
            { price: price },
            { new: true }
        )
        res.status(200).json({ message: "Updated successfully" });
    } catch (e) {
        res.status(500).json({ message: "An error occurred" });
    }
})

mongoose.connect(mongoURI).then(console.log("Connected")).catch(e => {
    console.log(e);
})

app.listen(port, () => {
    console.log('server started', port);
})