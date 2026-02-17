const bcrypt = require('bcrypt');

module.exports = class Auth {

    constructor({ config, managers, validators, mongomodels } = {}) {
        this.config       = config;
        this.managers     = managers;
        this.validators   = validators;
        this.mongomodels  = mongomodels;
        this.httpExposed  = ['post=login', 'post=createUser'];
    }

    async createUser({ __longToken, __requireSuperadmin, email, password, role, schoolId }) {
        const result = await this.validators.auth.createUser({ email, password, role });
        if (result && result.errors) return { errors: result.errors, code: 422 };

        if (!['superadmin', 'school_admin'].includes(role)) {
            return { error: 'Invalid role', code: 422 };
        }
        if (role === 'school_admin' && !schoolId) {
            return { error: 'schoolId required for school_admin', code: 422 };
        }

        const User = this.mongomodels.User;
        const existing = await User.findOne({ email: (email || '').trim().toLowerCase() });
        if (existing) return { error: 'Email already in use', code: 422 };

        const passwordHash = await bcrypt.hash(password, 10);
        const doc = {
            email:        (email || '').trim().toLowerCase(),
            passwordHash,
            role,
            schoolId:    role === 'school_admin' ? schoolId : null,
        };
        const user = await User.create(doc);
        return {
            userId:   user._id.toString(),
            email:    user.email,
            role:     user.role,
            schoolId: user.schoolId ? user.schoolId.toString() : null,
        };
    }

    async login({ email, password }) {
        const result = await this.validators.auth.login({ email, password });
        if (result && result.errors) return { errors: result.errors };

        const User = this.mongomodels.User;
        const user = await User.findOne({ email: (email || '').trim().toLowerCase() });
        if (!user) {
            return { error: 'Invalid email or password', code: 401 };
        }

        const match = await bcrypt.compare(password, user.passwordHash);
        if (!match) {
            return { error: 'Invalid email or password', code: 401 };
        }

        const longToken = this.managers.token.genLongToken({
            userId:   user._id.toString(),
            userKey:  user._id.toString(),
            role:     user.role,
            schoolId: user.schoolId ? user.schoolId.toString() : null,
        });

        return { longToken, userId: user._id.toString(), role: user.role, schoolId: user.schoolId ? user.schoolId.toString() : null };
    }
};
