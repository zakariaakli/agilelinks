import React from 'react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

const LogoutButton: React.FC = () => {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <button onClick={handleLogout}>
      Log out
    </button>
  );
};

export default LogoutButton;