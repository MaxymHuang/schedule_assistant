import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';

interface DatabaseStats {
  users: number;
  admins: number;
  regular_users: number;
  categories: number;
  equipment: number;
  available_equipment: number;
  borrowed_equipment: number;
  bookings: number;
  active_bookings: number;
  completed_bookings: number;
  cancelled_bookings: number;
}


const AdminDatabasePanel: React.FC = () => {
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [oldBookingsDays, setOldBookingsDays] = useState(30);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getDatabaseStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch database stats:', error);
      setMessage({ type: 'error', text: 'Failed to fetch database statistics' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleAction = async (action: () => Promise<any>, actionName: string) => {
    try {
      setActionLoading(actionName);
      const result = await action();
      showMessage('success', result.message);
      await fetchStats(); // Refresh stats after action
    } catch (error) {
      console.error(`Failed to ${actionName}:`, error);
      showMessage('error', `Failed to ${actionName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCleanAllBookings = () => {
    if (window.confirm('⚠️ Are you sure you want to delete ALL bookings? This action cannot be undone.')) {
      handleAction(() => apiClient.cleanAllBookings(), 'clean all bookings');
    }
  };

  const handleCleanAllEquipment = () => {
    if (window.confirm('⚠️ Are you sure you want to delete ALL equipment? This action cannot be undone.')) {
      handleAction(() => apiClient.cleanAllEquipment(), 'clean all equipment');
    }
  };

  const handleCleanOldBookings = () => {
    if (window.confirm(`⚠️ Are you sure you want to delete bookings older than ${oldBookingsDays} days?`)) {
      handleAction(() => apiClient.cleanOldBookings(oldBookingsDays), 'clean old bookings');
    }
  };

  const handleCleanCompletedCancelled = () => {
    if (window.confirm('⚠️ Are you sure you want to delete all completed and cancelled bookings?')) {
      handleAction(() => apiClient.cleanCompletedCancelledBookings(), 'clean completed/cancelled bookings');
    }
  };

  const handleResetEquipmentStatus = () => {
    if (window.confirm('⚠️ Are you sure you want to reset all equipment status to available?')) {
      handleAction(() => apiClient.resetEquipmentStatus(), 'reset equipment status');
    }
  };

  const handleCleanAll = () => {
    if (window.confirm('⚠️ Are you sure you want to delete ALL bookings AND equipment? This action cannot be undone.')) {
      handleAction(() => apiClient.cleanAllBookingsAndEquipment(), 'clean all bookings and equipment');
    }
  };

  const handleCleanNonAdminUsers = () => {
    if (window.confirm('⚠️ Are you sure you want to delete all non-admin users? This action cannot be undone.')) {
      handleAction(() => apiClient.cleanNonAdminUsers(), 'clean non-admin users');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Failed to load database statistics</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Message Display */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Database Statistics */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">📊 Database Statistics</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-blue-600">Users</h3>
            <p className="text-2xl font-bold text-blue-900">{stats.users}</p>
            <p className="text-xs text-blue-600">Admins: {stats.admins} | Regular: {stats.regular_users}</p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-green-600">Equipment</h3>
            <p className="text-2xl font-bold text-green-900">{stats.equipment}</p>
            <p className="text-xs text-green-600">Available: {stats.available_equipment} | Borrowed: {stats.borrowed_equipment}</p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-purple-600">Bookings</h3>
            <p className="text-2xl font-bold text-purple-900">{stats.bookings}</p>
            <p className="text-xs text-purple-600">Active: {stats.active_bookings} | Completed: {stats.completed_bookings} | Cancelled: {stats.cancelled_bookings}</p>
          </div>
          
          <div className="bg-orange-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-orange-600">Categories</h3>
            <p className="text-2xl font-bold text-orange-900">{stats.categories}</p>
          </div>
        </div>
        
        <div className="mt-4">
          <button
            onClick={fetchStats}
            className="btn btn-secondary"
            disabled={loading}
          >
            {loading ? 'Refreshing...' : '🔄 Refresh Stats'}
          </button>
        </div>
      </div>

      {/* Cleanup Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">🧹 Database Cleanup</h2>
        
        <div className="space-y-6">
          {/* Bookings Cleanup */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📅 Bookings Cleanup</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={handleCleanAllBookings}
                disabled={actionLoading === 'clean all bookings'}
                className="btn btn-danger"
              >
                {actionLoading === 'clean all bookings' ? 'Cleaning...' : '🗑️ Clean All Bookings'}
              </button>
              
              <button
                onClick={handleCleanCompletedCancelled}
                disabled={actionLoading === 'clean completed/cancelled bookings'}
                className="btn btn-warning"
              >
                {actionLoading === 'clean completed/cancelled bookings' ? 'Cleaning...' : '🧹 Clean Completed/Cancelled'}
              </button>
              
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={oldBookingsDays}
                  onChange={(e) => setOldBookingsDays(parseInt(e.target.value) || 30)}
                  className="input"
                  min="1"
                  max="365"
                />
                <button
                  onClick={handleCleanOldBookings}
                  disabled={actionLoading === 'clean old bookings'}
                  className="btn btn-warning"
                >
                  {actionLoading === 'clean old bookings' ? 'Cleaning...' : '🗓️ Clean Old Bookings'}
                </button>
              </div>
            </div>
          </div>

          {/* Equipment Cleanup */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🔧 Equipment Cleanup</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={handleCleanAllEquipment}
                disabled={actionLoading === 'clean all equipment'}
                className="btn btn-danger"
              >
                {actionLoading === 'clean all equipment' ? 'Cleaning...' : '🗑️ Clean All Equipment'}
              </button>
              
              <button
                onClick={handleResetEquipmentStatus}
                disabled={actionLoading === 'reset equipment status'}
                className="btn btn-warning"
              >
                {actionLoading === 'reset equipment status' ? 'Resetting...' : '🔄 Reset Equipment Status'}
              </button>
            </div>
          </div>

          {/* Users Cleanup */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">👥 Users Cleanup</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={handleCleanNonAdminUsers}
                disabled={actionLoading === 'clean non-admin users'}
                className="btn btn-danger"
              >
                {actionLoading === 'clean non-admin users' ? 'Cleaning...' : '🗑️ Clean Non-Admin Users'}
              </button>
            </div>
          </div>

          {/* Nuclear Option */}
          <div className="border border-red-200 rounded-lg p-4 bg-red-50">
            <h3 className="text-lg font-semibold text-red-900 mb-4">⚠️ Nuclear Options</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={handleCleanAll}
                disabled={actionLoading === 'clean all bookings and equipment'}
                className="btn btn-danger"
              >
                {actionLoading === 'clean all bookings and equipment' ? 'Cleaning...' : '💥 Clean All Bookings & Equipment'}
              </button>
            </div>
            <p className="text-sm text-red-600 mt-2">
              ⚠️ These actions are irreversible and will delete all data except admin users and categories.
            </p>
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">ℹ️ Help & Information</h3>
        <div className="text-sm text-blue-800 space-y-2">
          <p><strong>Clean All Bookings:</strong> Removes all booking records from the database.</p>
          <p><strong>Clean Completed/Cancelled:</strong> Removes only completed and cancelled bookings, keeping active ones.</p>
          <p><strong>Clean Old Bookings:</strong> Removes bookings older than the specified number of days.</p>
          <p><strong>Clean All Equipment:</strong> Removes all equipment records from the database.</p>
          <p><strong>Reset Equipment Status:</strong> Sets all equipment status to "available" without deleting records.</p>
          <p><strong>Clean Non-Admin Users:</strong> Removes all regular users, keeping only admin accounts.</p>
          <p><strong>Clean All:</strong> Removes all bookings and equipment in one operation.</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDatabasePanel;
