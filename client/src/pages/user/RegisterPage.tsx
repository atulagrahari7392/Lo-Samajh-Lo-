import React from 'react';
import LoginPage from './LoginPage';

export const RegisterPage: React.FC = () => {
  // Reuses the compact unified Auth component with mode='register'
  return <LoginPage />;
};

export default RegisterPage;
