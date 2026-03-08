
export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
  TEAM_MEMBER = 'TEAM_MEMBER',
  SUPER_ADMIN = 'SUPER_ADMIN'
}

export type Permission =
  | 'manage_repairs'
  | 'manage_inventory'
  | 'manage_sales'
  | 'manage_billing'
  | 'manage_team'
  | 'view_reports'
  | 'manage_system'
  | 'manage_support'
  | 'manage_users'
  | 'manage_audit'
  | 'manage_ai'
  | 'manage_announcements'
  | 'manage_features'
  | 'manage_security';

export type TicketStatus = 'pending' | 'investigating' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  subject: string;
  category: string;
  message: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: string;
  updatedAt: string;
}

export interface CurrencySetting {
  id: string;
  countryCode: string; // ISO 3166-1 alpha-2
  currencyCode: string; // ISO 4217
  symbol: string;
  isDefault: boolean;
  isActive: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  subRole?: string;
  permissions: Permission[];
  avatar?: string;
  walletBalance: number;
  status: 'active' | 'expired' | 'pending';
  is_disabled?: boolean;
  planId?: string;
  ownerId?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  ownerId: string;
  permissions: Permission[];
  status: 'active' | 'inactive';
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  duration: 'monthly' | 'yearly';
  features: string[];
  limits: {
    repairsPerMonth: number;
    teamMembers: number;
    inventoryItems: number;
    categories: number;
    brands: number;
    aiDiagnostics: boolean;
  };
}

export interface Repair {
  id: string;
  customerName: string;
  device: string;
  description: string;
  cost: number;
  date: string;
  status: 'pending' | 'completed' | 'cancelled';
}

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  stock: number;
  price: number;
  brand: string;
}

export interface Transaction {
  id: string;
  amount: number;
  type: 'credit' | 'debit';
  status: 'success' | 'pending' | 'failed';
  date: string;
  description: string;
}
