import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import DataTable from "../components/DataTable";
import Modal from "../components/Modal";
import { customerApi } from "../api/customerApi.js";
import { enquiryApi } from "../api/enquiryApi.js";
import { vehicleCatalogueApi } from "../api/vehicleCatalogueApi.js";
import { salesExecutiveApi } from "../api/salesExecutiveApi.js";
import SearchableDropdown from "../components/SearchableDropdown.jsx";
import { menuPermissionApi } from "../api/menuPermissionApi";

import { 
  User, Phone, MapPin, Sparkles, CheckCircle2, Save, X,
  Mail, Calendar, Briefcase, Home, Building2, CreditCard,
  FileText, AlertCircle, Search, UserCheck, UserPlus,
  Bike, Wrench, Target, ClipboardList, Globe, Award, Repeat
} from "lucide-react";

const InputField = ({ label, value, onChange, icon: Icon, type = "text", required = false, placeholder = "", disabled = false, maxLength }) => {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
        {Icon && <Icon size={12} />}
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/10 disabled:cursor-not-allowed disabled:bg-gray-50"
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        maxLength={maxLength}
      />
    </div>
  );
};

const Section = ({ icon: Icon, title, subtitle, required, children }) => {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 mb-5">
      <div className="flex items-center gap-3 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white px-5 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/10 text-blue-600">
          <Icon size={16} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-[14px] font-semibold text-gray-800">{title}</h3>
            {required && <span className="rounded-full bg-red-50 px-2 py-0.5 text-[9px] font-bold text-red-600">REQUIRED</span>}
          </div>
          {subtitle && <p className="text-[11px] text-gray-400">{subtitle}</p>}
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
};

const SelectField = ({ label, value, onChange, options, disabled = false, required = false }) => {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-gray-500">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <select
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          required={required}
          className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 py-2.5 pr-8 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/10 disabled:cursor-not-allowed disabled:bg-gray-50"
        >
          <option value="">Select...</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <svg className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.39a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </div>
    </div>
  );
};

