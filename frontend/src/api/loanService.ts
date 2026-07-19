import instance from './axiosInstance';
import { LoanApplication, LoanSummary, LoanApplicationRequest, LoanApplicationResponse, ApiResponse, PaginatedResponse } from '../types/index';

export const loanService = {
  /**
   * Get all loan applications for the current user
   */
  getLoanApplications: async (page: number = 1, pageSize: number = 10): Promise<PaginatedResponse<LoanApplication>> => {
    try {
      // Backend returns plain List<LoanApplicationResponse> directly
      const response = await instance.get('/loans');
      const data = Array.isArray(response.data) ? response.data : [];
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
      console.error('Error fetching loan applications:', error);
      throw error;
    }
  },

  /**
   * Get a specific loan application by ID
   */
  getLoanApplicationById: async (loanId: string): Promise<LoanApplication> => {
    try {
      const response = await instance.get<ApiResponse<LoanApplication>>(`/loans/${loanId}`);
      if (!response.data.data) {
        throw new Error('Loan application not found');
      }
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching loan ${loanId}:`, error);
      throw error;
    }
  },

  /**
   * Get loan summary for the current user
   */
  getLoanSummary: async (): Promise<LoanSummary> => {
    try {
      const response = await instance.get<ApiResponse<LoanSummary>>('/loans/summary');
      if (!response.data.data) {
        throw new Error('Loan summary not available');
      }
      return response.data.data;
    } catch (error) {
      console.error('Error fetching loan summary:', error);
      throw error;
    }
  },

  /**
   * Apply for a new loan
   * Backend expects: { accountNumber, loanType, principalAmount, tenureMonths, interestRate }
   */
  applyForLoan: async (data: LoanApplicationRequest): Promise<LoanApplicationResponse> => {
    try {
      // Fetch first account number (required by backend)
      const accountsResp = await instance.get('/accounts');
      const accounts = accountsResp.data;
      if (!accounts || accounts.length === 0) throw new Error('No account found to link loan to');
      const accountNumber = accounts[0].accountNumber;

      // Default interest rates by loan type
      const defaultRates: Record<string, number> = {
        PERSONAL: 10.5, HOME: 7.5, AUTO: 8.5, EDUCATIONAL: 6.5,
      };
      const interestRate = (data as any).interestRate ?? defaultRates[data.loanType ?? 'PERSONAL'] ?? 10.5;

      const payload = {
        accountNumber,
        loanType: data.loanType || 'PERSONAL',
        principalAmount: data.amount,
        tenureMonths: data.tenure,
        interestRate,
      };

      // Backend /loans/apply returns LoanApplicationResponse directly (not wrapped)
      const response = await instance.post('/loans/apply', payload);
      return response.data;
    } catch (error) {
      console.error('Error applying for loan:', error);
      throw error;
    }
  },

  /**
   * Get active loans
   */
  getActiveLoans: async (): Promise<LoanApplication[]> => {
    try {
      const response = await instance.get<ApiResponse<LoanApplication[]>>('/loans/active');
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching active loans:', error);
      throw error;
    }
  },

  /**
   * Get loan details with EMI schedule
   */
  getLoanDetails: async (loanId: string) => {
    try {
      const response = await instance.get(`/loans/${loanId}/details`);
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching loan details for ${loanId}:`, error);
      throw error;
    }
  },

  /**
   * Get EMI schedule for a loan
   */
  getEmiSchedule: async (loanId: string, page: number = 1, pageSize: number = 12) => {
    try {
      const response = await instance.get(`/loans/${loanId}/emi-schedule`, {
        params: { page, pageSize },
      });
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching EMI schedule for ${loanId}:`, error);
      throw error;
    }
  },

  /**
   * Apply for loan pre-approval
   */
  getPreApprovalStatus: async () => {
    try {
      const response = await instance.get('/loans/pre-approval');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching pre-approval status:', error);
      throw error;
    }
  },
};

export default loanService;
