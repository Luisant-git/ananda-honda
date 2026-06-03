import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { locationApi } from '../api/locationApi';

const LocationMaster = ({ user }) => {
  const [locations, setLocations] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({ 
    regionname: '', 
    divisionname: '', 
    officename: '', 
    pincode: '', 
    district: '', 
    statename: '' 
  });

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const data = await locationApi.getAll();
      const formattedData = data.map((loc, index) => ({
        sNo: index + 1,
        id: loc.id,
        regionname: loc.regionname,
        divisionname: loc.divisionname,
        officename: loc.officename,
        pincode: loc.pincode,
        district: loc.district,
        statename: loc.statename,
      }));
      setLocations(formattedData);
    } catch (error) {
      console.error('Error fetching locations:', error);
      toast.error('Failed to fetch locations');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditMode) {
        await locationApi.update(editingLocation.id, formData);
        toast.success('Location updated successfully!');
      } else {
        await locationApi.create(formData);
        toast.success('Location created successfully!');
      }
      setIsModalOpen(false);
      setIsEditMode(false);
      setEditingLocation(null);
      setFormData({ regionname: '', divisionname: '', officename: '', pincode: '', district: '', statename: '' });
      fetchLocations();
    } catch (error) {
      toast.error('Error saving location');
      console.error('Error saving location:', error);
    }
  };

  const handleEdit = (location) => {
    setIsEditMode(true);
    setEditingLocation(location);
    setFormData({
      regionname: location.regionname,
      divisionname: location.divisionname,
      officename: location.officename,
      pincode: location.pincode,
      district: location.district,
      statename: location.statename
    });
    setIsModalOpen(true);
  };

  const handleDelete = (location) => {
    setLocationToDelete(location);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await locationApi.delete(locationToDelete.id);
      toast.success('Location deleted successfully!');
      setIsDeleteModalOpen(false);
      setLocationToDelete(null);
      fetchLocations();
    } catch (error) {
      toast.error(error.message || 'Error deleting location');
      console.error('Error deleting location:', error);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setIsUploading(true);
      toast.loading('Uploading locations...', { id: 'upload-toast' });
      const response = await locationApi.upload(file);
      toast.success(response.message || 'Locations uploaded successfully!', { id: 'upload-toast' });
      fetchLocations();
    } catch (error) {
      toast.error(error.message || 'Error uploading locations', { id: 'upload-toast' });
      console.error('Error uploading:', error);
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const columns = [
    { header: 'SNo', accessor: 'sNo' },
    { header: 'Region Name', accessor: 'regionname' },
    { header: 'Division Name', accessor: 'divisionname' },
    { header: 'Office Name', accessor: 'officename' },
    { header: 'Pincode', accessor: 'pincode' },
    { header: 'District', accessor: 'district' },
    { header: 'State Name', accessor: 'statename' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-brand-text-primary">Locations</h1>
        <div className="flex gap-4">
          <div className="relative">
            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isUploading}
            />
            <button
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2"
              disabled={isUploading}
            >
              {isUploading ? 'Uploading...' : 'Upload Excel'}
            </button>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg"
          >
            Add Location
          </button>
        </div>
      </div>

      <DataTable 
        columns={columns} 
        data={locations} 
        actionButtons={(location) => (
          <div className="flex gap-2">
            <button onClick={() => handleEdit(location)} className="text-blue-600 hover:underline">Edit</button>
            <button onClick={() => handleDelete(location)} className="text-red-600 hover:underline">Delete</button>
          </div>
        )}
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditMode ? "Edit Location" : "Add Location"}>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-brand-text-secondary mb-1">Region Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={formData.regionname}
                onChange={(e) => setFormData({...formData, regionname: e.target.value})}
                className="w-full bg-white border border-brand-border text-brand-text-primary rounded-lg p-2 focus:ring-brand-accent focus:border-brand-accent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-text-secondary mb-1">Division Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={formData.divisionname}
                onChange={(e) => setFormData({...formData, divisionname: e.target.value})}
                className="w-full bg-white border border-brand-border text-brand-text-primary rounded-lg p-2 focus:ring-brand-accent focus:border-brand-accent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-text-secondary mb-1">Office Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={formData.officename}
                onChange={(e) => setFormData({...formData, officename: e.target.value})}
                className="w-full bg-white border border-brand-border text-brand-text-primary rounded-lg p-2 focus:ring-brand-accent focus:border-brand-accent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-text-secondary mb-1">Pincode <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={formData.pincode}
                onChange={(e) => setFormData({...formData, pincode: e.target.value})}
                className="w-full bg-white border border-brand-border text-brand-text-primary rounded-lg p-2 focus:ring-brand-accent focus:border-brand-accent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-text-secondary mb-1">District <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={formData.district}
                onChange={(e) => setFormData({...formData, district: e.target.value})}
                className="w-full bg-white border border-brand-border text-brand-text-primary rounded-lg p-2 focus:ring-brand-accent focus:border-brand-accent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-text-secondary mb-1">State Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={formData.statename}
                onChange={(e) => setFormData({...formData, statename: e.target.value})}
                className="w-full bg-white border border-brand-border text-brand-text-primary rounded-lg p-2 focus:ring-brand-accent focus:border-brand-accent"
                required
              />
            </div>
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
            Are you sure you want to delete this location <strong>{locationToDelete?.officename}</strong>?
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

export default LocationMaster;
