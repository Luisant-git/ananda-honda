import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { userApi } from '../api/userApi.js';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ username: '', password: '', role: 'USER' });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await userApi.getAll();
      setUsers(data.map((user, index) => ({ ...user, sNo: index + 1 })));
    } catch (error) {
      toast.error('Error fetching users');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await userApi.create(formData);
      toast.success('User created successfully!');
      setIsModalOpen(false);
      setFormData({ username: '', password: '', role: 'USER' });
      fetchUsers();
    } catch (error) {
      toast.error(error.message || 'Error creating user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (user) => {
    try {
      await userApi.toggleActive(user.id);
      toast.success(`User ${user.isActive ? 'deactivated' : 'activated'} successfully!`);
      fetchUsers();
    } catch (error) {
      toast.error('Error updating user status');
    }
  };

  const columns = [
    { header: 'SNo', accessor: 'sNo' },
    { header: 'Username', accessor: 'username' },
    { header: 'Role', accessor: 'role' },
    { 
      header: 'Status', 
      accessor: 'isActive',
      render: (value) => (
        <span className={`px-2 py-1 rounded ${value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {value ? 'Active' : 'Inactive'}
        </span>
      )
    },
    {
      header: 'Created At',
      accessor: 'createdAt',
      render: (value) => new Date(value).toLocaleDateString('en-GB')
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-brand-text-primary">User Management</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg"
        >
          Add
        </button>
      </div>

      <DataTable
        columns={columns}
        data={users}
        actionButtons={(user) => (
          <button
            onClick={() => handleToggleActive(user)}
            className={`${user.isActive ? 'text-red-600' : 'text-green-600'} hover:underline`}
          >
            {user.isActive ? 'Deactivate' : 'Activate'}
          </button>
        )}
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add User">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-brand-text-secondary mb-1">
              Username <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full bg-white border border-brand-border text-brand-text-primary rounded-lg p-2 focus:ring-brand-accent focus:border-brand-accent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-text-secondary mb-1">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full bg-white border border-brand-border text-brand-text-primary rounded-lg p-2 focus:ring-brand-accent focus:border-brand-accent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-text-secondary mb-1">
              Role <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full bg-white border border-brand-border text-brand-text-primary rounded-lg p-2 focus:ring-brand-accent focus:border-brand-accent"
              required
            >
              <option value="USER">User</option>
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="ENQUIRY">Enquiry</option>
              <option value="ACCOUNT">Account</option>
            </select>
          </div>
          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-white hover:bg-brand-hover text-brand-text-secondary font-bold border border-brand-border"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 rounded-lg bg-brand-accent hover:bg-brand-accent-hover text-white font-bold disabled:opacity-50"
            >
              {isLoading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UserManagement;
