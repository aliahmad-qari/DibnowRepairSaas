
const get = (key: string): any[] => {
  const data = localStorage.getItem(key);
  try { return data ? JSON.parse(data) : []; } catch (e) { return []; }
};

const set = (key: string, data: any): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

const KEYS = {
  REPAIRS: 'fixit_repairs',
  INVENTORY: 'fixit_inventory',
  USERS: 'fixit_users',
  TICKETS: 'fixit_tickets',
  BRANDS: 'fixit_brands',
  CATEGORIES: 'fixit_categories',
  CLIENTS: 'fixit_clients',
  PLANS: 'fixit_plans',
  TEAM: 'fixit_team',
  COMPLAINTS: 'fixit_complaints',
  TRANSACTIONS: 'fixit_transactions',
  SALES: 'fixit_sales',
  CURRENCY: 'fixit_currency_settings',
  PLAN_REQUESTS: 'fixit_plan_requests',
  USER_TEAM_V2: 'fixit_user_team_v2',
  ADMIN_TEAM_V2: 'fixit_admin_team_v2',
  RBAC_ROLES: 'fixit_rbac_roles',
  SUPPORT_TICKETS: 'fixit_support_tickets_v2',
  NOTIFICATIONS: 'fixit_notifications',
  ACTIVITY_LOGS: 'fixit_activity_logs',
  ADMIN_AUDIT_LOGS: 'fixit_admin_audit_logs',
  ADMIN_USERS: 'fixit_system_admins' 
};

const DEFAULT_PLANS: any[] = [
  { id: 'starter', name: 'FREE TRIAL', price: 0, baseCurrency: 'GBP', duration: 'monthly', features: ['1 Repair Customer', '1 In Stock', '1 Category', '1 Brand', '1 Teams'], limits: { repairsPerMonth: 1, teamMembers: 1, inventoryItems: 1, categories: 1, brands: 1, aiDiagnostics: false } },
  { id: 'basic', name: 'BASIC', price: 2, baseCurrency: 'GBP', duration: 'monthly', features: ['5 Repair Customer', '5 In Stock', '5 Category', '5 Brand', '5 Teams'], limits: { repairsPerMonth: 5, teamMembers: 5, inventoryItems: 5, categories: 5, brands: 5, aiDiagnostics: true } },
  { id: 'premium', name: 'PREMIUM', price: 5, baseCurrency: 'GBP', duration: 'monthly', features: ['7 Repair Customer', '7 In Stock', '7 Category', '7 Brand', '7 Teams'], limits: { repairsPerMonth: 7, teamMembers: 7, inventoryItems: 7, categories: 7, brands: 7, aiDiagnostics: true } },
  { id: 'gold', name: 'GOLD', price: 7, baseCurrency: 'GBP', duration: 'monthly', features: ['1000 Repair Customer', '1000 In Stock', '100 Category', '50 Brand', '50 Teams'], limits: { repairsPerMonth: 1000, teamMembers: 50, inventoryItems: 1000, categories: 100, brands: 50, aiDiagnostics: true } }
];

