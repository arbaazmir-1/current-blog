module.exports.userIsin = (req, res, next) => {
    if (req.isAuthenticated()) {
        req.flash('error', 'You are already Signed In!!');
       return res.redirect('/home')
    }
    next();
}