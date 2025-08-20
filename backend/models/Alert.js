// Admin dashboard per jo alert aayengi

const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: ['Critical', 'Warning', 'Info'] // Alert ke types
    },
    message: {
        type: String,
        required: true
    },
    bin: { // Kis bin se related hai
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bin'
    },
    status: {
        type: String,
        enum: ['Active', 'Resolved'],
        default: 'Active'
    }
}, { timestamps: true }); // Kab create hua, yeh store karega

module.exports = mongoose.model('Alert', AlertSchema);