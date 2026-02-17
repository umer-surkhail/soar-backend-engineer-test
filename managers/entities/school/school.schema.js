module.exports = {
    create: [
        { model: 'title', path: 'name', required: true },
        { model: 'label', path: 'address' },
        { model: 'phone' },
    ],
    update: [
        { model: 'title', path: 'name' },
        { model: 'label', path: 'address' },
        { model: 'phone' },
        { model: 'obj', path: 'profile' },
    ],
};
