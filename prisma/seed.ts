import { PrismaClient, AdminRole, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// ============================================
// DEFINE YOUR MODULES (Add new modules here)
// ============================================
enum Module {
  USER = 'user',
  ORDER = 'order',
  TRANSACTION = 'transaction',
  SERVICES = 'services',
  // 🆕 Add new modules here
  PAYMENT = 'payment',
  PRODUCT = 'product',
  INVENTORY = 'inventory',
}

// ============================================
// DEFINE GRANULAR PERMISSIONS
// ============================================
enum Permission {
  // Basic CRUD
  CREATE = 'create',
  READ = 'read',
  DELETE = 'delete',
  
  // USER specific
  UPDATE_USER_PROFILE = 'update_user_profile',
  UPDATE_USER_ROLE = 'update_user_role',
  UPDATE_USER_STATUS = 'update_user_status',
  
  // ORDER specific
  UPDATE_ORDER_STATUS = 'update_order_status',
  UPDATE_ORDER_DETAILS = 'update_order_details',
  UPDATE_ORDER_PRICE = 'update_order_price',
  CANCEL_ORDER = 'cancel_order',
  
  // TRANSACTION specific
  UPDATE_TRANSACTION_STATUS = 'update_transaction_status',
  UPDATE_TRANSACTION_AMOUNT = 'update_transaction_amount',
  APPROVE_TRANSACTION = 'approve_transaction',
  REFUND_TRANSACTION = 'refund_transaction',
  
  // SERVICES specific
  UPDATE_SERVICE_DETAILS = 'update_service_details',
  UPDATE_SERVICE_PRICING = 'update_service_pricing',
  UPDATE_SERVICE_STATUS = 'update_service_status',

  // 🆕 PAYMENT specific (new module)
  UPDATE_PAYMENT_METHOD = 'update_payment_method',
  PROCESS_PAYMENT = 'process_payment',
  REFUND_PAYMENT = 'refund_payment',

  // 🆕 PRODUCT specific (new module)
  UPDATE_PRODUCT_DETAILS = 'update_product_details',
  UPDATE_PRODUCT_PRICE = 'update_product_price',
  UPDATE_PRODUCT_STATUS = 'update_product_status',

  // 🆕 INVENTORY specific (new module)
  UPDATE_INVENTORY_STOCK = 'update_inventory_stock',
  ADJUST_INVENTORY = 'adjust_inventory',
}

// ============================================
// DEFAULT PERMISSIONS FOR EACH ROLE
// ============================================
const ROLE_PERMISSIONS = {
  [UserRole.SUPER_ADMIN]: [
    // USER module - full access
    { module: Module.USER, action: Permission.CREATE },
    { module: Module.USER, action: Permission.READ },
    { module: Module.USER, action: Permission.UPDATE_USER_PROFILE },
    { module: Module.USER, action: Permission.UPDATE_USER_ROLE },
    { module: Module.USER, action: Permission.UPDATE_USER_STATUS },
    { module: Module.USER, action: Permission.DELETE },
    
    // ORDER module - full access
    { module: Module.ORDER, action: Permission.CREATE },
    { module: Module.ORDER, action: Permission.READ },
    { module: Module.ORDER, action: Permission.UPDATE_ORDER_STATUS },
    { module: Module.ORDER, action: Permission.UPDATE_ORDER_DETAILS },
    { module: Module.ORDER, action: Permission.UPDATE_ORDER_PRICE },
    { module: Module.ORDER, action: Permission.CANCEL_ORDER },
    { module: Module.ORDER, action: Permission.DELETE },
    
    // TRANSACTION module - full access
    { module: Module.TRANSACTION, action: Permission.CREATE },
    { module: Module.TRANSACTION, action: Permission.READ },
    { module: Module.TRANSACTION, action: Permission.UPDATE_TRANSACTION_STATUS },
    { module: Module.TRANSACTION, action: Permission.UPDATE_TRANSACTION_AMOUNT },
    { module: Module.TRANSACTION, action: Permission.APPROVE_TRANSACTION },
    { module: Module.TRANSACTION, action: Permission.REFUND_TRANSACTION },
    { module: Module.TRANSACTION, action: Permission.DELETE },
    
    // SERVICES module - full access
    { module: Module.SERVICES, action: Permission.CREATE },
    { module: Module.SERVICES, action: Permission.READ },
    { module: Module.SERVICES, action: Permission.UPDATE_SERVICE_DETAILS },
    { module: Module.SERVICES, action: Permission.UPDATE_SERVICE_PRICING },
    { module: Module.SERVICES, action: Permission.UPDATE_SERVICE_STATUS },
    { module: Module.SERVICES, action: Permission.DELETE },

    // 🆕 PAYMENT module - full access
    { module: Module.PAYMENT, action: Permission.CREATE },
    { module: Module.PAYMENT, action: Permission.READ },
    { module: Module.PAYMENT, action: Permission.UPDATE_PAYMENT_METHOD },
    { module: Module.PAYMENT, action: Permission.PROCESS_PAYMENT },
    { module: Module.PAYMENT, action: Permission.REFUND_PAYMENT },
    { module: Module.PAYMENT, action: Permission.DELETE },

    // 🆕 PRODUCT module - full access
    { module: Module.PRODUCT, action: Permission.CREATE },
    { module: Module.PRODUCT, action: Permission.READ },
    { module: Module.PRODUCT, action: Permission.UPDATE_PRODUCT_DETAILS },
    { module: Module.PRODUCT, action: Permission.UPDATE_PRODUCT_PRICE },
    { module: Module.PRODUCT, action: Permission.UPDATE_PRODUCT_STATUS },
    { module: Module.PRODUCT, action: Permission.DELETE },

    // 🆕 INVENTORY module - full access
    { module: Module.INVENTORY, action: Permission.CREATE },
    { module: Module.INVENTORY, action: Permission.READ },
    { module: Module.INVENTORY, action: Permission.UPDATE_INVENTORY_STOCK },
    { module: Module.INVENTORY, action: Permission.ADJUST_INVENTORY },
    { module: Module.INVENTORY, action: Permission.DELETE },
  ],
  
  [UserRole.RAIDER]: [
    // ORDER module - limited access
    { module: Module.ORDER, action: Permission.CREATE },
    { module: Module.ORDER, action: Permission.READ },
    { module: Module.ORDER, action: Permission.UPDATE_ORDER_STATUS },
    
    // SERVICES module - read only
    { module: Module.SERVICES, action: Permission.READ },

    // 🆕 INVENTORY module - read and update stock
    { module: Module.INVENTORY, action: Permission.READ },
    { module: Module.INVENTORY, action: Permission.UPDATE_INVENTORY_STOCK },
  ],
  
  [UserRole.USER]: [
    // ORDER module - basic access
    { module: Module.ORDER, action: Permission.CREATE },
    { module: Module.ORDER, action: Permission.READ },
    
    // SERVICES module - read only
    { module: Module.SERVICES, action: Permission.READ },

    // 🆕 PRODUCT module - read only
    { module: Module.PRODUCT, action: Permission.READ },
  ],
};

// ============================================
// SYNC PERMISSIONS FOR EXISTING ROLES
// (Run this to update permissions for existing roles)
// ============================================
async function syncPermissionsForExistingRoles() {
  console.log('🔄 Syncing permissions for existing roles...\n');

  const roles = await prisma.role.findMany({
    where: {
      name: {
        in: [UserRole.SUPER_ADMIN, UserRole.USER, UserRole.RAIDER],
      },
    },
    include: {
      permissions: true,
    },
  });

  for (const role of roles) {
    const expectedPermissions = ROLE_PERMISSIONS[role.name as UserRole];
    
    if (!expectedPermissions) {
      console.log(`⚠️  No permissions defined for role: ${role.name}`);
      continue;
    }

    // Get current permission keys
    const currentPermKeys = role.permissions.map(p => `${p.module}:${p.action}`);
    const expectedPermKeys = expectedPermissions.map(p => `${p.module}:${p.action}`);

    // Find new permissions to add
    const newPermissions = expectedPermissions.filter(
      ep => !currentPermKeys.includes(`${ep.module}:${ep.action}`)
    );

    // Find old permissions to remove (optional - if you want to remove deprecated permissions)
    const permissionsToRemove = role.permissions.filter(
      cp => !expectedPermKeys.includes(`${cp.module}:${cp.action}`)
    );

    if (newPermissions.length === 0 && permissionsToRemove.length === 0) {
      console.log(`✅ ${role.name}: Already up to date (${role.permissions.length} permissions)`);
      continue;
    }

    await prisma.$transaction(async (tx) => {
      // Add new permissions
      if (newPermissions.length > 0) {
        await tx.rolePermission.createMany({
          data: newPermissions.map((perm) => ({
            roleId: role.id,
            module: perm.module,
            action: perm.action,
          })),
        });
        console.log(`   ➕ Added ${newPermissions.length} new permissions`);
      }

      // Remove old permissions (optional)
      if (permissionsToRemove.length > 0) {
        await tx.rolePermission.deleteMany({
          where: {
            id: {
              in: permissionsToRemove.map(p => p.id),
            },
          },
        });
        console.log(`   ➖ Removed ${permissionsToRemove.length} old permissions`);
      }
    });

    const updatedCount = role.permissions.length + newPermissions.length - permissionsToRemove.length;
    console.log(`✅ ${role.name}: Updated to ${updatedCount} permissions\n`);
  }

  console.log('🎉 Permission sync completed!\n');
}

// ============================================
// INITIAL SEED (First time setup)
// ============================================
async function initialSeed() {
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD;
  const superAdminUsername = process.env.SUPER_ADMIN_USERNAME || "superadmin";
  const superAdminPhone = process.env.SUPER_ADMIN_PHONE || "+8801000000000";

  if (!superAdminEmail || !superAdminPassword) {
    throw new Error("❌ SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD must be set in .env");
  }

  console.log('🌱 Starting initial database seed...\n');

  // Check if admin already exists
  const existing = await prisma.user.findUnique({
    where: { email: superAdminEmail },
  });

  if (existing) {
    console.log("⚠️  Super admin already exists.");
    return false; // Return false to indicate seed was skipped
  }

  const hashed = await bcrypt.hash(superAdminPassword, 10);

  // ✅ Use Prisma Transaction
  const result = await prisma.$transaction(async (tx) => {
    console.log('📝 Creating roles with permissions...\n');

    // 1️⃣ Create SUPER_ADMIN role with full permissions
    const superAdminRole = await tx.role.create({
      data: {
        name: UserRole.SUPER_ADMIN,
        isStatic: true,
        permissions: {
          create: ROLE_PERMISSIONS[UserRole.SUPER_ADMIN],
        },
      },
      include: {
        permissions: true,
      },
    });
    console.log(`✅ ${superAdminRole.name} role created with ${superAdminRole.permissions.length} permissions`);

    // 2️⃣ Create USER role with basic permissions
    const userRole = await tx.role.create({
      data: {
        name: UserRole.USER,
        isStatic: true,
        permissions: {
          create: ROLE_PERMISSIONS[UserRole.USER],
        },
      },
      include: {
        permissions: true,
      },
    });
    console.log(`✅ ${userRole.name} role created with ${userRole.permissions.length} permissions`);

    // 3️⃣ Create RAIDER role with limited permissions
    const raiderRole = await tx.role.create({
      data: {
        name: UserRole.RAIDER,
        isStatic: true,
        permissions: {
          create: ROLE_PERMISSIONS[UserRole.RAIDER],
        },
      },
      include: {
        permissions: true,
      },
    });
    console.log(`✅ ${raiderRole.name} role created with ${raiderRole.permissions.length} permissions\n`);

    console.log('👤 Creating super admin user...');

    // 4️⃣ Create super admin user
    const user = await tx.user.create({
      data: {
        email: superAdminEmail,
        username: superAdminUsername,
        phone: superAdminPhone,
        password: hashed,
        is_verified: true,
        is_active: true,
        roleId: superAdminRole.id,
      },
    });
    console.log(`✅ User created: ${user.email}`);

    // 5️⃣ Create admin entry
    const admin = await tx.admin.create({
      data: {
        email: superAdminEmail,
        userId: user.id,
        password: hashed,
        role: AdminRole.SUPER_ADMIN,
        phone_number: user.phone,
        first_name: user.username,
      },
    });
    console.log(`✅ Admin created: ${admin.email}\n`);

    return {
      roles: [superAdminRole, userRole, raiderRole],
      user,
      admin,
    };
  });

  // Print summary
  console.log('🎉 Initial seed completed successfully!\n');
  console.log('📊 Summary:');
  console.log(`   Roles created: ${result.roles.length}`);
  console.log(`   Total permissions: ${result.roles.reduce((sum, role) => sum + role.permissions.length, 0)}`);
  console.log(`   Super Admin: ${result.user.email}\n`);
  console.log('🔐 Login credentials:');
  console.log(`   Email: ${superAdminEmail}`);
  console.log(`   Password: ${superAdminPassword}\n`);

  return true; // Return true to indicate seed was successful
}

// ============================================
// MAIN FUNCTION - Smart Seeding
// ============================================
async function main() {
  // Check if this is first time or update
  const existingRoles = await prisma.role.count();

  if (existingRoles === 0) {
    // First time - run initial seed
    await initialSeed();
  } else {
    // Roles exist - sync permissions for new modules
    console.log('📦 Roles already exist. Running permission sync...\n');
    await syncPermissionsForExistingRoles();
  }
}

main()
  .catch((e) => {
    console.error("❌ Seeding Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

// ============================================
// HOW TO USE THIS SEED STRATEGY
// ============================================
/*
SCENARIO 1: First Time Setup
-----------------------------
npx prisma db seed

Output:
🌱 Starting initial database seed...
📝 Creating roles with permissions...
✅ SUPER_ADMIN role created with 48 permissions
✅ USER role created with 4 permissions
✅ RAIDER role created with 6 permissions


SCENARIO 2: Adding New Module (PAYMENT, PRODUCT, INVENTORY)
------------------------------------------------------------
1. Add new module to Module enum
2. Add new permissions to Permission enum
3. Add permissions to ROLE_PERMISSIONS object
4. Run: npx prisma db seed

Output:
📦 Roles already exist. Running permission sync...

🔄 Syncing permissions for existing roles...

   ➕ Added 6 new permissions (PAYMENT module)
✅ SUPER_ADMIN: Updated to 48 permissions

   ➕ Added 0 new permissions
✅ USER: Updated to 4 permissions

   ➕ Added 2 new permissions (INVENTORY module)
✅ RAIDER: Updated to 6 permissions

🎉 Permission sync completed!


SCENARIO 3: Reset Everything
-----------------------------
npx prisma migrate reset

This will:
1. Drop database
2. Run migrations
3. Run seed (initial seed)


SCENARIO 4: Manual Permission Sync Script
------------------------------------------
Create a separate file: src/scripts/sync-permissions.ts

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Import syncPermissionsForExistingRoles function
// Run it

Then run: ts-node src/scripts/sync-permissions.ts
*/

// ============================================
// ALTERNATIVE: Environment Variable Based Seeding
// ============================================
/*
// In your .env file
SEED_MODE=sync  # or "initial"

// In seed file
async function main() {
  const seedMode = process.env.SEED_MODE || 'auto';

  if (seedMode === 'initial') {
    await initialSeed();
  } else if (seedMode === 'sync') {
    await syncPermissionsForExistingRoles();
  } else {
    // Auto-detect
    const existingRoles = await prisma.role.count();
    if (existingRoles === 0) {
      await initialSeed();
    } else {
      await syncPermissionsForExistingRoles();
    }
  }
}

// Run with:
SEED_MODE=sync npx prisma db seed
*/