const CustomerDetails = ({ user }) => {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [isEnquiryModalOpen, setIsEnquiryModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    mobile: "",
    altMobile: "",
    email: "",
    location: "",
    address: "",
    customerType: "RETAIL",
    dob: "",
    anniversary: "",
    occupation: "",
    gstNo: "",
    channel: "WALKIN",
    sourceId: "",
    enquiryTypeId: "",
    status: "Walk in Customer",
    modelId: "",
    variantId: "",
    colourId: "",
    executiveName: "",
    interestLevel: "",
    purchaseType: "",
    exchangeEnabled: false,
    exchangeValue: "",
    enquiryDate: new Date().toISOString().split("T")[0],
    remark: "",
    typeOfService: "",
    expectedServiceDate: "",
    pickupDropFlag: false,
    branchId: "",
  });
  
  const [isCheckingCustomer, setIsCheckingCustomer] = useState(false);
  const [foundCustomer, setFoundCustomer] = useState(null);
  const [bigWingEnquiries, setBigWingEnquiries] = useState([]);
  const [showBigWingData, setShowBigWingData] = useState(false);
  const [isFetchingBigWing, setIsFetchingBigWing] = useState(false);
  
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [detailedCustomer, setDetailedCustomer] = useState(null);
  const [activeTab, setActiveTab] = useState("invoices");
  const [filters, setFilters] = useState({
    selectedCustomer: "",
    fromDate: "",
    toDate: "",
  });
  const [permissions, setPermissions] = useState(null);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);

  const [customerEnquiries, setCustomerEnquiries] = useState([]);
  const [showEnquiryForm, setShowEnquiryForm] = useState(false);
  const [enquiryFormData, setEnquiryFormData] = useState({
    enquiryType: "",
    vehicleModelId: "",
    mobileNumber: "",
    leadSources: [],
    executiveName: "",
  });

  const [lookupData, setLookupData] = useState({
    sources: [],
    enquiryTypes: [],
    models: [],
    colours: [],
    executives: [],
    branches: [],
  });
  const [selectedModel, setSelectedModel] = useState("");
  const [variants, setVariants] = useState([]);

  const customerTypes = ["RETAIL", "CORPORATE", "DEALER"];
  const leadSources = [
    "WALK_IN", "PHONE_CALL", "WEBSITE", "INSTAGRAM", 
    "GOOGLE_BUSINESS", "FACEBOOK", "REFERENCE", "EXISTING_CUSTOMER"
  ];
  const occupations = ["SALARIED", "SELF_EMPLOYED", "BUSINESS", "PROFESSIONAL", "STUDENT", "RETIRED", "HOUSEWIFE"];
  const CHANNELS = [
    { value: "WALKIN", label: "Walk-in" },
    { value: "TELE", label: "Tele" },
    { value: "DIGITAL", label: "Digital" },
    { value: "SOCIAL", label: "Social" },
    { value: "REFERENCE", label: "Reference" },
    { value: "WEBSITE", label: "Website" },
  ];

  const enquiryTypes = ["BIG_WING", "INSURANCE", "ACCESSORIES", "HSRP"];
  const bigWingExecutives = [
    "Vinushree", "Chandana", "Jeevitha", "Murali", 
    "Anusha", "Aadharsh", "Tejaswini", "Punith", "Babyrani"
  ];
  const accessoriesExecutives = ["Amrutha", "Sangeetha"];
  const bigWingModels = [
    "Activa", "Activa 125", "Dio", "Dio 125", 
    "Shine 100", "Shine 125", "SP160", "Unicorn", "Livo"
  ];
  const accessoriesModels = [
    "Activa 110", "Activa 125", "Dio", "Shine 100", 
    "Shine (123 cc)", "SP 125", "Unicorn", "CB125", "Hornet", "SP 160"
  ];

  useEffect(() => {
    fetchCustomers();
    fetchPermissions();
    fetchLookupData();
  }, []);

 const fetchLookupData = async () => {
  try {
    // Fetch all data using the correct API functions
    const [models, colours, executives, branches] = await Promise.all([
      vehicleCatalogueApi.getVehicleModels(),
      vehicleCatalogueApi.getVehicleColours(),
      vehicleCatalogueApi.getSalesExecutives(),
      salesExecutiveApi.getBranches(),
    ]);
    
    setLookupData({
      sources: [], // You can remove this if not needed
      enquiryTypes: [], // You can remove this if not needed  
      models: models.data || [],
      colours: colours.data || [],
      executives: executives.data || [],
      branches: branches.data || [],
    });

    console.log("Models loaded:", models.data);
    console.log("Colours loaded:", colours.data);
    console.log("Executives loaded:", executives.data);
    console.log("Branches loaded:", branches.data);
  } catch (error) {
    console.error("Error fetching lookup data:", error);
    toast.error("Failed to load master data. Please refresh the page.");
  }
};
  useEffect(() => {
    const loadVariants = async () => {
      if (!selectedModel) {
        setVariants([]);
        return;
      }

      try {
        const data = await vehicleCatalogueApi.getVehicleVariantsByModel(selectedModel);
        setVariants(data.data || []);
      } catch (err) {
        console.error("Error fetching variants:", err);
      }
    };

    loadVariants();
  }, [selectedModel]);

  const fetchCustomerEnquiries = async (customerId) => {
    try {
      const data = await enquiryApi.getByCustomer(customerId);
      setCustomerEnquiries(data);
    } catch (error) {
      console.error("Error fetching customer enquiries:", error);
    }
  };

  const fetchPermissions = async () => {
    try {
      const perms = await menuPermissionApi.get();
      setPermissions(perms);
    } catch (error) {
      console.error("Failed to fetch permissions:", error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const data = await customerApi.getAll();
      const formattedData = data.map((customer, index) => ({
        sNo: index + 1,
        ...customer,
      }));
      setCustomers(formattedData);
      setFilteredCustomers(formattedData);
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  const checkCustomerInBigWing = async (mobileNumber) => {
    if (!mobileNumber || mobileNumber.length !== 10) {
      return null;
    }
    
    setIsCheckingCustomer(true);
    try {
      const result = await customerApi.getByPhoneNumber(mobileNumber);
      
      let dataItems = [];
      if (result) {
        if (Array.isArray(result.data)) {
          dataItems = result.data;
        } else if (Array.isArray(result)) {
          dataItems = result;
        } else if (result.customer || result.firstName) {
          dataItems = [result];
        }
      }

      if (dataItems.length > 0) {
        const customerData = dataItems[0];
        const customer = customerData.customer || customerData;
        
        setFoundCustomer(customer);
        setBigWingEnquiries(dataItems);
        setShowBigWingData(true);
        
        const fullName = `${customer.firstName || ''} ${customer.lastName || ''}`.trim();
        
        toast.success(`Customer found: ${fullName}`, { duration: 3000 });
        
        return customer;
      } else {
        toast.info("No existing customer found with this mobile number", { duration: 2000 });
        setFoundCustomer(null);
        setShowBigWingData(false);
        return null;
      }
    } catch (error) {
      console.error("Error checking customer:", error);
      return null;
    } finally {
      setIsCheckingCustomer(false);
    }
  };

  const autoFillFromBigWing = () => {
    if (foundCustomer) {
      setFormData(prev => ({
        ...prev,
        firstName: foundCustomer.firstName || "",
        lastName: foundCustomer.lastName || "",
        mobile: foundCustomer.mobile || prev.mobile,
        address: foundCustomer.address || "",
        location: foundCustomer.location || "",
      }));
      toast.success("Form auto-filled with customer data from BigWing!");
      setShowBigWingData(false);
    }
  };

const handleMobileNumberChange = async (value) => {
  const numericValue = value.replace(/\D/g, "");
  if (numericValue.length > 10) return;
  
  setFormData(prev => ({ ...prev, mobile: numericValue }));
  
  if (numericValue.length === 10 && !isEditMode) {
    setIsCheckingCustomer(true);
    
    // First check in local database using your existing getByMobile function
    const localExists = await checkLocalCustomerExists(numericValue);
    
    // Only check BigWing if not found locally
    if (!localExists) {
      await checkCustomerInBigWing(numericValue);
    }
    
    setIsCheckingCustomer(false);
  }
};

  const handleFilterLoad = () => {
    let filtered = [...customers];

    if (filters.selectedCustomer) {
      filtered = filtered.filter(
        (customer) => customer.custId === filters.selectedCustomer
      );
    }

    if (filters.fromDate || filters.toDate) {
      filtered = filtered.filter((customer) => {
        const customerDate = new Date(customer.createdAt);
        const fromDate = filters.fromDate ? new Date(filters.fromDate) : null;
        const toDate = filters.toDate ? new Date(filters.toDate) : null;

        if (fromDate) {
          fromDate.setHours(0, 0, 0, 0);
          if (customerDate < fromDate) return false;
        }
        if (toDate) {
          toDate.setHours(23, 59, 59, 999);
          if (customerDate > toDate) return false;
        }
        return true;
      });
    }

    setFilteredCustomers(
      filtered.map((customer, index) => ({ ...customer, sNo: index + 1 }))
    );
  };

  const handleLoadAll = () => {
    setFilters({ selectedCustomer: "", fromDate: "", toDate: "" });
    setFilteredCustomers(customers);
  };

const handleSubmit = async (e) => {
  e.preventDefault();

  if (!/^\d{10}$/.test(formData.mobile)) {
    toast.error("Mobile number must be exactly 10 digits");
    return;
  }

  if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    toast.error("Please enter a valid email address");
    return;
  }

  if (!isEditMode) {
    const exists = await checkLocalCustomerExists(formData.mobile);
    if (exists) {
      toast.error("This mobile number is already registered. Please use a different number or edit existing customer.");
      return;
    }
  }

  if (formData.altMobile && formData.altMobile === formData.mobile) {
    toast.error("Alternate mobile number cannot be the same as primary mobile number.");
    return;
  }

  try {
    const customerData = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      mobile: formData.mobile,
      altMobile: formData.altMobile,
      email: formData.email,
      location: formData.location,
      address: formData.address,
      customerType: formData.customerType,
      dob: formData.dob,
      anniversary: formData.anniversary,
      occupation: formData.occupation,
      gstNo: formData.gstNo,
      status: formData.status,
      // Lead/Enquiry fields
      enquiryDate: formData.enquiryDate,
      vehicleModel: lookupData.models.find(m => String(m.id) === formData.modelId)?.name,
      color: lookupData.colours.find(c => String(c.id) === formData.colourId)?.name,
      variant: variants.find(v => String(v.id) === formData.variantId)?.name,
      interestLevel: formData.interestLevel,
      purchaseType: formData.purchaseType,
      branch: lookupData.branches.find((b) => String(b.id) === formData.branchId)?.name,
      exchangeDetails: formData.exchangeEnabled && formData.exchangeValue ? formData.exchangeValue : undefined,
      assignedExecutive: formData.executiveName || undefined,
      remarks: formData.remark || undefined,
    };

    let savedCustomer;
    if (isEditMode) {
      await customerApi.update(editingCustomer.id, customerData);
      toast.success("Customer updated successfully!");
      savedCustomer = { id: editingCustomer.id, ...customerData };
    } else {
      savedCustomer = await customerApi.create(customerData);
      toast.success("Customer created successfully!");
    }
    
    setIsModalOpen(false);
    setIsEditMode(false);
    setEditingCustomer(null);
    resetForm();
    setFoundCustomer(null);
    setShowBigWingData(false);
    fetchCustomers();
  } catch (error) {
    if (error.message?.includes('duplicate') || error.message?.includes('already exists')) {
      toast.error("This mobile number is already registered. Please use a different number.");
    } else {
      toast.error("Error saving customer");
    }
    console.error("Error saving customer:", error);
  }
};

  const createLead = async (customerId) => {
    try {
      const leadData = {
        customerId: customerId,
        channel: formData.channel,
        sourceId: Number(formData.sourceId),
        enquiryTypeId: Number(formData.enquiryTypeId),
        modelId: formData.modelId ? Number(formData.modelId) : undefined,
        variantId: formData.variantId ? Number(formData.variantId) : undefined,
        colourId: formData.colourId ? Number(formData.colourId) : undefined,
        executiveName: formData.executiveName || undefined,
        interestLevel: formData.interestLevel || undefined,
        purchaseType: formData.purchaseType || undefined,
        exchangeValue: formData.exchangeValue,
        enquiryDate: formData.enquiryDate,
        remark: formData.remark || undefined,
        typeOfService: formData.typeOfService || undefined,
        expectedServiceDate: formData.expectedServiceDate || undefined,
        pickupDropFlag: formData.pickupDropFlag,
      };
      
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(leadData),
      });
      
      toast.success("Lead created successfully!");
    } catch (error) {
      console.error("Error creating lead:", error);
      toast.error("Customer saved but failed to create lead");
    }
  };

  const checkLocalCustomerExists = async (mobileNumber) => {
  if (!mobileNumber || mobileNumber.length !== 10) return false;
  
  try {
    const customer = await customerApi.getByMobile(mobileNumber);
    const customerData = customer?.data ?? customer;
    if (!customerData) return false;

    const resolvedCustomer = Array.isArray(customerData)
      ? customerData[0]
      : customerData;

    if (!resolvedCustomer) return false;

    toast.error(
      (t) => (
        <div className="flex flex-col max-w-sm">
          <div className="flex items-center gap-2 font-semibold text-red-800">
           
            Mobile Number Already Registered!
          </div>
         
          
        </div>
      ),
      { duration: 8000 }
    );
    return true;
  } catch (error) {
    console.error("Error checking local customer:", error);
    return false;
  }
};

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      mobile: "",
      altMobile: "",
      email: "",
      location: "",
      address: "",
      customerType: "RETAIL",
      dob: "",
      anniversary: "",
      occupation: "",
      gstNo: "",
      channel: "WALKIN",
      sourceId: "",
      enquiryTypeId: "",
      status: "Walk in Customer",
      modelId: "",
      variantId: "",
      colourId: "",
      branchId: "",
      executiveName: "",
      interestLevel: "",
      purchaseType: "",
      exchangeValue: "",
      enquiryDate: new Date().toISOString().split("T")[0],
      remark: "",
      typeOfService: "",
      expectedServiceDate: "",
      pickupDropFlag: false,
    });
    setSelectedModel("");
  };

