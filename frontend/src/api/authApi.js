import { post } from './apiClient';

export const authApi = {
  login: (email, password) => post('/auth/login', { email, password }),
  register: (email, password) => post('/auth/register', { email, password }),
  verifyOtp: (email, otp) => post('/auth/verify-otp', { email, otp }),
  forgotPassword: (email) => post('/auth/forgot-password', { email }),
  verifyOtpResetPassword: (email, otp) => post('/auth/verify-otp-to-reset-password', { email, otp }),
  resetPassword: (email, newPassword, reEnterPassword) =>
    post('/auth/reset-password', { email, newPassword, reEnterPassword }),
  refresh: (refreshToken) => post('/auth/refresh', { refreshToken }),
  logout: (token) => post('/auth/logout', { token }),
};
