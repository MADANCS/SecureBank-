// Timeout handle type (avoids @types/node dependency)
export type TimeoutHandle = ReturnType<typeof setTimeout>;
export type IntervalHandle = ReturnType<typeof setInterval>;

// Account Related Types
export interface Account {
  id: number;
  accountNumber: string;
  accountType: 'SAVINGS' | 'CURRENT' | 'LOAN' | string;
  balance: number;
  active: boolean;
  status?: 'ACTIVE' | 'INACTIVE' | 'DORMANT';
  createdAt: string;
  updatedAt: string | null;
  owner?: { username: string; email: string; role: string; kycStatus: string };
}

export interface AccountResponse {
  accountNumber: string;
  accountType: string;
  balance: number;
}

// User Related Types
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  createdAt: string;
  kycStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  lastLogin: string;
}

// Transaction Related Types
export interface Transaction {
  id: number;
  transactionId?: string;
  fromAccount: string;
  toAccount: string;
  amount: number;
  type?: 'DEBIT' | 'CREDIT' | 'TRANSFER';
  status: 'SUCCESS' | 'PENDING' | 'FAILED' | 'COMPLETED' | 'PROCESSING' | 'CANCELLED';
  description?: string;
  timestamp?: string;
  createdAt?: string;
  date?: string;
  time?: string;
}

export interface TransactionRequest {
  toAccount: string;
  amount: number;
  description?: string;
  idempotencyKey?: string;
  otp?: string;
  transactionPin?: string;
}

export interface TransactionResponse {
  transactionId: string;
  status: string;
  amount: number;
  timestamp: string;
  message: string;
}

// Payment Related Types
export interface Payment {
  id: string;
  paymentId: string;
  amount: number;
  payeeAccount: string;
  payerAccount: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED' | 'CANCELLED';
  method: 'NET_BANKING' | 'UPI' | 'CARD' | 'WALLET';
  timestamp: string;
  description: string;
}

export interface PaymentRequest {
  toAccount: string;
  amount: number;
  method: string;
  description?: string;
}

export interface PaymentResponse {
  paymentId: string;
  status: string;
  amount: number;
  timestamp: string;
  message: string;
}

export interface Notification {
  id: string;
  username: string;
  type: string;
  title: string;
  message: string;
  timestamp: string;
}

// Recurring Payment Types
export interface RecurringPayment {
  id: string;
  recurringPaymentId: string;
  toAccount: string;
  amount: number;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  nextDueDate: string;
  status: 'ACTIVE' | 'INACTIVE' | 'COMPLETED';
  startDate: string;
  endDate?: string;
  description: string;
}

export interface RecurringPaymentRequest {
  toAccount: string;
  amount: number;
  frequency: string;
  startDate: string;
  endDate?: string;
  description?: string;
}

// Loan Related Types
export interface LoanApplication {
  id: string;
  loanApplicationId: string;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'DISBURSED' | 'ACTIVE' | 'CLOSED';
  loanType: 'PERSONAL' | 'HOME' | 'AUTO' | 'EDUCATIONAL';
  interestRate: number;
  tenure: number;
  emiAmount: number;
  appliedDate: string;
  approvedDate?: string;
  description: string;
}

export interface LoanSummary {
  totalLoans: number;
  activeLoans: number;
  totalOutstanding: number;
  nextEmiDate: string;
  nextEmiAmount: number;
}

export interface LoanApplicationRequest {
  amount: number;
  loanType: string;
  tenure: number;
  description?: string;
}

export interface LoanApplicationResponse {
  loanApplicationId: string;
  status: string;
  amount: number;
  message: string;
}

// Auth Related Types
export interface AuthRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message: string;
  statusCode: number;
}

export interface ApiErrorResponse {
  success: boolean;
  message: string;
  statusCode: number;
}

// Pagination Types
export interface PaginationParams {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// Dashboard Stats
export interface DashboardStats {
  totalAccounts: number;
  totalBalance: number;
  recentTransactions: Transaction[];
  accountsSummary: Account[];
}

// Error Handling
export interface AppError {
  message: string;
  code: string;
  timestamp: string;
  status: number;
}
