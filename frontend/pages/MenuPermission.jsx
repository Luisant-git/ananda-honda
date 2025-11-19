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
      payment_collection: {
        sales: { add: false, edit: false, delete: false, restore: false, view_deleted: false, add_customer: false },
        service: { add: false, edit: false, delete: false, restore: false, view_deleted: false, add_customer: false }
      },
      reports: { payment_collection_report: false, service_payment_collection_report: false, enquiry_report: false },
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
    <div className="p-3 sm:p-4 md:p-6">
      <div className="flex justify-between items-center mb-4 md:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold">Menu Permissions</h1>
      </div>

      {/* Desktop/Tablet Table View */}
      <div className="hidden sm:block bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dashboard</th>
              <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Master</th>
              <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
              <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reports</th>
              <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {roles.map(role => {
              const perm = permissions.find(p => p.role === role);
              return (
                <tr key={role}>
                  <td className="px-3 md:px-6 py-4 whitespace-nowrap font-medium text-sm">{role}</td>
                  <td className="px-3 md:px-6 py-4 text-sm">{perm?.permissions?.dashboard ? '✓' : '✗'}</td>
                  <td className="px-3 md:px-6 py-4 text-sm">{perm?.permissions?.master ? '✓' : '✗'}</td>
                  <td className="px-3 md:px-6 py-4 text-sm">{perm?.permissions?.payment_collection ? '✓' : '✗'}</td>
                  <td className="px-3 md:px-6 py-4 text-sm">{perm?.permissions?.reports ? '✓' : '✗'}</td>
                  <td className="px-3 md:px-6 py-4">
                    <button onClick={() => handleEdit(role)} className="text-blue-600 hover:text-blue-800 text-sm">
                      Edit
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="sm:hidden space-y-3">
        {roles.map(role => {
          const perm = permissions.find(p => p.role === role);
          return (
            <div key={role} className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-bold text-lg">{role}</h3>
                <button onClick={() => handleEdit(role)} className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  Edit
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Dashboard:</span>
                  <span>{perm?.permissions?.dashboard ? '✓' : '✗'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Master:</span>
                  <span>{perm?.permissions?.master ? '✓' : '✗'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment:</span>
                  <span>{perm?.permissions?.payment_collection ? '✓' : '✗'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Reports:</span>
                  <span>{perm?.permissions?.reports ? '✓' : '✗'}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={() => { setSelectedRole(null); setEditData(null); }}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-500 hover:text-gray-700"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h2 className="text-lg sm:text-xl font-bold mb-4 pr-8">Edit Permissions - {selectedRole}</h2>
            
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
                  <div className="ml-4 sm:ml-6 space-y-3">
                    {['customer_details', 'payment_mode', 'type_of_payment', 'type_of_collection', 'vehicle_model', 'create_enquiry'].map(module => (
                      <div key={module}>
                        <label className="flex items-center space-x-2 mb-1">
                          <input type="checkbox" checked={!!editData.master[module]} onChange={() => setEditData(prev => ({ ...prev, master: { ...prev.master, [module]: prev.master[module] ? false : { add: false, edit: false, delete: false } } }))} className="rounded" />
                          <span className="font-medium text-sm sm:text-base">{module.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</span>
                        </label>
                        {editData.master[module] && typeof editData.master[module] === 'object' && (
                          <div className="ml-4 sm:ml-6 space-y-1">
                            <label className="flex items-center space-x-2">
                              <input type="checkbox" checked={editData.master[module].add} onChange={() => toggleMasterAction(module, 'add')} className="rounded" />
                              <span className="text-sm">Add</span>
                            </label>
                            {module !== 'create_enquiry' && (
                              <>
                                <label className="flex items-center space-x-2">
                                  <input type="checkbox" checked={editData.master[module].edit} onChange={() => toggleMasterAction(module, 'edit')} className="rounded" />
                                  <span className="text-sm">Edit</span>
                                </label>
                                <label className="flex items-center space-x-2">
                                  <input type="checkbox" checked={editData.master[module].delete} onChange={() => toggleMasterAction(module, 'delete')} className="rounded" />
                                  <span className="text-sm">Delete</span>
                                </label>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="flex items-center space-x-2 mb-2">
                  <input type="checkbox" checked={!!editData.payment_collection} onChange={() => setEditData(prev => ({ ...prev, payment_collection: prev.payment_collection ? false : { sales: {}, service: {} } }))} className="rounded" />
                  <span className="font-medium">Payment Collection</span>
                </label>
                {editData.payment_collection && typeof editData.payment_collection === 'object' && (
                  <div className="ml-4 sm:ml-6 space-y-3">
                    {['sales', 'service'].map(type => (
                      <div key={type}>
                        <label className="flex items-center space-x-2 mb-1">
                          <input type="checkbox" checked={!!editData.payment_collection[type]} onChange={() => setEditData(prev => ({ ...prev, payment_collection: { ...prev.payment_collection, [type]: prev.payment_collection[type] ? false : { add: false, edit: false, delete: false, restore: false, view_deleted: false, add_customer: false } } }))} className="rounded" />
                          <span className="font-medium text-sm sm:text-base">{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                        </label>
                        {editData.payment_collection[type] && typeof editData.payment_collection[type] === 'object' && (
                          <div className="ml-4 sm:ml-6 space-y-1">
                            {['add', 'edit', 'delete', 'restore', 'view_deleted', 'add_customer'].map(action => (
                              <label key={action} className="flex items-center space-x-2">
                                <input type="checkbox" checked={editData.payment_collection[type][action]} onChange={() => setEditData(prev => ({ ...prev, payment_collection: { ...prev.payment_collection, [type]: { ...prev.payment_collection[type], [action]: !prev.payment_collection[type][action] } } }))} className="rounded" />
                                <span className="text-sm">{action.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="flex items-center space-x-2 mb-2">
                  <input type="checkbox" checked={!!editData.reports} onChange={() => setEditData(prev => ({ ...prev, reports: prev.reports ? false : { payment_collection_report: false, service_payment_collection_report: false, enquiry_report: false } }))} className="rounded" />
                  <span className="font-medium">Reports</span>
                </label>
                {editData.reports && typeof editData.reports === 'object' && (
                  <div className="ml-4 sm:ml-6 space-y-1">
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" checked={editData.reports.payment_collection_report} onChange={() => togglePermission('reports.payment_collection_report')} className="rounded" />
                      <span className="text-sm">Sales Payment Collection Report</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" checked={editData.reports.service_payment_collection_report} onChange={() => togglePermission('reports.service_payment_collection_report')} className="rounded" />
                      <span className="text-sm">Service Payment Collection Report</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" checked={editData.reports.enquiry_report} onChange={() => togglePermission('reports.enquiry_report')} className="rounded" />
                      <span className="text-sm">Enquiry Report</span>
                    </label>
                  </div>
                )}
              </div>

              <div>
                <label className="flex items-center space-x-2 mb-2">
                  <input type="checkbox" checked={!!editData.settings} onChange={() => setEditData(prev => ({ ...prev, settings: prev.settings ? false : {} }))} className="rounded" />
                  <span className="font-medium">Settings</span>
                </label>
                {editData.settings && typeof editData.settings === 'object' && (
                  <div className="ml-4 sm:ml-6 space-y-1">
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" checked={editData.settings.change_password} onChange={() => togglePermission('settings.change_password')} className="rounded" />
                      <span className="text-sm">Change Password</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" checked={editData.settings.user_management} onChange={() => togglePermission('settings.user_management')} className="rounded" />
                      <span className="text-sm">User Management</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" checked={editData.settings.menu_permission} onChange={() => togglePermission('settings.menu_permission')} className="rounded" />
                      <span className="text-sm">Menu Permission</span>
                    </label>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button onClick={() => { setSelectedRole(null); setEditData(null); }} className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50">
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