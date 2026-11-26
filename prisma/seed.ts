import {
  AttendanceStatus,
  EnrollmentStatus,
  PaymentProvider,
  PaymentStatus,
  PrismaClient,
  Role,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function clearDatabase() {
  console.log('Clearing existing database records...');
  await prisma.$transaction([
    prisma.auditLog.deleteMany(),
    prisma.payment.deleteMany(),
    prisma.feeInvoice.deleteMany(),
    prisma.examResult.deleteMany(),
    prisma.attendance.deleteMany(),
    prisma.enrollment.deleteMany(),
    prisma.section.deleteMany(),
    prisma.semester.deleteMany(),
    prisma.coursePrerequisite.deleteMany(),
    prisma.course.deleteMany(),
    prisma.studentProfile.deleteMany(),
    prisma.instructorProfile.deleteMany(),
    prisma.program.deleteMany(),
    prisma.department.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}

async function main() {
  await clearDatabase();
  console.log('Seeding comprehensive University Management System data...');

  const passwordHash = await bcrypt.hash('Password@123', 12);

  // 1. Admin
  const admin = await prisma.user.create({
    data: {
      email: 'admin@university.edu',
      passwordHash,
      name: 'System Registrar Admin',
      role: Role.ADMIN,
      phone: '+8801700000001',
    },
  });

  // 2. Departments
  const [cseDept, bbaDept, eeeDept, engDept] = await Promise.all([
    prisma.department.create({
      data: {
        code: 'CSE',
        name: 'Computer Science & Engineering',
        description: 'Department of Computer Science, AI, and Software Engineering',
      },
    }),
    prisma.department.create({
      data: {
        code: 'BBA',
        name: 'Business Administration',
        description: 'School of Business, Finance, and Economics',
      },
    }),
    prisma.department.create({
      data: {
        code: 'EEE',
        name: 'Electrical & Electronic Engineering',
        description: 'Department of Power Systems, VLSI, and Embedded Engineering',
      },
    }),
    prisma.department.create({
      data: {
        code: 'ENG',
        name: 'English & Humanities',
        description: 'Department of Literature, Linguistics, and Communication',
      },
    }),
  ]);

  // 3. Programs
  const [bscCse, mscCse, bbaGen, bscEee, baEng] = await Promise.all([
    prisma.program.create({
      data: {
        code: 'BSC-CSE',
        name: 'B.Sc. in Computer Science & Engineering',
        totalCreditsRequired: 136,
        departmentId: cseDept.id,
      },
    }),
    prisma.program.create({
      data: {
        code: 'MSC-CSE',
        name: 'M.Sc. in Computer Science & Engineering',
        totalCreditsRequired: 36,
        departmentId: cseDept.id,
      },
    }),
    prisma.program.create({
      data: {
        code: 'BBA-GEN',
        name: 'Bachelor of Business Administration',
        totalCreditsRequired: 124,
        departmentId: bbaDept.id,
      },
    }),
    prisma.program.create({
      data: {
        code: 'BSC-EEE',
        name: 'B.Sc. in Electrical & Electronic Engineering',
        totalCreditsRequired: 140,
        departmentId: eeeDept.id,
      },
    }),
    prisma.program.create({
      data: {
        code: 'BA-ENG',
        name: 'B.A. in English Literature',
        totalCreditsRequired: 120,
        departmentId: engDept.id,
      },
    }),
  ]);
  void mscCse;

  // 4. Instructors (Demo + 5 faculty)
  const instructorSeeds = [
    {
      email: 'instructor@university.edu',
      name: 'Dr. Alan Turing',
      employeeCode: 'FAC-CSE-001',
      departmentId: cseDept.id,
      designation: 'Associate Professor',
      phone: '+8801700000002',
    },
    {
      email: 'grace.hopper@university.edu',
      name: 'Dr. Grace Hopper',
      employeeCode: 'FAC-CSE-002',
      departmentId: cseDept.id,
      designation: 'Professor',
      phone: '+8801700000010',
    },
    {
      email: 'tim.berners@university.edu',
      name: 'Prof. Tim Berners-Lee',
      employeeCode: 'FAC-CSE-003',
      departmentId: cseDept.id,
      designation: 'Assistant Professor',
      phone: '+8801700000011',
    },
    {
      email: 'adam.smith@university.edu',
      name: 'Dr. Adam Smith',
      employeeCode: 'FAC-BBA-001',
      departmentId: bbaDept.id,
      designation: 'Professor',
      phone: '+8801700000012',
    },
    {
      email: 'nikola.tesla@university.edu',
      name: 'Dr. Nikola Tesla',
      employeeCode: 'FAC-EEE-001',
      departmentId: eeeDept.id,
      designation: 'Associate Professor',
      phone: '+8801700000013',
    },
    {
      email: 'jane.austen@university.edu',
      name: 'Prof. Jane Austen',
      employeeCode: 'FAC-ENG-001',
      departmentId: engDept.id,
      designation: 'Lecturer',
      phone: '+8801700000014',
    },
  ];

  const instructors = [];
  for (const inst of instructorSeeds) {
    const user = await prisma.user.create({
      data: {
        email: inst.email,
        passwordHash,
        name: inst.name,
        role: Role.INSTRUCTOR,
        phone: inst.phone,
      },
    });
    const profile = await prisma.instructorProfile.create({
      data: {
        userId: user.id,
        employeeCode: inst.employeeCode,
        departmentId: inst.departmentId,
        designation: inst.designation,
      },
    });
    instructors.push({ user, profile });
  }
  const [turing, hopper, berners, smith, tesla, austen] = instructors;

  // 5. Students (Demo + 19 students = 20 total)
  const extraStudentNames = [
    'Linus Torvalds',
    'Margaret Hamilton',
    'Donald Knuth',
    'Barbara Liskov',
    'Ken Thompson',
    'Dennis Ritchie',
    'Frances Allen',
    'John McCarthy',
    'Shafi Goldwasser',
    'Edsger Dijkstra',
    'Leslie Lamport',
    'Radia Perlman',
    'Bjarne Stroustrup',
    'Guido van Rossum',
    'James Gosling',
    'Hedy Lamarr',
    'Katherine Johnson',
    'Vint Cerf',
    'Fei-Fei Li',
  ];

  const programsPool = [bscCse, bscCse, bbaGen, bscEee, baEng];

  const demoStudentUser = await prisma.user.create({
    data: {
      email: 'student@university.edu',
      passwordHash,
      name: 'Ada Lovelace',
      role: Role.STUDENT,
      phone: '+8801700000003',
    },
  });
  const demoStudentProfile = await prisma.studentProfile.create({
    data: {
      userId: demoStudentUser.id,
      studentCode: '2026-1-60-001',
      programId: bscCse.id,
      admissionYear: 2026,
      currentCgpa: 3.88,
    },
  });

  const allStudents = [{ user: demoStudentUser, profile: demoStudentProfile }];
  for (let i = 0; i < extraStudentNames.length; i++) {
    const name = extraStudentNames[i];
    const slug = name.toLowerCase().replace(/[^a-z]+/g, '.');
    const prog = programsPool[i % programsPool.length];
    const user = await prisma.user.create({
      data: {
        email: `${slug}@university.edu`,
        passwordHash,
        name,
        role: Role.STUDENT,
        phone: `+8801710000${String(i + 10).padStart(3, '0')}`,
      },
    });
    const profile = await prisma.studentProfile.create({
      data: {
        userId: user.id,
        studentCode: `2026-1-60-${String(i + 2).padStart(3, '0')}`,
        programId: prog.id,
        admissionYear: 2026,
        currentCgpa: Number((3.1 + ((i * 7) % 9) * 0.1).toFixed(2)),
      },
    });
    allStudents.push({ user, profile });
  }

  // 6. Courses (14 courses across 4 departments)
  const cse101 = await prisma.course.create({
    data: {
      code: 'CSE101',
      title: 'Structured Programming',
      description: 'Fundamentals of programming in C and problem solving.',
      credits: 3,
      departmentId: cseDept.id,
      programId: bscCse.id,
    },
  });
  const cse102 = await prisma.course.create({
    data: {
      code: 'CSE102',
      title: 'Discrete Mathematics',
      description: 'Logic, set theory, combinatorics, and graph theory.',
      credits: 3,
      departmentId: cseDept.id,
      programId: bscCse.id,
    },
  });
  const cse201 = await prisma.course.create({
    data: {
      code: 'CSE201',
      title: 'Data Structures & Algorithms',
      description: 'Linear/non-linear data structures and algorithm complexity.',
      credits: 3,
      departmentId: cseDept.id,
      programId: bscCse.id,
    },
  });
  const cse202 = await prisma.course.create({
    data: {
      code: 'CSE202',
      title: 'Object-Oriented Programming',
      description: 'Design patterns, inheritance, polymorphism, and TypeScript/Java.',
      credits: 3,
      departmentId: cseDept.id,
      programId: bscCse.id,
    },
  });
  const cse301 = await prisma.course.create({
    data: {
      code: 'CSE301',
      title: 'Database Management Systems',
      description: 'Relational algebra, SQL, indexing, and transaction processing.',
      credits: 3,
      departmentId: cseDept.id,
      programId: bscCse.id,
    },
  });
  const cse302 = await prisma.course.create({
    data: {
      code: 'CSE302',
      title: 'Operating Systems',
      description: 'Processes, threads, scheduling, memory, and file systems.',
      credits: 3,
      departmentId: cseDept.id,
      programId: bscCse.id,
    },
  });
  const cse401 = await prisma.course.create({
    data: {
      code: 'CSE401',
      title: 'Distributed Systems & Cloud',
      description: 'Consensus, replication, microservices, and cloud architecture.',
      credits: 3,
      departmentId: cseDept.id,
      programId: bscCse.id,
    },
  });

  const bba101 = await prisma.course.create({
    data: {
      code: 'BBA101',
      title: 'Principles of Management',
      description: 'Foundations of organizational leadership and strategy.',
      credits: 3,
      departmentId: bbaDept.id,
      programId: bbaGen.id,
    },
  });
  const bba201 = await prisma.course.create({
    data: {
      code: 'BBA201',
      title: 'Financial Accounting',
      description: 'Financial statements, balance sheets, and corporate reporting.',
      credits: 3,
      departmentId: bbaDept.id,
      programId: bbaGen.id,
    },
  });
  const bba301 = await prisma.course.create({
    data: {
      code: 'BBA301',
      title: 'Corporate Finance',
      description: 'Capital budgeting, valuation, and risk management.',
      credits: 3,
      departmentId: bbaDept.id,
      programId: bbaGen.id,
    },
  });

  const eee101 = await prisma.course.create({
    data: {
      code: 'EEE101',
      title: 'Electrical Circuits I',
      description: 'DC/AC circuit analysis, Kirchhoff laws, and phasors.',
      credits: 3,
      departmentId: eeeDept.id,
      programId: bscEee.id,
    },
  });
  const eee201 = await prisma.course.create({
    data: {
      code: 'EEE201',
      title: 'Digital Logic Design',
      description: 'Boolean algebra, combinational and sequential circuits.',
      credits: 3,
      departmentId: eeeDept.id,
      programId: bscEee.id,
    },
  });

  const eng101 = await prisma.course.create({
    data: {
      code: 'ENG101',
      title: 'Academic English & Composition',
      description: 'Critical reading, academic writing, and technical communication.',
      credits: 3,
      departmentId: engDept.id,
      programId: baEng.id,
    },
  });
  const eng201 = await prisma.course.create({
    data: {
      code: 'ENG201',
      title: 'Modern World Literature',
      description: 'Comparative study of 20th-century global literature.',
      credits: 3,
      departmentId: engDept.id,
      programId: baEng.id,
    },
  });

  // Prerequisites
  await prisma.coursePrerequisite.createMany({
    data: [
      { courseId: cse201.id, prerequisiteId: cse101.id },
      { courseId: cse202.id, prerequisiteId: cse101.id },
      { courseId: cse301.id, prerequisiteId: cse201.id },
      { courseId: cse302.id, prerequisiteId: cse201.id },
      { courseId: cse401.id, prerequisiteId: cse301.id },
      { courseId: bba201.id, prerequisiteId: bba101.id },
      { courseId: bba301.id, prerequisiteId: bba201.id },
      { courseId: eee201.id, prerequisiteId: eee101.id },
      { courseId: eng201.id, prerequisiteId: eng101.id },
    ],
  });

  // 7. Semesters
  const spring2026 = await prisma.semester.create({
    data: {
      name: 'Spring 2026',
      year: 2026,
      term: 'Spring',
      startDate: new Date('2026-01-15T00:00:00Z'),
      endDate: new Date('2026-05-10T00:00:00Z'),
      isCurrent: false,
      registrationOpen: false,
    },
  });
  await prisma.semester.create({
    data: {
      name: 'Summer 2026',
      year: 2026,
      term: 'Summer',
      startDate: new Date('2026-05-20T00:00:00Z'),
      endDate: new Date('2026-08-20T00:00:00Z'),
      isCurrent: false,
      registrationOpen: false,
    },
  });
  const fall2026 = await prisma.semester.create({
    data: {
      name: 'Fall 2026',
      year: 2026,
      term: 'Fall',
      startDate: new Date('2026-09-01T00:00:00Z'),
      endDate: new Date('2026-12-20T00:00:00Z'),
      isCurrent: true,
      registrationOpen: true,
    },
  });

  // 8. Sections (Past + Current Fall 2026)
  const spCse101 = await prisma.section.create({
    data: {
      courseId: cse101.id,
      semesterId: spring2026.id,
      instructorId: turing.profile.id,
      sectionCode: 'A',
      maxCapacity: 40,
      enrolledCount: 6,
      scheduleSlot: 'SUN-TUE 08:30-10:00',
      room: 'AB-101',
    },
  });
  const spEng101 = await prisma.section.create({
    data: {
      courseId: eng101.id,
      semesterId: spring2026.id,
      instructorId: austen.profile.id,
      sectionCode: 'A',
      maxCapacity: 40,
      enrolledCount: 4,
      scheduleSlot: 'MON-WED 10:00-11:30',
      room: 'HU-201',
    },
  });

  // Fall 2026 Sections
  const fallCse101A = await prisma.section.create({
    data: {
      courseId: cse101.id,
      semesterId: fall2026.id,
      instructorId: turing.profile.id,
      sectionCode: 'A',
      maxCapacity: 40,
      scheduleSlot: 'SUN-TUE 10:00-11:30',
      room: 'AB-301',
    },
  });
  const fallCse101B = await prisma.section.create({
    data: {
      courseId: cse101.id,
      semesterId: fall2026.id,
      instructorId: hopper.profile.id,
      sectionCode: 'B',
      maxCapacity: 35,
      scheduleSlot: 'MON-WED 10:00-11:30',
      room: 'AB-302',
    },
  });
  const fallCse102A = await prisma.section.create({
    data: {
      courseId: cse102.id,
      semesterId: fall2026.id,
      instructorId: berners.profile.id,
      sectionCode: 'A',
      maxCapacity: 40,
      // Intentional overlap with fallCse201A to demonstrate time-clash protection!
      scheduleSlot: 'MON-WED 11:30-13:00',
      room: 'AB-303',
    },
  });
  const fallCse201A = await prisma.section.create({
    data: {
      courseId: cse201.id,
      semesterId: fall2026.id,
      instructorId: turing.profile.id,
      sectionCode: 'A',
      maxCapacity: 35,
      scheduleSlot: 'MON-WED 11:30-13:00',
      room: 'AB-305',
    },
  });
  const fallCse201B = await prisma.section.create({
    data: {
      courseId: cse201.id,
      semesterId: fall2026.id,
      instructorId: hopper.profile.id,
      sectionCode: 'B',
      maxCapacity: 35,
      scheduleSlot: 'SUN-TUE 14:00-15:30',
      room: 'AB-306',
    },
  });
  const fallCse202A = await prisma.section.create({
    data: {
      courseId: cse202.id,
      semesterId: fall2026.id,
      instructorId: turing.profile.id,
      sectionCode: 'A',
      maxCapacity: 40,
      scheduleSlot: 'SUN-TUE 11:30-13:00',
      room: 'AB-308',
    },
  });
  const fallCse301A = await prisma.section.create({
    data: {
      courseId: cse301.id,
      semesterId: fall2026.id,
      instructorId: berners.profile.id,
      sectionCode: 'A',
      maxCapacity: 35,
      scheduleSlot: 'MON-WED 14:00-15:30',
      room: 'AB-401',
    },
  });
  const fallBba101A = await prisma.section.create({
    data: {
      courseId: bba101.id,
      semesterId: fall2026.id,
      instructorId: smith.profile.id,
      sectionCode: 'A',
      maxCapacity: 45,
      scheduleSlot: 'SUN-TUE 08:30-10:00',
      room: 'BB-102',
    },
  });
  const fallEee101A = await prisma.section.create({
    data: {
      courseId: eee101.id,
      semesterId: fall2026.id,
      instructorId: tesla.profile.id,
      sectionCode: 'A',
      maxCapacity: 40,
      scheduleSlot: 'MON-WED 08:30-10:00',
      room: 'EE-201',
    },
  });
  const fallEng101A = await prisma.section.create({
    data: {
      courseId: eng101.id,
      semesterId: fall2026.id,
      instructorId: austen.profile.id,
      sectionCode: 'A',
      maxCapacity: 40,
      scheduleSlot: 'THU 10:00-13:00',
      room: 'HU-105',
    },
  });

  // 9. Completed Spring 2026 Enrollments & Published ExamResults (for Transcript + Prereqs)
  const completedPairs = [
    { student: allStudents[0], section: spCse101, att: 9, asg: 19, mid: 28, fin: 37, tot: 93, gr: 'A+', gp: 4.0 },
    { student: allStudents[0], section: spEng101, att: 9, asg: 17, mid: 24, fin: 28, tot: 78, gr: 'A', gp: 3.75 },
    { student: allStudents[1], section: spCse101, att: 9, asg: 18, mid: 26, fin: 33, tot: 86, gr: 'A+', gp: 4.0 },
    { student: allStudents[2], section: spCse101, att: 8, asg: 16, mid: 24, fin: 30, tot: 78, gr: 'A', gp: 3.75 },
    { student: allStudents[3], section: spCse101, att: 8, asg: 15, mid: 22, fin: 27, tot: 72, gr: 'A-', gp: 3.5 },
    { student: allStudents[4], section: spCse101, att: 7, asg: 14, mid: 20, fin: 26, tot: 67, gr: 'B+', gp: 3.25 },
  ];

  for (const item of completedPairs) {
    const enr = await prisma.enrollment.create({
      data: {
        studentId: item.student.profile.id,
        sectionId: item.section.id,
        status: EnrollmentStatus.COMPLETED,
      },
    });
    await prisma.examResult.create({
      data: {
        enrollmentId: enr.id,
        attendanceScore: item.att,
        assignmentScore: item.asg,
        midtermScore: item.mid,
        finalScore: item.fin,
        totalScore: item.tot,
        grade: item.gr,
        gradePoint: item.gp,
        isPublished: true,
        publishedAt: new Date('2026-05-15T12:00:00Z'),
      },
    });
  }

  // 10. Active Fall 2026 Enrollments + Attendance + Draft ExamResults
  const fallAssignments: Array<{ sectionId: string; studentIndices: number[] }> = [
    { sectionId: fallCse201A.id, studentIndices: [0, 1, 2, 3, 4, 5] },
    { sectionId: fallCse202A.id, studentIndices: [0, 1, 2, 3] },
    { sectionId: fallCse101A.id, studentIndices: [6, 7, 8, 9, 10, 11, 12] },
    { sectionId: fallCse101B.id, studentIndices: [13, 14, 15, 16] },
    { sectionId: fallCse201B.id, studentIndices: [5, 6, 7] },
    { sectionId: fallCse301A.id, studentIndices: [1, 2, 3] },
    { sectionId: fallBba101A.id, studentIndices: [12, 13, 14, 15, 16] },
    { sectionId: fallEee101A.id, studentIndices: [17, 18, 19] },
    { sectionId: fallEng101A.id, studentIndices: [8, 9, 10, 18, 19] },
  ];

  const attendanceDates = [
    new Date('2026-09-06T00:00:00Z'),
    new Date('2026-09-08T00:00:00Z'),
    new Date('2026-09-13T00:00:00Z'),
    new Date('2026-09-15T00:00:00Z'),
    new Date('2026-09-20T00:00:00Z'),
  ];
  const statuses: AttendanceStatus[] = [
    AttendanceStatus.PRESENT,
    AttendanceStatus.PRESENT,
    AttendanceStatus.PRESENT,
    AttendanceStatus.LATE,
    AttendanceStatus.ABSENT,
  ];

  for (const group of fallAssignments) {
    for (const sIdx of group.studentIndices) {
      const enr = await prisma.enrollment.create({
        data: {
          studentId: allStudents[sIdx].profile.id,
          sectionId: group.sectionId,
          status: EnrollmentStatus.ENROLLED,
        },
      });

      // Seed 5 days of attendance for Turing's sections & Ada's sections
      if (
        group.sectionId === fallCse201A.id ||
        group.sectionId === fallCse202A.id ||
        group.sectionId === fallCse101A.id
      ) {
        await prisma.attendance.createMany({
          data: attendanceDates.map((d, dIdx) => ({
            enrollmentId: enr.id,
            date: d,
            status: statuses[(sIdx + dIdx) % statuses.length],
            remarks: (sIdx + dIdx) % statuses.length === 3 ? 'Arrived 10m late' : null,
          })),
        });
      }
    }

    await prisma.section.update({
      where: { id: group.sectionId },
      data: { enrolledCount: group.studentIndices.length },
    });
  }
  void fallCse102A;

  // 11. FeeInvoices & Payments
  const adaSpringInv = await prisma.feeInvoice.create({
    data: {
      studentId: demoStudentProfile.id,
      semesterId: spring2026.id,
      title: 'Spring 2026 Tuition & Registration Fee',
      amount: 22000,
      currency: 'BDT',
      status: PaymentStatus.PAID,
      dueDate: new Date('2026-01-30T23:59:59Z'),
      paidAt: new Date('2026-01-25T10:30:00Z'),
    },
  });
  await prisma.payment.create({
    data: {
      invoiceId: adaSpringInv.id,
      studentId: demoStudentProfile.id,
      provider: PaymentProvider.SSLCOMMERZ,
      amount: 22000,
      currency: 'BDT',
      transactionId: 'TXN-SPRING-2026-001',
      status: PaymentStatus.PAID,
      paidAt: new Date('2026-01-25T10:30:00Z'),
    },
  });

  await prisma.feeInvoice.createMany({
    data: [
      {
        studentId: demoStudentProfile.id,
        semesterId: fall2026.id,
        title: 'Fall 2026 Tuition & Registration Fee',
        amount: 25000,
        currency: 'BDT',
        status: PaymentStatus.PENDING,
        dueDate: new Date('2026-09-15T23:59:59Z'),
      },
      {
        studentId: demoStudentProfile.id,
        semesterId: fall2026.id,
        title: 'Fall 2026 Computer Lab & Library Fee',
        amount: 3500,
        currency: 'BDT',
        status: PaymentStatus.PENDING,
        dueDate: new Date('2026-09-20T23:59:59Z'),
      },
    ],
  });

  // Paid invoices for other students so Admin Revenue chart has rich BDT data
  for (let i = 1; i <= 6; i++) {
    const inv = await prisma.feeInvoice.create({
      data: {
        studentId: allStudents[i].profile.id,
        semesterId: fall2026.id,
        title: 'Fall 2026 Tuition Fee',
        amount: 25000 + i * 1000,
        currency: 'BDT',
        status: PaymentStatus.PAID,
        dueDate: new Date('2026-09-15T23:59:59Z'),
        paidAt: new Date(`2026-09-0${i}T11:00:00Z`),
      },
    });
    await prisma.payment.create({
      data: {
        invoiceId: inv.id,
        studentId: allStudents[i].profile.id,
        provider: PaymentProvider.SSLCOMMERZ,
        amount: inv.amount,
        currency: 'BDT',
        transactionId: `TXN-FALL-2026-00${i + 1}`,
        status: PaymentStatus.PAID,
        paidAt: inv.paidAt,
      },
    });
  }

  // 12. Audit Logs
  await prisma.auditLog.createMany({
    data: [
      { actorId: admin.id, action: 'SEMESTER_CREATED', entityType: 'Semester', entityId: fall2026.id },
      { actorId: admin.id, action: 'INSTRUCTOR_CREATED', entityType: 'User', entityId: turing.user.id },
      { actorId: admin.id, action: 'INSTRUCTOR_CREATED', entityType: 'User', entityId: hopper.user.id },
      { actorId: admin.id, action: 'COURSE_CREATED', entityType: 'Course', entityId: cse201.id },
      { actorId: admin.id, action: 'COURSE_CREATED', entityType: 'Course', entityId: cse301.id },
      { actorId: admin.id, action: 'SECTION_CREATED', entityType: 'Section', entityId: fallCse201A.id },
      { actorId: turing.user.id, action: 'RESULT_PUBLISHED', entityType: 'ExamResult', entityId: spCse101.id },
      { actorId: demoStudentUser.id, action: 'ENROLLMENT_CREATED', entityType: 'Enrollment', entityId: fallCse201A.id },
    ],
  });

  console.log('Database cleared and seeded successfully:', {
    departments: 4,
    programs: 5,
    instructors: instructors.length,
    students: allStudents.length,
    courses: 14,
    semesters: 3,
    sections: 12,
    demoAdmin: admin.email,
    demoInstructor: turing.user.email,
    demoStudent: demoStudentUser.email,
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
