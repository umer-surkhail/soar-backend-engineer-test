const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    email:        { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role:         { type: String, required: true, enum: ['superadmin', 'school_admin'] },
    schoolId:     { type: mongoose.Schema.Types.ObjectId, ref: 'School', default: null },
}, { timestamps: true });

module.exports = mongoose.model('User', schema);
