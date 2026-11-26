import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../src/app';
import { calculateGradeFromScore, calculateWeightedGpa } from '../src/utils/gpa';

describe('GPA & Grading Utilities', () => {
  it('maps numeric scores to accurate letter grades and grade points', () => {
    expect(calculateGradeFromScore(85)).toEqual({ grade: 'A+', gradePoint: 4.0 });
    expect(calculateGradeFromScore(76)).toEqual({ grade: 'A', gradePoint: 3.75 });
    expect(calculateGradeFromScore(62)).toEqual({ grade: 'B', gradePoint: 3.0 });
    expect(calculateGradeFromScore(35)).toEqual({ grade: 'F', gradePoint: 0.0 });
  });

  it('computes credit-weighted GPA accurately', () => {
    const gpa = calculateWeightedGpa([
      { credits: 3, gradePoint: 4.0 },
      { credits: 3, gradePoint: 3.5 },
      { credits: 1, gradePoint: 3.0 },
    ]);
    expect(gpa).toBe(3.64);
  });
});

describe('API Health, 404, Validation & Auth Guards', () => {
  it('GET /health returns standardized success payload', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('UP');
  });

  it('returns 404 structured error for unknown routes', async () => {
    const res = await request(app).get('/api/v1/non-existent-endpoint');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(Array.isArray(res.body.errors)).toBe(true);
  });

  it('returns 400 structured validation error for invalid login payload', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'not-an-email', password: '' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Validation failed');
    expect(res.body.errors.length).toBeGreaterThan(0);
  });

  it('returns 401 when accessing protected routes without Bearer token', async () => {
    const res = await request(app).get('/api/v1/users/me');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