export const db = {
  audit: {
    getAll: () => get(KEYS.ADMIN_AUDIT_LOGS),
    log: (entry: { actionType: string; resource: string; details: string }) => {
      const all = get(KEYS.ADMIN_AUDIT_LOGS);
      const userRaw = localStorage.getItem('fixit_user');
      const user = userRaw ? JSON.parse(userRaw) : { id: 'System', role: 'ADMIN', subRole: 'Super Admin' };
      const logEntry = { id: `AUDIT-${Date.now()}`, adminId: user.id, adminRole: user.subRole || user.role, timestamp: new Date().toISOString(), ...entry };
      set(KEYS.ADMIN_AUDIT_LOGS, [logEntry, ...all]);
      window.dispatchEvent(new Event('storage'));
      return logEntry;
    }
  },
  adminUsers: {
    getAll: () => get(KEYS.ADMIN_USERS),
    getById: (id: string) => get(KEYS.ADMIN_USERS).find(u => u.id === id),
    getByEmail: (email: string) => get(KEYS.ADMIN_USERS).find(u => u.email === email),
    add: (admin: any) => {
      const all = get(KEYS.ADMIN_USERS);
      const newAdmin = { 
        ...admin, 
        id: `ADMIN-${Date.now()}`, 
        role: 'ADMIN', 
        createdAt: new Date().toISOString(),
        is_disabled: admin.is_disabled ?? false 
      };
      set(KEYS.ADMIN_USERS, [...all, newAdmin]);
      window.dispatchEvent(new Event('storage'));
      return newAdmin;
    },
    update: (id: string, updates: any) => {
      const all = get(KEYS.ADMIN_USERS);
      const updated = all.map(u => u.id === id ? { ...u, ...updates } : u);
      set(KEYS.ADMIN_USERS, updated);
      
      // Real-time Session Revocation Logic
      if (updates.is_disabled === true) {
        localStorage.setItem('dibnow_session_revoke', JSON.stringify({ userId: id, timestamp: Date.now() }));
      }
      
      window.dispatchEvent(new Event('storage'));
    },
    remove: (id: string) => {
      const all = get(KEYS.ADMIN_USERS);
      set(KEYS.ADMIN_USERS, all.filter(u => u.id !== id));
      localStorage.setItem('dibnow_session_revoke', JSON.stringify({ userId: id, timestamp: Date.now() }));
      window.dispatchEvent(new Event('storage'));
    }
  },
  activity: {
    getAll: () => get(KEYS.ACTIVITY_LOGS),
    log: (activity: { actionType: string; moduleName: string; refId: string; status: 'Success' | 'Failed' | 'Pending'; }) => {
      const all = get(KEYS.ACTIVITY_LOGS);
      const userRaw = localStorage.getItem('fixit_user');
      const user = userRaw ? JSON.parse(userRaw) : { id: 'System', name: 'Anonymous', role: 'USER' };
      const newLog = { id: `ACT-${Date.now()}`, userId: user.id, userName: user.name, userRole: user.role, timestamp: new Date().toISOString(), ...activity };
      set(KEYS.ACTIVITY_LOGS, [newLog, ...all].slice(0, 100));
      window.dispatchEvent(new Event('storage'));
      return newLog;
    }
  },
  notifications: {
    getAll: () => get(KEYS.NOTIFICATIONS),
    getByUser: (userId: string) => db.notifications.getAll().filter((n: any) => n.userId === userId || n.userId === 'global'),
    add: (notif: { userId: string; title: string; message: string; type: 'info' | 'success' | 'warning' }) => {
      const all = db.notifications.getAll();
      const newNotif = { ...notif, id: `NT-${Date.now()}`, read: false, createdAt: new Date().toISOString() };
      set(KEYS.NOTIFICATIONS, [newNotif, ...all]);
      window.dispatchEvent(new Event('storage'));
      return newNotif;
    },
    markAsRead: (id: string) => {
      const all = db.notifications.getAll();
      const updated = all.map((n: any) => n.id === id ? { ...n, read: true } : n);
      set(KEYS.NOTIFICATIONS, updated);
      window.dispatchEvent(new Event('storage'));
    },
    markAllAsRead: (userId: string) => {
      const all = db.notifications.getAll();
      const updated = all.map((n: any) => (n.userId === userId || n.userId === 'global') ? { ...n, read: true } : n);
      set(KEYS.NOTIFICATIONS, updated);
      window.dispatchEvent(new Event('storage'));
    }
  },
  supportTickets: {
    getAll: () => get(KEYS.SUPPORT_TICKETS),
    getByUser: (userId: string) => db.supportTickets.getAll().filter((t: any) => t.userId === userId || t.ownerId === userId),
    add: (ticket: any) => {
      const all = db.supportTickets.getAll();
      const newTicket = { ...ticket, id: `TKT-${Math.floor(100000 + Math.random() * 900000)}`, status: 'pending', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      set(KEYS.SUPPORT_TICKETS, [newTicket, ...all]);
      db.activity.log({ actionType: 'Ticket Created', moduleName: 'Support', refId: newTicket.id, status: 'Success' });
      window.dispatchEvent(new Event('storage'));
      return newTicket;
    },
    updateStatus: (id: string, status: string) => {
      const all = db.supportTickets.getAll();
      const ticket = all.find((t: any) => t.id === id);
      const updated = all.map((t: any) => t.id === id ? { ...t, status, updatedAt: new Date().toISOString() } : t);
      set(KEYS.SUPPORT_TICKETS, updated);
      if (ticket) {
        db.notifications.add({ userId: ticket.userId, title: 'Support Ticket Update', message: `Your ticket ${id} has been marked as ${status.toUpperCase()}.`, type: 'info' });
        db.activity.log({ actionType: 'Ticket Updated', moduleName: 'Support', refId: id, status: 'Success' });
      }
      window.dispatchEvent(new Event('storage'));
    }
  },
  userTeamV2: {
    getAll: () => get(KEYS.USER_TEAM_V2),
    getByOwner: (ownerId: string) => db.userTeamV2.getAll().filter((m: any) => m.ownerId === ownerId),
    getByEmail: (email: string) => db.userTeamV2.getAll().find((m: any) => m.email === email),
    add: (member: any) => {
      const all = db.userTeamV2.getAll();
      const newMember = { ...member, id: `TM-${Math.floor(1000 + Math.random() * 9000)}`, status: member.status || 'enabled', createdAt: new Date().toISOString() };
      set(KEYS.USER_TEAM_V2, [...all, newMember]);
      db.activity.log({ actionType: 'Staff Provisioned', moduleName: 'Team', refId: newMember.id, status: 'Success' });
      window.dispatchEvent(new Event('storage'));
      return newMember;
    },
    update: (id: string, updates: any) => {
      const all = db.userTeamV2.getAll();
      const updated = all.map((m: any) => m.id === id ? { ...m, ...updates } : m);
      set(KEYS.USER_TEAM_V2, updated);
      db.activity.log({ actionType: 'Staff Updated', moduleName: 'Team', refId: id, status: 'Success' });
      window.dispatchEvent(new Event('storage'));
    }
  },
  adminTeamV2: {
    getAll: () => get(KEYS.ADMIN_TEAM_V2),
    getByEmail: (email: string) => db.adminTeamV2.getAll().find((m: any) => m.email === email),
    add: (member: any) => {
      const all = db.adminTeamV2.getAll();
      const newMember = { ...member, id: `ADM-ST-${Math.floor(100 + Math.random() * 899)}`, status: member.status || 'enabled', createdAt: new Date().toISOString() };
      set(KEYS.ADMIN_TEAM_V2, [...all, newMember]);
      db.activity.log({ actionType: 'Admin Provisioned', moduleName: 'Infrastructure', refId: newMember.id, status: 'Success' });
      window.dispatchEvent(new Event('storage'));
      return newMember;
    }
  },
  rbacRoles: {
    getAll: () => get(KEYS.RBAC_ROLES),
    add: (role: any) => {
      const all = get(KEYS.RBAC_ROLES);
      set(KEYS.RBAC_ROLES, [...all, role]);
      window.dispatchEvent(new Event('storage'));
    }
  },
  currencies: {
    getAll: () => {
      const data = get(KEYS.CURRENCY);
      return data.length ? data : [
        { id: '1', countryCode: 'GB', currencyCode: 'GBP', symbol: '£', isDefault: true, isActive: true },
        { id: '2', countryCode: 'US', currencyCode: 'USD', symbol: '$', isDefault: false, isActive: true },
        { id: '3', countryCode: 'PK', currencyCode: 'PKR', symbol: 'Rs', isDefault: false, isActive: true },
        { id: '4', countryCode: 'AE', currencyCode: 'AED', symbol: 'DH', isDefault: false, isActive: true },
        { id: '5', countryCode: 'IN', currencyCode: 'INR', symbol: '₹', isDefault: false, isActive: true },
        { id: '6', countryCode: 'DE', currencyCode: 'EUR', symbol: '€', isDefault: false, isActive: true },
        { id: '7', countryCode: 'AU', currencyCode: 'AUD', symbol: 'A$', isDefault: false, isActive: true },
        { id: '8', countryCode: 'CA', currencyCode: 'CAD', symbol: 'C$', isDefault: false, isActive: true },
      ];
    },
    getByCountry: (code: string) => {
      const all = db.currencies.getAll();
      return all.find((c: any) => c.countryCode === code && c.isActive) || all.find((c: any) => c.isDefault);
    },
    update: (settings: any[]) => {
      set(KEYS.CURRENCY, settings);
      db.activity.log({ actionType: 'Currency Config Updated', moduleName: 'Treasury', refId: 'GLOBAL', status: 'Success' });
      window.dispatchEvent(new Event('storage'));
    }
  },
  users: {
    getAll: () => get(KEYS.USERS),
    getById: (id: string) => db.users.getAll().find((u: any) => u.id === id),
    update: (id: string, updates: any) => {
      const all = db.users.getAll();
      const existsIndex = all.findIndex((u: any) => u.id === id);
      if (existsIndex > -1) {
        all[existsIndex] = { ...all[existsIndex], ...updates };
        set(KEYS.USERS, all);
      } else {
        set(KEYS.USERS, [...all, { id, ...updates }]);
      }
      const currentSession = localStorage.getItem('fixit_user');
      if (currentSession) {
        const user = JSON.parse(currentSession);
        if (user.id === id) {
          localStorage.setItem('fixit_user', JSON.stringify({ ...user, ...updates }));
        }
      }
      window.dispatchEvent(new Event('storage'));
    }
  },
  user: {
    get: (): any => {
      const u = localStorage.getItem('fixit_user');
      return u ? JSON.parse(u) : null;
    },
    updatePlan: (planId: string) => {
      const user = db.user.get();
      if (user) {
        db.users.update(user.id, { planId });
        db.activity.log({ actionType: 'Plan Subscribed', moduleName: 'Billing', refId: planId, status: 'Success' });
        return { ...user, planId };
      }
      return null;
    },
    updateBalance: (amount: number, type: 'credit' | 'debit') => {
      const user = db.user.get();
      if (user) {
        const currentBalance = parseFloat(user.walletBalance.toString()) || 0;
        const changeAmount = parseFloat(amount.toString()) || 0;
        const newBalance = type === 'credit' ? currentBalance + changeAmount : currentBalance - changeAmount;
        const updatedBalance = parseFloat(newBalance.toFixed(2));
        db.users.update(user.id, { walletBalance: updatedBalance });
        db.activity.log({ actionType: type === 'credit' ? 'Wallet Top-up' : 'Service Charged', moduleName: 'Treasury', refId: user.id, status: 'Success' });
        return { ...user, walletBalance: updatedBalance };
      }
      return null;
    }
  },
  inventory: {
    getAll: () => get(KEYS.INVENTORY),
    add: (item: any) => {
      const all = db.inventory.getAll();
      const newItem = { ...item, id: `INV-${Math.floor(1000 + Math.random() * 9000)}`, createdAt: new Date().toISOString() };
      set(KEYS.INVENTORY, [...all, newItem]);
      db.activity.log({ actionType: 'Stock Item Added', moduleName: 'Inventory', refId: newItem.id, status: 'Success' });
      window.dispatchEvent(new Event('storage'));
      return newItem;
    },
    remove: (id: string) => {
      const all = db.inventory.getAll();
      set(KEYS.INVENTORY, all.filter((i: any) => i.id !== id));
      db.activity.log({ actionType: 'Stock Item Removed', moduleName: 'Inventory', refId: id, status: 'Success' });
      window.dispatchEvent(new Event('storage'));
    },
    update: (id: string, updates: any) => {
      const all = db.inventory.getAll();
      const updated = all.map((i: any) => i.id === id ? { ...i, ...updates } : i);
      set(KEYS.INVENTORY, updated);
      window.dispatchEvent(new Event('storage'));
    },
    sell: (id: string, qty: number, price: number, customer: string) => {
      const all = db.inventory.getAll();
      const itemIndex = all.findIndex((i: any) => i.id === id);
      if (itemIndex > -1 && all[itemIndex].stock >= qty) {
        all[itemIndex].stock -= qty;
        set(KEYS.INVENTORY, all);
        const sale = db.sales.add({
          productId: id, productName: all[itemIndex].name, qty, price, total: qty * price,
          customer: customer || 'Walk-in Customer', date: new Date().toLocaleDateString(),
          timestamp: new Date().toISOString()
        });
        db.activity.log({ actionType: 'Stock Item Sold', moduleName: 'POS', refId: sale.id, status: 'Success' });
        window.dispatchEvent(new Event('storage'));
        return true;
      }
      return false;
    }
  },
  plans: {
    getAll: () => {
      const plans = get(KEYS.PLANS);
      return plans.length ? plans : DEFAULT_PLANS;
    },
    getById: (id: string) => db.plans.getAll().find((p: any) => p.id === id) || DEFAULT_PLANS[0],
    add: (plan: any) => {
      const all = db.plans.getAll();
      const newPlan = { ...plan, id: `plan-${Math.random().toString(36).substr(2, 9)}` };
      set(KEYS.PLANS, [...all, newPlan]);
      db.activity.log({ actionType: 'Tier Deployed', moduleName: 'Billing', refId: newPlan.id, status: 'Success' });
      window.dispatchEvent(new Event('storage'));
      return newPlan;
    },
    update: (id: string, updates: any) => {
      const all = db.plans.getAll();
      const existsIndex = all.findIndex((p: any) => p.id === id);
      const updatedAll = existsIndex > -1 
        ? all.map((p: any) => p.id === id ? { ...p, ...updates } : p)
        : [...all, { id, ...updates }];
      set(KEYS.PLANS, updatedAll);
      db.activity.log({ actionType: 'Tier Updated', moduleName: 'Billing', refId: id, status: 'Success' });
      window.dispatchEvent(new Event('storage'));
    },
    remove: (id: string) => {
      const all = db.plans.getAll();
      const updatedAll = all.filter((p: any) => p.id !== id);
      set(KEYS.PLANS, updatedAll);
      db.activity.log({ actionType: 'Tier Removed', moduleName: 'Billing', refId: id, status: 'Success' });
      window.dispatchEvent(new Event('storage'));
    }
  },
  planRequests: {
    getAll: () => get(KEYS.PLAN_REQUESTS),
    add: (request: any) => {
      const all = get(KEYS.PLAN_REQUESTS);
      const newRequest = { ...request, id: `PR-${Math.floor(Math.random() * 10000)}`, status: 'pending', invoiceStatus: 'unpaid', date: new Date().toLocaleDateString() };
      set(KEYS.PLAN_REQUESTS, [newRequest, ...all]);
      db.activity.log({ actionType: 'Plan Request Submitted', moduleName: 'Billing', refId: newRequest.id, status: 'Pending' });
      window.dispatchEvent(new Event('storage'));
      return newRequest;
    },
    updateStatus: (id: string, status: 'approved' | 'denied', meta?: { planStatus: string, invoiceStatus: string }) => {
      const all = get(KEYS.PLAN_REQUESTS);
      const request = all.find((r: any) => r.id === id);
      const updated = all.map((r: any) => {
        if (r.id === id) {
          const updatedRequest = { ...r, status, invoiceStatus: meta?.invoiceStatus || (status === 'approved' ? 'paid' : 'unpaid'), planActivation: meta?.planStatus || (status === 'approved' ? 'active' : 'inactive') };
          if (status === 'approved' && updatedRequest.planActivation === 'active') db.users.update(r.shopId, { planId: r.requestedPlanId });
          return updatedRequest;
        }
        return r;
      });
      set(KEYS.PLAN_REQUESTS, updated);
      if (request) {
        db.notifications.add({ userId: request.shopId, title: 'Plan Upgrade Approved', message: `System Admin has approved your promo request to ${request.requestedPlanName}.`, type: 'success' });
      }
      window.dispatchEvent(new Event('storage'));
    }
  },
  wallet: {
    getTransactions: () => get(KEYS.TRANSACTIONS),
    addTransaction: (tx: any) => {
      const all = db.wallet.getTransactions();
      const newTx = { ...tx, id: `TX-${Math.floor(Math.random() * 10000)}` };
      set(KEYS.TRANSACTIONS, [newTx, ...all]);
      db.user.updateBalance(tx.amount, tx.type);
      return newTx;
    }
  },
  sales: {
    getAll: () => get(KEYS.SALES),
    add: (sale: any) => {
      const all = get(KEYS.SALES);
      const newSale = { 
        ...sale, 
        id: `SALE-${Math.floor(1000 + Math.random() * 9000)}`,
        timestamp: sale.timestamp || new Date().toISOString() 
      };
      set(KEYS.SALES, [newSale, ...all]);
      db.activity.log({ actionType: 'Invoice Generated', moduleName: 'Sales', refId: newSale.id, status: 'Success' });
      return newSale;
    }
  },
  repairs: {
    getAll: () => get(KEYS.REPAIRS),
    getByTrackingId: (trackingId: string) => db.repairs.getAll().find((r: any) => r.trackingId === trackingId),
    add: (repair: any) => {
      const all = db.repairs.getAll();
      const newRepair = { ...repair, id: `REP-${Math.floor(1000 + Math.random() * 9000)}`, createdAt: new Date().toISOString() };
      set(KEYS.REPAIRS, [newRepair, ...all]);
      db.activity.log({ actionType: 'Repair Created', moduleName: 'Repairs', refId: newRepair.trackingId || newRepair.id, status: 'Success' });
      db.notifications.add({ userId: 'global', title: 'New Repair Task', message: `New device enrolled for ${repair.customerName}. Protocol ID: ${newRepair.trackingId}`, type: 'info' });
      window.dispatchEvent(new Event('storage'));
      return newRepair;
    },
    update: (id: string, updates: any) => {
      const all = db.repairs.getAll();
      const repair = all.find(r => r.id === id);
      if (!repair) return;
      const updated = all.map((r: any) => {
        if (r.id === id) {
          const u = { ...r, ...updates };
          // If status completed, notify
          if (updates.status === 'completed' && r.status !== 'completed') {
            db.notifications.add({ userId: 'global', title: 'Repair Finalized', message: `Repair ${r.trackingId} is ready for collection.`, type: 'success' });
          }
          // If assigned to technician, notify
          if (updates.assignedTo && r.assignedTo !== updates.assignedTo) {
             db.notifications.add({ userId: 'global', title: 'Technician Dispatched', message: `${updates.assignedTo} assigned to Repair ${r.trackingId}.`, type: 'info' });
          }
          return u;
        }
        return r;
      });
      set(KEYS.REPAIRS, updated);
      window.dispatchEvent(new Event('storage'));
    },
    remove: (id: string) => {
      const all = db.repairs.getAll();
      const updated = all.filter((r: any) => r.id !== id);
      set(KEYS.REPAIRS, updated);
      db.activity.log({ actionType: 'Repair Deleted', moduleName: 'Repairs', refId: id, status: 'Success' });
      window.dispatchEvent(new Event('storage'));
    }
  },
  complaints: {
    getAll: () => {
      const data = get(KEYS.COMPLAINTS);
      return data.length ? data : [{ id: 'C-991', user: 'Downtown Elec', subject: 'Billing Discrepancy', priority: 'high', status: 'pending', date: 'Oct 24, 2023', description: 'Invoice #882 is showing wrong total.' }];
    },
    add: (complaint: any) => {
      const all = db.complaints.getAll();
      const newComplaint = { ...complaint, id: `C-${Math.floor(100 + Math.random() * 899)}`, status: 'pending', date: new Date().toLocaleDateString() };
      set(KEYS.COMPLAINTS, [newComplaint, ...all]);
      db.activity.log({ actionType: 'Complaint Created', moduleName: 'Support', refId: newComplaint.id, status: 'Success' });
      window.dispatchEvent(new Event('storage'));
      return newComplaint;
    },
    resolve: (id: string) => {
      const all = db.complaints.getAll();
      const updated = all.map((c: any) => c.id === id ? { ...c, status: 'resolved' } : c);
      set(KEYS.COMPLAINTS, updated);
      window.dispatchEvent(new Event('storage'));
    }
  },
  brands: {
    getAll: () => get(KEYS.BRANDS),
    add: (brand: any) => {
      const all = db.brands.getAll();
      const newBrand = { ...brand, id: Date.now().toString() };
      set(KEYS.BRANDS, [newBrand, ...all]);
      window.dispatchEvent(new Event('storage'));
      return newBrand;
    }
  },
  categories: {
    getAll: () => get(KEYS.CATEGORIES),
    add: (cat: any) => {
      const all = db.categories.getAll();
      const newCat = { ...cat, id: Date.now().toString() };
      set(KEYS.CATEGORIES, [newCat, ...all]);
      window.dispatchEvent(new Event('storage'));
      return newCat;
    }
  },
  clients: {
    getAll: () => get(KEYS.CLIENTS),
    add: (client: any) => {
      const all = get(KEYS.CLIENTS);
      const newClient = { ...client, id: Date.now().toString() };
      set(KEYS.CLIENTS, [newClient, ...all]);
      window.dispatchEvent(new Event('storage'));
      return newClient;
    }
  }
};
