import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding University Management System database...');

  const passwordHash = await bcrypt.hash('Password@123', 12);

  // 1. Admin User
  const admin = await prisma.user.upsert({
    where: { email: 'admin@university.edu' },
    update: {},
    create: {
      email: 'admin@university.edu',
      passwordHash,
      name: 'System Registrar Admin',
      role: Role.ADMIN,
      phone: '+8801700000001',
    },
  });

  // 2. Departments
  const cseDept = await prisma.department.upsert({
    where: { code: 'CSE' },
    update: {},
    create: {
      code: 'CSE',
      name: 'Computer Science & Engineering',
      description: 'Department of Computer Science and Software Engineering',
    },
  });

  const bbaDept = await prisma.department.upsert({
    where: { code: 'BBA' },
    update: {},
    create: {
      code: 'BBA',
      name: 'Business Administration',
      description: 'School of Business and Economics',
    },
  });

  // 3. Programs
  const bscCse = await prisma.program.upsert({
    where: { code: 'BSC-CSE' },
    update: {},
    create: {
      code: 'BSC-CSE',
      name: 'B.Sc. in Computer Science & Engineering',
      totalCreditsRequired: 136,
      departmentId: cseDept.id,
    },
  });

  await prisma.program.upsert({
    where: { code: 'BBA-GEN' },
    update: {},
    create: {
      code: 'BBA-GEN',
      name: 'Bachelor of Business Administration',
      totalCreditsRequired: 124,
      departmentId: bbaDept.id,
    },
  });

  // 4. Instructor User & Profile
  const instructorUser = await prisma.user.upsert({
    where: { email: 'instructor@university.edu' },
    update: {},
    create: {
      email: 'instructor@university.edu',
      passwordHash,
      name: 'Dr. Alan Turing',
      role: Role.INSTRUCTOR,
      phone: '+8801700000002',
    },
  });

  const instructorProfile = await prisma.instructorProfile.upsert({
    where: { userId: instructorUser.id },
    update: {},
    create: {
      userId: instructorUser.id,
      employeeCode: 'FAC-CSE-001',
      departmentId: cseDept.id,
      designation: 'Associate Professor',
    },
  });

  // 5. Student User & Profile
  const studentUser = await prisma.user.upsert({
    where: { email: 'student@university.edu' },
    update: {},
    create: {
      email: 'student@university.edu',
      passwordHash,
      name: 'Ada Lovelace',
      role: Role.STUDENT,
      phone: '+8801700000003',
    },
  });

  const studentProfile = await prisma.studentProfile.upsert({
    where: { userId: studentUser.id },
    update: {},
    create: {
      userId: studentUser.id,
      studentCode: '2026-1-60-001',
      programId: bscCse.id,
      admissionYear: 2026,
    },
  });

  // 6. Courses & Prerequisites
  const cse101 = await prisma.course.upsert({
    where: { code: 'CSE101' },
    update: {},
    create: {
      code: 'CSE101',
      title: 'Structured Programming',
      description: 'Fundamentals of programming in C/C++',
      credits: 3,
      departmentId: cseDept.id,
      programId: bscCse.id,
    },
  });

  const cse201 = await prisma.course.upsert({
    where: { code: 'CSE201' },
    update: {},
    create: {
      code: 'CSE201',
      title: 'Data Structures & Algorithms',
      description: 'Linear and non-linear data structures and algorithm analysis',
      credits: 3,
      departmentId: cseDept.id,
      programId: bscCse.id,
    },
  });

  await prisma.coursePrerequisite.upsert({
    where: {
      courseId_prerequisiteId: {
        courseId: cse201.id,
        prerequisiteId: cse101.id,
      },
    },
    update: {},
    create: {
      courseId: cse201.id,
      prerequisiteId: cse101.id,
    },
  });

  // 7. Semester
  const fall2026 = await prisma.semester.upsert({
    where: { name: 'Fall 2026' },
    update: {},
    create: {
      name: 'Fall 2026',
      year: 2026,
      term: 'Fall',
      startDate: new Date('2026-09-01T00:00:00Z'),
      endDate: new Date('2026-12-20T00:00:00Z'),
      isCurrent: true,
      registrationOpen: true,
    },
  });

  // 8. Sections
  await prisma.section.upsert({
    where: {
      courseId_semesterId_sectionCode: {
        courseId: cse101.id,
        semesterId: fall2026.id,
        sectionCode: 'A',
      },
    },
    update: {},
    create: {
      courseId: cse101.id,
      semesterId: fall2026.id,
      instructorId: instructorProfile.id,
      sectionCode: 'A',
      maxCapacity: 40,
      scheduleSlot: 'SUN-TUE 10:00-11:30',
      room: 'AB-301',
    },
  });

  await prisma.section.upsert({
    where: {
      courseId_semesterId_sectionCode: {
        courseId: cse201.id,
        semesterId: fall2026.id,
        sectionCode: 'A',
      },
    },
    update: {},
    create: {
      courseId: cse201.id,
      semesterId: fall2026.id,
      instructorId: instructorProfile.id,
      sectionCode: 'A',
      maxCapacity: 35,
      scheduleSlot: 'MON-WED 11:30-13:00',
      room: 'AB-305',
    },
  });

  // 9. Sample Fee Invoice
  const existingInvoice = await prisma.feeInvoice.findFirst({
    where: { studentId: studentProfile.id, semesterId: fall2026.id },
  });

  if (!existingInvoice) {
    await prisma.feeInvoice.create({
      data: {
        studentId: studentProfile.id,
        semesterId: fall2026.id,
        title: 'Fall 2026 Tuition & Registration Fee',
        amount: 25000,
        currency: 'BDT',
        dueDate: new Date('2026-09-15T23:59:59Z'),
      },
    });
  }

  console.log('Seed complete:', {
    adminEmail: admin.email,
    instructorEmail: instructorUser.email,
    studentEmail: studentUser.email,
  });
}

main()
  .catch((err) => {
    console.error('Seed error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
