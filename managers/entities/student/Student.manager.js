module.exports = class Student {

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
            'post=enroll',
            'post=transfer',
        ];
    }

    async _canAccessSchool(decoded, schoolId) {
        if (decoded.role === 'superadmin') return true;
        if (decoded.role === 'school_admin' && decoded.schoolId === String(schoolId)) return true;
        return false;
    }

    async create({ __longToken, __requireSchoolAdmin, schoolId, name, email, profile }) {
        const result = await this.validators.student.create({ schoolId, name, email, profile });
        if (result && result.errors) return { errors: result.errors, code: 422 };

        if (!(await this._canAccessSchool(__longToken, schoolId))) {
            return { error: 'forbidden', code: 403 };
        }

        const School = this.mongomodels.School;
        const school = await School.findById(schoolId);
        if (!school) return { error: 'School not found', code: 404 };

        const Student = this.mongomodels.Student;
        const student = await Student.create({
            schoolId,
            name:   (name || '').trim(),
            email:  (email || '').trim(),
            profile: profile && typeof profile === 'object' ? profile : {},
        });
        return { student: _toStudent(student) };
    }

    async get({ __longToken, __requireSchoolAdmin, id }) {
        if (!id) return { error: 'id required', code: 422 };
        const Student = this.mongomodels.Student;
        const student = await Student.findById(id);
        if (!student) return { error: 'Student not found', code: 404 };
        if (!(await this._canAccessSchool(__longToken, student.schoolId))) {
            return { error: 'forbidden', code: 403 };
        }
        return { student: _toStudent(student) };
    }

    async list({ __longToken, __requireSchoolAdmin, schoolId, classroomId }) {
        const filter = {};
        if (__longToken.role === 'school_admin') {
            filter.schoolId = __longToken.schoolId;
        } else if (schoolId) {
            filter.schoolId = schoolId;
        }
        if (classroomId) filter.classroomId = classroomId;
        const Student = this.mongomodels.Student;
        const list = await Student.find(filter).sort({ createdAt: -1 }).lean();
        return { students: list.map(_toStudent) };
    }

    async update({ __longToken, __requireSchoolAdmin, id, name, email, profile }) {
        if (!id) return { error: 'id required', code: 422 };
        const result = await this.validators.student.update({ name, email, profile });
        if (result && result.errors) return { errors: result.errors, code: 422 };

        const Student = this.mongomodels.Student;
        const student = await Student.findById(id);
        if (!student) return { error: 'Student not found', code: 404 };
        if (!(await this._canAccessSchool(__longToken, student.schoolId))) {
            return { error: 'forbidden', code: 403 };
        }

        if (name !== undefined) student.name = String(name).trim();
        if (email !== undefined) student.email = String(email).trim();
        if (profile !== undefined) student.profile = profile && typeof profile === 'object' ? profile : student.profile;
        await student.save();
        return { student: _toStudent(student) };
    }

    async remove({ __longToken, __requireSchoolAdmin, id }) {
        if (!id) return { error: 'id required', code: 422 };
        const Student = this.mongomodels.Student;
        const student = await Student.findById(id);
        if (!student) return { error: 'Student not found', code: 404 };
        if (!(await this._canAccessSchool(__longToken, student.schoolId))) {
            return { error: 'forbidden', code: 403 };
        }
        await Student.findByIdAndDelete(id);
        return { ok: true };
    }

    async enroll({ __longToken, __requireSchoolAdmin, studentId, classroomId }) {
        const result = await this.validators.student.enroll({ studentId, classroomId });
        if (result && result.errors) return { errors: result.errors, code: 422 };

        const Student = this.mongomodels.Student;
        const Classroom = this.mongomodels.Classroom;
        const student = await Student.findById(studentId);
        if (!student) return { error: 'Student not found', code: 404 };
        const classroom = await Classroom.findById(classroomId);
        if (!classroom) return { error: 'Classroom not found', code: 404 };
        if (String(classroom.schoolId) !== String(student.schoolId)) {
            return { error: 'Classroom must belong to the same school as student', code: 422 };
        }
        if (!(await this._canAccessSchool(__longToken, student.schoolId))) {
            return { error: 'forbidden', code: 403 };
        }

        student.classroomId = classroomId;
        await student.save();
        return { student: _toStudent(student) };
    }

    async transfer({ __longToken, __requireSchoolAdmin, studentId, classroomId }) {
        const result = await this.validators.student.transfer({ studentId, classroomId });
        if (result && result.errors) return { errors: result.errors, code: 422 };

        const Student = this.mongomodels.Student;
        const Classroom = this.mongomodels.Classroom;
        const student = await Student.findById(studentId);
        if (!student) return { error: 'Student not found', code: 404 };
        const classroom = await Classroom.findById(classroomId);
        if (!classroom) return { error: 'Classroom not found', code: 404 };
        if (String(classroom.schoolId) !== String(student.schoolId)) {
            return { error: 'Classroom must belong to the same school for transfer', code: 422 };
        }
        if (!(await this._canAccessSchool(__longToken, student.schoolId))) {
            return { error: 'forbidden', code: 403 };
        }

        student.classroomId = classroomId;
        await student.save();
        return { student: _toStudent(student) };
    }
};

function _toStudent(doc) {
    if (!doc) return null;
    const d = doc.toJSON ? doc.toJSON() : doc;
    return {
        id:           d._id.toString(),
        schoolId:     d.schoolId.toString(),
        classroomId:  d.classroomId ? d.classroomId.toString() : null,
        name:         d.name,
        email:        d.email || '',
        profile:      d.profile || {},
        createdAt:    d.createdAt,
        updatedAt:    d.updatedAt,
    };
}
