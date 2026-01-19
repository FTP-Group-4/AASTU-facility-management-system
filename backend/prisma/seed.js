const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create blocks 1-100
  console.log('📦 Creating blocks...');
  const blocks = [];
  for (let i = 1; i <= 100; i++) {
    blocks.push({
      block_number: i,
      name: `Block ${i}`,
      description: `Campus Block ${i}`
    });
  }

  await prisma.block.createMany({
    data: blocks,
    skipDuplicates: true
  });

  console.log('✅ Created 100 blocks');

  // Create admin user
  console.log('👤 Creating admin user...');
  const adminPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10);
  
  const adminUser = await prisma.user.upsert({
    where: { email: process.env.ADMIN_EMAIL || 'admin@aastu.edu.et' },
    update: {},
    create: {
      email: process.env.ADMIN_EMAIL || 'admin@aastu.edu.et',
      password_hash: adminPassword,
      full_name: 'System Administrator',
      role: 'admin',
      is_active: true
    }
  });

  console.log('✅ Created admin user:', adminUser.email);

  // Create sample coordinator
  console.log('👥 Creating sample coordinator...');
  const coordinatorPassword = await bcrypt.hash('coordinator123', 10);
  
  const coordinator = await prisma.user.upsert({
    where: { email: 'coordinator@aastu.edu.et' },
    update: {},
    create: {
      email: 'coordinator@aastu.edu.et',
      password_hash: coordinatorPassword,
      full_name: 'Building Coordinator',
      role: 'coordinator',
      is_active: true
    }
  });

  // Assign coordinator to blocks 1-10
  await prisma.coordinatorAssignment.createMany({
    data: Array.from({ length: 10 }, (_, i) => ({
      coordinator_id: coordinator.id,
      block_id: i + 1
    })),
    skipDuplicates: true
  });

  console.log('✅ Created coordinator and assigned to blocks 1-10');

  // Create sample fixers
  console.log('🔧 Creating sample fixers...');
  const electricalFixerPassword = await bcrypt.hash('fixer123', 10);
  const mechanicalFixerPassword = await bcrypt.hash('fixer123', 10);

  await prisma.user.upsert({
    where: { email: 'electrical.fixer@aastu.edu.et' },
    update: {},
    create: {
      email: 'electrical.fixer@aastu.edu.et',
      password_hash: electricalFixerPassword,
      full_name: 'Electrical Maintenance Specialist',
      role: 'electrical_fixer',
      is_active: true
    }
  });

  await prisma.user.upsert({
    where: { email: 'mechanical.fixer@aastu.edu.et' },
    update: {},
    create: {
      email: 'mechanical.fixer@aastu.edu.et',
      password_hash: mechanicalFixerPassword,
      full_name: 'Mechanical Maintenance Specialist',
      role: 'mechanical_fixer',
      is_active: true
    }
  });

  console.log('✅ Created electrical and mechanical fixers');

  // Create sample reporter
  console.log('📝 Creating sample reporter...');
  const reporterPassword = await bcrypt.hash('student123', 10);
  
  await prisma.user.upsert({
    where: { email: 'student@aastustudent.edu.et' },
    update: {},
    create: {
      email: 'student@aastustudent.edu.et',
      password_hash: reporterPassword,
      full_name: 'Sample Student',
      role: 'reporter',
      is_active: true
    }
  });

  console.log('✅ Created sample reporter');

  console.log('🎉 Database seeding completed successfully!');
  console.log('\n📋 Sample Users Created:');
  console.log('Admin: admin@aastu.edu.et / admin123');
  console.log('Coordinator: coordinator@aastu.edu.et / coordinator123');
  console.log('Electrical Fixer: electrical.fixer@aastu.edu.et / fixer123');
  console.log('Mechanical Fixer: mechanical.fixer@aastu.edu.et / fixer123');
  console.log('Student: student@aastustudent.edu.et / student123');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });