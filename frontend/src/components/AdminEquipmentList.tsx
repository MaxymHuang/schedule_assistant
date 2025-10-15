import React, { useState, useEffect } from 'react';
import type { Equipment } from '../types';
import { apiClient } from '../api/client';
import EquipmentEditModal from './EquipmentEditModal';
import EquipmentCreateModal from './EquipmentCreateModal';

interface Category {
  id: number;
  name: string;
  description?: string;
  equipment_count: number;
}

const AdminEquipmentList: React.FC = () => {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [filters, setFilters] = useState({
    category: '',
    status: '',
    search: '',
  });
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    loadEquipment();
    loadCategories();
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

  const handleEdit = (equipment: Equipment) => {
    setEditingEquipment(equipment);
    setShowEditModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this equipment? This action cannot be undone.')) {
      return;
    }

    setDeletingId(id);
    try {
      await apiClient.deleteEquipment(id);
      await loadEquipment(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete equipment');
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditSuccess = () => {
    loadEquipment(); // Refresh the list
  };

  const handleCreateSuccess = () => {
    loadEquipment(); // Refresh the list
  };

  const loadCategories = async () => {
    try {
      const data = await apiClient.getCategories();
      setCategories(data);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
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
        <button 
          className="btn btn-sm btn-outline ml-2"
          onClick={() => setError('')}
        >
          Dismiss
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-900">Equipment Management</h2>
        <div className="flex items-center space-x-6">
          <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
            Total: {equipment.length} items
          </div>
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
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Equipment
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-body p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
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
                {categories.map((category) => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
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

      {/* Equipment Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-900">Equipment List</h3>
        </div>
        <div className="card-body p-0">
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th>Equipment</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {equipment.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="flex items-center space-x-6">
                        {item.image_url && (
                          <div className="avatar">
                            <div className="mask mask-squircle w-12 h-12">
                              <img
                                src={item.image_url}
                                alt={item.name}
                                className="object-cover"
                              />
                            </div>
                          </div>
                        )}
                        <div>
                          <div className="font-bold">{item.name}</div>
                          <div className="text-sm opacity-50">{item.model}</div>
                          {item.description && (
                            <div className="text-sm opacity-70 max-w-xs truncate">
                              {item.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-outline">
                        {item.category}
                      </span>
                    </td>
                    <td>
                      <span className={getStatusBadge(item.status)}>
                        {item.status}
                      </span>
                    </td>
                    <td>
                      <div className="text-sm">
                        {new Date(item.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td>
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleEdit(item)}
                          className="btn btn-sm btn-outline btn-primary"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="btn btn-sm btn-outline btn-error"
                          disabled={deletingId === item.id}
                        >
                          {deletingId === item.id ? (
                            <>
                              <span className="loading loading-spinner loading-xs"></span>
                              Deleting...
                            </>
                          ) : (
                            'Delete'
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {equipment.length === 0 && (
        <div className="text-center py-12">
          <div className="bg-gray-50 rounded-lg p-8">
            <p className="text-gray-500 text-lg">No equipment found matching your criteria.</p>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <EquipmentEditModal
        equipment={editingEquipment}
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingEquipment(null);
        }}
        onSuccess={handleEditSuccess}
      />

      {/* Create Modal */}
      <EquipmentCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
};

export default AdminEquipmentList;
