# School Management System API

## Base URL

All endpoints are under `/api/:moduleName/:fnName`. Use the HTTP method indicated (GET or POST). Query parameters (for GET) and JSON body (for POST) are merged and passed to the handler.

## Authentication

JWT-based. Send the long-lived token in the `token` header:

```
token: <longToken>
```

### Login (no auth required)

- **POST** `/api/auth/login`
- Body: `{ "email": "...", "password": "..." }`
- Response: `{ "ok": true, "data": { "longToken": "...", "userId": "...", "role": "...", "schoolId": null|"..." } }`

### Create user (superadmin only)

- **POST** `/api/auth/createUser`
- Headers: `token` (superadmin longToken)
- Body: `{ "email": "...", "password": "...", "role": "superadmin"|"school_admin", "schoolId": "..." }` (schoolId required when role is school_admin)
- Response: `{ "ok": true, "data": { "userId": "...", "email": "...", "role": "...", "schoolId": null|"..." } }`

## Roles

- **superadmin**: Full access; can manage all schools, classrooms, students, and create users.
- **school_admin**: Can only manage resources (classrooms, students) for their assigned school.

## Schools (superadmin only)

| Method | Path | Description |
|--------|------|-------------|
| POST   | /api/school/create   | Create school (name, address, phone) |
| GET    | /api/school/get?id=   | Get school by id (query param) |
| GET    | /api/school/list     | List all schools |
| POST   | /api/school/update   | Update school (id, name, address, phone, profile) |
| POST   | /api/school/remove   | Delete school (id) |
| GET    | /api/school/getProfile?id= | Get school profile (same as get) |

All require `token` header (longToken) and superadmin role.

## Classrooms (school_admin for own school, superadmin for all)

| Method | Path | Description |
|--------|------|-------------|
| POST   | /api/classroom/create   | Create (schoolId, name, capacity, resources) |
| GET    | /api/classroom/get?id=  | Get by id |
| GET    | /api/classroom/list     | List; optional query schoolId (superadmin only) |
| POST   | /api/classroom/update   | Update (id, name, capacity, resources) |
| POST   | /api/classroom/remove   | Delete (id) |

Require `token` and school_admin or superadmin. School admins only see/edit classrooms of their school.

## Students (school_admin for own school, superadmin for all)

| Method | Path | Description |
|--------|------|-------------|
| POST   | /api/student/create   | Create (schoolId, name, email, profile) |
| GET    | /api/student/get?id=  | Get by id |
| GET    | /api/student/list     | List; optional schoolId, classroomId (query) |
| POST   | /api/student/update   | Update (id, name, email, profile) |
| POST   | /api/student/remove   | Delete (id) |
| POST   | /api/student/enroll   | Enroll student in classroom (studentId, classroomId) |
| POST   | /api/student/transfer | Transfer student to another classroom (studentId, classroomId) |

Same auth as Classrooms.

## Response format

- Success: `{ "ok": true, "data": { ... } }` (HTTP 200)
- Error: `{ "ok": false, "message": "..." or "errors": [...], "data": {} }` with appropriate HTTP status.

## Error codes

| Code | Meaning |
|------|---------|
| 400  | Bad request (validation or business error) |
| 401  | Unauthorized (missing or invalid token) |
| 403  | Forbidden (insufficient role or school scope) |
| 404  | Resource not found |
| 422  | Validation error (invalid input) |
| 429  | Too many requests (rate limit) |
| 500  | Server error |

## Rate limiting

API routes are limited to 100 requests per 15 minutes per IP. Response 429 when exceeded.
