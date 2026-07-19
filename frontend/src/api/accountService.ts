import instance from './axiosInstance';
import { Account, AccountResponse, ApiResponse, DashboardStats } from '../types/index';

export const accountService = {
  /**
   * Get all accounts for the current user
   */
  getAccounts: async (): Promise<Account[]> => {
    try {
      const response = await instance.get('/accounts');
      // Backend returns plain array directly
      const data = response.data;
      return Array.isArray(data) ? data : (data?.data || []);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      throw error;
    }
  },

  /**
   * Get a specific account by ID
   */
  getAccountById: async (accountId: string): Promise<Account> => {
    try {
      const response = await instance.get<ApiResponse<Account>>(`/accounts/${accountId}`);
      if (!response.data.data) {
        throw new Error('Account not found');
      }
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching account ${accountId}:`, error);
      throw error;
    }
  },

  /**
   * Get account balance
   */
  getAccountBalance: async (accountId: string): Promise<number> => {
    try {
      const account = await accountService.getAccountById(accountId);
      return account.balance;
    } catch (error) {
      console.error(`Error fetching account balance for ${accountId}:`, error);
      throw error;
    }
  },

  /**
   * Get dashboard statistics
   */
  getDashboardStats: async (): Promise<DashboardStats> => {
    try {
      const response = await instance.get<ApiResponse<DashboardStats>>('/accounts/dashboard/stats');
      if (!response.data.data) {
        throw new Error('Dashboard stats not available');
      }
      return response.data.data;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  },

  /**
   * Update account details (admin only)
   */
  updateAccount: async (accountId: string, data: Partial<Account>): Promise<Account> => {
    try {
      const response = await instance.put<ApiResponse<Account>>(`/accounts/${accountId}`, data);
      if (!response.data.data) {
        throw new Error('Failed to update account');
      }
      return response.data.data;
    } catch (error) {
      console.error(`Error updating account ${accountId}:`, error);
      throw error;
    }
  },

  createAccount: async (accountType: string): Promise<Account> => {
    try {
      const response = await instance.post(`/accounts?accountType=${accountType}`);
      return response.data;
    } catch (error) {
      console.error('Error creating account:', error);
      throw error;
    }
  },

  depositFunds: async (accountNumber: string, amount: number): Promise<Account> => {
    try {
      const response = await instance.post(`/accounts/${accountNumber}/deposit?amount=${amount}`);
      return response.data;
    } catch (error) {
      console.error('Error depositing funds:', error);
      throw error;
    }
  },

  adminCreateAccount: async (username: string, accountType: string): Promise<Account> => {
    try {
      const response = await instance.post(`/accounts/admin/create?username=${username}&accountType=${accountType}`);
      return response.data;
    } catch (error) {
      console.error('Error creating account via admin:', error);
      throw error;
    }
  },

  adminDepositFunds: async (accountNumber: string, amount: number): Promise<Account> => {
    try {
      const response = await instance.post(`/accounts/admin/${accountNumber}/deposit?amount=${amount}`);
      return response.data;
    } catch (error) {
      console.error('Error depositing funds via admin:', error);
      throw error;
    }
  },

  adminProvisionAccount: async (
    username: string,
    accountType: string,
    initialDeposit: number
  ): Promise<{
    accountNumber: string;
    accountType: string;
    username: string;
    email: string;
    balance: number;
    active: boolean;
    initialDeposit: number;
    transactionRef: string | null;
    provisionedBy: string;
    provisionedAt: string;
  }> => {
    const response = await instance.post(
      `/accounts/admin/provision?username=${encodeURIComponent(username)}&accountType=${accountType}&initialDeposit=${initialDeposit}`
    );
    return response.data;
  },
};

export default accountService;
