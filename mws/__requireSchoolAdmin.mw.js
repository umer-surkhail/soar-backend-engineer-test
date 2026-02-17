module.exports = ({ managers }) => {
    return ({ req, res, results, next, end }) => {
        const decoded = results.__longToken;
        if (!decoded) {
            return managers.responseDispatcher.dispatch(res, { ok: false, code: 401, message: 'unauthorized' });
        }
        if (decoded.role !== 'school_admin' && decoded.role !== 'superadmin') {
            return managers.responseDispatcher.dispatch(res, { ok: false, code: 403, message: 'forbidden' });
        }
        next(decoded);
    };
};
