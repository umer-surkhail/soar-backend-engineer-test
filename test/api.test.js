/**
 * API tests. Start the server first (npm start), then run: npm test
 * Requires: MongoDB and Redis running, and a superadmin (run scripts/seed-superadmin.js).
 * Credentials: loaded from .env (INITIAL_SUPERADMIN_EMAIL, INITIAL_SUPERADMIN_PASSWORD) or set TEST_SUPERADMIN_EMAIL, TEST_SUPERADMIN_PASSWORD.
 */
require('dotenv').config();

const { describe, it } = require('node:test');
const assert = require('node:assert');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5111';

function getTestCredentials() {
    const email = process.env.TEST_SUPERADMIN_EMAIL || process.env.INITIAL_SUPERADMIN_EMAIL;
    const password = process.env.TEST_SUPERADMIN_PASSWORD || process.env.INITIAL_SUPERADMIN_PASSWORD;
    return { email, password };
}

async function request(method, path, body = null, token = null) {
    const url = new URL(path, BASE_URL);
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (token) opts.headers['token'] = token;
    if (body && (method === 'POST' || method === 'GET')) {
        if (method === 'POST') opts.body = JSON.stringify(body);
        else if (Object.keys(body).length) url.search = new URLSearchParams(body).toString();
    }
    const res = await fetch(url.toString(), opts);
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
}

describe('Auth', () => {
    it('POST /api/auth/login with invalid credentials returns 200 and ok:false or 401', async () => {
        const { status, data } = await request('POST', '/api/auth/login', { email: 'none@x.com', password: 'wrong' });
        assert.ok(status === 200 || status === 401);
        if (status === 200) assert.strictEqual(data.ok, false);
    });

    it('POST /api/auth/login with valid body returns longToken when user exists', async () => {
        const { email, password } = getTestCredentials();
        if (!email || !password) {
            console.log('Skip: add INITIAL_SUPERADMIN_EMAIL and INITIAL_SUPERADMIN_PASSWORD to .env (or set TEST_*), then run scripts/seed-superadmin.js');
            return;
        }
        const { status, data } = await request('POST', '/api/auth/login', { email, password });
        assert.strictEqual(status, 200);
        assert.strictEqual(data.ok, true);
        assert.ok(data.data && data.data.longToken);
    });
});

describe('Schools (superadmin)', () => {
    let token;
    let schoolId;

    it('login to get token', async () => {
        const { email, password } = getTestCredentials();
        if (!email || !password) {
            throw new Error('Add INITIAL_SUPERADMIN_EMAIL and INITIAL_SUPERADMIN_PASSWORD to .env (see .env.example), run scripts/seed-superadmin.js, then npm test');
        }
        const { status, data } = await request('POST', '/api/auth/login', { email, password });
        assert.strictEqual(status, 200);
        assert.ok(data.data && data.data.longToken);
        token = data.data.longToken;
    });

    it('POST /api/school/create creates a school', async () => {
        const { status, data } = await request('POST', '/api/school/create', {
            name: 'Test School',
            address: '123 Main St',
            phone: '555-0000',
        }, token);
        assert.strictEqual(status, 200);
        assert.strictEqual(data.ok, true);
        assert.ok(data.data && data.data.school && data.data.school.id);
        schoolId = data.data.school.id;
    });

    it('GET /api/school/list returns schools', async () => {
        const { status, data } = await request('GET', '/api/school/list', {}, token);
        assert.strictEqual(status, 200);
        assert.strictEqual(data.ok, true);
        assert.ok(Array.isArray(data.data.schools));
    });

    it('GET /api/school/get?id= returns one school', async () => {
        const { status, data } = await request('GET', '/api/school/get', { id: schoolId }, token);
        assert.strictEqual(status, 200);
        assert.strictEqual(data.ok, true);
        assert.strictEqual(data.data.school.id, schoolId);
    });
});

describe('Unauthorized', () => {
    it('GET /api/school/list without token returns 401', async () => {
        const { status, data } = await request('GET', '/api/school/list');
        assert.strictEqual(status, 401);
        assert.strictEqual(data.ok, false);
    });
});
