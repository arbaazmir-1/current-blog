const Joi = require('joi');

blogSchema = Joi.object({
    title: Joi.string().required(),
    // image: Joi.string().required(),
    content: Joi.string().required()
})
module.exports = blogSchema;