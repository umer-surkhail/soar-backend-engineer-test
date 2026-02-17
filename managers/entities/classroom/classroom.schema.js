module.exports = {
    create: [
        { model: 'id', path: 'schoolId', required: true },
        { model: 'title', path: 'name', required: true },
        { model: 'number', path: 'capacity', required: true },
        { model: 'label', path: 'resources' },
    ],
    update: [
        { model: 'title', path: 'name' },
        { model: 'number', path: 'capacity' },
        { model: 'label', path: 'resources' },
    ],
};
