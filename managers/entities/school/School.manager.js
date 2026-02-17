module.exports = class School {

    constructor({ config, managers, validators, mongomodels } = {}) {
        this.config       = config;
        this.managers     = managers;
        this.validators   = validators;
        this.mongomodels  = mongomodels;
        this.httpExposed  = [
            'post=create',
            'get=get',
            'get=list',
            'post=update',
            'post=remove',
            'get=getProfile',
        ];
    }

    async create({ __longToken, __requireSuperadmin, name, address, phone }) {
        const result = await this.validators.school.create({ name, address, phone });
        if (result && result.errors) return { errors: result.errors, code: 422 };

        const School = this.mongomodels.School;
        const school = await School.create({ name: (name || '').trim(), address: (address || '').trim(), phone: (phone || '').trim() });
        return { school: _toSchool(school) };
    }

    async get({ __longToken, __requireSuperadmin, id }) {
        if (!id) return { error: 'id required', code: 422 };
        const School = this.mongomodels.School;
        const school = await School.findById(id);
        if (!school) return { error: 'School not found', code: 404 };
        return { school: _toSchool(school) };
    }

    async list({ __longToken, __requireSuperadmin }) {
        const School = this.mongomodels.School;
        const list = await School.find({}).sort({ createdAt: -1 }).lean();
        return { schools: list.map(_toSchool) };
    }

    async update({ __longToken, __requireSuperadmin, id, name, address, phone, profile }) {
        if (!id) return { error: 'id required', code: 422 };
        const result = await this.validators.school.update({ name, address, phone, profile });
        if (result && result.errors) return { errors: result.errors, code: 422 };

        const School = this.mongomodels.School;
        const school = await School.findById(id);
        if (!school) return { error: 'School not found', code: 404 };

        if (name !== undefined) school.name = String(name).trim();
        if (address !== undefined) school.address = String(address).trim();
        if (phone !== undefined) school.phone = String(phone).trim();
        if (profile !== undefined) school.profile = profile && typeof profile === 'object' ? profile : school.profile;
        await school.save();
        return { school: _toSchool(school) };
    }

    async remove({ __longToken, __requireSuperadmin, id }) {
        if (!id) return { error: 'id required', code: 422 };
        const School = this.mongomodels.School;
        const school = await School.findByIdAndDelete(id);
        if (!school) return { error: 'School not found', code: 404 };
        return { ok: true };
    }

    async getProfile({ __longToken, __requireSuperadmin, id }) {
        if (!id) return { error: 'id required', code: 422 };
        const School = this.mongomodels.School;
        const school = await School.findById(id).lean();
        if (!school) return { error: 'School not found', code: 404 };
        return { school: _toSchool(school) };
    }
};

function _toSchool(doc) {
    if (!doc) return null;
    const d = doc.toJSON ? doc.toJSON() : doc;
    return {
        id:        d._id.toString(),
        name:      d.name,
        address:   d.address,
        phone:     d.phone,
        profile:   d.profile || {},
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
    };
}
