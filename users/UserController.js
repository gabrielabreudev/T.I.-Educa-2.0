const express = require("express")
const router = express.Router()
const User = require("./User")
const bcrypt = require('bcryptjs')
const adminAuth = require("../middlewares/adminAuth")

router.get("/admin/users", adminAuth, (req,res) => {
   User.findAll().then(users => {
        res.render("admin/users/index", {users: users})
   })
})

// Rota para exibir o formulário de edição de usuário
router.get("/admin/users/edit/:id", adminAuth, (req, res) => {
    const userId = req.params.id;
    User.findByPk(userId).then((user) => {
        if (!user) {
            res.redirect("/admin/users");
        } else {
            res.render("admin/users/edit", { user: user });
        }
    });
});

// Rota para processar a edição do usuário
router.post("/admin/users/edit/:id", adminAuth, (req, res) => {
    const userId = req.params.id;
    const newEmail = req.body.email;
    const newPassword = req.body.password;

    User.findByPk(userId).then((user) => {
        if (!user) {
            res.redirect("/admin/users");
        } else {
            user.email = newEmail;
            if (newPassword) {
                const salt = bcrypt.genSaltSync(10);
                const hash = bcrypt.hashSync(newPassword, salt);
                user.password = hash;
            }

            user.save().then(() => {
                res.redirect("/admin/users");
            });
        }
    });
});

router.post("/users/delete", adminAuth, (req,res) => {
    var id = req.body.id;

    if(id != undefined){
        if(!isNaN(id)){

            User.destroy({
                where: {
                    id: id
                }
            }).then(() => {
                res.redirect("/admin/users")
            })

        }else{ // se não for numero
            res.redirect("/admin/users")
        }
    }else{  // se for nulo
        res.redirect("/admin/users")
    }
})

router.get("/admin/users/create", adminAuth, (req,res) => {
    res.render("admin/users/create")
})

router.post("/users/create", adminAuth, (req,res) => {
    var email = req.body.email
    var password = req.body.password
    
    User.findOne({where: {email: email}}).then( user => {
        if(user == undefined){

            var salt = bcrypt.genSaltSync(10)
            var hash = bcrypt.hashSync(password, salt)
        
                User.create({
                    email: email,
                    password: hash
                }).then(() => {
                    res.redirect("/admin/users")
                }).catch((err) => {
                    res.redirect("/admin/users")
                })

        } else {
            res.redirect("/admin/users")
        }
    })
})

router.get("/login", (req,res) => {
    res.render("admin/users/login")
})

router.get("/errologin", (req,res) => {
    res.render("admin/users/errologin")
})

router.post("/authenticate", (req,res) => {
    var email = req.body.email
    var password = req.body.password

    User.findOne({where: {email: email}}).then(user => {
        if(user != undefined){ //se existe usuario com esse email, valida senha
            var correct = bcrypt.compareSync(password,user.password)

                if(correct){
                    req.session.user = {
                        id: user.id,
                        email: user.email
                    }
                    res.redirect("/admin/articles")
                } else {
                    res.redirect("/errologin")
                }

        } else {
            res.redirect("/errologin")
        }
    })
})

router.get("/logout", adminAuth, (req,res) => {
    req.session.user = undefined
    res.redirect("/")
})

module.exports = router;