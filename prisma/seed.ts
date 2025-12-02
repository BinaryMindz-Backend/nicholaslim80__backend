import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD;
  const superAdminUsername = process.env.SUPER_ADMIN_USERNAME || "superadmin";
  const superAdminPhone = process.env.SUPER_ADMIN_PHONE || "+8801000000000";

  if (!superAdminEmail || !superAdminPassword) {
    throw new Error("❌ SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD must be set in .env");
  }

  // Check if admin already exists
  const existing = await prisma.user.findUnique({
    where: { email: superAdminEmail },
  });

  if (existing) {
    console.log("⚠️ Super admin already exists. Skipping seed.");
    return;
  }

  const hashed = await bcrypt.hash(superAdminPassword, 10);

  // ✅ Use Prisma Transaction
  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: superAdminEmail,
        username: superAdminUsername,
        phone: superAdminPhone,
        password: hashed,
        role: "SUPER_ADMIN",
        is_verified: true,
        is_active: true,
      },
    });

    const admin = await tx.admin.create({
      data: {
        email: superAdminEmail,
        userId: user.id,
        password: hashed,
        role:UserRole.SUPER_ADMIN,
        phone_number: user.phone,
        first_name:user?.username,
        
      },
    });


    return { user, admin };
  });

  console.log("✅ Super Admin created successfully:", result);
}

main()
  .catch((e) => {
    console.error("❌ Seeding Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
