import { apiClient } from './apiClient';

export const adminApi = {
  // Get platform-wide aggregation statistics
  getAggregation: async () => {
    const response = await apiClient.get('/admin/dashboard/aggregation');
    return response.data;
  },

  // Get all users
  getAllUsers: async () => {
    const response = await apiClient.get('/admin/dashboard/users');
    return response.data;
  },

  // Get all repairs
  getAllRepairs: async () => {
    const response = await apiClient.get('/admin/dashboard/repairs');
    return response.data;
  },

  // Get all sales
  getAllSales: async () => {
    const response = await apiClient.get('/admin/dashboard/sales');
    return response.data;
  },

  // Get all inventory
  getAllInventory: async () => {
    const response = await apiClient.get('/admin/dashboard/inventory');
    return response.data;
  },

  // Get all complaints
  getAllComplaints: async () => {
    const response = await apiClient.get('/admin/dashboard/complaints');
    return response.data;
  },

  // Get all transactions
  getAllTransactions: async () => {
    const response = await apiClient.get('/admin/dashboard/transactions');
    return response.data;
  },

  // Toggle user status
  toggleUserStatus: async (userId: string) => {
    const response = await apiClient.patch(`/admin/dashboard/users/${userId}/toggle-status`);
    return response.data;
  },

  // Delete user
  deleteUser: async (userId: string) => {
    const response = await apiClient.delete(`/admin/dashboard/users/${userId}`);
    return response.data;
  }
};
