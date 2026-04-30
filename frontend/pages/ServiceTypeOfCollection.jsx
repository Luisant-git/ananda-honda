import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { serviceTypeOfCollectionApi } from '../api/serviceTypeOfCollectionApi';
import { menuPermissionApi } from '../api/menuPermissionApi';

const ServiceTypeOfCollection = ({ user }) => {
  const [serviceTypeOfCollections, setServiceTypeOfCollections] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const [formData, setFormData] = useState({
    typeOfCollect: '',
    status: 'Enable',
    disableVehicleModel: false
  });

  const [permissions, setPermissions] = useState(null);

  useEffect(() => {
    fetchData();
    fetchPermissions();
  }, []);

  // ✅ Fetch Permissions
  const fetchPermissions = async () => {
    try {
      const perms = await menuPermissionApi.get();
      setPermissions(perms);
    } catch (error) {
      console.error('Permission error:', error);
    }
  };

  // ✅ Fetch Data
  const fetchData = async () => {
    try {
      const data = await serviceTypeOfCollectionApi.getAll();
      const formatted = data.map((item, index) => ({
        sNo: index + 1,
        id: item.id,
        typeOfCollect: item.typeOfCollect,
        status: item.status,
        disableVehicleModel: item.disableVehicleModel
      }));
      setServiceTypeOfCollections(formatted);
    } catch (error) {
      console.error('Fetch error:', error);
    }
  };

  // ✅ Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditMode) {
        await serviceTypeOfCollectionApi.update(editingItem.id, formData);
        toast.success('Updated successfully!');
      } else {
        await serviceTypeOfCollectionApi.create(formData);
        toast.success('Created successfully!');
      }

      resetForm();
      fetchData();
    } catch (error) {
      toast.error('Save failed');
      console.error(error);
    }
  };

  // ✅ Reset
  const resetForm = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setEditingItem(null);
    setFormData({
      typeOfCollect: '',
      status: 'Enable',
      disableVehicleModel: false
    });
  };

  // ✅ Edit
  const handleEdit = (item) => {
    setIsEditMode(true);
    setEditingItem(item);
    setFormData({
      typeOfCollect: item.typeOfCollect,
      status: item.status,
      disableVehicleModel: item.disableVehicleModel || false
    });
    setIsModalOpen(true);
  };

  // ✅ Delete
  const handleDelete = (item) => {
    setItemToDelete(item);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await serviceTypeOfCollectionApi.delete(itemToDelete.id);
      toast.success('Deleted successfully!');
      setIsDeleteModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Delete failed');
    }
  };

  // ✅ Add New
  const handleAddNew = () => {
    setIsEditMode(false);
    setEditingItem(null);
    setFormData({
      typeOfCollect: '',
      status: 'Enable',
      disableVehicleModel: false
    });
    setIsModalOpen(true);
  };

  // ✅ Table Columns
  const columns = [
    { header: 'SNo', accessor: 'sNo' },
    { header: 'Type of Collection', accessor: 'typeOfCollect' },
    { header: 'Status', accessor: 'status' },
    {
      header: 'Disable Vehicle Model',
      accessor: 'disableVehicleModel',
      render: (val) => (val ? 'Yes' : 'No')
    }
  ];

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-brand-text-primary">
          Service Type of Collection
        </h1>

        {permissions?.master?.service_type_of_collection?.add && (
          <button
            onClick={handleAddNew}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg"
          >
            Add
          </button>
        )}
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={serviceTypeOfCollections}
        actionButtons={(item) => (
          <div className="flex gap-2">
            {permissions?.master?.service_type_of_collection?.edit && (
              <button
                onClick={() => handleEdit(item)}
                className="text-blue-600 hover:underline"
              >
                Edit
              </button>
            )}

            {permissions?.master?.service_type_of_collection?.delete && (
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
        title={isEditMode ? "Edit Service Type of Collection" : "Add Service Type of Collection"}
      >
        <form className="space-y-4" onSubmit={handleSubmit}>

          <input
            type="text"
            placeholder="Type of Collection"
            value={formData.typeOfCollect}
            onChange={(e) =>
              setFormData({ ...formData, typeOfCollect: e.target.value })
            }
            className="w-full border p-2 rounded"
            required
          />

          <select
            value={formData.status}
            onChange={(e) =>
              setFormData({ ...formData, status: e.target.value })
            }
            className="w-full border p-2 rounded"
          >
            <option value="Enable">Enable</option>
            <option value="Disable">Disable</option>
          </select>

          <label className="flex gap-2">
            <input
              type="checkbox"
              checked={formData.disableVehicleModel}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  disableVehicleModel: e.target.checked
                })
              }
            />
            Disable Vehicle Model
          </label>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={resetForm}>
              Cancel
            </button>
            <button type="submit" className="bg-red-600 text-white px-4 py-2 rounded">
              {isEditMode ? 'Update' : 'Save'}
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
        <p>
          Delete <strong>{itemToDelete?.typeOfCollect}</strong>?
        </p>

        <div className="flex justify-end gap-3 mt-4">
          <button onClick={() => setIsDeleteModalOpen(false)}>Cancel</button>
          <button
            onClick={confirmDelete}
            className="bg-red-600 text-white px-4 py-2 rounded"
          >
            Delete
          </button>
        </div>
      </Modal>

    </div>
  );
};

export default ServiceTypeOfCollection;