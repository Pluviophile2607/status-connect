import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRole?: 'agent' | 'business_owner' | 'admin';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRole }) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (allowedRole && profile?.role !== allowedRole) {
    // Exception: Admin can access business_owner routes
    if (allowedRole === 'business_owner' && profile?.role === 'admin') {
      return <>{children}</>;
    }

    const redirectPath = profile?.role === 'agent' 
      ? '/agent/dashboard' 
      : profile?.role === 'admin'
        ? '/admin/dashboard'
        : '/business/dashboard'; // Fallback for legacy
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
