const mongoose = require('mongoose');
const { Schema } = mongoose;

const commentSchema = new Schema({
    comment: {
        type: String,
        required:[true,'Comment is needed']
    },
    blog: {
        type: Schema.Types.ObjectId,
        ref:"Blog"
    },
    author: {
        type: Schema.Types.ObjectId,
        ref:'User'
    }
})
const Comment = mongoose.model('Comment', commentSchema);
module.exports = Comment;