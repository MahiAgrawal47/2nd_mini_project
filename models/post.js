const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true, // Make title required
    },
    content: {
        type: String,
        required: true, // Make content required
    },
    location: {
        type: String,
        required: true, // Make location required
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user' // Assuming you have a User model
    }],
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user', // Assuming you have a User model
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Create the Post model
module.exports  = mongoose.model('post', postSchema);

;