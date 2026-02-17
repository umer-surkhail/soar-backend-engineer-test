/**
 * Creates an initial superadmin user if no users exist.
 * Usage: INITIAL_SUPERADMIN_EMAIL=admin@example.com INITIAL_SUPERADMIN_PASSWORD=secret node scripts/seed-superadmin.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcrypt');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/axion';
const email    = process.env.INITIAL_SUPERADMIN_EMAIL;
const password = process.env.INITIAL_SUPERADMIN_PASSWORD;

async function run() {
    if (!email || !password) {
        console.log('Set INITIAL_SUPERADMIN_EMAIL and INITIAL_SUPERADMIN_PASSWORD');
        process.exit(1);
    }
    await mongoose.connect(MONGO_URI);
    const User = require('../managers/entities/user/User.mongoModel');
    const count = await User.countDocuments();
    if (count > 0) {
        console.log('Users already exist, skipping seed.');
        await mongoose.disconnect();
        process.exit(0);
    }
    const passwordHash = await bcrypt.hash(password, 10);
    await User.create({
        email:        email.trim().toLowerCase(),
        passwordHash,
        role:         'superadmin',
        schoolId:     null,
    });
    console.log('Superadmin created:', email);
    await mongoose.disconnect();
    process.exit(0);
}

run().catch((err) => {
    console.error(err);
    process.exit(1);
});
