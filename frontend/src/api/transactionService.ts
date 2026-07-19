import instance from './axiosInstance';
import { Transaction, TransactionRequest, ApiResponse, PaginatedResponse } from '../types/index';

export const transactionService = {
  /**
   * Get all transactions for the current user
   */
  getTransactions: async (page: number = 1, pageSize: number = 10): Promise<PaginatedResponse<Transaction>> => {
    try {
      const accountsResp = await instance.get('/accounts');
      const accounts = accountsResp.data;
      if (!accounts || accounts.length === 0) {
        return { content: [], totalElements: 0, totalPages: 0, currentPage: 0, pageSize, hasNext: false, hasPrevious: false };
      }
      
      let allTx: Transaction[] = [];
      for (const acc of accounts) {
        const response = await instance.get('/transactions', {
          params: { accountNumber: acc.accountNumber, page: 0, size: 50 },
        });
        const data = response.data;
        allTx = [...allTx, ...(data?.content ?? [])];
      }
      
      allTx = Array.from(new Map(allTx.map(t => [t.id, t])).values());
      allTx.sort((a: any, b: any) => new Date(b.createdAt ?? b.timestamp).getTime() - new Date(a.createdAt ?? a.timestamp).getTime());
      
      const startIndex = (page - 1) * pageSize;
      const content = allTx.slice(startIndex, startIndex + pageSize);

      return {
        content,
        totalElements: allTx.length,
        totalPages: Math.ceil(allTx.length / pageSize),
        currentPage: page - 1,
        pageSize,
        hasNext: startIndex + pageSize < allTx.length,
        hasPrevious: page > 1,
      };
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
  },

  /**
   * Get a specific transaction by ID
   */
  getTransactionById: async (transactionId: string): Promise<Transaction> => {
    try {
      const response = await instance.get<ApiResponse<Transaction>>(`/transactions/${transactionId}`);
      if (!response.data.data) {
        throw new Error('Transaction not found');
      }
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching transaction ${transactionId}:`, error);
      throw error;
    }
  },

  /**
   * Create a new transaction (transfer)
   * Backend expects: { fromAccount, toAccount, amount, idempotencyKey, otp? }
   */
  createTransaction: async (data: TransactionRequest & { fromAccount: string; otp?: string }): Promise<any> => {
    try {
      const response = await instance.post('/transactions/transfer', data);
      return response.data;
    } catch (error: any) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  },

  /**
   * Get transactions by account number (matches backend /api/transactions?accountNumber=...)
   */
  getAccountTransactions: async (
    accountNumber: string,
    page: number = 0,
    pageSize: number = 10
  ): Promise<any> => {
    try {
      const response = await instance.get('/transactions', {
        params: { accountNumber, page, size: pageSize },
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching transactions for account ${accountNumber}:`, error);
      throw error;
    }
  },

  /**
   * Get recent transactions — uses account transactions endpoint
   * Falls back gracefully if no account available
   */
  getRecentTransactions: async (limit: number = 5): Promise<Transaction[]> => {
    try {
      const accountsResp = await instance.get('/accounts');
      const accounts = accountsResp.data;
      if (!accounts || accounts.length === 0) return [];

      let allTx: Transaction[] = [];
      for (const acc of accounts) {
        const response = await instance.get('/transactions', {
          params: { accountNumber: acc.accountNumber, page: 0, size: limit },
        });
        const data = response.data;
        allTx = [...allTx, ...(data?.content ?? (Array.isArray(data) ? data : []))];
      }

      allTx = Array.from(new Map(allTx.map(t => [t.id, t])).values());
      allTx.sort((a: any, b: any) => new Date(b.createdAt ?? b.timestamp).getTime() - new Date(a.createdAt ?? a.timestamp).getTime());

      return allTx.slice(0, limit);
    } catch (error) {
      console.error('Error fetching recent transactions:', error);
      return [];
    }
  },

  /**
   * Get transaction status by ID
   */
  getTransactionStatus: async (id: string | number): Promise<{ id: any; status: string }> => {
    const response = await instance.get(`/transactions/${id}/status`);
    return response.data;
  },

  /**
   * Export transactions (CSV or PDF)
   */
  exportTransactions: async (format: 'CSV' | 'PDF', fromDate?: string, toDate?: string): Promise<Blob> => {
    try {
      // Get first account number for PDF statement
      const accountsResp = await instance.get('/accounts');
      const accounts = accountsResp.data;
      if (!accounts || accounts.length === 0) throw new Error('No accounts found');
      const accountNumber = accounts[0].accountNumber;
      const response = await instance.get(`/statements/${accountNumber}/pdf`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error('Error exporting transactions:', error);
      throw error;
    }
  },
};

export default transactionService;
