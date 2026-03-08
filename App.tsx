
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { CurrencyProvider } from './context/CurrencyContext.tsx';
import { UserRole, Permission } from './types.ts';
import { DashboardLayout } from './layouts/DashboardLayout.tsx';
import { AIChatbot } from './components/common/AIChatbot.tsx';

// Auth Pages
import { Login } from './pages/auth/Login.tsx';
import { Register } from './pages/auth/Register.tsx';
import { VerifyOTP } from './pages/auth/VerifyOTP.tsx';
import { TeamPortal } from './pages/auth/TeamPortal.tsx';
import { ForgotPassword } from './pages/auth/ForgotPassword.tsx';

// User Pages
import { UserDashboard } from './pages/user/UserDashboard.tsx';
import { Repairs } from './pages/user/Repairs.tsx';
import { AddRepair } from './pages/user/AddRepair.tsx';
import { Inventory } from './pages/user/Inventory.tsx';
import { AddInventory } from './pages/user/AddInventory.tsx';
import { AllStock } from './pages/user/AllStock.tsx';
import { SellProducts } from './pages/user/SellProducts.tsx';
import { SoldItems } from './pages/user/SoldItems.tsx';
import { Categories } from './pages/user/Categories.tsx';
import { Brands } from './pages/user/Brands.tsx';
import { Clients } from './pages/user/Clients.tsx';
import { AdvancedTeam } from './pages/user/AdvancedTeam.tsx';
import { TeamMembers } from './pages/user/TeamMembers.tsx';
import { Wallet } from './pages/user/Wallet.tsx';
import { Utilities } from './pages/user/Utilities.tsx';
import { HelpCenter } from './pages/user/Help.tsx';
import { UserComplaints } from './pages/user/Complaints.tsx';
import { UserPricing } from './pages/user/Pricing.tsx';
import { SupportTickets } from './pages/user/SupportTickets.tsx';
import { UserSettings } from './pages/user/UserSettings.tsx';

// NEW USER PAGES
import { UserReports } from './pages/user/Reports.tsx';
import { UserInvoices } from './pages/user/Invoices.tsx';
import { UserNotifications } from './pages/user/NotificationsPage.tsx';
import { ProfilePage } from './pages/user/quick-actions/Profile.tsx';
import { UserActivity } from './pages/user/ActivityPage.tsx';

// Quick Action Pages
import { PrayerPage } from './pages/user/quick-actions/Prayer.tsx';
import { QuranPage } from './pages/user/quick-actions/Quran.tsx';
import { SurahDetail } from './pages/user/quick-actions/SurahDetail.tsx';
import { TasbeehPage } from './pages/user/quick-actions/Tasbeeh.tsx';
import { WeatherPage } from './pages/user/quick-actions/Weather.tsx';
import { HistoryPage } from './pages/user/quick-actions/History.tsx';
import { SupportPage } from './pages/user/quick-actions/Support.tsx';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard.tsx';
import { AdminUsers } from './pages/admin/Users.tsx';
import { SystemStaff } from './pages/admin/SystemStaff.tsx';
import { AllRepairs } from './pages/admin/AllRepairs.tsx';
import { AllInventory } from './pages/admin/AllInventory.tsx';
import { AllSales } from './pages/admin/AllSales.tsx';
import { Plans } from './pages/admin/Plans.tsx';
import { PlanRequests } from './pages/admin/PlanRequests.tsx';
import { AdminWallet } from './pages/admin/Wallet.tsx';
import { AdminTransactions } from './pages/admin/Transactions.tsx';
import { CurrencySettings } from './pages/admin/CurrencySettings.tsx';
import { SupportHub } from './pages/admin/SupportHub.tsx';
import { Complaints } from './pages/admin/Complaints.tsx';
import { AdminSettings } from './pages/admin/Settings.tsx';
import { SecurityIntelligence } from './pages/admin/SecurityIntelligence.tsx';

