import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-white shadow">
      <div className="container">
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-900">Equipment Lending System</h1>
          </div>
          
          <div className="flex items-center space-x-6">
            {user && (
              <>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Welcome,</span>
                  <span className="text-sm font-medium text-gray-900">{user.name}</span>
                  {user.role === 'ADMIN' && (
                    <span className="badge badge-info">Admin</span>
                  )}
                </div>
                <button
                  onClick={logout}
                  className="btn btn-secondary"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
