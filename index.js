if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const express = require('express');
const app = express();
const ejs = require('ejs');
const ejsMate = require('ejs-mate');
const methodOverride = require('method-override');
const mongoose = require('mongoose');
const Blog = require('./model/blogmodel');
const path = require('path');
const AppError = require('./utlity/AppError');
const CatchAsyc = require('./utlity/CatchAsyc');
const morgan = require('morgan');
const Comment = require('./model/comment');
const Joi = require('joi');
const blogSchema = require('./validationSchema');
const validateBlog = require('./utlity/validateBlog');
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
const LocalStratagry = require('passport-local');
const User = require('./model/usermodel');
const { isLoggedin } = require('./middleware');
const { userIsin } = require('./utlity/isloggedIn');
const multer = require('multer');
const { storage } = require('./cloudinary/index')
const { cloudinary} = require('./cloudinary/index')

const upload = multer({ storage });



const sessionVariables = {
    secret: "notagoodsecret",
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly:true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}
app.use(session(sessionVariables));

app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStratagry(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
app.use((req, res, next) => {
    // console.log(req.session);
    res.locals.success = req.flash('succes');
    res.locals.error = req.flash('error');
    res.locals.activeUser = req.user;
    next();
})



app.engine('ejs', ejsMate);

app.set('views',path.join(__dirname,'views'));
app.set('view engine', 'ejs'); // so you can render('index')
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

mongoose.connect('mongodb://localhost:27017/currentBlog', { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, useFindAndModify: false })
    .then(() => {
        console.log('Database up and running');
    }).catch((e) => {
        console.log(`Something is wrong!! ${e}`);
    })




app.use(morgan('dev'));


const isAuthor = async (req, res, next) => {
    const { id } = req.params;
    const foundBlog = await Blog.findById(id);
    if (!foundBlog.author._id.equals(req.user._id)) {
        req.flash('error', "You don't have permission for that!");
        res.redirect(`/home/${id}`);
    }
    next();
}
// const iscommentAuthor = async (req, res, next) => {
//     const { id } = req.params;
//     const findComment = await Comment.findById(id);
//     console.
// }

app.get('/home/register',userIsin, (req, res) => {
   
    
        res.render('users/register');
    
})
app.post('/register',userIsin, CatchAsyc(async (req, res, next) => {
    

    try {
        const { email, username, password } = req.body;
    
        const user = new User({ email, username });
        const registereduser = await User.register(user, password);
        req.login(registereduser, err => {
            if (err) return next(err);
            req.flash('succes', "Welcome to Current!");
            res.redirect('/home');
        })
        
    } catch (e) {
        req.flash('error', `${e.message}`);
        res.redirect('/home/register');
    }
        
    

    
}))
app.get('/home/login',userIsin, (req, res) => {
    
    res.render('users/login');
})
app.get('/logout', (req, res) => {
    req.logOut();
    req.flash('succes', 'Logged you out!! See you soon!!');
    res.redirect('/home');
})
app.post('/login', passport.authenticate('local', { failureFlash: true, failureRedirect: '/home/login' }), (req, res) => {

    req.flash('succes', `Welcome Back ${req.user.username}`);
    const redirectUrl = req.session.returnTo || '/home'
    delete req.session.returnTo;
    res.redirect(redirectUrl);
})
app.get('/home', async (req, res, next) => {
    const posts = await Blog.find({});
    
    console.log(req.user)
    console.log(req.isAuthenticated())
    
    res.render('blogpages/home', { posts });
})


app.post('/home', isLoggedin, upload.single('image'),validateBlog, async (req, res, next) => {
    const { filename, path } = req.file;
    
    
    const { title, content } = req.body;
    const d = new Date();
    const fullDate = `${d.getDate()}/${d.getMonth()}/${d.getFullYear()}`;
    const author = req.user._id;
    const foundAuthor = await User.findById(author);
    console.log(foundAuthor)
   
    const newBlog = new Blog({ title, content, date: fullDate, author });
    newBlog.image.url = path;
    newBlog.image.filename = filename;

   
    foundAuthor.blogs.push(newBlog);
    console.log(newBlog);
    await foundAuthor.save();
    console.log(foundAuthor);
    await newBlog.save();
    req.flash('succes', 'Created a new blog');
    res.redirect(`/home/${newBlog.id}`);

  
})

// app.post('/home', isLoggedin, upload.single('image'), async(req, res) => {
//     const { filename, path } = req.file;


//     const { title, content } = req.body;
//     const d = new Date();
//     const fullDate = `${d.getDate()}/${d.getMonth()}/${d.getFullYear()}`;
//     const author = req.user._id;
//     const foundAuthor = await User.findById(author);
//     console.log(foundAuthor)

//     const newBlog = new Blog({ title, content, date: fullDate, author });
//     newBlog.image.url = path;
//     newBlog.image.filename = filename;
//     console.log(newBlog);
//     res.send('working')


// })


app.get('/home/new', isLoggedin,(req, res) => {
    
        res.render('blogpages/new');
   
})
app.get('/home/search',CatchAsyc( async (req, res) => {
    const search = req.query.search;
    console.log(search);
    if (!search) {
        throw new AppError('Invalid Search Request! Search cannot be empty', 400);
    } else {
        const foundBlog = await Blog.find({ title: { $regex: `${search}`, $options: "i" } });
        res.render('blogpages/search', { foundBlog, search });
    }
    

}))
app.get('/home/showall', CatchAsyc(async (req, res, next) => {
    const posts = await Blog.find({});
    res.render('blogpages/showall', { posts });

}))
app.get('/home/:id',isLoggedin, CatchAsyc( async (req, res, next) => {
    const { id } = req.params;
    const foundBlog = await (await Blog.findById(id).populate('comments').populate('author').populate({
        path: 'comments', populate: {
            path: 'author',
            model:'User'
        }
    }));
    
    if (!foundBlog) {
        req.flash('error', 'No Blog found');
        res.redirect('/home');
    }
   
    const { comments } = foundBlog;
    
    
    const { author } = foundBlog;
    console.log(foundBlog);
    const allBlog = await Blog.find({});
    
   

    res.render('blogpages/show', { foundBlog,allBlog,comments,author});

}))


app.get('/home/:id/edit', isLoggedin, isAuthor,CatchAsyc( async (req, res) => {
    const { id } = req.params;
    const foundBlog = await Blog.findById(id);
    if (!foundBlog) {
        req.flash('error', 'No Blog found');
        res.redirect('/home');
    }
    res.render('blogpages/edit', { foundBlog });
    
}))

app.get('/home/user/:id', async (req, res, next) => {
    const  {id}  = req.params;
    const foundUser = await User.findById(id).populate('blogs');
    const { blogs } = foundUser;
    const posts = blogs
    res.render('users/userBlogs',{posts})
})

app.put('/home/:id', isLoggedin, isAuthor,upload.single('image'),CatchAsyc( async (req, res) => {
    const { filename, path } = req.file;
    const image = {
        url: path,
        filename: filename
    };
    const { id } = req.params;
    const { title, content } = req.body;
    const oldBlog = await Blog.findById(id);
    await cloudinary.uploader.destroy(oldBlog.image.filename);
    const foundBlog = await Blog.findByIdAndUpdate(id, { title,image, content });
    req.flash('succes','Updated!')
    res.redirect(`/home/${foundBlog._id}`);
    
}))
app.put('/home/:id/likes',isLoggedin,CatchAsyc( async (req, res) => {
    const { id } = req.params;
    const blog = await Blog.findByIdAndUpdate(id, { $inc: { likes: 1 } });
    res.redirect(`/home/${blog._id}`);


}))
app.post('/home/:id/comments',isLoggedin, CatchAsyc(async (req, res) => {
    const { id } = req.params;
    const { comment } = req.body;
    const author = req.user._id;
    const foundBlog = await Blog.findById(id);
    const newComment = new Comment({ comment,author});
    foundBlog.comments.push(newComment);
    newComment.blog = foundBlog;
    console.log(foundBlog);
    await foundBlog.save();
    await newComment.save();
    req.flash('succes', 'Comment Added');
    res.redirect(`/home/${foundBlog._id}`);
    


}))

app.delete('/home/:id', isLoggedin, isAuthor,CatchAsyc( async (req, res, next) => {
    const { id } = req.params;
    console.log(id);
    const oldBlog = await Blog.findById(id);
    await cloudinary.uploader.destroy(oldBlog.image.filename);
    const foundBlog = await Blog.findByIdAndDelete(id);
    req.flash('succes', 'Post Deleted');
    res.redirect('/home');
}))
app.delete('/home/:blogid/:commentid', isLoggedin,CatchAsyc(async (req, res, next) => {
    const { commentid } = req.params;
    const { blogid } = req.params;
    const foundBlog = await Blog.findById(blogid);
    console.log(commentid);
    // const indexOfComment = foundBlog.comments.indexOf(commentid);
    // foundBlog.comments.splice(indexOfComment, 1);
    const Foundcomment = await Comment.findById(commentid);
    console.log(Foundcomment);
    if (Foundcomment.author.equals(req.user._id)) {
    

        await foundBlog.comments.remove(commentid);
        await Comment.findByIdAndDelete(commentid);
        await foundBlog.save();
        console.log(foundBlog);
        req.flash('succes', 'Comment Deleted');
        res.redirect(`/home/${foundBlog._id}`);
    }
    else {
        req.flash('error', 'Cannot Delete Comment');
        res.redirect(`/home/${foundBlog._id}`);
    }
   

}))
app.all('*', (req, res, next) => {
    next(new AppError('Page not found', 404));
});

app.use((err, req, res, next) => {
    const { status = 500 } = err;
    console.log(status);
    console.log(err.message);
    if (!err.message) err.message = 'Oh Shit, something went wrong'
    res.status(status);
    res.render('blogpages/error',{err,status});
})
app.listen(8000, () => {
    console.log('Listening to port 800')
})