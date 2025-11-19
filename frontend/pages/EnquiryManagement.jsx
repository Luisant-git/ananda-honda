import React, { useState, useEffect } from "react";
import { enquiryApi } from "../api/enquiryApi.js";
import DataTable from "../components/DataTable.jsx";

const EnquiryManagement = ({ setCurrentView }) => {
  const [enquiries, setEnquiries] = useState([]);
  const [filteredEnquiries, setFilteredEnquiries] = useState([]);
  const [selectedType, setSelectedType] = useState("BIG_WING");

  const enquiryTypes = ["BIG_WING", "INSURANCE", "ACCESSORIES", "HSRP"];

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterEnquiries();
  }, [enquiries, selectedType]);

  const filterEnquiries = () => {
    const filtered = enquiries.filter(
      (enquiry) => enquiry.enquiryType === selectedType
    );
    setFilteredEnquiries(filtered);
  };

  const fetchData = async () => {
    try {
      const enquiriesRes = await enquiryApi.getAll();
      setEnquiries(enquiriesRes);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const formatDateDMY = (value) => {
    if (!value) return "N/A";
    const d = new Date(value);
    if (isNaN(d.getTime())) return "N/A";
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this enquiry?")) {
      try {
        await enquiryApi.delete(id);
        fetchData();
      } catch (error) {
        console.error("Error deleting enquiry:", error);
      }
    }
  };

  const columns = [
    { header: "ID", accessor: "id" },
    { header: "Type", accessor: "enquiryType" },
    {
      header: "Customer Name",
      accessor: "customerName",
      render: (value) => value || "N/A",
    },
    {
      header: "Mobile",
      accessor: "mobileNumber",
      render: (value) => value || "N/A",
    },
    {
      header: "Vehicle Model",
      accessor: "vehicleModel",
      render: (value) => value || "N/A",
    },
    {
      header: "Executive",
      accessor: "executiveName",
      render: (value) => value || "Not Assigned",
    },
    {
      header: "Lead Sources",
      accessor: "leadSources",
      render: (value) => value?.join(", ") || "N/A",
    },
    {
      header: "Created",
      accessor: "createdAt",
      render: (value) => formatDateDMY(value),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Enquiry Report</h1>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Filter by Enquiry Type:
        </label>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="p-2 border rounded w-48"
        >
          {enquiryTypes.map((type) => (
            <option key={type} value={type}>
              {type.replace("_", " ")}
            </option>
          ))}
        </select>
      </div>

      <DataTable
        data={filteredEnquiries}
        columns={columns}
        actionButtons={(enquiry) => (
          <div className="flex gap-2">
            <button
              onClick={() => handleDelete(enquiry.id)}
              className="text-red-600 hover:underline"
            >
              Delete
            </button>
          </div>
        )}
      />
    </div>
  );
};

export default EnquiryManagement;
