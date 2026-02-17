module.exports = {
    login: [
        { model: 'email', required: true },
        { model: 'password', required: true },
    ],
    createUser: [
        { model: 'email', required: true },
        { model: 'password', required: true },
        { model: 'label', path: 'role', required: true },
    ],
};
