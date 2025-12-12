export enum Module {
  USER = 'user',
  ORDER = 'order',
  TRANSACTION = 'transaction',
  RBAC="rbac"
}

// Granular permissions with specific actions
export enum Permission {
  // Basic CRUD
  CREATE = 'create',
  READ = 'read',
  DELETE = 'delete',
  UPDATE="update",


  // RBAC UPDATE
  UPDATE_RBAC_ROLE_PERMISSION="update_rbac_role_permission",
  
  // ORDER specific granular permissions
  UPDATE_ORDER_STATUS = 'update_order_status',
  UPDATE_ORDER_DETAILS = 'update_order_details',
  UPDATE_ORDER_PRICE = 'update_order_price',
  CANCEL_ORDER = 'cancel_order',
  
  // TRANSACTION specific granular permissions
  UPDATE_TRANSACTION_STATUS = 'update_transaction_status',
  UPDATE_TRANSACTION_AMOUNT = 'update_transaction_amount',
  APPROVE_TRANSACTION = 'approve_transaction',
  REFUND_TRANSACTION = 'refund_transaction',
  
  // USER specific granular permissions
  GET_USER_PROFILE="get_user_profile",
  UPDATE_USER_PROFILE = 'update_user_profile',
  UPDATE_USER_ROLE = 'update_user_role',
  UPDATE_USER_STATUS = 'update_user_status',
  
}


// statc role
export const STATIC_ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  RAIDER: 'RAIDER',
  USER: 'USER',
};