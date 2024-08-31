const multer = require("multer");
const fs = require("fs")

module.exports = {
    profileUser: multer.diskStorage({
        destination: (req, file, cb) => {
            if (file.size > 1024 * 1024 * 5) {
                return cb("File to large")
            }
            cb(null, "./public/profile")
        },
        filename: (req, file, cb) => {
            const user = req.body.userId;
            cb(null, `profile_${user}.png`)
        }
    }),
    messageFile: multer.diskStorage({
        destination: (req, file, cb) => {
            if (file.size > 1024 * 1024 * 5) {
                return cb("File to large")
            }
            const username = req.body.user            
            const pathUrl = "./public/message/" + username + "/" 
            fs.mkdirSync(pathUrl, { recursive: true });
            cb(null, pathUrl)
        },
        filename: (req, file, cb) => {
            const user = req.body.user;
            console.log(file);
            
            cb(null, `message_${Date.now()}.${file.originalname.split(".").slice(-1)[0]}`)
        }
    }),
    Upload: (fn) => multer({ storage: fn })
}

