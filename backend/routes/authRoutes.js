const express = require('express');
const router = express.Router();
const jwtSecret = process.env.JWT_SECRET;
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const userModel = require('../models/users');

const verifyToken = require('../middleware/verifyToken');

const { sendVerificationCode } = require('../email');

router.get('/verify-token', verifyToken, async (req, res) => {
    const user = await userModel.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.status(200).json({ user });
});

router.post('/login', async (req, res) => {

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

        const token = jwt.sign(
            {
                id: existingUser._id,
                email: existingUser.email,
            },
            jwtSecret,
            { expiresIn: '7d' }
        );

        res.cookie('token', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'None',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        const { password: _, verificationCode, ...safeUser } = existingUser.toObject();

        res.status(200).json({
            message: 'Login successful',
            user: safeUser
        });

    } catch (error) {

        res.status(500).json({ error: 'An error occurred while processing your request' });

    }

});

router.post('/signup', async (req, res) => {

    const { email, password, name } = req.body;

    try {

        const existingUser = await userModel.findOne({ email });

        if (existingUser) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

        const newUser = await userModel.create({
            email,
            password: hashedPassword,
            name,
            isVerified: false,
            verificationCode,
            orders: 0,
            wins: 0
        });

        await sendVerificationCode(
            email,
            `Verify your email to get started. Your verification code is ${verificationCode}. Verify now to order and win exciting prizes in our lucky draws held twice a month.`,
            "Verify your email"
        );

        res.status(201).json(newUser);

    } catch (error) {

        res.status(500).json({ error: 'An error occurred while processing your request' });

    }

});

router.post('/verify', verifyToken, async (req, res) => {

    const { verificationCode } = req.body;

    const email = req.user.email;

    try {

        const user = await userModel.findOneAndUpdate(
            { email, verificationCode },
            { $set: { isVerified: true }, $unset: { verificationCode: "" } },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ error: 'Invalid verification code' });
        }

        res.status(200).json({
            message: 'Account verified successfully',
            user: {
                email: user.email,
                wins: user.wins
            }
        });

    } catch (e) {

        res.status(500).json({ error: 'An error occurred while processing your request' });

    }

});

router.post('/forgotpassword', async (req, res) => {

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

        await sendVerificationCode(
            email,
            `Verify your email to change password. Your verification code is ${verificationCode}.`,
            "Verify your email"
        );

        return res.status(200).json({ message: 'Check your email for an OTP!' });

    } catch (error) {

        return res.status(500).json({ error: 'Server error. Please try again later.' });

    }

});

router.post('/verifyforgotpassword', async (req, res) => {

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

        res.status(500).json({ error: 'An error occurred while processing your request' });

    }

});

module.exports = router;