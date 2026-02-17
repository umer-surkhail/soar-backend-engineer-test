const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    name:        { type: String, required: true },
    address:     { type: String, default: '' },
    phone:       { type: String, default: '' },
    profile:     { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

module.exports = mongoose.model('School', schema);
