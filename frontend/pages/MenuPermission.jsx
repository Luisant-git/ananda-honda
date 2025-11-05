import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { menuPermissionApi } from '../api/menuPermissionApi';

const MenuPermission = () => {
  const [permissions, setPermissions] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [editData, setEditData] = useState(null);
  const [loading, setLoading] = useState(false);

  const roles = ['SUPER_ADMIN', 'USER', 'ENQUIRY', 'ACCOUNT', 'DEVELOPER'];

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    try {
      const data = await menuPermissionApi.getAll();
      setPermissions(data);
    } catch (error) {
      toast.error('Failed to fetch permissions');
    }
  };

  const handleEdit = (role) => {
    const existing = permissions.find(p => p.role === role);
    setSelectedRole(role);
    setEditData(existing?.permissions || {
      dashboard: false,
      master: false,
      payment_collection: { view: false, add_customer: false },
      reports: false,
      settings: { change_password: false, user_management: false, menu_permission: false }
    });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await menuPermissionApi.upsert(selectedRole, editData);
      await fetchPermissions();
      setSelectedRole(null);
      setEditData(null);
      toast.success('Permissions updated successfully');
    } catch (error) {
      toast.error('Failed to update permissions');
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (path) => {
    setEditData(prev => {
      const newData = { ...prev };
      if (path.includes('.')) {
        const [parent, child] = path.split('.');
        newData[parent] = { ...newData[parent], [child]: !newData[parent][child] };
      } else {
        newData[path] = !newData[path];
      }
      return newData;
    });
  };

  const toggleMasterSubmenu = (submenu) => {
    setEditData(prev => ({
      ...prev,
      master: typeof prev.master === 'object' 
        ? { ...prev.master, [submenu]: !prev.master[submenu] }
        : { [submenu]: true }
    }));
  };

  const toggleMasterAction = (module, action) => {
    setEditData(prev => ({
      ...prev,
      master: {
        ...prev.master,
        [module]: typeof prev.master[module] === 'object'
          ? { ...prev.master[module], [action]: !prev.master[module][action] }
          : { [action]: true }
      }
    }));
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Menu Permissions</h1>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dashboard</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Master</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Collection</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reports</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {roles.map(role => {
              const perm = permissions.find(p => p.role === role);
              return (
                <tr key={role}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">{role}</td>
                  <td className="px-6 py-4">{perm?.permissions?.dashboard ? '✓' : '✗'}</td>
                  <td className="px-6 py-4">{perm?.permissions?.master ? '✓' : '✗'}</td>
                  <td className="px-6 py-4">{perm?.permissions?.payment_collection ? '✓' : '✗'}</td>
                  <td className="px-6 py-4">{perm?.permissions?.reports ? '✓' : '✗'}</td>
                  <td className="px-6 py-4">
                    <button onClick={() => handleEdit(role)} className="text-blue-600 hover:text-blue-800">
                      Edit
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selectedRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={() => { setSelectedRole(null); setEditData(null); }}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h2 className="text-xl font-bold mb-4">Edit Permissions - {selectedRole}</h2>
            
            <div className="space-y-4">
              <label className="flex items-center space-x-2">
                <input type="checkbox" checked={editData.dashboard} onChange={() => togglePermission('dashboard')} className="rounded" />
                <span>Dashboard</span>
              </label>

              <div>
                <label className="flex items-center space-x-2 mb-2">
                  <input type="checkbox" checked={!!editData.master} onChange={() => setEditData(prev => ({ ...prev, master: prev.master ? false : {} }))} className="rounded" />
                  <span className="font-medium">Master</span>
                </label>
                {editData.master && typeof editData.master === 'object' && (
                  <div className="ml-6 space-y-3">
                    {['customer_details', 'payment_mode', 'type_of_payment', 'type_of_collection', 'vehicle_model'].map(module => (
                      <div key={module}>
                        <label className="flex items-center space-x-2 mb-1">
                          <input type="checkbox" checked={!!editData.master[module]} onChange={() => setEditData(prev => ({ ...prev, master: { ...prev.master, [module]: prev.master[module] ? false : { add: false, edit: false, delete: false } } }))} className="rounded" />
                          <span className="font-medium">{module.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</span>
                        </label>
                        {editData.master[module] && typeof editData.master[module] === 'object' && (
                          <div className="ml-6 space-y-1">
                            <label className="flex items-center space-x-2">
                              <input type="checkbox" checked={editData.master[module].add} onChange={() => toggleMasterAction(module, 'add')} className="rounded" />
                              <span className="text-sm">Add</span>
                            </label>
                            <label className="flex items-center space-x-2">
                              <input type="checkbox" checked={editData.master[module].edit} onChange={() => toggleMasterAction(module, 'edit')} className="rounded" />
                              <span className="text-sm">Edit</span>
                            </label>
                            <label className="flex items-center space-x-2">
                              <input type="checkbox" checked={editData.master[module].delete} onChange={() => toggleMasterAction(module, 'delete')} className="rounded" />
                              <span className="text-sm">Delete</span>
                            </label>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="flex items-center space-x-2 mb-2">
                  <input type="checkbox" checked={!!editData.payment_collection} onChange={() => setEditData(prev => ({ ...prev, payment_collection: prev.payment_collection ? false : { view: false, add_customer: false } }))} className="rounded" />
                  <span className="font-medium">Payment Collection</span>
                </label>
                {editData.payment_collection && typeof editData.payment_collection === 'object' && (
                  <div className="ml-6 space-y-2">
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" checked={editData.payment_collection.view} onChange={() => togglePermission('payment_collection.view')} className="rounded" />
                      <span>View</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" checked={editData.payment_collection.add_customer} onChange={() => togglePermission('payment_collection.add_customer')} className="rounded" />
                      <span>Add New Customer</span>
                    </label>
                  </div>
                )}
              </div>

              <label className="flex items-center space-x-2">
                <input type="checkbox" checked={editData.reports} onChange={() => togglePermission('reports')} className="rounded" />
                <span>Reports</span>
              </label>

              <div>
                <span className="font-medium">Settings</span>
                <div className="ml-6 space-y-2 mt-2">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" checked={editData.settings?.change_password} onChange={() => togglePermission('settings.change_password')} className="rounded" />
                    <span>Change Password</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" checked={editData.settings?.user_management} onChange={() => togglePermission('settings.user_management')} className="rounded" />
                    <span>User Management</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" checked={editData.settings?.menu_permission} onChange={() => togglePermission('settings.menu_permission')} className="rounded" />
                    <span>Menu Permission</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <button onClick={() => { setSelectedRole(null); setEditData(null); }} className="px-4 py-2 border rounded hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleSave} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuPermission;
