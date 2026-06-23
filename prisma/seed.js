const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

const companiesData = [
  { name: 'google', domain: 'google.com', industry: 'Internet & Cloud Services', sizeRange: '10,000+', verified: true },
  { name: 'meta', domain: 'meta.com', industry: 'Social Networks', sizeRange: '10,000+', verified: true },
  { name: 'stripe', domain: 'stripe.com', industry: 'Fintech', sizeRange: '5,000-10,000', verified: true },
  { name: 'apple', domain: 'apple.com', industry: 'Consumer Electronics', sizeRange: '10,000+', verified: true },
  { name: 'amazon', domain: 'amazon.com', industry: 'E-Commerce', sizeRange: '10,000+', verified: true },
  { name: 'netflix', domain: 'netflix.com', industry: 'Entertainment / Streaming', sizeRange: '5,000-10,000', verified: true },
  { name: 'uber', domain: 'uber.com', industry: 'Transportation / Logistics', sizeRange: '10,000+', verified: true }
];

const salariesData = [
  { companyName: 'google', jobTitle: 'Software Engineer III', level: 'L4', base: 160000, bonus: 25000, equity: 40000, loc: 'San Francisco, CA', exp: 3 },
  { companyName: 'google', jobTitle: 'Software Engineer II', level: 'L3', base: 120000, bonus: 15000, equity: 25000, loc: 'New York, NY', exp: 1 },
  { companyName: 'google', jobTitle: 'Senior Software Engineer', level: 'L5', base: 200000, bonus: 35000, equity: 75000, loc: 'Mountain View, CA', exp: 6 },
  { companyName: 'google', jobTitle: 'Staff Software Engineer', level: 'Staff', base: 250000, bonus: 50000, equity: 150000, loc: 'San Francisco, CA', exp: 10 },
  { companyName: 'meta', jobTitle: 'Production Engineer', level: 'IC5', base: 195000, bonus: 35000, equity: 55000, loc: 'Menlo Park, CA', exp: 6 },
  { companyName: 'meta', jobTitle: 'Software Engineer', level: 'IC4', base: 165000, bonus: 25000, equity: 45000, loc: 'Seattle, WA', exp: 3 },
  { companyName: 'meta', jobTitle: 'Software Engineer', level: 'IC5', base: 210000, bonus: 40000, equity: 85000, loc: 'Menlo Park, CA', exp: 7 },
  { companyName: 'stripe', jobTitle: 'Software Engineer', level: 'L3', base: 175000, bonus: 20000, equity: 50000, loc: 'Seattle, WA', exp: 4 },
  { companyName: 'stripe', jobTitle: 'Software Engineer II', level: 'L4', base: 215000, bonus: 25000, equity: 80000, loc: 'San Francisco, CA', exp: 5 },
  { companyName: 'apple', jobTitle: 'Hardware Engineer II', level: 'L4', base: 148000, bonus: 20000, equity: 30000, loc: 'Cupertino, CA', exp: 4 },
  { companyName: 'apple', jobTitle: 'Software Engineer III', level: 'L5', base: 185000, bonus: 30000, equity: 60000, loc: 'Cupertino, CA', exp: 5 },
  { companyName: 'amazon', jobTitle: 'Software Development Engineer I', level: 'SDE-I', base: 115000, bonus: 20000, equity: 15000, loc: 'Austin, TX', exp: 1 },
  { companyName: 'amazon', jobTitle: 'Software Development Engineer II', level: 'SDE-II', base: 165000, bonus: 20000, equity: 55000, loc: 'Seattle, WA', exp: 4 },
  { companyName: 'amazon', jobTitle: 'Software Development Engineer III', level: 'SDE-III', base: 210000, bonus: 35000, equity: 90000, loc: 'Boston, MA', exp: 8 },
  { companyName: 'netflix', jobTitle: 'Senior Software Engineer', level: 'L6', base: 420000, bonus: 0, equity: 0, loc: 'Los Gatos, CA', exp: 8 },
  { companyName: 'netflix', jobTitle: 'Principal Software Engineer', level: 'Principal', base: 550000, bonus: 0, equity: 0, loc: 'Los Gatos, CA', exp: 12 },
  { companyName: 'uber', jobTitle: 'Data Scientist', level: 'L4', base: 150000, bonus: 20000, equity: 45000, loc: 'San Francisco, CA', exp: 3 },
  { companyName: 'uber', jobTitle: 'Senior Data Scientist', level: 'L5', base: 190000, bonus: 30000, equity: 70000, loc: 'New York, NY', exp: 6 }
];

const LEVEL_MAP = {
  'L3': 'L3',
  'L4': 'L4',
  'L5': 'L5',
  'L6': 'L6',
  'SDE-I': 'SDE_I',
  'SDE-II': 'SDE_II',
  'SDE-III': 'SDE_III',
  'Staff': 'Staff',
  'Principal': 'Principal',
  'IC4': 'IC4',
  'IC5': 'IC5'
};

async function main() {
  console.log('Starting database seed...');

  // 1. Clean existing records
  await prisma.compensationRecord.deleteMany();
  await prisma.company.deleteMany();
  await prisma.errorLog.deleteMany();
  console.log('Cleared existing data.');

  // 2. Insert Companies
  const companyMap = {};
  for (const c of companiesData) {
    const created = await prisma.company.create({
      data: c
    });
    companyMap[c.name] = created.id;
    console.log(`Created company: ${c.name}`);
  }

  // 3. Insert Salaries
  for (const s of salariesData) {
    const companyId = companyMap[s.companyName];
    const dbLevel = LEVEL_MAP[s.level];
    
    // Server-side compute total compensation
    const totalComp = s.base + s.bonus + s.equity;

    // Unique deduplication hash
    const dedupString = `${companyId}-${s.jobTitle.toLowerCase()}-${dbLevel}-${s.loc.toLowerCase()}-${s.base}-${Date.now()}-${Math.random()}`;
    const hashDedup = crypto.createHash('sha256').update(dedupString).digest('hex');

    await prisma.compensationRecord.create({
      data: {
        companyId,
        jobTitle: s.jobTitle,
        level: dbLevel,
        department: 'Engineering',
        baseSalary: s.base,
        variablePay: s.bonus,
        equity: s.equity,
        totalCompensation: totalComp,
        location: s.loc,
        yearsOfExperience: s.exp,
        status: 'APPROVED',
        hashDedup,
        submittedAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000) // Random submission date within last 30 days
      }
    });
    console.log(`Created compensation record for ${s.companyName} - ${s.jobTitle}`);
  }

  console.log('Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
