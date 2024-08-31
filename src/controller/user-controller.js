const userService = require("../services/user-service")

module.exports = {
    update: async (req, res, next) => {
        try {
            const userId = res.locals.decrypt_token.id;
            const payload = req.body;
            const result = await userService.update(userId, payload, req.file);
            res.status(200).json({
                result
            })
        } catch (e) {
            next(e)
        }
    }

}