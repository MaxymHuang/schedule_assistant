import React from 'react';
import type { Equipment } from '../types';

interface EquipmentDetailsModalProps {
  equipment: Equipment;
  onClose: () => void;
  onBookNow?: () => void;
}

const EquipmentDetailsModal: React.FC<EquipmentDetailsModalProps> = ({ 
  equipment, 
  onClose, 
  onBookNow 
}) => {
  const handleOverlayClick = (e: React.MouseEvent) => {
    // Only close if clicking directly on the overlay, not on child elements
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="text-xl font-semibold text-gray-900">Equipment Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="modal-body">
          <div className="space-y-6">
            {/* Equipment Image */}
            {equipment.image_url && (
              <div className="w-full">
                <img
                  src={equipment.image_url}
                  alt={equipment.name}
                  className="w-full h-64 object-cover rounded-lg"
                />
              </div>
            )}

            {/* Equipment Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <p className="text-sm text-gray-900">{equipment.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Model</label>
                    <p className="text-sm text-gray-900">{equipment.model}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Category</label>
                    <p className="text-sm text-gray-900">{equipment.category}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      equipment.status === 'available' 
                        ? 'bg-green-100 text-green-800' 
                        : equipment.status === 'borrowed'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {equipment.status}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Details</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <p className="text-sm text-gray-900">
                      {equipment.description || 'No description available'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Added Date</label>
                    <p className="text-sm text-gray-900">
                      {new Date(equipment.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="btn btn-secondary"
              style={{ flex: 1 }}
            >
              Close
            </button>
            {equipment.status === 'available' && onBookNow && (
              <button
                onClick={onBookNow}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                Book Now
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EquipmentDetailsModal;
