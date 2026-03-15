import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const HomeRedirect: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/generate', { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Show loading state while redirecting
  return (
    <div className="min-h-screen bg-gradient-to-br from-neon-darker via-neon-dark to-neon-light flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-neon-pink border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-neon-cyan">Redirecting...</p>
      </div>
    </div>
  );
};

export default HomeRedirect;
