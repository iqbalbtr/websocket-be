const blockService = require("../services/block-service");

module.exports = {
    add: async(req, res, next) => {
        try {
            const result = await blockService.add(req.params.contactId);
            res.status(200).json(result)
        } catch (error) {
            next(error)
        }
    },
    remove: async(req, res, next) => {
        try {
            const result = await blockService.remove(req.params.contactId);
            res.status(200).json(result)
        } catch (error) {
            next(error)
        }
    },
}