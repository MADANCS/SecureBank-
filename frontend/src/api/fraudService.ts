import instance from './axiosInstance';
import { Transaction } from '../types';

export const fraudService = {
  /**
   * Get all transactions blocked by the fraud engine
   */
  getFraudulentTransactions: async (): Promise<Transaction[]> => {
    try {
      const response = await instance.get('/admin/fraud/transactions');
      return response.data;
    } catch (error) {
      console.error('Error fetching fraudulent transactions:', error);
      throw error;
    }
  },

  /**
   * Approve a flagged transaction
   */
  approveTransaction: async (transactionId: number | string): Promise<any> => {
    try {
      const response = await instance.post(`/admin/fraud/transactions/${transactionId}/approve`);
      return response.data;
    } catch (error) {
      console.error('Error approving fraud transaction:', error);
      throw error;
    }
  },

  /**
   * Reject a flagged transaction
   */
  rejectTransaction: async (transactionId: number | string): Promise<any> => {
    try {
      const response = await instance.post(`/admin/fraud/transactions/${transactionId}/reject`);
      return response.data;
    } catch (error) {
      console.error('Error rejecting fraud transaction:', error);
      throw error;
    }
  }
};

export default fraudService;
