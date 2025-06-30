const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const userModel = require('./models/users');
const itemModel = require('./models/items');
const winnerModel = require('./models/winner');
const orderModel = require('./models/order');
const bcrypt = require('bcrypt');
const { sendVerificationCode, sendQRCode } = require('./email');
const mongoURI = 'mongodb+srv://nummad:zfjektln@cluster0.qllkfkv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
require('dotenv').config();
const moment = require("moment-timezone");
const QRCode = require("qrcode");
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

dotenv.config();
const app = express();
const port = 3000;

const corsOptions = {
    origin: ['https://crunchy-bites.vercel.app', 'http://localhost:3001'],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

const verifyToken = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: 'No token found' });

    try {
        const decoded = jwt.verify(token, 'SECRET!@#');
        req.user = decoded;
        next();
    } catch {
        return res.status(403).json({ error: 'Invalid token' });
    }
};


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
        const qrData = JSON.stringify({ email: highestEmail, verificationCode });
        const qrCodeUrl = await QRCode.toDataURL(qrData);
        await sendQRCode(
            highestEmail,
            `Congrats ${winnerUser.name}. You have won this month's lucky draw. Get this QR code scanned by us and claim you reward. Reach us for more details.`,
            "Lucky draw won",
            qrCodeUrl
        );
    } catch (error) {
    }
}
// cron.schedule("43 14 * * *", async () => {
//     const today = new Date();
//     const tomorrow = new Date(today);
//     tomorrow.setDate(today.getDate() + 1);
//     if (tomorrow.getDate() == 1) {
//         await declareWinner();
//     }
// }, {
//     timezone: "Asia/Karachi"
// });


app.get('/', async (req, res) => {
    res.send('Backend deployed')
})
app.get('/verify-token', verifyToken, async (req, res) => {
    const user = await userModel.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.status(200).json({ user });
});

app.get("/declareWinner", async (req, res) => {
    const today = moment().tz("Asia/Karachi");
    const tomorrow = today.clone().add(1, "day");
    console.log("Yes");
    try {
        if (tomorrow.date() === 1) {
            await declareWinner();
        }
        res.json({ message: "Winner declared successfully!" });
    } catch (error) {
        console.error("Error declaring winner:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
app.get('/data', verifyToken, async (req, res) => {
    const { date } = req.query;

    if (!date) {
        return res.status(400).json({ error: 'Date is required' });
    }

    const startDate = moment(date, "YYYY-MM-DD").startOf("month").toDate();
    const endDate = moment(date, "YYYY-MM-DD").endOf("month").toDate();

    try {
        const data = await orderModel.find({
            sender: req.user.email, // ✅ Email from JWT
            date: { $gte: startDate, $lte: endDate }
        });

        res.status(200).json({ data });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: "An error occurred" });
    }
});

app.get('/customerdata', verifyToken, async (req, res) => {
    try {
        const data = await userModel.find().select('-password -verificationCode');
        res.status(200).json({ data });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: "An error occurred" });
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
        const latestWinner = await winnerModel.findOne().sort({ date: -1 });
        if (!latestWinner) {
            return res.status(404).json({ message: "No winner has been declared yet." });
        }
        res.status(200).json({ winner: latestWinner });
    } catch (error) {
        console.error("Error fetching latest winner:", error);
        res.status(500).json({ message: "An error occurred" });
    }
});
app.get('/winners', async (req, res) => {
    try {
        const Winners = await winnerModel.find();
        res.status(200).json({ winners: Winners });
    } catch (e) {
        console.log(e);
    }
})
app.get('/showorders', verifyToken, async (req, res) => {
    try {
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const endOfDay = new Date(today.setHours(23, 59, 59, 999));

        const orderData = await orderModel.find({
            date: { $gte: startOfDay, $lte: endOfDay }
        });

        res.status(200).json({ data: orderData });
    } catch (e) {
        console.error('Error fetching orders:', e);
        res.status(500).json({ error: 'An error occurred while fetching today’s orders.' });
    }
});


app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    console.log(email)
    try {
        const existingUser = await userModel.findOne({ email });

        if (!existingUser) {
            return res.status(400).json({ error: 'User not found. Please sign up first.' });
        }
        const isPasswordValid = await bcrypt.compare(password, existingUser.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        const token = jwt.sign(
            {
                id: existingUser._id,
                email: existingUser.email,
            },
            "SECRET!@#",
            { expiresIn: '7d' }
        );
        console.log(existingUser)
        res.cookie('token', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'None',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
        const { password: _, verificationCode, ...safeUser } = existingUser.toObject();
        res.status(200).json({ message: 'Login successful', user: safeUser });

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
        await sendVerificationCode(email, `Verify your email to get started. Your verification code is ${verificationCode}. Verify now to order and win exciting prizes in our lucky draws held twice a month.`, "Verify your email");
        res.status(201).json(newUser);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'An error occurred while processing your request' });
    }
});
app.post('/verify', verifyToken, async (req, res) => {
    const { verificationCode } = req.body;
    const email = req.user.email; // Email from the verified JWT

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
        await sendVerificationCode(email, `Verify your email to change password. Your verification code is ${verificationCode}.`, "Verify your email");
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
            { $set: { password: hashedPassword, isVerified: true }, $unset: { verificationCode: "" } },
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
app.post('/order', verifyToken, async (req, res) => {
    const { date, items, price, time } = req.body;
    const email = req.user.email; // Extracted from JWT — secure & trusted
    const sum = items.samosa + items.fries + items.cheesyFries + items.roll;

    try {
        const updatedUser = await userModel.findOneAndUpdate(
            { email },
            { $inc: { orders: 1 } },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        const newOrder = await orderModel.create({
            sender: email,
            date,
            items,
            total: sum,
            price,
            time
        });

        res.status(201).json({ message: "Ordered successfully" });
    } catch (e) {
        console.error("Order error:", e);
        res.status(500).json({ error: 'An error occurred while processing your request' });
    }
});

app.post('/updateitem', verifyToken, async (req, res) => {
    const { name, price } = req.body;

    try {
        const updatedItem = await itemModel.findOneAndUpdate(
            { name: name },
            { price: price },
            { new: true }
        );

        res.status(200).json({ message: "Updated successfully" });
    } catch (e) {
        console.error("Item update error:", e);
        res.status(500).json({ message: "An error occurred" });
    }
});

app.post('/updatewinner', verifyToken, async (req, res) => {
    const { verificationCode } = req.body;
    const email = req.user.email; // Securely retrieved from JWT

    try {
        const existingWinner = await winnerModel.findOne({ email, verificationCode });

        if (!existingWinner) {
            return res.status(400).json({ error: "Verification failed. Please try again." });
        }

        if (existingWinner.isVerified) {
            return res.status(400).json({ error: "Reward already claimed." });
        }

        const winner = await winnerModel.findOneAndUpdate(
            { email, verificationCode },
            { $set: { isVerified: true } },
            { new: true }
        );

        res.status(200).json({ message: "Winner verified successfully!" });
    } catch (error) {
        console.error("Error updating winner:", error);
        res.status(500).json({ error: "An error occurred while processing your request." });
    }
});




mongoose.connect(mongoURI)
    .then(() => console.log("DB Connected"))
    .catch(err => console.log('err', err));

app.listen(port, () => {
    console.log('server started', port);
})