const mongoose = require('mongoose');
const Comment = require('./comment');
const User = require('./usermodel')
const { Schema } = mongoose;


const blogSchema = new Schema({
    title: {
        type: String,
        required: [true,'Title is need']
    },
    content: {
        type: String,
        required: [true, 'Content is need']
    },
    image: {
        url: String,
        filename:String,
        
    },
    likes: {
        type: Number,
        default: 0
    },
    date: {
        type:String,
        
    },
    comments: [
        {
        type: Schema.Types.ObjectId,
        ref:'Comment'
        }
    ],
    author: 
        {
            type: Schema.Types.ObjectId,
            ref:'User'
        }
    
})
blogSchema.post('findOneAndDelete', async function(blog) {
    if (blog.comments.length) {
        const res =await Comment.deleteMany({ _id: { $in: blog.comments } });
        console.log(res);
    }
})

const Blog = mongoose.model('Blog', blogSchema);


module.exports = Blog;