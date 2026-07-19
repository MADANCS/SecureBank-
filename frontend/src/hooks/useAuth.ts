import { useState } from 'react';
import axios from '../api/axiosInstance';

type LoginPayload = {
  username: string;
  password: string;
};

export function useAuth() {
  const [username, setUsername] = useState<string | null>(localStorage.getItem('username'));
  const [error, setError] = useState<string | null>(null);

  const login = async (payload: LoginPayload) => {
    try {
      const result = await axios.post('/auth/login', payload);
      localStorage.setItem('accessToken', result.data.accessToken);
      localStorage.setItem('refreshToken', result.data.refreshToken);
      localStorage.setItem('username', result.data.username);
      setUsername(result.data.username);
      setError(null);
      return true;
    } catch (err) {
      setError('Login failed. Check your credentials.');
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('username');
    setUsername(null);
  };

  return {
    username,
    error,
    login,
    logout,
  };
}
