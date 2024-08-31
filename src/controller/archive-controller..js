const archiveService = require("../services/archive-service");

module.exports = {
    add: async(req, res, next) => {
        try {
            const result = await archiveService.add(req.params.contactId);
            res.status(200).json(result)
        } catch (error) {
            next(error)
        }
    },
    remove: async(req, res, next) => {
        try {
            const result = await archiveService.remove(req.params.contactId);
            res.status(200).json(result)
        } catch (error) {
            next(error)
        }
    },
}