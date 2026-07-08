import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import config from '../config.js';

const BranchMaster = ({ user }) => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    branchName: '',
    branchCode: '',
    brand: user?.brand || 'BIGWINGS',
  });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      const res = await fetch(`${config.API_BASE_URL}/branch`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setBranches(data);
    } catch (error) {
      toast.error('Failed to fetch branches');
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingId) {
        const res = await fetch(`${config.API_BASE_URL}/branch/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(formData)
        });
        if (!res.ok) {
           const err = await res.json();
           throw new Error(err.message || 'Error updating');
        }
        toast.success('Branch updated successfully');
      } else {
        const res = await fetch(`${config.API_BASE_URL}/branch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(formData)
        });
        if (!res.ok) {
           const err = await res.json();
           throw new Error(err.message || 'Error adding');
        }
        toast.success('Branch added successfully');
      }
      setFormData({ branchName: '', branchCode: '', brand: user?.brand || 'BIGWINGS' });
      setEditingId(null);
      fetchBranches();
    } catch (error) {
      toast.error(error.message || 'Error saving branch');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (branch) => {
    setEditingId(branch.id);
    setFormData({
      branchName: branch.branchName,
      branchCode: branch.branchCode,
      brand: branch.brand,
    });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this branch?')) {
      try {
        const res = await fetch(`${config.API_BASE_URL}/branch/${id}`, {
          method: 'DELETE',
          credentials: 'include'
        });
        if (!res.ok) throw new Error('Delete failed');
        
        toast.success('Branch deleted successfully');
        fetchBranches();
      } catch (error) {
        toast.error('Error deleting branch');
      }
    }
  };

  return (
    <div className="p-6">
      <div className="bg-brand-surface p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-bold mb-4 text-brand-text-primary">
          {editingId ? 'Edit Branch' : 'Add New Branch'}
        </h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-brand-text-secondary mb-1">Branch Name</label>
            <input
              type="text"
              name="branchName"
              value={formData.branchName}
              onChange={handleInputChange}
              required
              className="w-full p-2 border border-brand-border rounded-lg bg-brand-background text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
              placeholder="e.g. Silk Board"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-text-secondary mb-1">Branch/Network Code</label>
            <input
              type="text"
              name="branchCode"
              value={formData.branchCode}
              onChange={handleInputChange}
              required
              className="w-full p-2 border border-brand-border rounded-lg bg-brand-background text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
              placeholder="e.g. BWKA0105"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-text-secondary mb-1">Brand</label>
            <select
              name="brand"
              value={formData.brand}
              onChange={handleInputChange}
              className="w-full p-2 border border-brand-border rounded-lg bg-brand-background text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
            >
              <option value="BIGWINGS">BIGWINGS</option>
              <option value="REDWINGS">REDWINGS</option>
            </select>
          </div>
          <div className="flex items-end space-x-2">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-brand-accent text-white rounded-lg hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-brand-accent disabled:opacity-50"
            >
              {loading ? 'Saving...' : editingId ? 'Update' : 'Add'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setFormData({ branchName: '', branchCode: '', brand: user?.brand || 'BIGWINGS' });
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 focus:outline-none"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="bg-brand-surface rounded-lg shadow-md overflow-hidden">
        <table className="w-full text-sm text-left text-brand-text-secondary">
          <thead className="text-xs text-brand-text-primary uppercase bg-brand-background border-b border-brand-border">
            <tr>
              <th className="px-6 py-3">S.No</th>
              <th className="px-6 py-3">Branch Name</th>
              <th className="px-6 py-3">Branch Code</th>
              <th className="px-6 py-3">Brand</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {branches.map((branch, index) => (
              <tr key={branch.id} className="border-b border-brand-border hover:bg-brand-hover">
                <td className="px-6 py-4">{index + 1}</td>
                <td className="px-6 py-4 font-medium">{branch.branchName}</td>
                <td className="px-6 py-4">{branch.branchCode}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    branch.brand === 'REDWINGS' 
                      ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' 
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                  }`}>
                    {branch.brand}
                  </span>
                </td>
                <td className="px-6 py-4 text-right space-x-3">
                  <button
                    onClick={() => handleEdit(branch)}
                    className="text-blue-500 hover:text-blue-700 font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(branch.id)}
                    className="text-red-500 hover:text-red-700 font-medium"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {branches.length === 0 && (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                  No branches found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BranchMaster;