// NEW ADMIN PAGES
import { AdminReports } from './pages/admin/ReportsAdmin.tsx';
import { AdminAuditLogs } from './pages/admin/AuditLogs.tsx';
import { AdminAIInsights } from './pages/admin/AIInsightsAdmin.tsx';
import { AdminAnnouncements } from './pages/admin/Announcements.tsx';
import { AdminFeatureFlags } from './pages/admin/FeatureFlags.tsx';

// Public Pages
import { TrackRepair } from './pages/public/TrackRepair.tsx';

// SUPER ADMIN PAGES
import { SuperAdminLayout } from './layouts/SuperAdminLayout.tsx';
import { SuperAdminDashboard } from './pages/superadmin/SuperAdminDashboard.tsx';
import { GlobalUserManagement } from './pages/superadmin/UserManagement.tsx';
import { ShopManagement } from './pages/superadmin/ShopManagement.tsx';
import { RevenueAnalytics } from './pages/superadmin/RevenueAnalytics.tsx';
import { PaymentControl } from './pages/superadmin/PaymentControl.tsx';
import { GlobalPlans } from './pages/superadmin/GlobalPlans.tsx';
import { GlobalCurrencies } from './pages/superadmin/GlobalCurrencies.tsx';
import { GlobalAnnouncements } from './pages/superadmin/GlobalAnnouncements.tsx';
import { AIMonitor } from './pages/superadmin/AIMonitor.tsx';
import { SystemAuditLogs } from './pages/superadmin/SystemAuditLogs.tsx';
import { GlobalSupport } from './pages/superadmin/GlobalSupport.tsx';
import { GlobalFeatureFlags } from './pages/superadmin/GlobalFeatureFlags.tsx';
import { AdminManagement } from './pages/superadmin/AdminManagement.tsx';

