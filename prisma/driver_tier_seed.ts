import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedDriverTiers() {
  console.log('🌱 Seeding Driver Tiers...');

  const tiers = [
    {
      name: 'Bronze',
      code: 'BRONZE',
      priorityScore: 1.0,
      description: 'Default tier for new drivers',
      minOrders: 0,
      minRating: 0,
      maxCancellationRate: 100,
      requiresBranding: false,
      isInvitationOnly: false,
    },
    {
      name: 'Silver',
      code: 'SILVER',
      priorityScore: 1.2,
      description: '100+ orders with good performance',
      minOrders: 100,
      minRating: 4.6,
      maxCancellationRate: 5,
      requiresBranding: false,
      isInvitationOnly: false,
    },
    {
      name: 'Gold',
      code: 'GOLD',
      priorityScore: 1.5,
      description: 'High priority drivers with branding',
      minOrders: 300,
      minRating: 4.7,
      maxCancellationRate: 3,
      requiresBranding: true,
      isInvitationOnly: false,
    },
    {
      name: 'Platinum',
      code: 'PLATINUM',
      priorityScore: 2.0,
      description: 'Elite drivers (invitation only)',
      minOrders: 2000,
      minRating: 4.85,
      maxCancellationRate: 2,
      requiresBranding: true,
      isInvitationOnly: true,
    },
  ];

  for (const tier of tiers) {
    await prisma.driverTier.upsert({
      where: { code: tier.code },
      update: {
        name: tier.name,
        priorityScore: tier.priorityScore,
        description: tier.description,
        minOrders: tier.minOrders,
        minRating: tier.minRating,
        maxCancellationRate: tier.maxCancellationRate,
        requiresBranding: tier.requiresBranding,
        isInvitationOnly: tier.isInvitationOnly,
        isActive: true,
      },
      create: {
        ...tier,
        isActive: true,
      },
    });

    console.log(`✅ ${tier.name} tier ready`);
  }

  console.log('🎉 Driver tiers seeded successfully!');
}

