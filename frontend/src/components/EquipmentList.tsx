import React, { useState, useEffect } from 'react';
import type { Equipment } from '../types';
import { apiClient } from '../api/client';

interface EquipmentListProps {
  onViewDetails: (equipment: Equipment) => void;
  onBookNow: (equipment: Equipment) => void;
}

const EquipmentList: React.FC<EquipmentListProps> = ({ onViewDetails, onBookNow }) => {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [filters, setFilters] = useState({
    category: '',
    status: '',
    search: '',
  });

  useEffect(() => {
    loadEquipment();
  }, [filters]);

  const loadEquipment = async () => {
    try {
      setLoading(true);
      setError(''); // Clear any previous errors
      const data = await apiClient.getEquipment(filters);
      setEquipment(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load equipment');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadEquipment();
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const getStatusBadge = (status: string) => {
    if (status === 'available') {
      return "badge badge-success";
    }
    return "badge badge-danger";
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header with Refresh Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Equipment</h2>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="btn btn-outline btn-sm"
          title="Refresh equipment status"
        >
          <svg 
            className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
            />
          </svg>
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="form-label">
                Search
              </label>
              <input
                type="text"
                placeholder="Search by name or model..."
                className="form-input"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">
                Category
              </label>
              <select
                className="form-select"
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
              >
                <option value="">All Categories</option>
                <option value="camera">Camera</option>
                <option value="laptop">Laptop</option>
                <option value="projector">Projector</option>
                <option value="audio">Audio</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="form-label">
                Status
              </label>
              <select
                className="form-select"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="">All Status</option>
                <option value="available">Available</option>
                <option value="borrowed">Borrowed</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Equipment Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {equipment.map((item) => (
          <div key={item.id} className="card">
            {item.image_url && (
              <img
                src={item.image_url}
                alt={item.name}
                style={{ width: '100%', height: '12rem', objectFit: 'cover' }}
              />
            )}
            <div className="card-body">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                <span className={getStatusBadge(item.status)}>
                  {item.status}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-3">Model: {item.model}</p>
              <p className="text-sm text-gray-500 mb-3">Category: {item.category}</p>
              {item.description && (
                <p className="text-sm text-gray-700 mb-6" style={{ 
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {item.description}
                </p>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => onViewDetails(item)}
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  View Details
                </button>
                <button
                  onClick={() => onBookNow(item)}
                  className="btn btn-success"
                  style={{ flex: 1 }}
                >
                  {item.status === 'available' ? 'Book Now' : 'Reserve'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {equipment.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No equipment found matching your criteria.</p>
        </div>
      )}
    </div>
  );
};

export default EquipmentList;