const ProtectedRoute: React.FC<{ children: React.ReactNode; role?: UserRole; permission?: Permission }> = ({ children, role, permission }) => {
  const { isAuthenticated, user, hasPermission, isLoading } = useAuth();
  
  // Wait for auth to initialize before redirecting
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-semibold">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) return <Navigate to="/login" />;

  // ROLE VALIDATION
  if (role && user?.role !== role && user?.role !== UserRole.SUPER_ADMIN) {
    return <Navigate to="/" />;
  }

  // PERMISSION VALIDATION - ONLY FOR TEAM MEMBERS
  // Owners (USER/ADMIN) and SUPER_ADMIN have full access without permission checks
  if (permission && user?.role === UserRole.TEAM_MEMBER && !hasPermission(permission)) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <CurrencyProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="/login" element={<Login />} />
            <Route path="/auth/register" element={<Register />} />
            <Route path="/auth/verify-otp" element={<VerifyOTP />} />
            <Route path="/auth/forgot-password" element={<ForgotPassword />} />
            <Route path="/team/login" element={<TeamPortal />} />

            {/* Super Admin Routes */}
            <Route path="/superadmin/dashboard" element={<ProtectedRoute role={UserRole.SUPER_ADMIN}><SuperAdminLayout><SuperAdminDashboard /></SuperAdminLayout></ProtectedRoute>} />
            <Route path="/superadmin/users" element={<ProtectedRoute role={UserRole.SUPER_ADMIN}><SuperAdminLayout><GlobalUserManagement /></SuperAdminLayout></ProtectedRoute>} />
            <Route path="/superadmin/shops" element={<ProtectedRoute role={UserRole.SUPER_ADMIN}><SuperAdminLayout><ShopManagement /></SuperAdminLayout></ProtectedRoute>} />
            <Route path="/superadmin/revenue" element={<ProtectedRoute role={UserRole.SUPER_ADMIN}><SuperAdminLayout><RevenueAnalytics /></SuperAdminLayout></ProtectedRoute>} />
            <Route path="/superadmin/payments" element={<ProtectedRoute role={UserRole.SUPER_ADMIN}><SuperAdminLayout><PaymentControl /></SuperAdminLayout></ProtectedRoute>} />
            <Route path="/superadmin/currencies" element={<ProtectedRoute role={UserRole.SUPER_ADMIN}><SuperAdminLayout><GlobalCurrencies /></SuperAdminLayout></ProtectedRoute>} />
            <Route path="/superadmin/announcements" element={<ProtectedRoute role={UserRole.SUPER_ADMIN}><SuperAdminLayout><GlobalAnnouncements /></SuperAdminLayout></ProtectedRoute>} />
            <Route path="/superadmin/ai-monitor" element={<ProtectedRoute role={UserRole.SUPER_ADMIN}><SuperAdminLayout><AIMonitor /></SuperAdminLayout></ProtectedRoute>} />
            <Route path="/superadmin/logs" element={<ProtectedRoute role={UserRole.SUPER_ADMIN}><SuperAdminLayout><SystemAuditLogs /></SuperAdminLayout></ProtectedRoute>} />
            <Route path="/superadmin/support" element={<ProtectedRoute role={UserRole.SUPER_ADMIN}><SuperAdminLayout><GlobalSupport /></SuperAdminLayout></ProtectedRoute>} />
            <Route path="/superadmin/feature-flags" element={<ProtectedRoute role={UserRole.SUPER_ADMIN}><SuperAdminLayout><GlobalFeatureFlags /></SuperAdminLayout></ProtectedRoute>} />
            <Route path="/superadmin/admin-management" element={<ProtectedRoute role={UserRole.SUPER_ADMIN}><SuperAdminLayout><AdminManagement /></SuperAdminLayout></ProtectedRoute>} />

            {/* User Routes */}
            <Route path="/user/dashboard" element={<ProtectedRoute role={UserRole.USER}><DashboardLayout><UserDashboard /></DashboardLayout></ProtectedRoute>} />
            <Route path="/user/reports" element={<ProtectedRoute role={UserRole.USER}><DashboardLayout><UserReports /></DashboardLayout></ProtectedRoute>} />
            <Route path="/user/invoices" element={<ProtectedRoute role={UserRole.USER}><DashboardLayout><UserInvoices /></DashboardLayout></ProtectedRoute>} />
            <Route path="/user/notifications" element={<ProtectedRoute role={UserRole.USER}><DashboardLayout><UserNotifications /></DashboardLayout></ProtectedRoute>} />
            <Route path="/user/profile" element={<ProtectedRoute role={UserRole.USER}><DashboardLayout><ProfilePage /></DashboardLayout></ProtectedRoute>} />
            <Route path="/user/activity" element={<ProtectedRoute role={UserRole.USER}><DashboardLayout><UserActivity /></DashboardLayout></ProtectedRoute>} />

            {/* Quick Action specialized routes */}
            <Route path="/user/quick/prayer" element={<ProtectedRoute role={UserRole.USER}><DashboardLayout><PrayerPage /></DashboardLayout></ProtectedRoute>} />
            <Route path="/user/quick/quran" element={<ProtectedRoute role={UserRole.USER}><DashboardLayout><QuranPage /></DashboardLayout></ProtectedRoute>} />
            <Route path="/user/quick/quran/:id" element={<ProtectedRoute role={UserRole.USER}><DashboardLayout><SurahDetail /></DashboardLayout></ProtectedRoute>} />
            <Route path="/user/quick/tasbeeh" element={<ProtectedRoute role={UserRole.USER}><DashboardLayout><TasbeehPage /></DashboardLayout></ProtectedRoute>} />
            <Route path="/user/quick/weather" element={<ProtectedRoute role={UserRole.USER}><DashboardLayout><WeatherPage /></DashboardLayout></ProtectedRoute>} />
            <Route path="/user/quick/history" element={<ProtectedRoute role={UserRole.USER}><DashboardLayout><HistoryPage /></DashboardLayout></ProtectedRoute>} />
            <Route path="/user/quick/support" element={<ProtectedRoute role={UserRole.USER}><DashboardLayout><SupportPage /></DashboardLayout></ProtectedRoute>} />

            {/* Standard User Routes */}
            <Route path="/user/repairs" element={<ProtectedRoute role={UserRole.USER}><DashboardLayout><Repairs /></DashboardLayout></ProtectedRoute>} />
            <Route path="/user/add-repair" element={<ProtectedRoute role={UserRole.USER}><DashboardLayout><AddRepair /></DashboardLayout></ProtectedRoute>} />
            <Route path="/user/inventory" element={<ProtectedRoute role={UserRole.USER}><DashboardLayout><Inventory /></DashboardLayout></ProtectedRoute>} />
            <Route path="/user/add-inventory" element={<ProtectedRoute role={UserRole.USER}><DashboardLayout><AddInventory /></DashboardLayout></ProtectedRoute>} />
            <Route path="/user/all-stock" element={<ProtectedRoute role={UserRole.USER}><DashboardLayout><AllStock /></DashboardLayout></ProtectedRoute>} />
            <Route path="/user/pos" element={<ProtectedRoute role={UserRole.USER}><DashboardLayout><SellProducts /></DashboardLayout></ProtectedRoute>} />
            <Route path="/user/sold-items" element={<ProtectedRoute role={UserRole.USER}><DashboardLayout><SoldItems /></DashboardLayout></ProtectedRoute>} />
            <Route path="/user/categories" element={<ProtectedRoute role={UserRole.USER}><DashboardLayout><Categories /></DashboardLayout></ProtectedRoute>} />
            <Route path="/user/brands" element={<ProtectedRoute role={UserRole.USER}><DashboardLayout><Brands /></DashboardLayout></ProtectedRoute>} />
            <Route path="/user/clients" element={<ProtectedRoute role={UserRole.USER}><DashboardLayout><Clients /></DashboardLayout></ProtectedRoute>} />
            <Route path="/user/advanced-team" element={<ProtectedRoute role={UserRole.USER}><DashboardLayout><AdvancedTeam /></DashboardLayout></ProtectedRoute>} />
            <Route path="/user/team" element={<ProtectedRoute role={UserRole.USER}><DashboardLayout><TeamMembers /></DashboardLayout></ProtectedRoute>} />
            <Route path="/user/wallet" element={<ProtectedRoute role={UserRole.USER}><DashboardLayout><Wallet /></DashboardLayout></ProtectedRoute>} />
            <Route path="/user/utilities" element={<ProtectedRoute role={UserRole.USER}><DashboardLayout><Utilities /></DashboardLayout></ProtectedRoute>} />
            <Route path="/user/help" element={<ProtectedRoute role={UserRole.USER}><DashboardLayout><HelpCenter /></DashboardLayout></ProtectedRoute>} />
            <Route path="/user/complaints" element={<ProtectedRoute role={UserRole.USER}><DashboardLayout><UserComplaints /></DashboardLayout></ProtectedRoute>} />
            <Route path="/user/pricing" element={<ProtectedRoute role={UserRole.USER}><DashboardLayout><UserPricing /></DashboardLayout></ProtectedRoute>} />
            <Route path="/user/tickets" element={<ProtectedRoute role={UserRole.USER}><DashboardLayout><SupportTickets /></DashboardLayout></ProtectedRoute>} />
            <Route path="/user/settings" element={<ProtectedRoute role={UserRole.USER}><DashboardLayout><UserSettings /></DashboardLayout></ProtectedRoute>} />

            {/* Admin Routes with Granular Permission Gates */}
            <Route path="/admin/dashboard" element={<ProtectedRoute role={UserRole.ADMIN}><DashboardLayout><AdminDashboard /></DashboardLayout></ProtectedRoute>} />
            <Route path="/admin/reports" element={<ProtectedRoute role={UserRole.ADMIN} permission="view_reports"><DashboardLayout><AdminReports /></DashboardLayout></ProtectedRoute>} />
            <Route path="/admin/audit-logs" element={<ProtectedRoute role={UserRole.ADMIN} permission="manage_system"><DashboardLayout><AdminAuditLogs /></DashboardLayout></ProtectedRoute>} />
            <Route path="/admin/ai-insights" element={<ProtectedRoute role={UserRole.ADMIN} permission="manage_system"><DashboardLayout><AdminAIInsights /></DashboardLayout></ProtectedRoute>} />
            <Route path="/admin/announcements" element={<ProtectedRoute role={UserRole.ADMIN} permission="manage_system"><DashboardLayout><AdminAnnouncements /></DashboardLayout></ProtectedRoute>} />
            <Route path="/admin/feature-flags" element={<ProtectedRoute role={UserRole.ADMIN} permission="manage_system"><DashboardLayout><AdminFeatureFlags /></DashboardLayout></ProtectedRoute>} />
            <Route path="/admin/security-intel" element={<ProtectedRoute role={UserRole.ADMIN} permission="manage_system"><DashboardLayout><SecurityIntelligence /></DashboardLayout></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute role={UserRole.ADMIN} permission="manage_system"><DashboardLayout><AdminUsers /></DashboardLayout></ProtectedRoute>} />
            <Route path="/admin/staff" element={<ProtectedRoute role={UserRole.ADMIN} permission="manage_system"><DashboardLayout><SystemStaff /></DashboardLayout></ProtectedRoute>} />
            <Route path="/admin/all-repairs" element={<ProtectedRoute role={UserRole.ADMIN} permission="manage_repairs"><DashboardLayout><AllRepairs /></DashboardLayout></ProtectedRoute>} />
            <Route path="/admin/all-inventory" element={<ProtectedRoute role={UserRole.ADMIN} permission="manage_inventory"><DashboardLayout><AllInventory /></DashboardLayout></ProtectedRoute>} />
            <Route path="/admin/all-sales" element={<ProtectedRoute role={UserRole.ADMIN} permission="manage_sales"><DashboardLayout><AllSales /></DashboardLayout></ProtectedRoute>} />
            <Route path="/admin/plans" element={<ProtectedRoute role={UserRole.ADMIN}><DashboardLayout><AdminPlans /></DashboardLayout></ProtectedRoute>} />
            <Route path="/admin/plan-requests" element={<ProtectedRoute role={UserRole.ADMIN} permission="manage_billing"><DashboardLayout><PlanRequests /></DashboardLayout></ProtectedRoute>} />
            <Route path="/admin/wallet" element={<ProtectedRoute role={UserRole.ADMIN} permission="manage_billing"><DashboardLayout><AdminWallet /></DashboardLayout></ProtectedRoute>} />
            <Route path="/admin/transactions" element={<ProtectedRoute role={UserRole.ADMIN} permission="manage_billing"><DashboardLayout><AdminTransactions /></DashboardLayout></ProtectedRoute>} />
            <Route path="/admin/currencies" element={<ProtectedRoute role={UserRole.ADMIN} permission="manage_system"><DashboardLayout><CurrencySettings /></DashboardLayout></ProtectedRoute>} />
            <Route path="/admin/tickets" element={<ProtectedRoute role={UserRole.ADMIN} permission="manage_support"><DashboardLayout><SupportHub /></DashboardLayout></ProtectedRoute>} />
            <Route path="/admin/complaints" element={<ProtectedRoute role={UserRole.ADMIN} permission="manage_support"><DashboardLayout><Complaints /></DashboardLayout></ProtectedRoute>} />
            <Route path="/admin/settings" element={<ProtectedRoute role={UserRole.ADMIN} permission="manage_system"><DashboardLayout><AdminSettings /></DashboardLayout></ProtectedRoute>} />

            {/* Public Routes (No Auth Required) */}
            <Route path="/track-repair" element={<TrackRepair />} />
            <Route path="/track-repair/:trackingId" element={<TrackRepair />} />
          </Routes>
          <AIChatbot />
        </Router>
      </CurrencyProvider>
    </AuthProvider>
  );
};

const AdminPlans = () => <Plans />;

export default App;
