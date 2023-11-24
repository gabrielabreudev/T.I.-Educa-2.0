function adminAuth(req, res, next){

    if(req.session.user != undefined){
        next()
    } else {
        res.redirect("/index")
    }
}

module.exports = adminAuth