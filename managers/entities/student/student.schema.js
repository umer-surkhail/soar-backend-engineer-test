module.exports = {
    create: [
        { model: 'id', path: 'schoolId', required: true },
        { model: 'title', path: 'name', required: true },
        { model: 'email' },
        { model: 'obj', path: 'profile' },
    ],
    update: [
        { model: 'title', path: 'name' },
        { model: 'email' },
        { model: 'obj', path: 'profile' },
    ],
    enroll: [
        { model: 'id', path: 'studentId', required: true },
        { model: 'id', path: 'classroomId', required: true },
    ],
    transfer: [
        { model: 'id', path: 'studentId', required: true },
        { model: 'id', path: 'classroomId', required: true },
    ],
};
