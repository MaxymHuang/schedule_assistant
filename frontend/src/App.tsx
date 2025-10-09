import React, { useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import LoginModern from './components/LoginModern';
import LoginSplit from './components/LoginSplit';
import LoginFigma from './components/LoginFigma';
import RegisterFigma from './components/RegisterFigma';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import EquipmentList from './components/EquipmentList';
import AdminEquipmentList from './components/AdminEquipmentList';
import CategoryManagement from './components/CategoryManagement';
import AdminDatabasePanel from './components/AdminDatabasePanel';
import BookingModal from './components/BookingModal';
import EquipmentDetailsModal from './components/EquipmentDetailsModal';
import BookingList from './components/BookingList';
import EquipmentBookingCalendar from './components/EquipmentBookingCalendar';
import type { Equipment } from './types';

const App: React.FC = () => {
  const { isAuthenticated, loading, user } = useAuth();
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'equipment' | 'bookings' | 'booking-calendar' | 'admin' | 'database'>('equipment');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [useModernLogin] = useState(false);
  const [useSplitLogin] = useState(false);
  const [useFigmaLogin] = useState(true);

  const handleViewDetails = (equipment: Equipment) => {
    setSelectedEquipment(equipment);
    setShowDetailsModal(true);
  };

  const handleBookNow = (equipment: Equipment) => {
    setSelectedEquipment(equipment);
    setShowBookingForm(true);
  };

  const handleBookingSuccess = () => {
    setShowBookingForm(false);
    setSelectedEquipment(null);
    // Optionally refresh the equipment list or show a success message
  };

  const handleDetailsClose = () => {
    setShowDetailsModal(false);
    setSelectedEquipment(null);
  };

  const handleBookNowFromDetails = () => {
    setShowDetailsModal(false);
    setShowBookingForm(true);
  };

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  // Show login/register forms if not authenticated
  if (!isAuthenticated) {
    return (
      <>
        {authMode === 'login' ? (
          useFigmaLogin ? (
            <LoginFigma onSwitchToRegister={() => setAuthMode('register')} />
          ) : useSplitLogin ? (
            <LoginSplit onSwitchToRegister={() => setAuthMode('register')} />
          ) : useModernLogin ? (
            <LoginModern onSwitchToRegister={() => setAuthMode('register')} />
          ) : (
            <Login onSwitchToRegister={() => setAuthMode('register')} />
          )
        ) : (
          <RegisterFigma onSwitchToLogin={() => setAuthMode('login')} />
        )}
      </>
    );
  }

  // Show main application if authenticated
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navbar />

        {/* Navigation Tabs */}
        <div className="container py-8">
          <div className="border-b border-gray-200">
            <nav className="nav-tabs">
              <button
                onClick={() => setActiveTab('equipment')}
                className={`nav-tab ${activeTab === 'equipment' ? 'active' : ''}`}
              >
                Equipment
              </button>
              <button
                onClick={() => setActiveTab('bookings')}
                className={`nav-tab ${activeTab === 'bookings' ? 'active' : ''}`}
              >
                My Bookings
              </button>
              <button
                onClick={() => setActiveTab('booking-calendar')}
                className={`nav-tab ${activeTab === 'booking-calendar' ? 'active' : ''}`}
              >
                Booking Calendar
              </button>
              {user?.role === 'admin' && (
                <>
                  <button
                    onClick={() => setActiveTab('admin')}
                    className={`nav-tab ${activeTab === 'admin' ? 'active' : ''}`}
                  >
                    Admin Panel
                  </button>
                  <button
                    onClick={() => setActiveTab('database')}
                    className={`nav-tab ${activeTab === 'database' ? 'active' : ''}`}
                  >
                    Database
                  </button>
                </>
              )}
            </nav>
          </div>

          {/* Content */}
          <div className="mt-8">
            {activeTab === 'equipment' && (
              <EquipmentList 
                onViewDetails={handleViewDetails}
                onBookNow={handleBookNow}
              />
            )}
            {activeTab === 'bookings' && <BookingList />}
            {activeTab === 'booking-calendar' && <EquipmentBookingCalendar />}
            {activeTab === 'admin' && user?.role === 'admin' && (
              <ProtectedRoute requireAdmin={true}>
                <div className="space-y-16">
                  <AdminEquipmentList />
                  <CategoryManagement />
                </div>
              </ProtectedRoute>
            )}
            {activeTab === 'database' && user?.role === 'admin' && (
              <ProtectedRoute requireAdmin={true}>
                <AdminDatabasePanel />
              </ProtectedRoute>
            )}
          </div>
        </div>

        {/* Equipment Details Modal */}
        {showDetailsModal && selectedEquipment && (
          <EquipmentDetailsModal
            equipment={selectedEquipment}
            onClose={handleDetailsClose}
            onBookNow={handleBookNowFromDetails}
          />
        )}

        {/* Booking Modal */}
        {showBookingForm && selectedEquipment && (
          <BookingModal
            equipment={selectedEquipment}
            onClose={() => {
              setShowBookingForm(false);
              setSelectedEquipment(null);
            }}
            onSuccess={handleBookingSuccess}
          />
        )}
      </div>
    </ProtectedRoute>
  );
};

export default App;