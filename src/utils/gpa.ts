export interface GradeScaleEntry {
  minScore: number;
  grade: string;
  gradePoint: number;
}

export const GRADE_SCALE: GradeScaleEntry[] = [
  { minScore: 80, grade: 'A+', gradePoint: 4.0 },
  { minScore: 75, grade: 'A', gradePoint: 3.75 },
  { minScore: 70, grade: 'A-', gradePoint: 3.5 },
  { minScore: 65, grade: 'B+', gradePoint: 3.25 },
  { minScore: 60, grade: 'B', gradePoint: 3.0 },
  { minScore: 55, grade: 'B-', gradePoint: 2.75 },
  { minScore: 50, grade: 'C+', gradePoint: 2.5 },
  { minScore: 45, grade: 'C', gradePoint: 2.25 },
  { minScore: 40, grade: 'D', gradePoint: 2.0 },
  { minScore: 0, grade: 'F', gradePoint: 0.0 },
];

export function calculateGradeFromScore(totalScore: number): {
  grade: string;
  gradePoint: number;
} {
  const clamped = Math.max(0, Math.min(100, totalScore));
  for (const entry of GRADE_SCALE) {
    if (clamped >= entry.minScore) {
      return { grade: entry.grade, gradePoint: entry.gradePoint };
    }
  }
  return { grade: 'F', gradePoint: 0.0 };
}

export function calculateWeightedGpa(
  items: Array<{ credits: number; gradePoint: number }>
): number {
  const totalCredits = items.reduce((sum, item) => sum + item.credits, 0);
  if (totalCredits === 0) return 0;
  const weightedSum = items.reduce((sum, item) => sum + item.credits * item.gradePoint, 0);
  return Number((weightedSum / totalCredits).toFixed(2));
}
