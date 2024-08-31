const Joi = require("joi");

module.exports = {
    create: Joi.object({
        username: Joi.string().min(6).max(25).required(),
        email: Joi.string().email().required(),
        password: Joi.string().required()
    }),
    update: Joi.object({
        first_name: Joi.string().min(1).max(55).required(),
        last_name: Joi.string().max(55).allow('').default("").optional(),
        bio: Joi.string().max(55).allow('').default("").optional(),
    })
}