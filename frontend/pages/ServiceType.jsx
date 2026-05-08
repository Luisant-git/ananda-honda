import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { serviceTypeApi } from '../api/serviceTypeApi.js';
import { menuPermissionApi } from '../api/menuPermissionApi';

const ServiceType = ({ user }) => {
  const [serviceTypes, setServiceTypes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [formData, setFormData] = useState({ name: '', status: 'Active' });
  const [permissions, setPermissions] = useState(null);

  useEffect(() => {
    fetchServiceTypes();
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    try {
      const perms = await menuPermissionApi.get();
      setPermissions(perms);
    } catch (error) {
      console.error('Failed to fetch permissions:', error);
    }
  };

  const fetchServiceTypes = async () => {
    try {
      const data = await serviceTypeApi.getAll();
      const formatted = data.map((item, index) => ({
        sNo: index + 1,
        id: item.id,
        name: item.name,
        status: item.status,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      }));
      setServiceTypes(formatted);
    } catch (error) {
      console.error('Error fetching service types:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (isEditMode) {
        await serviceTypeApi.update(editingItem.id, formData);
        toast.success('Service type updated successfully!');
      } else {
        await serviceTypeApi.create(formData);
        toast.success('Service type created successfully!');
      }

      resetForm();
      fetchServiceTypes();
    } catch (error) {
      toast.error('Error saving service type');
      console.error(error);
    }
  };

  const resetForm = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setEditingItem(null);
    setFormData({ name: '', status: 'Active' });
  };

  const handleEdit = (item) => {
    setIsEditMode(true);
    setEditingItem(item);
    setFormData({
      name: item.name,
      status: item.status,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (item) => {
    setItemToDelete(item);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await serviceTypeApi.delete(itemToDelete.id);
      toast.success('Service type deleted successfully!');
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
      fetchServiceTypes();
    } catch (error) {
      toast.error(error.message || 'Error deleting service type');
      console.error(error);
    }
  };

  const columns = [
    { header: 'SNo', accessor: 'sNo' },
    { header: 'Service Type', accessor: 'name' },
    { header: 'Status', accessor: 'status' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-brand-text-primary">
          Service Types
        </h1>

        {permissions?.master?.service_type?.add && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg"
          >
            Add
          </button>
        )}
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={serviceTypes}
        actionButtons={(item) => (
          <div className="flex gap-2">
            {permissions?.master?.service_type?.edit && (
              <button
                onClick={() => handleEdit(item)}
                className="text-blue-600 hover:underline"
              >
                Edit
              </button>
            )}

            {permissions?.master?.service_type?.delete && (
              <button
                onClick={() => handleDelete(item)}
                className="text-red-600 hover:underline"
              >
                Delete
              </button>
            )}
          </div>
        )}
      />

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={resetForm}
        title={isEditMode ? 'Edit Service Type' : 'Add Service Type'}
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-brand-text-secondary mb-1">
              Service Type <span className="text-red-500">*</span>
            </label>

            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full bg-white border border-brand-border rounded-lg p-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-text-secondary mb-1">
              Status <span className="text-red-500">*</span>
            </label>

            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value })
              }
              className="w-full bg-white border border-brand-border rounded-lg p-2"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 border rounded-lg"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-4 py-2 bg-brand-accent text-white rounded-lg"
            >
              {isEditMode ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Delete"
      >
        <div className="space-y-4">
          <p>
            Are you sure you want to delete{' '}
            <strong>{itemToDelete?.name}</strong>?
          </p>

          <div className="flex justify-end gap-4">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 border rounded-lg"
            >
              Cancel
            </button>

            <button
              onClick={confirmDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ServiceType;