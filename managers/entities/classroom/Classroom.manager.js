module.exports = class Classroom {

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
        ];
    }

    async _canAccessSchool(decoded, schoolId) {
        if (decoded.role === 'superadmin') return true;
        if (decoded.role === 'school_admin' && decoded.schoolId === String(schoolId)) return true;
        return false;
    }

    async create({ __longToken, __requireSchoolAdmin, schoolId, name, capacity, resources }) {
        const result = await this.validators.classroom.create({ schoolId, name, capacity, resources });
        if (result && result.errors) return { errors: result.errors, code: 422 };

        if (!(await this._canAccessSchool(__longToken, schoolId))) {
            return { error: 'forbidden', code: 403 };
        }

        const School = this.mongomodels.School;
        const school = await School.findById(schoolId);
        if (!school) return { error: 'School not found', code: 404 };

        const Classroom = this.mongomodels.Classroom;
        const classroom = await Classroom.create({
            schoolId,
            name: (name || '').trim(),
            capacity: Number(capacity) || 1,
            resources: (resources || '').trim(),
        });
        return { classroom: _toClassroom(classroom) };
    }

    async get({ __longToken, __requireSchoolAdmin, id }) {
        if (!id) return { error: 'id required', code: 422 };
        const Classroom = this.mongomodels.Classroom;
        const classroom = await Classroom.findById(id);
        if (!classroom) return { error: 'Classroom not found', code: 404 };
        if (!(await this._canAccessSchool(__longToken, classroom.schoolId))) {
            return { error: 'forbidden', code: 403 };
        }
        return { classroom: _toClassroom(classroom) };
    }

    async list({ __longToken, __requireSchoolAdmin, schoolId }) {
        const filter = {};
        if (__longToken.role === 'school_admin') {
            filter.schoolId = __longToken.schoolId;
        } else if (schoolId) {
            filter.schoolId = schoolId;
        }
        const Classroom = this.mongomodels.Classroom;
        const list = await Classroom.find(filter).sort({ createdAt: -1 }).lean();
        return { classrooms: list.map(_toClassroom) };
    }

    async update({ __longToken, __requireSchoolAdmin, id, name, capacity, resources }) {
        if (!id) return { error: 'id required', code: 422 };
        const result = await this.validators.classroom.update({ name, capacity, resources });
        if (result && result.errors) return { errors: result.errors, code: 422 };

        const Classroom = this.mongomodels.Classroom;
        const classroom = await Classroom.findById(id);
        if (!classroom) return { error: 'Classroom not found', code: 404 };
        if (!(await this._canAccessSchool(__longToken, classroom.schoolId))) {
            return { error: 'forbidden', code: 403 };
        }

        if (name !== undefined) classroom.name = String(name).trim();
        if (capacity !== undefined) classroom.capacity = Number(capacity) || classroom.capacity;
        if (resources !== undefined) classroom.resources = String(resources).trim();
        await classroom.save();
        return { classroom: _toClassroom(classroom) };
    }

    async remove({ __longToken, __requireSchoolAdmin, id }) {
        if (!id) return { error: 'id required', code: 422 };
        const Classroom = this.mongomodels.Classroom;
        const classroom = await Classroom.findById(id);
        if (!classroom) return { error: 'Classroom not found', code: 404 };
        if (!(await this._canAccessSchool(__longToken, classroom.schoolId))) {
            return { error: 'forbidden', code: 403 };
        }
        await Classroom.findByIdAndDelete(id);
        return { ok: true };
    }
};

function _toClassroom(doc) {
    if (!doc) return null;
    const d = doc.toJSON ? doc.toJSON() : doc;
    return {
        id:        d._id.toString(),
        schoolId:  d.schoolId.toString(),
        name:      d.name,
        capacity:  d.capacity,
        resources: d.resources || '',
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
    };
}
