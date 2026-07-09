import React from 'react';
import AuthForm from '@/components/AuthForm';

export const metadata = {
  title: 'Login - OX WebTV',
};

export default function LoginPage() {
  return (
    <div className="flex-1 flex flex-col relative w-full pt-20 pb-12 items-center justify-center min-h-[80vh]">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[#00f0ff]/10 blur-[150px] rounded-full pointer-events-none"></div>
      
      <div className="w-full px-4 sm:px-6 lg:px-8 z-10 flex flex-col items-center max-w-7xl mx-auto">
        <AuthForm type="login" />
      </div>
    </div>
  );
}
