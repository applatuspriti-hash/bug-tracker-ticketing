import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from 'contexts/AuthContext';

import Loader from 'ui-component/Loader';

const ProtectedHandler = ({ requiredRole, children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return <Loader />;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (requiredRole && user.role !== requiredRole) {
        // If user is logged in but doesn't have the role, redirect based on their role
        return <Navigate to={user.role === 'admin' ? '/dashboard/default' : '/tickets'} replace />;
    }

    return children ? children : <Outlet />;
};

export default ProtectedHandler;
