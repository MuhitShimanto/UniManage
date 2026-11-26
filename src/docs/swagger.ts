export const swaggerDocument = {
  openapi: '3.0.3',
  info: {
    title: 'University Management System API',
    version: '1.0.0',
    description:
      'RESTful Backend API for University Management System with 3-Role RBAC (STUDENT, INSTRUCTOR, ADMIN), Neon PostgreSQL + Prisma, Google OAuth, Multer + Cloudinary, Redis Caching, and bKash + SSLCommerz Payment Gateways.',
  },
  servers: [{ url: '/api/v1', description: 'API v1' }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  paths: {
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new student account',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password', 'programId'],
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8 },
                  programId: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Student registered' }, 400: { description: 'Validation error' } },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login with email and password',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'admin@university.edu' },
                  password: { type: 'string', example: 'Password@123' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Login successful' }, 401: { description: 'Invalid credentials' } },
      },
    },
    '/auth/google': {
      post: {
        tags: ['Auth'],
        summary: 'Login or register using Google ID Token (GCP OAuth)',
        responses: { 200: { description: 'Google login successful' } },
      },
    },
    '/auth/refresh-token': {
      post: { tags: ['Auth'], summary: 'Refresh JWT access token', responses: { 200: { description: 'Tokens refreshed' } } },
    },
    '/auth/logout': {
      post: { tags: ['Auth'], summary: 'Logout and revoke refresh token', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Logged out' } } },
    },
    '/users/me': {
      get: { tags: ['Users'], summary: 'Get current user profile', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Profile retrieved' } } },
      patch: { tags: ['Users'], summary: 'Update current user profile', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Profile updated' } } },
    },
    '/users/me/avatar': {
      patch: { tags: ['Users'], summary: 'Upload profile avatar (Multer + Cloudinary)', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Avatar uploaded' } } },
    },
    '/departments': {
      get: { tags: ['Academic Catalog'], summary: 'List all departments', responses: { 200: { description: 'OK' } } },
      post: { tags: ['Academic Catalog'], summary: 'Create department (ADMIN)', security: [{ bearerAuth: [] }], responses: { 201: { description: 'Created' } } },
    },
    '/programs': {
      get: { tags: ['Academic Catalog'], summary: 'List all programs', responses: { 200: { description: 'OK' } } },
      post: { tags: ['Academic Catalog'], summary: 'Create program (ADMIN)', security: [{ bearerAuth: [] }], responses: { 201: { description: 'Created' } } },
    },
    '/courses': {
      get: { tags: ['Academic Catalog'], summary: 'List/search/paginate courses', responses: { 200: { description: 'OK' } } },
      post: { tags: ['Academic Catalog'], summary: 'Create course with prerequisites (ADMIN)', security: [{ bearerAuth: [] }], responses: { 201: { description: 'Created' } } },
    },
    '/courses/{id}/syllabus': {
      patch: { tags: ['Academic Catalog'], summary: 'Upload course syllabus PDF (ADMIN/INSTRUCTOR)', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Uploaded' } } },
    },
    '/semesters': {
      get: { tags: ['Academic Catalog'], summary: 'List semesters', responses: { 200: { description: 'OK' } } },
      post: { tags: ['Academic Catalog'], summary: 'Create semester (ADMIN)', security: [{ bearerAuth: [] }], responses: { 201: { description: 'Created' } } },
    },
    '/sections': {
      get: { tags: ['Academic Catalog'], summary: 'List sections', responses: { 200: { description: 'OK' } } },
      post: { tags: ['Academic Catalog'], summary: 'Create section (ADMIN)', security: [{ bearerAuth: [] }], responses: { 201: { description: 'Created' } } },
    },
    '/enrollments': {
      post: { tags: ['Enrollment'], summary: 'Enroll in section (STUDENT, transaction-safe)', security: [{ bearerAuth: [] }], responses: { 201: { description: 'Enrolled' } } },
    },
    '/enrollments/my': {
      get: { tags: ['Enrollment'], summary: 'Get my enrollments (STUDENT)', security: [{ bearerAuth: [] }], responses: { 200: { description: 'OK' } } },
    },
    '/enrollments/{id}': {
      delete: { tags: ['Enrollment'], summary: 'Drop course enrollment (STUDENT)', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Dropped' } } },
    },
    '/attendance/bulk': {
      post: { tags: ['Attendance'], summary: 'Mark bulk attendance (INSTRUCTOR/ADMIN)', security: [{ bearerAuth: [] }], responses: { 201: { description: 'Recorded' } } },
    },
    '/attendance/student/{sectionId}': {
      get: { tags: ['Attendance'], summary: 'Get own attendance for a section (STUDENT)', security: [{ bearerAuth: [] }], responses: { 200: { description: 'OK' } } },
    },
    '/results': {
      post: { tags: ['Results & Transcripts'], summary: 'Upsert exam scores (INSTRUCTOR/ADMIN)', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Saved' } } },
    },
    '/results/{id}/publish': {
      patch: { tags: ['Results & Transcripts'], summary: 'Publish result & recalculate CGPA', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Published' } } },
    },
    '/transcripts/me': {
      get: { tags: ['Results & Transcripts'], summary: 'Get official academic transcript & CGPA (STUDENT)', security: [{ bearerAuth: [] }], responses: { 200: { description: 'OK' } } },
    },
    '/payments/invoices': {
      post: { tags: ['Payments'], summary: 'Create student fee invoice (ADMIN)', security: [{ bearerAuth: [] }], responses: { 201: { description: 'Created' } } },
    },
    '/payments/invoices/my': {
      get: { tags: ['Payments'], summary: 'Get my fee invoices (STUDENT)', security: [{ bearerAuth: [] }], responses: { 200: { description: 'OK' } } },
    },
    '/payments/initiate': {
      post: { tags: ['Payments'], summary: 'Initiate bKash or SSLCommerz payment (STUDENT)', security: [{ bearerAuth: [] }], responses: { 201: { description: 'Session created' } } },
    },
    '/payments/bkash/callback': {
      get: { tags: ['Payments'], summary: 'bKash callback handler (executes & verifies)', responses: { 200: { description: 'Processed' } } },
    },
    '/payments/sslcommerz/success': {
      post: { tags: ['Payments'], summary: 'SSLCommerz success callback (validates val_id)', responses: { 200: { description: 'Verified' } } },
    },
    '/admin/users': {
      get: { tags: ['Admin'], summary: 'List users with pagination & search (ADMIN)', security: [{ bearerAuth: [] }], responses: { 200: { description: 'OK' } } },
    },
    '/admin/users/{id}/role': {
      patch: { tags: ['Admin'], summary: 'Update user role (ADMIN)', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Updated' } } },
    },
    '/admin/dashboard-stats': {
      get: { tags: ['Admin'], summary: 'Get system-wide statistics (ADMIN)', security: [{ bearerAuth: [] }], responses: { 200: { description: 'OK' } } },
    },
    '/admin/audit-logs': {
      get: { tags: ['Admin'], summary: 'Get system audit logs (ADMIN)', security: [{ bearerAuth: [] }], responses: { 200: { description: 'OK' } } },
    },
  },
};
