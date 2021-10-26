const validateBlog = (req, res, next) => {
    const { error } = blogSchema.validate(req.body);
    if (error) {
        const message = error.details.map(el => el.message).join(",")
        req.flash('error', `Errpr ${message}`);
        throw new AppError(`${message}`, 400)
        
    }
    else {
        next();
       
    }
}

module.exports = validateBlog;