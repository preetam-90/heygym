import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';
import { uniqueSlug } from '../src/lib/slug';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding HeyGym dev data...');
  const passwordHash = await argon2.hash('Password123!');

  const admin = await prisma.user.upsert({
    where: { email: 'admin@heygym.dev' },
    create: { name: 'HeyGym Admin', email: 'admin@heygym.dev', passwordHash, role: 'ADMIN' },
    update: {},
  });

  const owner1 = await prisma.user.upsert({
    where: { email: 'owner1@heygym.dev' },
    create: { name: 'Aarav Sharma', email: 'owner1@heygym.dev', passwordHash, role: 'GYM_OWNER', phone: '+919810000001' },
    update: {},
  });
  const owner2 = await prisma.user.upsert({
    where: { email: 'owner2@heygym.dev' },
    create: { name: 'Priya Verma', email: 'owner2@heygym.dev', passwordHash, role: 'GYM_OWNER', phone: '+919810000002' },
    update: {},
  });

  const users = [];
  for (let i = 1; i <= 4; i++) {
    users.push(
      await prisma.user.upsert({
        where: { email: `user${i}@heygym.dev` },
        create: { name: `Test User ${i}`, email: `user${i}@heygym.dev`, passwordHash, role: 'USER' },
        update: {},
      }),
    );
  }

  const facilities = await prisma.facility.findMany();
  const facBySlug = new Map(facilities.map((f) => [f.slug, f]));

  const gymSeed = [
    { name: 'FitZone Noida', city: 'Noida', state: 'UP', address: 'Sector 18, Noida', lat: 28.5706, lng: 77.321, owner: owner1, facs: ['weight-training', 'cardio', 'parking', 'locker', 'ac', 'wifi'], price: 2000 },
    { name: 'Iron Paradise Delhi', city: 'New Delhi', state: 'Delhi', address: 'Connaught Place', lat: 28.6315, lng: 77.2167, owner: owner1, facs: ['weight-training', 'crossfit', 'personal-trainer', 'shower'], price: 3000 },
    { name: 'Yoga Bliss Gurgaon', city: 'Gurgaon', state: 'Haryana', address: 'Sector 29', lat: 28.467, lng: 77.064, owner: owner2, facs: ['yoga', 'steam-room', 'sauna', 'parking'], price: 1500 },
    { name: 'Cardio Hub Noida', city: 'Noida', state: 'UP', address: 'Sector 62', lat: 28.613, lng: 77.365, owner: owner2, facs: ['cardio', 'ac', 'music', 'wifi', 'locker'], price: 1200 },
    { name: 'PowerHouse Express', city: 'Noida', state: 'UP', address: 'Sector 137', lat: 28.5, lng: 77.4, owner: owner1, facs: ['weight-training', 'cardio'], price: 800 },
    { name: 'Draft Gym (not public)', city: 'Noida', state: 'UP', address: 'Sector 15', lat: 28.58, lng: 77.31, owner: owner2, facs: ['cardio'], price: 999, status: 'DRAFT' as const },
  ];

  for (const [idx, g] of gymSeed.entries()) {
    const slug = uniqueSlug(g.name, `seed${idx}`);
    const gym = await prisma.gym.upsert({
      where: { slug },
      create: {
        ownerId: g.owner.id,
        name: g.name,
        slug,
        description: `${g.name} — verified HeyGym partner with modern equipment.`,
        address: g.address,
        city: g.city,
        state: g.state,
        pincode: '201301',
        latitude: g.lat,
        longitude: g.lng,
        phone: '+911204567890',
        status: (g.status ?? 'APPROVED') as never,
        verifiedAt: g.status === 'DRAFT' ? null : new Date(),
      },
      update: {},
    });
    for (const s of g.facs) {
      const f = facBySlug.get(s);
      if (f) await prisma.gymFacility.upsert({ where: { gymId_facilityId: { gymId: gym.id, facilityId: f.id } }, create: { gymId: gym.id, facilityId: f.id }, update: {} });
    }
    const plans = [
      { name: 'Monthly', price: g.price, durationDays: 30 },
      { name: 'Quarterly', price: g.price * 3 * 0.9, durationDays: 90 },
      { name: 'Yearly', price: g.price * 12 * 0.75, durationDays: 365 },
    ];
    for (const p of plans) {
      await prisma.membershipPlan.create({ data: { gymId: gym.id, name: p.name, description: `${p.name} membership`, price: Math.round(p.price), durationDays: p.durationDays, features: ['Full access', 'Locker'], isActive: true } }).catch(() => null);
    }
    await prisma.gymHours.createMany({
      data: [0, 1, 2, 3, 4, 5, 6].map((d) => ({ gymId: gym.id, dayOfWeek: d, openTime: '06:00', closeTime: '22:00', isClosed: d === 0 })),
      skipDuplicates: true,
    });
  }

  // Sample reviews + enquiries + favorites on first approved gym
  const firstApproved = await prisma.gym.findFirst({ where: { status: 'APPROVED' } });
  if (firstApproved) {
    for (const [i, u] of users.slice(0, 3).entries()) {
      await prisma.review.upsert({
        where: { userId_gymId: { userId: u.id, gymId: firstApproved.id } },
        create: { userId: u.id, gymId: firstApproved.id, rating: 5 - i, title: 'Great gym', comment: 'Clean equipment and helpful trainers.' },
        update: {},
      }).catch(() => null);
      await prisma.enquiry.create({ data: { userId: u.id, gymId: firstApproved.id, message: 'I want to know about the monthly membership and timings.' } }).catch(() => null);
      await prisma.favorite.upsert({ where: { userId_gymId: { userId: u.id, gymId: firstApproved.id } }, create: { userId: u.id, gymId: firstApproved.id }, update: {} }).catch(() => null);
    }
  }

  console.log('Seed done. Dev credentials (development only):');
  console.log(' admin@heygym.dev / Password123!');
  console.log(' owner1@heygym.dev / Password123!');
  console.log(' user1@heygym.dev / Password123!');
  void admin;
}

main().then(() => prisma.$disconnect()).catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