const handleEdit = (customer) => {
  setIsEditMode(true);
  setEditingCustomer(customer);
  
  const normalize = (value = '') => String(value).trim().toLowerCase();
  const customerBranchLabel = customer.branch || customer.referredBranch || "";

  // Find model, variant, colour IDs from names using case-insensitive matching
  const model = lookupData.models.find(
    (m) => normalize(m.name) === normalize(customer.vehicleModel)
  );
  const colour = lookupData.colours.find(
    (c) => normalize(c.name) === normalize(customer.color)
  );
  const variant = variants.find(
    (v) => normalize(v.name) === normalize(customer.variant)
  );
  const branch = lookupData.branches.find(
    (b) => normalize(b.name) === normalize(customerBranchLabel)
  );
  
  setFormData({
    firstName: customer.firstName || customer.name?.split(' ')[0] || "",
    lastName: customer.lastName || customer.name?.split(' ').slice(1).join(' ') || "",
    mobile: customer.mobile || customer.contactNo || "",
    altMobile: customer.altMobile || "",
    email: customer.email || "",
    location: customer.location || "",
    address: customer.address || "",
    customerType: customer.customerType || "RETAIL",
    status: customer.status || "Walk in Customer",
    dob: customer.dob ? customer.dob.split('T')[0] : "",
    anniversary: customer.anniversary ? customer.anniversary.split('T')[0] : "",
    occupation: customer.occupation || "",
    gstNo: customer.gstNo || "",
    channel: "WALKIN",
    sourceId: "",
    enquiryTypeId: "",
    modelId: model ? String(model.id) : "",
    variantId: variant ? String(variant.id) : "",
    colourId: colour ? String(colour.id) : "",
    branchId: branch ? String(branch.id) : (customer.branchId ? String(customer.branchId) : ""),
    executiveName: customer.assignedExecutive || "",
    interestLevel: customer.interestLevel || "",
    purchaseType: customer.purchaseType || "",
    exchangeEnabled: Boolean(customer.exchangeDetails && customer.exchangeDetails.trim() !== ""),
    exchangeValue: customer.exchangeDetails || "",
    enquiryDate: customer.enquiryDate ? new Date(customer.enquiryDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
    remark: customer.remarks || "",
    typeOfService: "",
    expectedServiceDate: "",
    pickupDropFlag: false,
  });
  
  if (model) setSelectedModel(String(model.id));
  
  setIsModalOpen(true);
};
  
  const handleViewDetails = async (customer) => {
    try {
      const details = await customerApi.getDetails(customer.id);
      setDetailedCustomer(details);
      setIsDetailsModalOpen(true);
      setActiveTab("invoices");
      await checkCustomerInBigWing(customer.contactNo);
    } catch (error) {
      toast.error("Error fetching details");
    }
  };

  const handleEnquiryTypeSelect = (type) => {
    setEnquiryFormData({ ...enquiryFormData, enquiryType: type });
    setShowEnquiryForm(true);
  };

  const handleEnquirySubmit = async (e) => {
    e.preventDefault();
    if (!/^[0-9]{10}$/.test(enquiryFormData.mobileNumber)) {
      toast.error("Mobile number must be exactly 10 digits");
      return;
    }
    try {
      await enquiryApi.create({
        customerId: selectedCustomer.id,
        enquiryType: enquiryFormData.enquiryType,
        mobileNumber: enquiryFormData.mobileNumber,
        vehicleModel: enquiryFormData.vehicleModelId,
        leadSources: enquiryFormData.leadSources,
        executiveName: enquiryFormData.executiveName,
      });
      toast.success("Enquiry added successfully!");
      setShowEnquiryForm(false);
      setEnquiryFormData({
        enquiryType: "",
        vehicleModelId: "",
        mobileNumber: "",
        leadSources: [],
        executiveName: "",
      });
      fetchCustomerEnquiries(selectedCustomer.id);
    } catch (error) {
      toast.error("Error adding enquiry");
      console.error("Error adding enquiry:", error);
    }
  };

  const handleLeadSourceChange = (source) => {
    setEnquiryFormData((prev) => ({
      ...prev,
      leadSources: prev.leadSources.includes(source)
        ? prev.leadSources.filter((s) => s !== source)
        : [...prev.leadSources, source],
    }));
  };

  const handleDelete = (customer) => {
    setCustomerToDelete(customer);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await customerApi.delete(customerToDelete.id);
      toast.success("Customer deleted successfully!");
      setIsDeleteModalOpen(false);
      setCustomerToDelete(null);
      fetchCustomers();
    } catch (error) {
      toast.error(error.message || "Error deleting customer");
      console.error("Error deleting customer:", error);
    }
  };

  const handleAddNew = () => {
    setIsEditMode(false);
    setEditingCustomer(null);
    resetForm();
    setFoundCustomer(null);
    setShowBigWingData(false);
    setIsModalOpen(true);
  };

  const downloadXML = () => {
    try {
      let xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n';
      xmlContent += "<ENVELOPE>\n";
      xmlContent += "<HEADER>\n";
      xmlContent += "<TALLYREQUEST>Import Data</TALLYREQUEST>\n";
      xmlContent += "</HEADER>\n";
      xmlContent += "<BODY>\n";
      xmlContent += "<IMPORTDATA>\n";
      xmlContent += "<REQUESTDESC>\n";
      xmlContent += "<REPORTNAME>All Masters</REPORTNAME>\n";
      xmlContent += "<STATICVARIABLES>\n";
      xmlContent += "<SVCURRENTCOMPANY>DEMO COMPANY</SVCURRENTCOMPANY>\n";
      xmlContent += "</STATICVARIABLES>\n";
      xmlContent += "</REQUESTDESC>\n";
      xmlContent += "<REQUESTDATA>\n";

      filteredCustomers.forEach((customer) => {
        xmlContent += '<TALLYMESSAGE xmlns:UDF="TallyUDF">\n';
        xmlContent += `<LEDGER NAME="${customer.custId} ${customer.name}" RESERVEDNAME="">\n`;
        xmlContent += "<NAME.LIST>\n";
        xmlContent += `<NAME>${customer.custId} ${customer.name}</NAME>\n`;
        xmlContent += "</NAME.LIST>\n";
        xmlContent += "<ADDRESS.LIST>\n";
        xmlContent += `<ADDRESS>${customer.address || "N/A"}</ADDRESS>\n`;
        xmlContent += "</ADDRESS.LIST>\n";
        xmlContent += `<ADDITIONALNAME>${customer.custId} ${customer.name}</ADDITIONALNAME>\n`;
        xmlContent += `<PARENT>Sundry Debtors</PARENT>\n`;
        xmlContent += "</LEDGER>\n";
        xmlContent += "</TALLYMESSAGE>\n";
      });

      xmlContent += "</REQUESTDATA>\n";
      xmlContent += "</IMPORTDATA>\n";
      xmlContent += "</BODY>\n";
      xmlContent += "</ENVELOPE>";

      const blob = new Blob([xmlContent], { type: "application/xml" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tally_customers_${new Date().toISOString().split("T")[0]}.xml`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("Tally XML file downloaded successfully!");
    } catch (error) {
      toast.error("Error downloading XML file");
    }
  };

  const columns = [
    { header: "SNo", accessor: "sNo" },
    { header: "CustId", accessor: "custId" },
    { header: "Name", accessor: "name" },
    { header: "Contact No", accessor: "contactNo" },
    { header: "Status", accessor: "status" },
  ];

  const EnquiryTypeBadge = ({ type }) => {
    const getTypeColor = (enquiryType) => {
      switch(enquiryType) {
        case 'Walk-In': return 'bg-green-100 text-green-800';
        case 'BIG_WING': return 'bg-blue-100 text-blue-800';
        case 'INSURANCE': return 'bg-yellow-100 text-yellow-800';
        case 'ACCESSORIES': return 'bg-purple-100 text-purple-800';
        case 'HSRP': return 'bg-orange-100 text-orange-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getTypeColor(type)}`}>
        {type?.replace(/_/g, ' ') || 'N/A'}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Customer Details</h1>
        <button
          onClick={downloadXML}
          className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-6 rounded-lg"
        >
          XML
        </button>
      </div>

      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm ring-1 ring-black/5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <SearchableDropdown
            label="Select Customer"
            value={filters.selectedCustomer}
            onChange={(value) => setFilters({ ...filters, selectedCustomer: value })}
            options={customers.map((c) => ({
              value: c.custId,
              label: `${c.name} - ${c.contactNo}`,
            }))}
          />
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-600 mb-1">From:</label>
            <input
              type="date"
              value={filters.fromDate}
              onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
              className="bg-white border border-gray-200 rounded-lg p-2 focus:ring-blue-600 focus:border-blue-600"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-600 mb-1">To:</label>
            <input
              type="date"
              value={filters.toDate}
              onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
              className="bg-white border border-gray-200 rounded-lg p-2 focus:ring-blue-600 focus:border-blue-600"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleFilterLoad}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg"
            >
              Load
            </button>
            <button
              onClick={handleLoadAll}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg"
            >
              Load All
            </button>
          </div>
          {permissions?.master?.customer_details?.add && (
            <button
              onClick={handleAddNew}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg"
            >
              Add Customer
            </button>
          )}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredCustomers}
        actionButtons={(customer) => (
          <div className="flex gap-2">
            {permissions?.master?.customer_details?.edit && (
              <button onClick={() => handleEdit(customer)} className="text-blue-600 hover:underline">
                Edit
              </button>
            )}
            <button onClick={() => handleViewDetails(customer)} className="text-green-600 hover:underline">
              View
            </button>
            {permissions?.master?.customer_details?.delete && (
              <button onClick={() => handleDelete(customer)} className="text-red-600 hover:underline">
                Delete
              </button>
            )}
          </div>
        )}
      />

      {/* Add/Edit Customer Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setFoundCustomer(null);
          setShowBigWingData(false);
        }}
        title={isEditMode ? "Edit Customer" : "New Customer Entry"}
        maxWidth="max-w-5xl"
        maxHeight="max-h-[90vh]"
      >
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto px-2">
          {showBigWingData && foundCustomer && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <UserCheck size={20} className="text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-green-800">Customer Found in BigWing CRM</h4>
                    <p className="text-sm text-green-700 mt-1">
                      {foundCustomer.firstName} {foundCustomer.lastName} - {foundCustomer.mobile}
                    </p>
                    {bigWingEnquiries.length > 0 && (
                      <p className="text-xs text-green-600 mt-1">
                        {bigWingEnquiries.length} previous enquiry(s) found
                      </p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={autoFillFromBigWing}
                  className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
                >
                  Auto-fill Form
                </button>
              </div>
            </div>
          )}

          <Section icon={User} title="Customer Information" subtitle="Personal and contact details" required>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="relative">
                <InputField
                  label="Mobile Number"
                  icon={Phone}
                  value={formData.mobile}
                  onChange={handleMobileNumberChange}
                  required
                  placeholder="10-digit mobile number"
                  maxLength="10"
                />
                {isCheckingCustomer && (
                  <div className="absolute right-3 top-8">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  </div>
                )}
              </div>
              <InputField
                label="First Name"
                value={formData.firstName}
                onChange={(value) => setFormData(prev => ({ ...prev, firstName: value }))}
                required
                placeholder="Enter first name"
              />
              <InputField
                label="Last Name"
                value={formData.lastName}
                onChange={(value) => setFormData(prev => ({ ...prev, lastName: value }))}
                placeholder="Enter last name"
              />
              <InputField
                label="Address"
                icon={Home}
                value={formData.address}
                onChange={(value) => setFormData(prev => ({ ...prev, address: value }))}
                placeholder="Enter address"
              />
              <InputField
                label="Location"
                icon={MapPin}
                value={formData.location}
                onChange={(value) => setFormData(prev => ({ ...prev, location: value }))}
                placeholder="Enter location"
              />
            </div>
          </Section>

          {/* Enquiry Type - Fixed to Walk in Customer (no dropdown, just display) */}
          <Section icon={FileText} title="Enquiry Details" subtitle="Capture lead/enquiry information">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                  Enquiry Type
                </label>
                <input
                  type="text"
                  value="Walk in Customer"
                  disabled
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-600"
                />
              </div>
              <InputField
                label="Enquiry Date"
                icon={Calendar}
                type="date"
                value={formData.enquiryDate}
                onChange={(value) => setFormData(prev => ({ ...prev, enquiryDate: value }))}
              />
            </div>
          </Section>

          <Section icon={Bike} title="Vehicle Interest" subtitle="Vehicle the customer is interested in">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <SelectField
                label="Model"
                value={formData.modelId}
                onChange={(value) => {
                  setFormData(prev => ({ ...prev, modelId: value, variantId: "" }));
                  setSelectedModel(value);
                }}
                options={lookupData.models.map(m => ({ value: String(m.id), label: m.name }))}
              />
              <SelectField
                label="Variant"
                value={formData.variantId}
                onChange={(value) => setFormData(prev => ({ ...prev, variantId: value }))}
                options={variants.map(v => ({ value: String(v.id), label: v.name }))}
                disabled={!selectedModel}
              />
              <SelectField
                label="Colour"
                value={formData.colourId}
                onChange={(value) => setFormData(prev => ({ ...prev, colourId: value }))}
                options={lookupData.colours.map(c => ({ value: String(c.id), label: c.name }))}
              />
            </div>
          </Section>

<Section icon={Target} title="Interest & Purchase" subtitle="Lead qualification">
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
    <div>
      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-gray-500">
        Interest Level
      </label>
      <div className="grid grid-cols-3 gap-2">
        {[
          { value: "HOT", label: "🔥 Hot", color: "#EF4444" },
          { value: "WARM", label: "🌤️ Warm", color: "#F59E0B" },
          { value: "COLD", label: "❄️ Cold", color: "#64748B" },
        ].map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, interestLevel: opt.value }))}
            className={`rounded-lg border px-3 py-2 text-[12px] font-bold transition-all ${
              formData.interestLevel === opt.value
                ? "text-white shadow-md"
                : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
            }`}
            style={formData.interestLevel === opt.value ? { backgroundColor: opt.color, borderColor: opt.color } : {}}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
    <SelectField
      label="Purchase Type"
      value={formData.purchaseType}
      onChange={(value) => {
        setFormData(prev => ({
          ...prev,
          purchaseType: value,
        }));
      }}
      options={[
        { value: "CASH", label: "Cash" },
        { value: "FINANCE", label: "Finance" },
      ]}
    />
  </div>

  {/* Exchange Toggle - Always visible, no purchase type requirement */}
  <div className="mt-4 flex gap-3">
    <button
      type="button"
      onClick={() => setFormData(prev => ({ 
        ...prev, 
        exchangeEnabled: !prev.exchangeEnabled,
        exchangeValue: !prev.exchangeEnabled ? prev.exchangeValue : ""
      }))}
      className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${
        formData.exchangeEnabled
          ? "bg-blue-600 text-white shadow-md"
          : "bg-gray-100 text-gray-500 ring-1 ring-gray-200 hover:bg-gray-200"
      }`}
    >
      <span className={`flex h-4 w-4 items-center justify-center rounded-full ${formData.exchangeEnabled ? "bg-white text-blue-600" : "border-2 border-gray-300"}`}>
        {formData.exchangeEnabled && <CheckCircle2 size={10} strokeWidth={3} />}
      </span>
      Exchange
    </button>
  </div>

  {/* Exchange Details Textarea - Shows when toggle is ON */}
  {formData.exchangeEnabled && (
    <div className="mt-4">
      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-gray-500">
        Exchange Details
      </label>
      <textarea
        value={formData.exchangeValue}
        onChange={(e) => setFormData(prev => ({ ...prev, exchangeValue: e.target.value }))}
        rows={3}
        placeholder="Enter exchange vehicle details (e.g., Old Activa - 2018 model, Registration No: KA01AB1234)"
        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/10"
      />
    </div>
  )}
</Section>

          <Section icon={User} title="Assignment">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <SelectField
                label="Branch"
                value={formData.branchId}
                onChange={(value) => setFormData(prev => ({ ...prev, branchId: value }))}
                options={lookupData.branches.map((branch) => ({ value: String(branch.id), label: branch.name }))}
              />
              <SelectField
                label="Assigned Executive"
                value={formData.executiveName}
                onChange={(value) => setFormData(prev => ({ ...prev, executiveName: value }))}
                options={lookupData.executives.map(ex => ({ value: ex.name, label: ex.name }))}
              />
            </div>
          </Section>

          <Section icon={Sparkles} title="Notes & Remarks">
            <textarea
              value={formData.remark}
              onChange={(e) => setFormData(prev => ({ ...prev, remark: e.target.value }))}
              rows={3}
              placeholder="Add any additional notes about this customer/lead..."
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/10"
            />
          </Section>

          <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                setFoundCustomer(null);
                setShowBigWingData(false);
              }}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              <X size={14} /> Cancel
            </button>
            <button
              type="submit"
              disabled={isCheckingCustomer}
              className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-2 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg disabled:opacity-50"
            >
              <Save size={14} /> {isEditMode ? "Update Customer" : "Create Customer"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Delete"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to delete customer{" "}
            <strong>{customerToDelete?.name}</strong>?
          </p>
          <div className="flex justify-end gap-4">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-white hover:bg-gray-50 text-gray-600 font-bold border border-gray-200"
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

      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title={`Customer Profile: ${detailedCustomer?.name} (${detailedCustomer?.custId})`}
        maxWidth="max-w-5xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 border-b border-gray-200 pb-4">
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold">Contact No</p>
              <p className="text-gray-800 font-medium">{detailedCustomer?.contactNo}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold">Status</p>
              <p className="text-gray-800 font-medium">{detailedCustomer?.status}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold">Branch</p>
              <p className="text-gray-800 font-medium">{detailedCustomer?.branch || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold">Address</p>
              <p className="text-gray-800 font-medium">{detailedCustomer?.address}</p>
            </div>
          </div>

          <div className="flex border-b border-gray-200 overflow-x-auto">
            {["invoices", "enquiries", "bigwing_enquiries", "sales_payments", "service_payments"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                  activeTab === tab
                    ? "border-b-2 border-blue-600 text-blue-600 bg-blue-50/50"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                {tab.replace("_", " ").toUpperCase()}
              </button>
            ))}
          </div>

          <div className="min-h-[400px]">
            {activeTab === "invoices" && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase">Reg No</th>
                      <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase">Model</th>
                      <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase">DSE</th>
                      <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase">Delivery Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {detailedCustomer?.salesInvoices?.map((inv) => (
                      <tr key={inv.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm">{inv.vehicleRegNo || 'N/A'}</td>
                        <td className="px-4 py-2 text-sm">{inv.vehicleModel || 'N/A'}</td>
                        <td className="px-4 py-2 text-sm">{inv.assignedTo || 'N/A'}</td>
                        <td className="px-4 py-2 text-sm">
                          {inv.actualDeliverDate ? new Date(inv.actualDeliverDate).toLocaleDateString('en-GB') : 'N/A'}
                        </td>
                      </tr>
                    ))}
                    {(!detailedCustomer?.salesInvoices || detailedCustomer.salesInvoices.length === 0) && (
                      <tr>
                        <td colSpan="4" className="px-4 py-8 text-center text-gray-500 italic">No invoices found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === "enquiries" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-gray-200 pb-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold">Location</p>
                    <p className="text-gray-800 font-medium">{detailedCustomer?.location || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold">Vehicle Model</p>
                    <p className="text-gray-800 font-medium">{detailedCustomer?.vehicleModel || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold">Variant</p>
                    <p className="text-gray-800 font-medium">{detailedCustomer?.variant || 'N/A'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-gray-200 pb-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold">Color</p>
                    <p className="text-gray-800 font-medium">{detailedCustomer?.color || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold">Interest Level</p>
                    <p className="text-gray-800 font-medium">{detailedCustomer?.interestLevel || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold">Purchase Type</p>
                    <p className="text-gray-800 font-medium">{detailedCustomer?.purchaseType || 'N/A'}</p>
                  </div>
                </div>

                <div className="border-b border-gray-200 pb-4">
                  <p className="text-xs text-gray-500 uppercase font-bold">Exchange Details</p>
                  <p className="text-gray-800 font-medium">{detailedCustomer?.exchangeDetails || 'N/A'}</p>
                </div>

                <div className="border-b border-gray-200 pb-4">
                  <p className="text-xs text-gray-500 uppercase font-bold">Remarks</p>
                  <p className="text-gray-800 font-medium">{detailedCustomer?.remarks || 'N/A'}</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase">Type</th>
                        <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase">Vehicle</th>
                        <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase">Executive</th>
                        <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {detailedCustomer?.enquiries?.map((enq) => (
                        <tr key={enq.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-sm">{enq.enquiryType}</td>
                          <td className="px-4 py-2 text-sm">{enq.vehicleModel || 'N/A'}</td>
                          <td className="px-4 py-2 text-sm">{enq.executiveName || 'N/A'}</td>
                          <td className="px-4 py-2 text-sm">{new Date(enq.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                    {(!detailedCustomer?.enquiries || detailedCustomer.enquiries.length === 0) && (
                      <tr>
                        <td colSpan="4" className="px-4 py-8 text-center text-gray-500 italic">No enquiries found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            )}

            {activeTab === "bigwing_enquiries" && (
              <div className="space-y-4">
                {isFetchingBigWing ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-500">Loading BigWing enquiries...</p>
                  </div>
                ) : bigWingEnquiries.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Enquiry No</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Enquiry Type</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Customer Name</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Mobile</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Model</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Variant</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Stage</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Interest</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Executive</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Enquiry Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {bigWingEnquiries.map((enquiry, idx) => (
                          <tr key={idx} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 text-sm font-mono text-xs">{enquiry.enquiryNo || 'N/A'}</td>
                            <td className="px-4 py-3 text-sm">
                              <EnquiryTypeBadge type={enquiry.enquiryType} />
                            </td>
                            <td className="px-4 py-3 text-sm font-medium">
                              {`${enquiry.customer?.firstName || ''} ${enquiry.customer?.lastName || ''}`.trim() || 'N/A'}
                            </td>
                            <td className="px-4 py-3 text-sm">{enquiry.customer?.mobile || 'N/A'}</td>
                            <td className="px-4 py-3 text-sm">{enquiry.model || 'N/A'}</td>
                            <td className="px-4 py-3 text-sm">{enquiry.variant || 'N/A'}</td>
                            <td className="px-4 py-3 text-sm">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                enquiry.stage === 'INVOICED' ? 'bg-green-100 text-green-800' :
                                enquiry.stage === 'ENQUIRED' ? 'bg-yellow-100 text-yellow-800' :
                                enquiry.stage === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {enquiry.stage || 'N/A'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                enquiry.interestLevel === 'HOT' ? 'bg-red-100 text-red-800' :
                                enquiry.interestLevel === 'WARM' ? 'bg-orange-100 text-orange-800' :
                                enquiry.interestLevel === 'COLD' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {enquiry.interestLevel || 'N/A'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm">{enquiry.executiveName || 'Not Assigned'}</td>
                            <td className="px-4 py-3 text-sm">
                              {enquiry.enquiryDate ? new Date(enquiry.enquiryDate).toLocaleDateString() : 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <p className="mt-2 text-gray-500">No BigWing enquiries found for this customer</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "sales_payments" && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase">Receipt</th>
                      <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase">Mode</th>
                      <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {detailedCustomer?.paymentCollections?.map((pay) => (
                      <tr key={pay.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm">{new Date(pay.date).toLocaleDateString()}</td>
                        <td className="px-4 py-2 text-sm font-medium">{pay.receiptNo}</td>
                        <td className="px-4 py-2 text-sm">{pay.paymentMode?.paymentMode}</td>
                        <td className="px-4 py-2 text-sm font-bold text-blue-600">₹{pay.recAmt.toLocaleString()}</td>
                      </tr>
                    ))}
                    {(!detailedCustomer?.paymentCollections || detailedCustomer.paymentCollections.length === 0) && (
                      <tr>
                        <td colSpan="4" className="px-4 py-8 text-center text-gray-500 italic">No payment records found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === "service_payments" && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase">Receipt</th>
                      <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase">Mode</th>
                      <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {detailedCustomer?.servicePaymentCollections?.map((pay) => (
                      <tr key={pay.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm">{new Date(pay.date).toLocaleDateString()}</td>
                        <td className="px-4 py-2 text-sm font-medium">{pay.receiptNo}</td>
                        <td className="px-4 py-2 text-sm">{pay.paymentMode?.paymentMode}</td>
                        <td className="px-4 py-2 text-sm font-bold text-blue-600">₹{pay.recAmt.toLocaleString()}</td>
                      </tr>
                    ))}
                    {(!detailedCustomer?.servicePaymentCollections || detailedCustomer.servicePaymentCollections.length === 0) && (
                      <tr>
                        <td colSpan="4" className="px-4 py-8 text-center text-gray-500 italic">No service records found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            {permissions?.master?.customer_details?.edit && detailedCustomer && (
              <button
                type="button"
                onClick={() => {
                  setIsDetailsModalOpen(false);
                  handleEdit(detailedCustomer);
                }}
                className="px-6 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white font-bold transition-colors"
              >
                Edit
              </button>
            )}
            <button
              onClick={() => setIsDetailsModalOpen(false)}
              className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CustomerDetails;