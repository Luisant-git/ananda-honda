import React, { useState, useEffect } from 'react';
import { executiveApi } from '../api/executiveApi.js';
import DataTable from '../components/DataTable.jsx';
import Modal from '../components/Modal.jsx';

const ExecutiveManagement = () => {
  const [executives, setExecutives] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExecutive, setEditingExecutive] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    isActive: true
  });

  useEffect(() => {
    fetchExecutives();
  }, []);

  const fetchExecutives = async () => {
    try {
      const data = await executiveApi.getAll();
      setExecutives(data);
    } catch (error) {
      console.error('Error fetching executives:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingExecutive) {
        await executiveApi.update(editingExecutive.id, formData);
      } else {
        await executiveApi.create(formData);
      }
      
      fetchExecutives();
      resetForm();
    } catch (error) {
      console.error('Error saving executive:', error);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', isActive: true });
    setEditingExecutive(null);
    setIsModalOpen(false);
  };

  const handleEdit = (executive) => {
    setFormData({
      name: executive.name,
      isActive: executive.isActive
    });
    setEditingExecutive(executive);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to deactivate this executive?')) {
      try {
        await executiveApi.delete(id);
        fetchExecutives();
      } catch (error) {
        console.error('Error deactivating executive:', error);
      }
    }
  };

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'isActive', label: 'Status', render: (executive) => executive.isActive ? 'Active' : 'Inactive' },
    { key: 'createdAt', label: 'Created', render: (executive) => new Date(executive.createdAt).toLocaleDateString() }
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Executive Management</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Add New Executive
        </button>
      </div>

      <DataTable
        data={executives}
        columns={columns}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <Modal isOpen={isModalOpen} onClose={resetForm} title={editingExecutive ? 'Edit Executive' : 'Add New Executive'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-2 border rounded"
              required
            />
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="mr-2"
              />
              Active
            </label>
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 text-gray-600 border rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              {editingExecutive ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ExecutiveManagement;