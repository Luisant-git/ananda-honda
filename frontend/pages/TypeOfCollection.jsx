import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { typeOfCollectionApi } from '../api/typeOfCollectionApi.js';

const TypeOfCollection = ({ user }) => {
  const [typeOfCollections, setTypeOfCollections] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingTypeOfCollection, setEditingTypeOfCollection] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [typeOfCollectionToDelete, setTypeOfCollectionToDelete] = useState(null);
  const [formData, setFormData] = useState({ typeOfCollect: '', status: 'Enable', disableVehicleModel: false });

  useEffect(() => {
    fetchTypeOfCollections();
  }, []);

  const fetchTypeOfCollections = async () => {
    try {
      const data = await typeOfCollectionApi.getAll();
      const formattedData = data.map((item, index) => ({
        sNo: index + 1,
        id: item.id,
        typeOfCollect: item.typeOfCollect,
        status: item.status,
        disableVehicleModel: item.disableVehicleModel
      }));
      setTypeOfCollections(formattedData);
    } catch (error) {
      console.error('Error fetching type of collections:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditMode) {
        await typeOfCollectionApi.update(editingTypeOfCollection.id, formData);
        toast.success('Type of collection updated successfully!');
      } else {
        await typeOfCollectionApi.create(formData);
        toast.success('Type of collection created successfully!');
      }
      setIsModalOpen(false);
      setIsEditMode(false);
      setEditingTypeOfCollection(null);
      setFormData({ typeOfCollect: '', status: 'Enable', disableVehicleModel: false });
      fetchTypeOfCollections();
    } catch (error) {
      toast.error('Error saving type of collection');
      console.error('Error saving type of collection:', error);
    }
  };

  const handleEdit = (item) => {
    setIsEditMode(true);
    setEditingTypeOfCollection(item);
    setFormData({ typeOfCollect: item.typeOfCollect, status: item.status, disableVehicleModel: item.disableVehicleModel || false });
    setIsModalOpen(true);
  };

  const handleDelete = (item) => {
    setTypeOfCollectionToDelete(item);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await typeOfCollectionApi.delete(typeOfCollectionToDelete.id);
      toast.success('Type of collection deleted successfully!');
      setIsDeleteModalOpen(false);
      setTypeOfCollectionToDelete(null);
      fetchTypeOfCollections();
    } catch (error) {
      toast.error('Error deleting type of collection');
      console.error('Error deleting type of collection:', error);
    }
  };

  const handleAddNew = () => {
    setIsEditMode(false);
    setEditingTypeOfCollection(null);
    setFormData({ typeOfCollect: '', status: 'Enable', disableVehicleModel: false });
    setIsModalOpen(true);
  };

  const columns = [
    { header: 'SNo', accessor: 'sNo' },
    { header: 'Type of Collection', accessor: 'typeOfCollect' },
    { header: 'Status', accessor: 'status' },
    { header: 'Disable Vehicle Model', accessor: 'disableVehicleModel', render: (value) => value ? 'Yes' : 'No' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-brand-text-primary">Type of Collection</h1>
        <button 
          onClick={handleAddNew}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg">
            Add
        </button>
      </div>
      <DataTable 
        columns={columns} 
        data={typeOfCollections} 
        actionButtons={user?.role === 'SUPER_ADMIN' ? (item) => (
          <div className="flex gap-2">
            <button onClick={() => handleEdit(item)} className="text-blue-600 hover:underline">Edit</button>
            <button onClick={() => handleDelete(item)} className="text-red-600 hover:underline">Delete</button>
          </div>
        ) : null}
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditMode ? "Edit Type of Collection" : "Add Type of Collection"}>
        <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
                <label className="block text-sm font-medium text-brand-text-secondary mb-1">Type of Collection</label>
                <input type="text" value={formData.typeOfCollect} onChange={(e) => setFormData({...formData, typeOfCollect: e.target.value})} className="w-full bg-white border border-brand-border text-brand-text-primary rounded-lg p-2 focus:ring-brand-accent focus:border-brand-accent" required />
            </div>
            <div>
                <label className="block text-sm font-medium text-brand-text-secondary mb-1">Status</label>
                <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full bg-white border border-brand-border text-brand-text-primary rounded-lg p-2 focus:ring-brand-accent focus:border-brand-accent" required>
                    <option value="Enable">Enable</option>
                    <option value="Disable">Disable</option>
                </select>
            </div>
            <div>
                <label className="flex items-center space-x-2">
                    <input 
                        type="checkbox" 
                        checked={formData.disableVehicleModel} 
                        onChange={(e) => setFormData({...formData, disableVehicleModel: e.target.checked})} 
                        className="rounded border-brand-border text-brand-accent focus:ring-brand-accent" 
                    />
                    <span className="text-sm font-medium text-brand-text-secondary">Disable Vehicle Model</span>
                </label>
            </div>
             <div className="flex justify-end gap-4 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg bg-white hover:bg-brand-hover text-brand-text-secondary font-bold border border-brand-border">Close</button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-brand-accent hover:bg-brand-accent-hover text-white font-bold">{isEditMode ? 'Update' : 'Save'}</button>
            </div>
        </form>
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Delete">
        <div className="space-y-4">
          <p className="text-brand-text-primary">Are you sure you want to delete type of collection <strong>{typeOfCollectionToDelete?.typeOfCollect}</strong>?</p>
          <div className="flex justify-end gap-4">
            <button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 rounded-lg bg-white hover:bg-brand-hover text-brand-text-secondary font-bold border border-brand-border">Cancel</button>
            <button onClick={confirmDelete} className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold">Delete</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TypeOfCollection;