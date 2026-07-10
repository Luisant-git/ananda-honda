import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import { userApi } from '../api/userApi.js';
import config from '../config.js';

const UserManagement = ({ user: currentUser }) => {
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [formData, setFormData] = useState({ username: '', password: '', role: 'ADMIN', brand: 'BIGWINGS', branchCode: '' });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchBranches();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await userApi.getAll();
      setUsers(data.map((user, index) => ({ ...user, sNo: index + 1 })));
    } catch (error) {
      toast.error('Error fetching users');
    }
  };

  const fetchBranches = async () => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/branch`, {credentials: 'include'});
      if (response.ok) {
        const data = await response.json();
        setBranches(data);
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (editingId) {
        const payload = { ...formData };
        if (!payload.password) delete payload.password; // Don't send empty password
        await userApi.update(editingId, payload);
        toast.success('User updated successfully!');
      } else {
        await userApi.create(formData);
        toast.success('User created successfully!');
      }
      setIsModalOpen(false);
      setFormData({ username: '', password: '', role: 'ADMIN', brand: 'BIGWINGS', branchCode: '' });
      setEditingId(null);
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

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    setIsLoading(true);
    try {
      await userApi.delete(userToDelete.id);
      toast.success('User permanently deleted!');
      setUserToDelete(null);
      fetchUsers();
    } catch (error) {
      toast.error(error.message || 'Error deleting user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (user) => {
    setEditingId(user.id);
    setFormData({
      username: user.username,
      password: '', // Blank out password
      role: user.role,
      brand: user.brand || 'BIGWINGS',
      branchCode: user.branchCode || ''
    });
    setIsModalOpen(true);
  };

  const columns = [
    { header: 'SNo', accessor: 'sNo' },
    { header: 'Username', accessor: 'username' },
    { 
      header: 'Brand', 
      accessor: 'brand',
      render: (value) => (
        <span className={`px-2 py-1 rounded text-xs font-bold ${value === 'REDWINGS' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
          {value || 'BIGWINGS'}
        </span>
      )
    },
    { header: 'Branch Code', accessor: 'branchCode' },
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
          className="bg-brand-accent hover:bg-brand-accent-hover text-white font-bold py-2 px-6 rounded-lg shadow-sm transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
          Add User
        </button>
      </div>

      <DataTable
        columns={columns}
        data={users}
        actionButtons={(user) => (
          <div className="flex gap-3">
            <button
              onClick={() => handleToggleActive(user)}
              className={`${user.isActive ? 'text-red-600' : 'text-green-600'} hover:underline`}
            >
              {user.isActive ? 'Deactivate' : 'Activate'}
            </button>
            {currentUser?.role === 'DEVELOPER' && (
              <>
                <button
                  onClick={() => handleEdit(user)}
                  className="text-blue-600 hover:underline"
                >
                  Edit
                </button>
                <button
                  onClick={() => setUserToDelete(user)}
                  className="text-red-600 hover:underline ml-2"
                >
                  Delete
                </button>
              </>
            )}
          </div>
        )}
      />

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingId(null); setFormData({ username: '', password: '', role: 'ADMIN', brand: 'BIGWINGS', branchCode: '' }); }} title={editingId ? "Edit User" : "Add User"}>
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
              Password {editingId ? <span className="text-gray-400 font-normal">(Leave blank to keep unchanged)</span> : <span className="text-red-500">*</span>}
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full bg-white border border-brand-border text-brand-text-primary rounded-lg p-2 focus:ring-brand-accent focus:border-brand-accent"
              required={!editingId}
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
              <option value="ADMIN">Admin</option>
              <option value="DEVELOPER">Developer</option>
              <option value="ACCOUNTS">Accounts</option>
              <option value="PART_EXECUTIVE">Part Executive</option>
              <option value="BILLING_EXECUTIVE">Billing Executive</option>
              <option value="CASHIER_SALES">Cashier Sales</option>
              <option value="CASHIER_SERVICE">Cashier Service</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-text-secondary mb-1">
              Brand <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              className="w-full bg-white border border-brand-border text-brand-text-primary rounded-lg p-2 focus:ring-brand-accent focus:border-brand-accent"
              required
            >
              <option value="BIGWINGS">Bigwings</option>
              <option value="REDWINGS">Redwings</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-text-secondary mb-1">
              Branch (Optional)
            </label>
            <select
              value={formData.branchCode}
              onChange={(e) => {
                 const branchCode = e.target.value;
                 const branch = branches.find(b => b.branchCode === branchCode);
                 setFormData({ ...formData, branchCode, branchId: branch ? branch.id : null });
              }}
              className="w-full bg-white border border-brand-border text-brand-text-primary rounded-lg p-2 focus:ring-brand-accent focus:border-brand-accent"
            >
              <option value="">Select Branch</option>
              {branches.filter(b => b.brand === formData.brand).map((branch) => (
                <option key={branch.id} value={branch.branchCode}>
                  {branch.branchName} ({branch.branchCode})
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={() => { setIsModalOpen(false); setEditingId(null); setFormData({ username: '', password: '', role: 'ADMIN', brand: 'BIGWINGS', branchCode: '' }); }}
              className="px-4 py-2 rounded-lg bg-white hover:bg-brand-hover text-brand-text-secondary font-bold border border-brand-border"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 rounded-lg bg-brand-accent hover:bg-brand-accent-hover text-white font-bold disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : editingId ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete User"
        message={`Are you sure you want to permanently delete the user "${userToDelete?.username}"? This action cannot be undone.`}
        confirmText={isLoading ? "Deleting..." : "Delete"}
        isDestructive={true}
      />
    </div>
  );
};

export default UserManagement;
