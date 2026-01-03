export enum Module {
  DASHBOARD="dashboard",
  USER = 'user',
  RAIDER = "raider",
  ORDER = 'order',
  SUPPORT_DISPUTE = 'support_dispute',
  PAYMENT_TRANSACTION = 'payment_transaction',
  LIVE_MAP = "live_map",
  NOTIFICATION = "notification",
  REPORT_ANALYTICS = "report_analytics",
  VECHICLE_PRICING = "vechicle_pricing",
  WALLET = "wallet",
  COIN = "coin",
  QUIZ = "quiz",
  ADVERTISEMENT = "advertisement",
  PLATFORM_FEE = "platform_fee",
  CONTENT_MANAGEMENT = "content_management",
  DRIVER_ORDER_COMPETITION = "driver_order_competition",
  CUSTOMER_ORDER_CONFIRMATION = "customer_order_confirmation",
  ORDER_PLACEMENT = "order_placement",
  RBAC = "rbac",
  //DESTINATION
  DESTINATION = 'destination',
  // my raider
  MY_RAIDER = "my_raider",
  // Payment_option module
  PAYMENT_METHOD = "payment_method",
  // referral module
  REFERRAL = "referral",



}

// Granular permissions with specific actions
export enum Permission {
  // Basic CRUD
  CREATE = 'create',
  READ = 'read',
  DELETE = 'delete',
  UPDATE = "update",
  ALL = "all",
  JUST_ADMIN = "just_admin",
  GET_ONE = "get_one",


  // RBAC UPDATE
  UPDATE_RBAC_ROLE_PERMISSION = "update_rbac_role_permission",
  // ORDER specific granular permissions
  UPDATE_ORDER_STATUS = 'update_order_status',
  GET_ORDER_DETAILS = 'get_order_details',
  ADD_DESTINATION_TO_ORDER = 'add_destination_to_order',
  CANCEL_ORDER = 'cancel_order',
  DECLINE_ORDER="DECLINE_ORDER",
  // admin
  ORDER_READ_MINE = 'order_read_mine',
  // my raider

  // raider
  ORDER_COMPITITION = "order_compitition",
  ORDER_READ_FEED = "order_read_feed",
  // my raider
  READ_ADMIN_MY_RAIDER = 'read_admin_my_raider',
    
  //raider specific
  ONLINE_STATUS_UPDATE = "online_status_update",


  // TRANSACTION specific granular permissions
  UPDATE_TRANSACTION_STATUS = 'update_transaction_status',
  UPDATE_TRANSACTION_AMOUNT = 'update_transaction_amount',
  APPROVE_TRANSACTION = 'approve_transaction',
  REFUND_TRANSACTION = 'refund_transaction',

  // USER specific granular permissions
  GET_USER_PROFILE = "get_user_profile",
  UPDATE_USER_PROFILE = 'update_user_profile',
  UPDATE_USER_ROLE = 'update_user_role',
  UPDATE_USER_STATUS = 'update_user_status',
  // 
  REEDOM_COIN = 'reedom_coin',

}


// statc role
export const STATIC_ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  RAIDER: 'RAIDER',
  USER: 'USER',
};