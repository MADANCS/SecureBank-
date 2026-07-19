import instance from './axiosInstance';
import { Payment, PaymentRequest, PaymentResponse, PaginatedResponse, RecurringPayment, RecurringPaymentRequest } from '../types/index';

export const paymentService = {
  /**
   * Get all payment orders for the current user (bill payments history)
   * Backend: GET /payments/history?accountNumber=...
   * Falls back gracefully with empty list if no endpoint exists
   */
  getPayments: async (page: number = 1, pageSize: number = 10): Promise<PaginatedResponse<Payment>> => {
    try {
      const accountsResp = await instance.get('/accounts');
      const accounts = accountsResp.data;
      if (!accounts || accounts.length === 0) {
        return { content: [], totalElements: 0, totalPages: 0, currentPage: 0, pageSize, hasNext: false, hasPrevious: false };
      }
      const accountNumber = accounts[0].accountNumber;

      // Try /payments/history endpoint; if missing, return empty (graceful fallback)
      const response = await instance.get('/payments/history', {
        params: { accountNumber, page: page - 1, size: pageSize },
      }).catch(() => ({ data: { content: [], totalPages: 0, totalElements: 0, number: 0, size: pageSize, last: true, first: true } }));

      const data = response.data;
      return {
        content: data?.content ?? (Array.isArray(data) ? data : []),
        totalElements: data?.totalElements ?? 0,
        totalPages: data?.totalPages ?? 0,
        currentPage: data?.number ?? 0,
        pageSize: data?.size ?? pageSize,
        hasNext: !data?.last,
        hasPrevious: !data?.first,
      };
    } catch (error) {
      console.error('Error fetching payments:', error);
      return { content: [], totalElements: 0, totalPages: 0, currentPage: 0, pageSize, hasNext: false, hasPrevious: false };
    }
  },

  /**
   * Create a new bill payment
   * Backend: POST /payments/bill  { accountNumber, billType, reference, amount }
   */
  createPayment: async (data: PaymentRequest & { fromAccount?: string }): Promise<PaymentResponse> => {
    try {
      const payload = {
        accountNumber: data.fromAccount,         // source account
        billType: data.method || 'BILL_PAYMENT', // e.g. NET_BANKING, UPI, CARD
        reference: data.toAccount,               // biller/payee reference
        amount: data.amount,
      };
      const response = await instance.post('/payments/bill', payload);
      // Backend returns PaymentResponse directly (not wrapped)
      return response.data;
    } catch (error) {
      console.error('Error creating payment:', error);
      throw error;
    }
  },

  /**
   * Get recurring payments for the current user
   * Backend: GET /payments/recurring?accountNumber=...  returns List<RecurringPaymentResponse> directly
   */
  getRecurringPayments: async (page: number = 1, pageSize: number = 10): Promise<PaginatedResponse<RecurringPayment>> => {
    try {
      const accountsResp = await instance.get('/accounts');
      const accounts = accountsResp.data;
      if (!accounts || accounts.length === 0) {
        return { content: [], totalElements: 0, totalPages: 1, currentPage: 0, pageSize: 0, hasNext: false, hasPrevious: false };
      }
      const accountNumber = accounts[0].accountNumber;

      const response = await instance.get('/payments/recurring', {
        params: { accountNumber },
      });

      // Backend returns List<RecurringPaymentResponse> directly (not paginated)
      const data = Array.isArray(response.data) ? response.data : (response.data?.content ?? []);
      return {
        content: data,
        totalElements: data.length,
        totalPages: 1,
        currentPage: 0,
        pageSize: data.length,
        hasNext: false,
        hasPrevious: false,
      };
    } catch (error) {
      console.error('Error fetching recurring payments:', error);
      return { content: [], totalElements: 0, totalPages: 1, currentPage: 0, pageSize: 0, hasNext: false, hasPrevious: false };
    }
  },

  /**
   * Create a recurring payment
   * Backend: POST /payments/recurring  { accountNumber, billType, reference, amount, frequency }
   * nextExecutionAt is computed by the backend from frequency + now
   */
  createRecurringPayment: async (data: RecurringPaymentRequest & { fromAccount?: string }): Promise<RecurringPayment> => {
    try {
      // Compute nextExecutionAt from startDate (or default to tomorrow)
      const startDate = data.startDate ? new Date(data.startDate) : new Date();
      if (!data.startDate) startDate.setDate(startDate.getDate() + 1);

      const payload = {
        accountNumber: data.fromAccount,
        billType: data.description || 'RECURRING',  // used as bill category label
        reference: data.toAccount,                   // biller reference
        amount: data.amount,
        frequency: data.frequency,
        nextExecutionAt: startDate.toISOString(),    // backend field name
      };
      const response = await instance.post('/payments/recurring', payload);
      return response.data;
    } catch (error) {
      console.error('Error creating recurring payment:', error);
      throw error;
    }
  },

  /**
   * Cancel a recurring payment
   * Backend: DELETE /payments/recurring/{id}
   */
  cancelRecurringPayment: async (recurringPaymentId: string): Promise<void> => {
    try {
      await instance.delete(`/payments/recurring/${recurringPaymentId}`);
    } catch (error) {
      console.error(`Error canceling recurring payment ${recurringPaymentId}:`, error);
      throw error;
    }
  },

  /**
   * Verify payment status
   */
  verifyPayment: async (paymentId: string): Promise<Payment> => {
    try {
      const response = await instance.get<Payment>(`/payments/${paymentId}/verify`);
      return response.data;
    } catch (error) {
      console.error(`Error verifying payment ${paymentId}:`, error);
      throw error;
    }
  },
};

export default paymentService;
