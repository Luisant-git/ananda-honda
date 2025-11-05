import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { vehicleModelApi } from '../api/vehicleModelApi.js';
import { menuPermissionApi } from '../api/menuPermissionApi';

const VehicleModel = ({ user }) => {
  const [vehicleModels, setVehicleModels] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingModel, setEditingModel] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [modelToDelete, setModelToDelete] = useState(null);
  const [formData, setFormData] = useState({ model: '', status: 'Enable' });
  const [permissions, setPermissions] = useState(null);

  useEffect(() => {
    fetchVehicleModels();
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

  const fetchVehicleModels = async () => {
    try {
      const data = await vehicleModelApi.getAll();
      const formattedData = data.map((model, index) => ({
        sNo: index + 1,
        id: model.id,
        model: model.model,
        status: model.status,
        createdAt: model.createdAt,
        updatedAt: model.updatedAt
      }));
      setVehicleModels(formattedData);
    } catch (error) {
      console.error('Error fetching vehicle models:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditMode) {
        await vehicleModelApi.update(editingModel.id, formData);
        toast.success('Vehicle model updated successfully!');
      } else {
        await vehicleModelApi.create(formData);
        toast.success('Vehicle model created successfully!');
      }
      setIsModalOpen(false);
      setIsEditMode(false);
      setEditingModel(null);
      setFormData({ model: '', status: 'Enable' });
      fetchVehicleModels();
    } catch (error) {
      toast.error('Error saving vehicle model');
      console.error('Error saving vehicle model:', error);
    }
  };

  const handleEdit = (model) => {
    setIsEditMode(true);
    setEditingModel(model);
    setFormData({
      model: model.model,
      status: model.status
    });
    setIsModalOpen(true);
  };

  const handleDelete = (model) => {
    setModelToDelete(model);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await vehicleModelApi.delete(modelToDelete.id);
      toast.success('Vehicle model deleted successfully!');
      setIsDeleteModalOpen(false);
      setModelToDelete(null);
      fetchVehicleModels();
    } catch (error) {
      toast.error(error.message || 'Error deleting vehicle model');
      console.error('Error deleting vehicle model:', error);
    }
  };

  const columns = [
    { header: 'SNo', accessor: 'sNo' },
    { header: 'Vehicle Model', accessor: 'model' },
    { header: 'Status', accessor: 'status' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-brand-text-primary">Vehicle Models</h1>
        {permissions?.master?.vehicle_model?.add && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg"
          >
            Add
          </button>
        )}
      </div>

      <DataTable 
        columns={columns} 
        data={vehicleModels} 
        actionButtons={(model) => (
          <div className="flex gap-2">
            {permissions?.master?.vehicle_model?.edit && (
              <button onClick={() => handleEdit(model)} className="text-blue-600 hover:underline">Edit</button>
            )}
            {permissions?.master?.vehicle_model?.delete && (
              <button onClick={() => handleDelete(model)} className="text-red-600 hover:underline">Delete</button>
            )}
          </div>
        )}
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditMode ? "Edit Vehicle Model" : "Add Vehicle Model"}>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-brand-text-secondary mb-1">Vehicle Model <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={formData.model}
              onChange={(e) => setFormData({...formData, model: e.target.value})}
              className="w-full bg-white border border-brand-border text-brand-text-primary rounded-lg p-2 focus:ring-brand-accent focus:border-brand-accent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-text-secondary mb-1">Status <span className="text-red-500">*</span></label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value})}
              className="w-full bg-white border border-brand-border text-brand-text-primary rounded-lg p-2 focus:ring-brand-accent focus:border-brand-accent"
              required
            >
              <option value="Enable">Enable</option>
              <option value="Disable">Disable</option>
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
              className="px-4 py-2 rounded-lg bg-brand-accent hover:bg-brand-accent-hover text-white font-bold"
            >
              {isEditMode ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Delete">
        <div className="space-y-4">
          <p className="text-brand-text-primary">
            Are you sure you want to delete vehicle model <strong>{modelToDelete?.model}</strong>?
          </p>
          <div className="flex justify-end gap-4">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-white hover:bg-brand-hover text-brand-text-secondary font-bold border border-brand-border"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default VehicleModel;