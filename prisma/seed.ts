import {  LoginType, PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// DEFINE YOUR MODULES (Add new modules here)
export enum Module {
  DASHBOARD = "dashboard",
  ORDER = 'order',
  PAYMENT_TRANSACTION = 'payment_transaction',
  VECHICLE_PRICING = "vechicle_pricing",
  WALLET = "wallet",
  COIN = "coin",
  QUIZ = "quiz",

  CUSTOMER_ORDER_CONFIRMATION = "customer_order_confirmation",
  RBAC = "rbac",
  // ** sub modules
  //DESTINATION
  DESTINATION = 'destination',
  // my raider
  MY_RAIDER = "my_raider",
  // Payment_option module
  PAYMENT_METHOD = "payment_method",
  // referral module
  REFERRAL = "referral",
  ADDITIONAL_SERVICES = "additional_services",
  USER_PROFILE = "user_profile",
  // services configuaration
  SERVICE_AREAS = "service_areas",
  VEHICLE_TYPE = 'vehicle_type',
  DELIVERY_TYPE = 'delivery_type',
  POLICIES = 'policies',
  // revenue configuaration
  REVENUE_CONFIGURATION = "revenue_order_config",
  // customer configuaration
  ADDITIONAL_ORDER_SERVICE = 'additionl_order_service',
  ORDER_CONFIRMATION = 'order_confirmation',
  //driver configuaration
  DRIVER_ORDER_COMPETITION = 'driver_order_compitition',
  QUIZZES = 'quizzes',
  // incentive rewards configurations
  DRIVER_INCENTIVE = 'driver_incentive',
  CUSTOMER_REWARDS = 'customer_rewards',
  PROMO_CODE = 'promo_code',


  //  user
  USER_WEB = 'user_web',
  USER = 'user',
  // 
  USER_MOBILE = 'user_mobile',
  // USER = 'user',
  //
  RAIDER_JOIN = "raider_join",
  RAIDER = "raider",
  // user wallet 
  USER_WALLET = "user_wallet",
  RAIDER_WALLET = "raider_wallet",
  // driver wallet

  // finnace reporting // report-and-analytics/kpi-stats
  COIN_STATS = 'coin_stats',
  INCENTIVE_ANALYSIS = 'incentive_analytics',
  KPI_STATS = 'kpi_stats',
  TRANSACTION_STATS = 'transactions_stats',

  // report and analysis
  REPORT_ANALYTICS = "report_analytics",
  REPORT_ANALYTICS_STATS = "report_analytics_stats",
  // live map fleet tacking
  LIVE_MAP = "live_map",
  // support and communication
  CONTACT_INFO = 'contact_info',
  SUPPORT_DISPUTE = 'support_dispute',
  NOTIFICATION = "notification",
  SERVICE_CHAT = 'service_chat',

  // markating engageement
  ADVERTISEMENT = "advertisement",
  DASHBOARD_POPUP = "dashboard_popup",
  // content management
  CONTENT_MANAGEMENT = "content_management",
  FAQ = "faq",
  // order management
  ORDER_PLACEMENT = "order_placement", //order placement
  LIVE_ORDER_TRACKING = 'live_order_tracking',
  ORDER_HISTORY = 'order_history'



}

// DEFINE GRANULAR PERMISSIONS
enum Permission {
  // Basic CRUD
  CREATE = 'create',
  READ = 'read',
  DELETE = 'delete',
  UPDATE = "update",
  ALL = "all",
  JUST_ADMIN = "just_admin",
  GET_ONE = "get_one",

  //  
  // 
  UPDATE_RBAC_ROLE_PERMISSION = "update_rbac_role_permission",
  // ORDER specific granular permissions
  UPDATE_ORDER_STATUS = 'update_order_status',
  GET_ORDER_DETAILS = 'get_order_details',
  ADD_DESTINATION_TO_ORDER = 'add_destination_to_order',
  CANCEL_ORDER = 'cancel_order',
  DECLINE_ORDER = "DECLINE_ORDER",

  // admin
  ORDER_READ_MINE = 'order_read_mine',
  // raider
  ORDER_COMPITITION = "order_compitition",
  ORDER_READ_FEED = "order_read_feed",
  ONLINE_STATUS_UPDATE = "online_status_update",
  // my raider
  READ_ADMIN_MY_RAIDER = 'read_admin_my_raider',
  // coin reedom
  REEDOM_COIN = 'reedom_coin',





  // USER specific
  GET_USER_PROFILE = "get_user_profile",
  UPDATE_USER_PROFILE = 'update_user_profile',
  UPDATE_USER_ROLE = 'update_user_role',
  UPDATE_USER_STATUS = 'update_user_status',

  // TRANSACTION specific
  UPDATE_TRANSACTION_STATUS = 'update_transaction_status',
  UPDATE_TRANSACTION_AMOUNT = 'update_transaction_amount',
  APPROVE_TRANSACTION = 'approve_transaction',
  REFUND_TRANSACTION = 'refund_transaction',


  // 🆕 PAYMENT specific (new module)
  UPDATE_PAYMENT_METHOD = 'update_payment_method',
  PROCESS_PAYMENT = 'process_payment',
  REFUND_PAYMENT = 'refund_payment',

}

// DEFAULT PERMISSIONS FOR EACH ROLE
const ROLE_PERMISSIONS = {
  [UserRole.ADMIN]: [
    // DASBOARD
    { module: Module.DASHBOARD, action: Permission.READ },
    // USER module - full access
    { module: Module.USER, action: Permission.CREATE },
    { module: Module.USER, action: Permission.READ },
    { module: Module.USER, action: Permission.UPDATE },
    { module: Module.USER, action: Permission.UPDATE_USER_PROFILE },
    { module: Module.USER, action: Permission.UPDATE_USER_ROLE },
    { module: Module.USER, action: Permission.UPDATE_USER_STATUS },
    { module: Module.USER, action: Permission.DELETE },
    { module: Module.USER, action: Permission.GET_USER_PROFILE },
    { module: Module.USER_MOBILE, action: Permission.READ },
    { module: Module.USER_WEB, action: Permission.READ },
    // auth module
    { module: Module.PAYMENT_TRANSACTION, action: Permission.CREATE },

    // ORDER module - full access
    { module: Module.ORDER, action: Permission.CREATE },
    { module: Module.ORDER, action: Permission.READ },
    { module: Module.ORDER, action: Permission.UPDATE },
    { module: Module.ORDER, action: Permission.ADD_DESTINATION_TO_ORDER },
    { module: Module.ORDER, action: Permission.ORDER_COMPITITION },
    { module: Module.ORDER, action: Permission.GET_ORDER_DETAILS },
    { module: Module.ORDER, action: Permission.ORDER_READ_MINE },
    { module: Module.ORDER, action: Permission.ORDER_READ_MINE },
    { module: Module.ORDER, action: Permission.ORDER_READ_FEED },
    { module: Module.ORDER, action: Permission.UPDATE_ORDER_STATUS },
    { module: Module.ORDER, action: Permission.DECLINE_ORDER },
    { module: Module.ORDER, action: Permission.CANCEL_ORDER },
    { module: Module.ORDER, action: Permission.DELETE },
    { module: Module.LIVE_ORDER_TRACKING, action: Permission.READ },
    { module: Module.ORDER_HISTORY, action: Permission.READ },
    // RAIDER MODULE - FULL ACCESS
    { module: Module.RAIDER, action: Permission.CREATE },
    { module: Module.RAIDER, action: Permission.READ },
    { module: Module.RAIDER, action: Permission.UPDATE },
    { module: Module.RAIDER, action: Permission.DELETE },
    { module: Module.RAIDER, action: Permission.JUST_ADMIN },
    { module: Module.RAIDER_JOIN, action: Permission.JUST_ADMIN },

    // live map fleet track
    { module: Module.LIVE_MAP, action: Permission.READ },
    // 
    { module: Module.SUPPORT_DISPUTE, action: Permission.CREATE },
    { module: Module.SUPPORT_DISPUTE, action: Permission.READ },
    { module: Module.SUPPORT_DISPUTE, action: Permission.DELETE },
    { module: Module.SUPPORT_DISPUTE, action: Permission.UPDATE },
    { module: Module.SUPPORT_DISPUTE, action: Permission.JUST_ADMIN },
    // 
    { module: Module.ORDER_PLACEMENT, action: Permission.CREATE },
    { module: Module.ORDER_PLACEMENT, action: Permission.READ },
    { module: Module.ORDER_PLACEMENT, action: Permission.DELETE },
    { module: Module.ORDER_PLACEMENT, action: Permission.UPDATE },
    { module: Module.ORDER_PLACEMENT, action: Permission.JUST_ADMIN },
    // 
    { module: Module.REPORT_ANALYTICS, action: Permission.CREATE },
    { module: Module.REPORT_ANALYTICS, action: Permission.READ },
    { module: Module.REPORT_ANALYTICS, action: Permission.DELETE },
    { module: Module.REPORT_ANALYTICS, action: Permission.UPDATE },
    { module: Module.REPORT_ANALYTICS, action: Permission.JUST_ADMIN },
    { module: Module.REPORT_ANALYTICS_STATS, action: Permission.READ },


    //Advertise MODULE
    { module: Module.ADVERTISEMENT, action: Permission.CREATE },
    { module: Module.ADVERTISEMENT, action: Permission.READ },
    { module: Module.ADVERTISEMENT, action: Permission.DELETE },
    { module: Module.ADVERTISEMENT, action: Permission.UPDATE },
    { module: Module.ADVERTISEMENT, action: Permission.JUST_ADMIN },
    //Content mangement module
    { module: Module.CONTENT_MANAGEMENT, action: Permission.CREATE },
    { module: Module.CONTENT_MANAGEMENT, action: Permission.READ },
    { module: Module.CONTENT_MANAGEMENT, action: Permission.DELETE },
    { module: Module.CONTENT_MANAGEMENT, action: Permission.UPDATE },
    //Wallet mangement module
    { module: Module.WALLET, action: Permission.CREATE },
    { module: Module.WALLET, action: Permission.READ },
    { module: Module.WALLET, action: Permission.DELETE },
    { module: Module.WALLET, action: Permission.UPDATE },
    { module: Module.USER_WALLET, action: Permission.READ },
    { module: Module.RAIDER_WALLET, action: Permission.READ },

    //Notification module
    { module: Module.NOTIFICATION, action: Permission.CREATE },
    { module: Module.NOTIFICATION, action: Permission.DELETE },
    { module: Module.NOTIFICATION, action: Permission.UPDATE },

    //Quiz module
    { module: Module.QUIZ, action: Permission.CREATE },
    { module: Module.QUIZ, action: Permission.DELETE },
    { module: Module.QUIZ, action: Permission.UPDATE },
    { module: Module.QUIZ, action: Permission.READ },
    { module: Module.QUIZ, action: Permission.GET_ONE },
    //Coin module
    { module: Module.COIN, action: Permission.CREATE },
    { module: Module.COIN, action: Permission.DELETE },
    { module: Module.COIN, action: Permission.UPDATE },
    { module: Module.COIN, action: Permission.READ },
    { module: Module.COIN, action: Permission.GET_ONE },
    { module: Module.COIN, action: Permission.REEDOM_COIN },
    //Report and  analytiucs module
    { module: Module.REPORT_ANALYTICS, action: Permission.CREATE },
    { module: Module.REPORT_ANALYTICS, action: Permission.DELETE },
    { module: Module.REPORT_ANALYTICS, action: Permission.UPDATE },
    { module: Module.REPORT_ANALYTICS, action: Permission.READ },

    // driver competition module
    { module: Module.DRIVER_ORDER_COMPETITION, action: Permission.CREATE },
    { module: Module.DRIVER_ORDER_COMPETITION, action: Permission.READ },
    { module: Module.DRIVER_ORDER_COMPETITION, action: Permission.DELETE },
    { module: Module.DRIVER_ORDER_COMPETITION, action: Permission.UPDATE },
    // customner confirmation module
    { module: Module.CUSTOMER_ORDER_CONFIRMATION, action: Permission.CREATE },
    { module: Module.CUSTOMER_ORDER_CONFIRMATION, action: Permission.READ },
    { module: Module.CUSTOMER_ORDER_CONFIRMATION, action: Permission.DELETE },
    { module: Module.CUSTOMER_ORDER_CONFIRMATION, action: Permission.UPDATE },

    // SERVICE_AREAS module
    { module: Module.SERVICE_AREAS, action: Permission.CREATE },
    { module: Module.SERVICE_AREAS, action: Permission.READ },
    { module: Module.SERVICE_AREAS, action: Permission.DELETE },
    { module: Module.SERVICE_AREAS, action: Permission.UPDATE },
    { module: Module.SERVICE_AREAS, action: Permission.JUST_ADMIN },

    { module: Module.VEHICLE_TYPE, action: Permission.CREATE },
    { module: Module.VEHICLE_TYPE, action: Permission.READ },
    { module: Module.VEHICLE_TYPE, action: Permission.DELETE },
    { module: Module.VEHICLE_TYPE, action: Permission.UPDATE },
    { module: Module.VEHICLE_TYPE, action: Permission.JUST_ADMIN },

    { module: Module.DELIVERY_TYPE, action: Permission.CREATE },
    { module: Module.DELIVERY_TYPE, action: Permission.READ },
    { module: Module.DELIVERY_TYPE, action: Permission.DELETE },
    { module: Module.DELIVERY_TYPE, action: Permission.UPDATE },
    { module: Module.DELIVERY_TYPE, action: Permission.JUST_ADMIN },

    { module: Module.POLICIES, action: Permission.CREATE },
    { module: Module.POLICIES, action: Permission.READ },
    { module: Module.POLICIES, action: Permission.DELETE },
    { module: Module.POLICIES, action: Permission.UPDATE },
    { module: Module.POLICIES, action: Permission.JUST_ADMIN },

    //REVENUE_CONFIGURATION module
    { module: Module.REVENUE_CONFIGURATION, action: Permission.CREATE },
    { module: Module.REVENUE_CONFIGURATION, action: Permission.DELETE },
    { module: Module.REVENUE_CONFIGURATION, action: Permission.UPDATE },
    { module: Module.REVENUE_CONFIGURATION, action: Permission.READ },


    // driver configuration
    { module: Module.DRIVER_ORDER_COMPETITION, action: Permission.CREATE },
    { module: Module.DRIVER_ORDER_COMPETITION, action: Permission.DELETE },
    { module: Module.DRIVER_ORDER_COMPETITION, action: Permission.UPDATE },
    { module: Module.DRIVER_ORDER_COMPETITION, action: Permission.READ },
    // quiezz
    { module: Module.QUIZZES, action: Permission.CREATE },
    { module: Module.QUIZZES, action: Permission.DELETE },
    { module: Module.QUIZZES, action: Permission.UPDATE },
    { module: Module.QUIZZES, action: Permission.READ },
    { module: Module.QUIZZES, action: Permission.GET_ONE },
    // customer configuaration
    { module: Module.CUSTOMER_ORDER_CONFIRMATION, action: Permission.CREATE },
    { module: Module.CUSTOMER_ORDER_CONFIRMATION, action: Permission.DELETE },
    { module: Module.CUSTOMER_ORDER_CONFIRMATION, action: Permission.UPDATE },
    { module: Module.CUSTOMER_ORDER_CONFIRMATION, action: Permission.READ },
    // additional order services
    { module: Module.ADDITIONAL_ORDER_SERVICE, action: Permission.CREATE },
    { module: Module.ADDITIONAL_ORDER_SERVICE, action: Permission.DELETE },
    { module: Module.ADDITIONAL_ORDER_SERVICE, action: Permission.UPDATE },
    { module: Module.ADDITIONAL_ORDER_SERVICE, action: Permission.READ },
    // incentive
    { module: Module.DRIVER_INCENTIVE, action: Permission.CREATE },
    { module: Module.DRIVER_INCENTIVE, action: Permission.DELETE },
    { module: Module.DRIVER_INCENTIVE, action: Permission.UPDATE },
    { module: Module.DRIVER_INCENTIVE, action: Permission.READ },
    // CUSTOMER_REWARDS
    { module: Module.CUSTOMER_REWARDS, action: Permission.CREATE },
    { module: Module.CUSTOMER_REWARDS, action: Permission.DELETE },
    { module: Module.CUSTOMER_REWARDS, action: Permission.UPDATE },
    { module: Module.CUSTOMER_REWARDS, action: Permission.READ },
    //
    { module: Module.PROMO_CODE, action: Permission.CREATE },
    { module: Module.PROMO_CODE, action: Permission.DELETE },
    { module: Module.PROMO_CODE, action: Permission.UPDATE },
    { module: Module.PROMO_CODE, action: Permission.READ },

    // Destination module - full access
    { module: Module.DESTINATION, action: Permission.CREATE },
    { module: Module.DESTINATION, action: Permission.READ },
    { module: Module.DESTINATION, action: Permission.UPDATE },
    { module: Module.DESTINATION, action: Permission.DELETE },
    { module: Module.DESTINATION, action: Permission.JUST_ADMIN },
    // TRANSACTION module - full access
    { module: Module.PAYMENT_TRANSACTION, action: Permission.CREATE },
    { module: Module.PAYMENT_TRANSACTION, action: Permission.READ },
    { module: Module.PAYMENT_TRANSACTION, action: Permission.UPDATE_TRANSACTION_STATUS },
    { module: Module.PAYMENT_TRANSACTION, action: Permission.UPDATE_TRANSACTION_AMOUNT },
    { module: Module.PAYMENT_TRANSACTION, action: Permission.APPROVE_TRANSACTION },
    { module: Module.PAYMENT_TRANSACTION, action: Permission.REFUND_TRANSACTION },
    { module: Module.PAYMENT_TRANSACTION, action: Permission.DELETE },


    // MY RAIDER MODULE
    { module: Module.MY_RAIDER, action: Permission.CREATE },
    { module: Module.MY_RAIDER, action: Permission.READ },
    { module: Module.MY_RAIDER, action: Permission.DELETE },
    { module: Module.MY_RAIDER, action: Permission.UPDATE },
    { module: Module.MY_RAIDER, action: Permission.READ_ADMIN_MY_RAIDER },

    // MY REFERAL MODULE
    { module: Module.REFERRAL, action: Permission.CREATE },
    { module: Module.REFERRAL, action: Permission.READ },
    { module: Module.REFERRAL, action: Permission.DELETE },
    { module: Module.REFERRAL, action: Permission.UPDATE },
    //  faq
    { module: Module.FAQ, action: Permission.CREATE },
    { module: Module.FAQ, action: Permission.READ },
    { module: Module.FAQ, action: Permission.DELETE },
    { module: Module.FAQ, action: Permission.UPDATE },
    // dashbard popup
    { module: Module.DASHBOARD_POPUP, action: Permission.CREATE },
    { module: Module.DASHBOARD_POPUP, action: Permission.READ },
    { module: Module.DASHBOARD_POPUP, action: Permission.DELETE },
    { module: Module.DASHBOARD_POPUP, action: Permission.UPDATE },
    // service chat
    { module: Module.SERVICE_CHAT, action: Permission.CREATE },
    { module: Module.SERVICE_CHAT, action: Permission.READ },
    { module: Module.SERVICE_CHAT, action: Permission.DELETE },
    { module: Module.SERVICE_CHAT, action: Permission.UPDATE },
    { module: Module.SERVICE_CHAT, action: Permission.ALL },
    // contact info
    { module: Module.CONTACT_INFO, action: Permission.CREATE },
    { module: Module.CONTACT_INFO, action: Permission.READ },
    { module: Module.CONTACT_INFO, action: Permission.DELETE },
    { module: Module.CONTACT_INFO, action: Permission.UPDATE },

    // RBAC MODULE
    { module: Module.RBAC, action: Permission.CREATE },
    { module: Module.RBAC, action: Permission.READ },
    { module: Module.RBAC, action: Permission.DELETE },
    { module: Module.RBAC, action: Permission.READ },
    { module: Module.RBAC, action: Permission.UPDATE_RBAC_ROLE_PERMISSION },
    { module: Module.DESTINATION, action: Permission.ALL },

    // additional services and dashboard popup
    { module: Module.ADDITIONAL_SERVICES, action: Permission.CREATE },
    { module: Module.ADDITIONAL_SERVICES, action: Permission.READ },
    { module: Module.ADDITIONAL_SERVICES, action: Permission.DELETE },
    { module: Module.ADDITIONAL_SERVICES, action: Permission.UPDATE },
    // user profile
    { module: Module.USER_PROFILE, action: Permission.CREATE },
    { module: Module.USER_PROFILE, action: Permission.READ },
    { module: Module.USER_PROFILE, action: Permission.DELETE },
    { module: Module.USER_PROFILE, action: Permission.UPDATE },
    // coin stats
    { module: Module.COIN_STATS, action: Permission.CREATE },
    { module: Module.COIN_STATS, action: Permission.READ },
    { module: Module.COIN_STATS, action: Permission.UPDATE },
    { module: Module.COIN_STATS, action: Permission.DELETE },
    // 
    { module: Module.INCENTIVE_ANALYSIS, action: Permission.CREATE },
    { module: Module.INCENTIVE_ANALYSIS, action: Permission.READ },
    { module: Module.INCENTIVE_ANALYSIS, action: Permission.UPDATE },
    { module: Module.INCENTIVE_ANALYSIS, action: Permission.DELETE },
    // 
    { module: Module.KPI_STATS, action: Permission.CREATE },
    { module: Module.KPI_STATS, action: Permission.READ },
    { module: Module.KPI_STATS, action: Permission.UPDATE },
    { module: Module.KPI_STATS, action: Permission.DELETE },
    //
    { module: Module.TRANSACTION_STATS, action: Permission.CREATE },
    { module: Module.TRANSACTION_STATS, action: Permission.READ },
    { module: Module.TRANSACTION_STATS, action: Permission.UPDATE },
    { module: Module.TRANSACTION_STATS, action: Permission.DELETE },


  ],

  [UserRole.RAIDER]: [
    // User module - limited access
    { module: Module.USER, action: Permission.GET_USER_PROFILE },
    { module: Module.USER, action: Permission.UPDATE },
    // Order module - limited access
    { module: Module.ORDER, action: Permission.GET_ORDER_DETAILS },
    { module: Module.ORDER, action: Permission.UPDATE_ORDER_STATUS },
    { module: Module.ORDER, action: Permission.ORDER_COMPITITION },
    { module: Module.ORDER, action: Permission.ORDER_READ_FEED },
    { module: Module.ORDER, action: Permission.DECLINE_ORDER },
    { module: Module.ORDER, action: Permission.ORDER_READ_MINE },
    // MY REFERAL MODULE  -- - limited access
    { module: Module.REFERRAL, action: Permission.CREATE },
    { module: Module.REFERRAL, action: Permission.READ },
    { module: Module.REFERRAL, action: Permission.DELETE },
    { module: Module.REFERRAL, action: Permission.UPDATE },
    // RAIDER MODULE -- - limited access
    { module: Module.RAIDER, action: Permission.CREATE },
    { module: Module.RAIDER, action: Permission.READ },
    { module: Module.RAIDER, action: Permission.UPDATE },
    { module: Module.RAIDER, action: Permission.ONLINE_STATUS_UPDATE },
    { module: Module.RAIDER, action: Permission.ORDER_READ_FEED },
    // Advertise MODULE
    { module: Module.ADVERTISEMENT, action: Permission.READ },
    // notification
    { module: Module.NOTIFICATION, action: Permission.READ },
    { module: Module.NOTIFICATION, action: Permission.DELETE },
    // qize module
    { module: Module.QUIZZES, action: Permission.GET_ONE },
    { module: Module.QUIZ, action: Permission.GET_ONE },
    // wallet module
    { module: Module.WALLET, action: Permission.READ },
    // faq
    { module: Module.FAQ, action: Permission.READ },
    // content management
    { module: Module.CONTENT_MANAGEMENT, action: Permission.READ },
    // policies
    { module: Module.POLICIES, action: Permission.READ },
    // 
    { module: Module.DRIVER_INCENTIVE, action: Permission.READ },
    // additional servics
    { module: Module.ADDITIONAL_ORDER_SERVICE, action: Permission.READ },
    // user profile
    { module: Module.USER_PROFILE, action: Permission.CREATE },
    { module: Module.USER_PROFILE, action: Permission.READ },
    { module: Module.USER_PROFILE, action: Permission.DELETE },
    { module: Module.USER_PROFILE, action: Permission.UPDATE },
    // 
    { module: Module.DASHBOARD_POPUP, action: Permission.READ },
    // 
    { module: Module.SERVICE_CHAT, action: Permission.ALL },
    // 
    { module: Module.CONTACT_INFO, action: Permission.READ },


  ],




  [UserRole.USER]: [
    // User module - basic access
    { module: Module.USER, action: Permission.GET_USER_PROFILE },
    { module: Module.USER, action: Permission.UPDATE },
    //  Order module - basic access
    { module: Module.ORDER, action: Permission.CREATE },
    { module: Module.ORDER, action: Permission.ORDER_READ_MINE },
    { module: Module.ORDER, action: Permission.ADD_DESTINATION_TO_ORDER },
    { module: Module.ORDER, action: Permission.GET_ORDER_DETAILS },
    { module: Module.ORDER, action: Permission.UPDATE_ORDER_STATUS },
    // Advertise MODULE
    { module: Module.ADVERTISEMENT, action: Permission.READ },
    // notification
    { module: Module.NOTIFICATION, action: Permission.READ },
    { module: Module.NOTIFICATION, action: Permission.DELETE },
    { module: Module.USER, action: Permission.GET_USER_PROFILE },
    { module: Module.USER, action: Permission.UPDATE },
    //  Order module - basic access
    { module: Module.ORDER, action: Permission.CREATE },
    { module: Module.ORDER, action: Permission.ORDER_READ_MINE },
    { module: Module.ORDER, action: Permission.ORDER_READ_FEED },
    { module: Module.ORDER, action: Permission.ADD_DESTINATION_TO_ORDER },
    { module: Module.ORDER, action: Permission.GET_ORDER_DETAILS },
    { module: Module.ORDER, action: Permission.UPDATE_ORDER_STATUS },
    // Advertise MODULE
    { module: Module.ADVERTISEMENT, action: Permission.READ },
    // notification
    { module: Module.NOTIFICATION, action: Permission.READ },
    // 
    { module: Module.CONTENT_MANAGEMENT, action: Permission.READ },
    // user profile
    { module: Module.USER_PROFILE, action: Permission.CREATE },
    { module: Module.USER_PROFILE, action: Permission.READ },
    { module: Module.USER_PROFILE, action: Permission.DELETE },
    { module: Module.USER_PROFILE, action: Permission.UPDATE },

    //sub module
    // Destination module - basic access
    { module: Module.DESTINATION, action: Permission.ALL },
    // my raider module - basic access
    { module: Module.MY_RAIDER, action: Permission.CREATE },
    { module: Module.MY_RAIDER, action: Permission.READ },
    { module: Module.MY_RAIDER, action: Permission.DELETE },
    { module: Module.MY_RAIDER, action: Permission.UPDATE },
    //PAYMENT_METHOD - full access
    { module: Module.PAYMENT_METHOD, action: Permission.ALL },

    // MY REFERAL MODULE - basic access
    { module: Module.REFERRAL, action: Permission.CREATE },
    { module: Module.REFERRAL, action: Permission.READ },
    { module: Module.REFERRAL, action: Permission.DELETE },
    { module: Module.REFERRAL, action: Permission.UPDATE },
    // coin module
    { module: Module.CUSTOMER_REWARDS, action: Permission.REEDOM_COIN },
    // additional servics
    { module: Module.ADDITIONAL_ORDER_SERVICE, action: Permission.READ },
    // 
    { module: Module.FAQ, action: Permission.READ },
    // addtional services
    { module: Module.PROMO_CODE, action: Permission.READ },
    // 
    { module: Module.DASHBOARD_POPUP, action: Permission.READ },
    //
    { module: Module.SERVICE_CHAT, action: Permission.ALL },
    // 
    { module: Module.CONTACT_INFO, action: Permission.READ },
  ],
};

// SYNC PERMISSIONS FOR EXISTING ROLES
// (Run this to update permissions for existing roles)
async function syncPermissionsForExistingRoles() {
  console.log('🔄 Syncing permissions for existing roles...\n');

  const roles = await prisma.role.findMany({
    where: {
      name: {
        in: [UserRole.ADMIN, UserRole.USER, UserRole.RAIDER],
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


// INITIAL SEED (First time setup)
async function initialSeed() {
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD;
  const superAdminUsername = "admin";
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
        name: UserRole.ADMIN,
        isStatic: true,
        permissions: {
          create: ROLE_PERMISSIONS[UserRole.ADMIN],
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
        roles: {
          connect: { id: superAdminRole.id }
        },
        regi_status: LoginType.ADMIN_SIGNIN
      },
    });
    console.log(`✅ User created: ${user.email}`);

    // 5️⃣ Create admin entry
    const admin = await tx.admin.create({
      data: {
        email: superAdminEmail,
        userId: user.id,
        password: hashed,
        role_id: superAdminRole.id,
        phone_number: user.phone,
        first_name: user.username,
      },
    });
    console.log(`✅ Admin created: ${admin.email}\n`);

    // 6 Create default Driver Order Competition Config
    const driverCompititionConfig = await tx.driver_order_competition.create({
      data: {
        rank_weight: 40,
        rating_weight: 30,
        followers_weight: 30,
        total_weights: 100,
        max_users_to_join: 5,
        challenges_timeout: 8
      },
    });
    console.log(`✅ Driver Order Competition Config seeded: ${driverCompititionConfig.id}\n`);
    // 7 customer order confirmation config
    const customerOrderConfirmationConfig = await tx.customer_order_confirmation.create({
      data: {
        is_new_customer_weight: 50,
        completed_orders_weight: 0,
        followers_weight: 50,
      },
    });
    console.log(`✅ Customer Order Confirmation Config seeded: ${customerOrderConfirmationConfig.id}\n`);
    // delivery type seed
    // const deliveryTypes = await tx.deliveryType.createMany({
    //   data: [
    //     {
    //       name: DeliveryTypeName.EXPRESS,
    //       percentage: 10,
    //       pickup_duration: 75,
    //       delivery_duration: 90,
    //       is_active: true,
    //       admin_id: admin.id
    //     },
    //     {
    //       name: DeliveryTypeName.STACKED,
    //       percentage: 5,
    //       pickup_duration: 95,
    //       delivery_duration: 130,
    //       is_active: true,
    //       admin_id: admin.id
    //     },
    //     {
    //       name: DeliveryTypeName.STANDARD,
    //       percentage: 2,
    //       pickup_duration: 275,
    //       delivery_duration: 290,
    //       is_active: true,
    //       admin_id: admin.id
    //     }
    //   ]
    // })
    // console.log(`✅ Delivery type Config seeded: ${deliveryTypes.count}\n`);
    // 
    return {
      roles: [superAdminRole, userRole, raiderRole],
      user,
      admin,
      driverCompititionConfig,
      customerOrderConfirmationConfig,
      deliveryType: []
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

// MAIN FUNCTION - Smart Seeding
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