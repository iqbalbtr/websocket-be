const path = require("path")
const fs = require("fs")

module.exports = {
    get: async (req, res) => {
        const filePath = req.params[0];
        const fullPath = path.join(path.resolve(__dirname, "..", ".."), 'public', filePath);
        const download = req.query.download


        fs.access(fullPath, fs.constants.F_OK, (err) => {
            if (err) {
                return res.status(404).json({ error: 'File not found' });
            }

            if (download) {
                res.download(fullPath, (err) => {
                    if (err) {
                        return res.status(500).json({ error: 'Error in file download' });
                    }
                });
            } else {
                res.sendFile(fullPath, (err) => {
                    if (err) {
                        return res.status(500).json({ error: 'Error in file download' });
                    }
                });
            }
        });
    }
}