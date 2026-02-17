const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    schoolId:     { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
    classroomId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom', default: null },
    name:         { type: String, required: true },
    email:        { type: String, default: '' },
    profile:      { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

module.exports = mongoose.model('Student', schema);
