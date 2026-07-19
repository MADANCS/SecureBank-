import instance from './axiosInstance';

// ── 2FA ─────────────────────────────────────────────────────────
export const sendOtp = (purpose = 'LOGIN') =>
  instance.post(`/v1/2fa/send-otp?purpose=${purpose}`);

export const verifyOtp = (otp: string, purpose = 'LOGIN') =>
  instance.post('/v1/2fa/verify-otp', { otp, purpose });

// ── KYC ─────────────────────────────────────────────────────────
export const uploadKycDocument = (file: File, documentType: string) => {
  const form = new FormData();
  form.append('file', file);
  form.append('documentType', documentType);
  return instance.post('/v1/kyc/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const getKycDocuments = () =>
  instance.get('/v1/kyc/documents');

export const getPendingKycDocuments = () =>
  instance.get('/v1/kyc/pending');

export const verifyKycDocument = (docId: number, approved: boolean, rejectionReason?: string) =>
  instance.post(`/v1/kyc/${docId}/verify`, { approved, rejectionReason });

// ── Nominees ─────────────────────────────────────────────────────
export const getNominees = (accountNumber: string) =>
  instance.get(`/v1/nominees/${accountNumber}`);

export const addNominee = (accountNumber: string, data: {
  nomineeName: string; relationship: string; dateOfBirth: string;
  phone: string; email?: string; sharePercentage?: number;
}) => instance.post(`/v1/nominees/${accountNumber}`, data);

export const updateNominee = (accountNumber: string, nomineeId: number, data: object) =>
  instance.put(`/v1/nominees/${accountNumber}/${nomineeId}`, data);

export const removeNominee = (accountNumber: string, nomineeId: number) =>
  instance.delete(`/v1/nominees/${accountNumber}/${nomineeId}`);

// ── Account Closure ───────────────────────────────────────────────
export const requestAccountClosure = (accountNumber: string, reason: string) =>
  instance.post('/v1/account-closure/request', { accountNumber, reason });

export const getMyClosureRequests = () =>
  instance.get('/v1/account-closure/my-requests');

export const getPendingClosureRequests = (page = 0, size = 20) =>
  instance.get('/v1/account-closure/pending', { params: { page, size } });

export const reviewClosureRequest = (requestId: number, approve: boolean, note: string) =>
  instance.post(`/v1/account-closure/${requestId}/review`, { approve, note });

// ── Notification Preferences ─────────────────────────────────────
export const getNotificationPreferences = () =>
  instance.get('/v1/profile/notification-preferences');

export const updateNotificationPreferences = (prefs: object) =>
  instance.put('/v1/profile/notification-preferences', prefs);

// ── Transaction PIN ───────────────────────────────────────────────
export const getTransactionPinStatus = () =>
  instance.get('/v1/profile/transaction-pin/status');

export const setTransactionPin = (currentPassword: string, newPin: string) =>
  instance.post('/v1/profile/transaction-pin/set', { currentPassword, newPin });

export const verifyTransactionPin = (pin: string) =>
  instance.post('/v1/profile/transaction-pin/verify', { pin });

// ── Bulk Upload ───────────────────────────────────────────────────
export const bulkUploadTransactions = (file: File) => {
  const form = new FormData();
  form.append('file', file);
  return instance.post('/v1/transactions/bulk-upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const downloadBulkTemplate = () =>
  instance.get('/v1/transactions/bulk-upload/template', { responseType: 'blob' });
