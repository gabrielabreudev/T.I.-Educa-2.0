const express = require("express");
const router = express.Router();
const Category = require("./Category");
const slugify = require("slugify");
const adminAuth = require("../middlewares/adminAuth")

//rota para tela de categorias
router.get("/categories", adminAuth, (req,res) => {
    res.send("rota de categorias")
});

//rota para tela de cadastro
router.get("/admin/categories/new", adminAuth, (req,res) => {
    res.render("admin/categories/new")
});

//salvar uma nova categoria com os dados enviados pelo form
router.post("/categories/save", adminAuth, (req,res) => {
    var title = req.body.title;

        if(title != undefined){
            
            Category.create({
                title: title,
                slug: slugify(title)
            }).then(() => {
                res.redirect("/admin/categories");
            })

        } else {
            res.redirect('/admin/categories/new');
        }
});

//listar categorias
router.get("/admin/categories", adminAuth, (req,res) => {
    
    Category.findAll().then(categories =>{
        res.render("admin/categories/index", { 
            categories: categories
            })
    });
});

//deletar categoria
router.post("/categories/delete", adminAuth, (req,res) => {
        var id = req.body.id;

        if(id != undefined){
            if(!isNaN(id)){

                Category.destroy({
                    where: {
                        id: id
                    }
                }).then(() => {
                    res.redirect("/admin/categories")
                })

            }else{ // se não for numero
                res.redirect("/admin/categories")
            }
        }else{  // se for nulo
            res.redirect("/admin/categories")
        }
})

//mostrar dados da categoria na tela de editar
router.get("/admin/categories/edit/:id", adminAuth, (req,res) => {
    var id = req.params.id;

    if(isNaN(id)){
        res.redirect("/admin/categories")
    };

    Category.findByPk(id).then(category =>{
            if(category != undefined){                
               res.render("admin/categories/edit", {
                category: category
               }) 
            }else{
                res.redirect("/admin/categories")
            }
    }).catch(erro => {
        res.redirect("/admin/categories")
    })
});

//update das alterações
router.post("/categories/update", adminAuth, (req,res) => {
    var id = req.body.id;
    var title = req.body.title;

    Category.update({ title: title, slug: slugify(title) },{
    where: { id: id }
            }).then(() => {
                res.redirect("/admin/categories")
            })
})

module.exports = router;