const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const session = require("express-session")
const connection = require("./database/database")
const mysql = require('mysql2');
const cors = require('cors');

app.use(bodyParser.json());
app.use(cors());



//chamando controllers
const categoriesController = require("./categories/CategoriesController");
const articlesController = require("./articles/ArticlesController");
const usersController = require("./users/UserController");

//chamando models
const Article = require("./articles/Article")
const Category = require("./categories/Category")
const User = require("./users/User")

// configurando view engine
app.set('view engine', 'ejs'); 

//configurando sessões
app.use(session({
    secret: "adshjvcfdd234wadsjd", cookie: {maxAge: 3000000}
}))

//carregar arquivos estaticos
app.use(express.static('public'));

// configurando body-parser
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());

//conectando ao database
connection
    .authenticate()
    .then(() => {
        console.log("Conexão com sucesso");
    }).catch((error) => {
        console.log(error);
    })

//importando controllers
app.use("/", categoriesController);
app.use("/", articlesController);
app.use("/", usersController);


//rota principal
app.get("/", (req,res) => {
   Article.findAll({
    order: [['id', 'DESC']], limit: 2
   }).then(articles => {
        Category.findAll().then(categories => {
            res.render("index", {articles: articles, categories: categories});
        })
   })
})

app.get("/:slug", (req,res) => {
    var slug = req.params.slug
    Article.findOne({
       where: {slug: slug} 
    }).then(article => {
        if(article != undefined){
            Category.findAll().then(categories => {
                res.render("article", {article: article, categories: categories});
            })
        } else {
            res.redirect("/")
        }
    }).catch(err => {
        res.redirect("/")
    })  
 })

 app.get("/category/:slug", (req,res) => {
    var slug = req.params.slug
    Category.findOne({
        where: {slug: slug}, include: [{model: Article}]    
    }).then(category => {
        if(category != undefined){
            Category.findAll().then(categories => {
                res.render("index", {articles: category.articles, categories: categories})
            })
        } else {
            res.redirect("/")
        }
    }).catch(err => {
        res.redirect("/")
    })
 })

// ...

// Rota para adicionar curtida

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

// Configuração da conexão com o MySQL
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'tieduca'
});

// Abra a conexão com o MySQL
db.connect((err) => {
  if (err) {
    console.error('Erro ao conectar ao MySQL:', err.message);
    return;
  }

  console.log('Conexão bem-sucedida com o MySQL');
});

// Rota para adicionar curtida
app.post('/like', (req, res) => {
  const articleId = req.body.articleId;

  // Atualize a contagem de curtidas no banco de dados MySQL
  db.query(
    'UPDATE articles SET likes = likes + 1 WHERE id = ?',
    [articleId],
    (err, results) => {
      if (err) {
        console.error('Erro ao atualizar as curtidas:', err.message);
        res.status(500).json({ success: false, error: 'Erro ao atualizar as curtidas.' });
      } else {
        console.log(`Curtida adicionada ao artigo com ID ${articleId}`);
        
        // Recupere o novo número de curtidas para enviar de volta ao cliente
        db.query(
          'SELECT likes FROM articles WHERE id = ?',
          [articleId],
          (err, results) => {
            if (err) {
              console.error('Erro ao recuperar o número atual de curtidas:', err.message);
              res.status(500).json({ success: false, error: 'Erro ao recuperar o número atual de curtidas.' });
            } else {
              const likeCount = results[0].likes;
              res.status(200).json({ success: true, likeCount });
            }
          }
        );
      }
    }
  );
});

app.get('/getLikeCount/:articleId', (req, res) => {
    const articleId = req.params.articleId;

    // Recupere a contagem de curtidas do banco de dados para o artigo
    db.query(
        'SELECT likes FROM articles WHERE id = ?',
        [articleId],
        (err, results) => {
            if (err) {
                console.error('Erro ao obter a contagem de curtidas:', err.message);
                res.status(500).json({ success: false, error: 'Erro ao obter a contagem de curtidas.' });
            } else {
                const likeCount = results[0].likes;
                res.status(200).json({ success: true, likeCount });
            }
        }
    );
});

// Rota para inserir um novo comentário
app.post('/comment', (req, res) => {
    const { articleId, commentText } = req.body;
  
    const getArticleQuery = 'SELECT comments FROM articles WHERE id = ?';
    db.query(getArticleQuery, [articleId], (err, results) => {
      if (err) {
        console.error('Erro ao buscar o artigo do banco de dados:', err);
        res.json({ success: false, message: 'Erro ao buscar o artigo' });
      } else {
        // Obtenha os comentários atuais do artigo
        const currentComments = JSON.parse(results[0].comments || '[]');
  
        // Adicione o novo comentário à lista de comentários
        currentComments.push({ text: commentText, createdAt: new Date() });
  
        // Atualize a tabela "articles" com os novos comentários
        const updateCommentsQuery = 'UPDATE articles SET comments = ? WHERE id = ?';
        db.query(updateCommentsQuery, [JSON.stringify(currentComments), articleId], (err) => {
          if (err) {
            console.error('Erro ao atualizar os comentários do artigo:', err);
            res.json({ success: false, message: 'Erro ao atualizar os comentários' });
          } else {
            console.log('Comentário inserido com sucesso');
            res.json({ success: true, message: 'Comentário inserido com sucesso' });
          }
        });
      }
    });
  });


  app.get('/', (req, res) => {
    // Recupere os artigos e categorias do banco de dados
    // Renderize a página inicial com os artigos e categorias
});

  app.get('/views/chatgpt.ejs', (req, res) => {
  res.render('chatgpt');
});



// Rota para recuperar os comentários de um artigo específico
app.get('/getComments/:articleId', (req, res) => {
    const articleId = req.params.articleId;
  
    const getCommentsQuery = 'SELECT comments FROM articles WHERE id = ?';
    db.query(getCommentsQuery, [articleId], (err, results) => {
      if (err) {
        console.error('Erro ao recuperar os comentários do artigo do banco de dados:', err);
        res.json({ success: false, message: 'Erro ao recuperar os comentários' });
      } else {
        const comments = JSON.parse(results[0].comments || '[]');
        console.log('Comentários recuperados com sucesso');
        res.json({ success: true, comments });
      }
    });
  });
  
  
  // ...
  

//iniciar o servidor
const port = process.env.PORT || 8080;

app.listen(port, () => {
    console.log(`Servidor está rodando na porta ${port}`);
});