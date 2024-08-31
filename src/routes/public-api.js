const express = require("express");
const public_api = express.Router();
const authController = require("../controller/auth-controller")
const path = require("path")

public_api.get("/", (req, res) => {
    res.status(200).json({
        status: true,
        message: "Server is running"
    })
})

public_api.post("/auth/register", authController.register);
public_api.post("/auth/login", authController.login);


public_api.get("/v1/chat/:user/:filename", (req, res) => {

    const {user, filename} = req.params;
    const filePath = path.resolve(__dirname, "../../public", path.join('message', user, filename));
    
    res.download(filePath, (err) => {
        if (err) {
            console.error('Error downloading file:', err);
            return res.status(404).send('File not found');
        }
    });
});

module.exports = public_api;