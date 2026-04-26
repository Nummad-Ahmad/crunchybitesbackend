const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const upload = require('../config/multerStorage');

router.post('/image', verifyToken, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No image uploaded" });
        }

        res.status(200).json({
            message: "Image uploaded successfully",
            imageUrl: req.file.path 
        });

    } catch (e) {
        console.log("Upload error:", e);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;