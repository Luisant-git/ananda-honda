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
import { locationApi } from "../api/locationApi.js";

import { 
  User, Phone, MapPin, Sparkles, CheckCircle2, Save, X,
  Mail, Calendar, Briefcase, Home, Building2, CreditCard,
  FileText, AlertCircle, Search, UserCheck, UserPlus,
  Bike, Wrench, Target, ClipboardList, Globe, Award, CalendarClock, Repeat
} from "lucide-react";

const InputField = ({ label, value, onChange, icon: Icon, type = "text", required = false, placeholder = "", disabled = false, maxLength }) => {
  return (
    <div>
      <label className="flex items-center gap-1.5 block text-sm font-medium text-brand-text-secondary mb-1">
        {Icon && <Icon size={12} />}
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white border border-brand-border text-brand-text-primary rounded-lg p-2 disabled:cursor-not-allowed disabled:bg-gray-50"
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
      <label className="block text-sm font-medium text-brand-text-secondary mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <select
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          required={required}
          className="w-full appearance-none bg-white border border-brand-border text-brand-text-primary rounded-lg p-2 pr-8 disabled:cursor-not-allowed disabled:bg-gray-50"
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
    exchangeEnabled: null,
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

  const [lookupData, setLookupData] = useState({
    sources: [],
    enquiryTypes: [],
    models: [],
    colours: [],
    executives: [],
    branches: [],
    locations: [],
  });
  const [selectedModel, setSelectedModel] = useState("");
  const [variants, setVariants] = useState([]);
  
  // Store pending data for auto-fill
  const [pendingBigWingData, setPendingBigWingData] = useState({
    variantName: "",
    executiveName: "",
    modelId: "",
    colourName: "",
  });
  
  // BigWing enquiry type, date, and role for display only
  const [bigWingEnquiryType, setBigWingEnquiryType] = useState("");
  const [bigWingEnquiryDate, setBigWingEnquiryDate] = useState("");
  const [bigWingCreatedByRole, setBigWingCreatedByRole] = useState("");

  const normalizeText = (value) => String(value || "").trim().toLowerCase();
  const findLookupId = (items, value) => {
    if (!value || !items?.length) return "";
    const normalized = normalizeText(value);
    const match = items.find((item) =>
      normalizeText(item.name) === normalized ||
      normalizeText(item.label) === normalized ||
      normalizeText(item.value) === normalized
    );
    return match ? String(match.id || match.value || match.name) : "";
  };

  const findVariantIdByName = (value) => {
    if (!value || !variants?.length) return "";
    const normalized = normalizeText(value);
    const match = variants.find((item) => normalizeText(item.name) === normalized);
    return match ? String(match.id) : "";
  };

  const getExecutiveValue = (executive) => {
    return executive?.name || executive?.fullName || executive?.label || executive?.value || "";
  };

  const findExecutiveName = (executiveName) => {
    if (!executiveName || !lookupData.executives?.length) return executiveName || "";
    const normalizedSearch = normalizeText(executiveName);
    const exactMatch = lookupData.executives.find(ex => normalizeText(getExecutiveValue(ex)) === normalizedSearch);
    if (exactMatch) return getExecutiveValue(exactMatch);
    const cleanSearch = executiveName.replace(/[\s\.\-_]/g, '').toLowerCase();
    const partialMatch = lookupData.executives.find(ex => {
      const cleanEx = getExecutiveValue(ex).replace(/[\s\.\-_]/g, '').toLowerCase();
      return cleanEx === cleanSearch || cleanEx.includes(cleanSearch) || cleanSearch.includes(cleanEx);
    });
    return partialMatch ? getExecutiveValue(partialMatch) : executiveName;
  };

  useEffect(() => {
    fetchCustomers();
    fetchPermissions();
    fetchLookupData();
  }, []);

  const fetchLookupData = async () => {
    try {
      const [models, colours, executives, branches, locs] = await Promise.all([
        vehicleCatalogueApi.getVehicleModels(),
        vehicleCatalogueApi.getVehicleColours(),
        vehicleCatalogueApi.getSalesExecutives(),
        salesExecutiveApi.getBranches(),
        locationApi.getAll(),
      ]);
      
      setLookupData({
        sources: [],
        enquiryTypes: [],  
        models: models.data || [],
        colours: colours.data || [],
        executives: executives.data || [],
        branches: branches.data || [],
        locations: locs || [],
      });
    } catch (error) {
      console.error("Error fetching lookup data:", error);
      toast.error("Failed to load master data. Please refresh the page.");
    }
  };
  
  // Load variants when model changes
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
  
// After variants are loaded, auto-fill the variant field
useEffect(() => {
  if (pendingBigWingData.variantName && variants.length > 0) {
    console.log("Attempting to auto-fill variant:", pendingBigWingData.variantName);
    console.log("Available variants:", variants.map(v => v.name));
    
    const variantId = findVariantIdByName(pendingBigWingData.variantName);
    if (variantId) {
      setFormData(prev => ({ ...prev, variantId: variantId }));
      console.log("Variant auto-filled successfully:", pendingBigWingData.variantName, "ID:", variantId);
    } else {
      console.log("Variant not found in list:", pendingBigWingData.variantName);
    }
  }
}, [variants, pendingBigWingData.variantName]);

// After executives are loaded, auto-fill the assigned executive field
useEffect(() => {
  if (pendingBigWingData.executiveName && lookupData.executives?.length) {
    const matchedExecutive = findExecutiveName(pendingBigWingData.executiveName);
    if (matchedExecutive) {
      setFormData(prev => ({ ...prev, executiveName: matchedExecutive }));
    }
  }
}, [lookupData.executives, pendingBigWingData.executiveName]);

// After colours are loaded, auto-fill the colour field from BigWing
useEffect(() => {
  if (pendingBigWingData.colourName && lookupData.colours?.length) {
    const colourId = findLookupId(lookupData.colours, pendingBigWingData.colourName);
    if (colourId) {
      setFormData(prev => ({ ...prev, colourId }));
    }
  }
}, [lookupData.colours, pendingBigWingData.colourName]);

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
      const enquiryData = dataItems[0];
      const customer = enquiryData.customer || enquiryData;
      
      // Debug logging
      console.log("=== BigWing Data Received ===");
      console.log("Full Response:", enquiryData);
      console.log("Executive Name from BigWing:", enquiryData.executiveName);
      console.log("Model:", enquiryData.model);
      console.log("Variant:", enquiryData.variant);
      
      // Set BigWing display info for Enquiry Details section
      const oldEnquiryType = enquiryData.enquiryType || enquiryData.type || enquiryData.status || "";
      const createdBy = enquiryData.createdBy || enquiryData.customer?.createdBy;
      const createdByRole = Array.isArray(createdBy?.roles)
        ? createdBy.roles.join(", ")
        : createdBy?.role || createdBy?.roles || "";
      setBigWingEnquiryType(oldEnquiryType);
      setBigWingCreatedByRole(createdByRole);
      
      // Extract field values from BigWing response
      const rawFirstName = customer.firstName || "";
      const rawLastName = customer.lastName || "";
      const rawMobile = customer.mobile || enquiryData.mobileNumber || enquiryData.phoneNumber || "";
      const rawAltMobile = customer.altMobile || enquiryData.altMobile || enquiryData.alternateMobile || enquiryData.altPhone || "";
      const rawEmail = customer.email || enquiryData.email || enquiryData.customer?.email || "";
      const rawAddress = customer.address || enquiryData.address || enquiryData.customer?.address || customer.addressLine || "";
      const rawLocation = customer.location || enquiryData.location || enquiryData.city || enquiryData.customer?.city || "";
      const rawModelName = enquiryData.model || enquiryData.vehicleModel || customer.vehicleModel || enquiryData.modelName || "";
      const rawVariantName = enquiryData.variant || enquiryData.modelVariant || enquiryData.customer?.variant || "";
      const rawBranchName = enquiryData.referredFromBranch || enquiryData.branch || enquiryData.branchName || customer.branch || enquiryData.customer?.branch || "";
      const rawExecutiveName = enquiryData.executiveName || enquiryData.assignedExecutive || customer.assignedExecutive || enquiryData.customer?.assignedExecutive || enquiryData.customer?.executiveName || "";
      const rawColourName = enquiryData.colour?.name || enquiryData.color || enquiryData.customer?.color || enquiryData.colour || "";
      const rawInterestLevel = enquiryData.interestLevel || enquiryData.interest || enquiryData.customer?.interestLevel || "";
      const rawPurchaseType = enquiryData.purchaseType || enquiryData.paymentType || enquiryData.customer?.purchaseType || "";
      const rawRemark = enquiryData.remark || enquiryData.notes || enquiryData.customer?.remark || enquiryData.customer?.notes || "";
      const rawEnquiryDate = enquiryData.enquiryDate || enquiryData.date || enquiryData.customer?.enquiryDate || new Date().toISOString().split("T")[0];
      const currentDate = new Date().toISOString().split("T")[0];
      
      // Find lookup IDs
      const modelId = findLookupId(lookupData.models, rawModelName);
      const branchId = findLookupId(lookupData.branches, rawBranchName);
      const colourId = findLookupId(lookupData.colours, rawColourName);
      const matchedExecutiveName = findExecutiveName(rawExecutiveName);
      
      setBigWingEnquiryDate(rawEnquiryDate.split('T')[0]);
      
      // For Variant, executive and colour - store to auto-fill after master data loads
      setPendingBigWingData({
        variantName: rawVariantName,
        executiveName: rawExecutiveName,
        modelId: modelId,
        colourName: rawColourName,
      });
      
      // Auto-fill form data
      setFormData(prev => ({
        ...prev,
        firstName: rawFirstName,
        lastName: rawLastName,
        mobile: rawMobile,
        altMobile: rawAltMobile,
        email: rawEmail,
        address: rawAddress,
        location: rawLocation,
        pincode: prev.pincode,
        modelId: modelId || prev.modelId,
        branchId: branchId || prev.branchId,
        colourId: colourId || prev.colourId,
        executiveName: matchedExecutiveName || prev.executiveName,
        interestLevel: rawInterestLevel || prev.interestLevel,
        purchaseType: rawPurchaseType || prev.purchaseType,
        enquiryDate: currentDate,
        remark: rawRemark || prev.remark,
        // Status remains the new enquiry type selection; keep existing default
      }));
      
      // Set selected model to trigger variant loading
      if (modelId) {
        setSelectedModel(modelId);
      }
      
      const rawEnquiryNo = enquiryData.enquiryNo || enquiryData.enquiryNumber || enquiryData.referenceId || enquiryData.id || "";
      const mappedCustomer = {
        firstName: rawFirstName,
        lastName: rawLastName,
        mobile: rawMobile,
        enquiryNo: rawEnquiryNo,
      };
      
      const sanitizeBigWingItem = (item) => {
        const { createdBy, customer: nestedCustomer, ...rest } = item;
        const sanitizedCustomer = nestedCustomer
          ? (({ createdBy: _cb, roles: _roles, ...c }) => c)(nestedCustomer)
          : undefined;
        return { ...rest, customer: sanitizedCustomer };
      };
      
      setFoundCustomer(mappedCustomer);
      setBigWingEnquiries(dataItems.map(sanitizeBigWingItem));
      setShowBigWingData(true);
      
      const fullName = `${rawFirstName} ${rawLastName}`.trim();
      toast.success(`BigWing Data Loaded: ${fullName || "Customer Found"}`, { duration: 3000 });
      return mappedCustomer;
    } else {
      resetBigWingData();
      toast.info("No existing customer found in BigWing", { duration: 2000 });
      return null;
    }
  } catch (error) {
    console.error("Error checking customer:", error);
    return null;
  } finally {
    setIsCheckingCustomer(false);
  }
};
  
  const resetBigWingData = () => {
    setBigWingEnquiryType("");
    setBigWingCreatedByRole("");
    setPendingBigWingData({
      variantName: "",
      executiveName: "",
      modelId: "",
      colourName: "",
    });
    setFoundCustomer(null);
    setShowBigWingData(false);
  };

  const handleMobileNumberChange = async (value) => {
    const numericValue = value.replace(/\D/g, "");
    if (numericValue.length > 10) return;
    
    setFormData(prev => ({ ...prev, mobile: numericValue }));
    
    if (numericValue.length === 10 && !isEditMode) {
      setIsCheckingCustomer(true);
      
      const localExists = await checkLocalCustomerExists(numericValue);
      
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

    if (formData.exchangeEnabled === null || formData.exchangeEnabled === undefined) {
      toast.error("Please specify if Exchange is required (Yes or No).");
      return;
    }

    if (!/^\d{10}$/.test(formData.mobile)) {
      toast.error("Mobile number must be exactly 10 digits");
      return;
    }



    if (!isEditMode) {
      const exists = await checkLocalCustomerExists(formData.mobile);
      if (exists) {
        toast.error("This mobile number is already registered. Please use a different number or edit existing customer.");
        return;
      }
    }

    

    try {
      const customerData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        mobile: formData.mobile,
        altMobile: formData.altMobile,
        email: formData.email,
        location: formData.location,
        pincode: formData.pincode,
        address: formData.address,
        customerType: formData.customerType,
        dob: formData.dob,
        anniversary: formData.anniversary,
        occupation: formData.occupation,
        gstNo: formData.gstNo,
        status: formData.status,
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

      if (isEditMode) {
        await customerApi.update(editingCustomer.id, customerData);
        toast.success("Customer updated successfully!");
      } else {
        await customerApi.create(customerData);
        toast.success("Customer created successfully!");
      }
      
      setIsModalOpen(false);
      setIsEditMode(false);
      setEditingCustomer(null);
      resetForm();
      resetBigWingData();
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

      toast.error("Mobile Number Already Registered!", { duration: 8000 });
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
      pincode: "",
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
      exchangeEnabled: null,
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
      pincode: customer.pincode || "",
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
    } catch (error) {
      toast.error("Error fetching details");
    }
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
    resetBigWingData();
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
        case 'Telephonic': return 'bg-blue-100 text-blue-800';
        case 'Digital': return 'bg-purple-100 text-purple-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getTypeColor(type)}`}>
        {type?.replace(/_/g, ' ') || 'N/A'}
      </span>
    );
  };

  const executiveOptions = lookupData.executives
    .map((ex) => ({
      value: getExecutiveValue(ex),
      label: getExecutiveValue(ex),
    }))
    .filter((opt) => opt.value);

  if (
    formData.executiveName &&
    !executiveOptions.some((opt) => normalizeText(opt.value) === normalizeText(formData.executiveName))
  ) {
    executiveOptions.push({ value: formData.executiveName, label: formData.executiveName });
  }

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
          resetBigWingData();
        }}
        title={isEditMode ? "Edit Customer" : "New Customer Entry"}
        maxWidth="max-w-5xl"
        maxHeight="max-h-[90vh]"
      >
        <form onSubmit={handleSubmit} className="space-y-6 px-2">
          {showBigWingData && foundCustomer && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-3">
                <UserCheck size={20} className="text-green-600" />
                <div>
                  <h4 className="font-semibold text-green-800">Customer Found in BigWing CRM</h4>
                  <p className="text-sm text-green-700">
                    {foundCustomer.firstName} {foundCustomer.lastName} - {foundCustomer.mobile}
                  </p>
                  {foundCustomer.enquiryNo && (
                    <p className="text-sm text-green-700">Enquiry No: {foundCustomer.enquiryNo}</p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {bigWingCreatedByRole && (
                      <span className="inline-flex items-center gap-2 rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-purple-900">
                        <Award size={12} className="text-purple-600" />
                        {bigWingCreatedByRole}
                      </span>
                    )}
                    {bigWingEnquiryType && (
                      <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-800">
                        <Award size={12} className="text-blue-600" />
                        {bigWingEnquiryType}
                      </span>
                    )}
                    {bigWingEnquiryDate && (
                      <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-slate-800">
                        <CalendarClock size={12} className="text-slate-600" />
                        {bigWingEnquiryDate}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              <InputField
                label="Name"
                value={formData.firstName}
                onChange={(value) => setFormData(prev => ({ ...prev, firstName: value }))}
                required
                placeholder="Enter name"
                disabled={!!foundCustomer?.firstName}
              />
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
              <SearchableDropdown
                label="Location"
                value={formData.location}
                onChange={(value) => {
                  const selectedLoc = lookupData.locations.find(loc => loc.officename === value);
                  setFormData(prev => ({ 
                    ...prev, 
                    location: value,
                    pincode: selectedLoc ? selectedLoc.pincode : prev.pincode 
                  }));
                }}
                options={lookupData.locations.map(loc => ({
                  value: loc.officename,
                  label: `${loc.officename} - ${loc.district}`
                }))}
              />
              <SearchableDropdown
                label="Pincode"
                value={formData.pincode}
                onChange={(value) => {
                  const selectedLoc = lookupData.locations.find(loc => loc.pincode === value);
                  setFormData(prev => ({ 
                    ...prev, 
                    pincode: value,
                    location: selectedLoc && !prev.location ? selectedLoc.officename : prev.location 
                  }));
                }}
                options={Array.from(new Set(lookupData.locations.map(loc => loc.pincode))).filter(Boolean).map(pincode => ({
                  value: pincode,
                  label: String(pincode)
                }))}
              />
              
              <div>
                <label className="block text-sm font-medium text-brand-text-secondary mb-1">
                  New Enquiry Type
                </label>
                <input
                  type="text"
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full bg-white border border-brand-border text-brand-text-primary rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-text-secondary mb-1">
                  Enquiry Date
                </label>
                <input
                  type="date"
                  value={formData.enquiryDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, enquiryDate: e.target.value }))}
                  disabled
                  className="w-full bg-gray-100 border border-brand-border text-brand-text-primary rounded-lg p-2 cursor-not-allowed"
                />
              </div>

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

              <div>
                <label className="block text-sm font-medium text-brand-text-secondary mb-1">
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
                      className={`rounded-lg border px-1 py-2 text-[11px] font-bold transition-all ${
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
                onChange={(value) => setFormData(prev => ({ ...prev, purchaseType: value }))}
                options={[
                  { value: "CASH", label: "Cash" },
                  { value: "FINANCE", label: "Finance" },
                ]}
              />
              
              <div className="flex flex-col justify-start">
                <label className="block text-sm font-medium text-brand-text-secondary mb-1">
                  Exchange
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, exchangeEnabled: true }))}
                    className={`rounded-lg border px-1 py-2 text-[12px] font-bold transition-all ${
                      formData.exchangeEnabled === true
                        ? "bg-brand-accent text-white shadow-md border-brand-accent"
                        : "border-gray-300 bg-white text-brand-text-secondary hover:bg-gray-50"
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, exchangeEnabled: false, exchangeValue: "" }))}
                    className={`rounded-lg border px-1 py-2 text-[12px] font-bold transition-all ${
                      formData.exchangeEnabled === false
                        ? "bg-gray-500 text-white shadow-md border-gray-500"
                        : "border-gray-300 bg-white text-brand-text-secondary hover:bg-gray-50"
                    }`}
                  >
                    No
                  </button>
                </div>
                {formData.exchangeEnabled && (
                  <div className="mt-2">
                    <label className="block text-sm font-medium text-brand-text-secondary mb-1">
                      Exchange Details
                    </label>
                    <textarea
                      value={formData.exchangeValue}
                      onChange={(e) => setFormData(prev => ({ ...prev, exchangeValue: e.target.value }))}
                      rows={2}
                      placeholder="Enter exchange vehicle details"
                      className="w-full bg-white border border-brand-border text-brand-text-primary rounded-lg p-2"
                    />
                  </div>
                )}
              </div>

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
                options={executiveOptions}
              />
              <div>
                <label className="block text-sm font-medium text-brand-text-secondary mb-1">
                  Notes & Remarks
                </label>
                <textarea
                  value={formData.remark}
                  onChange={(e) => setFormData(prev => ({ ...prev, remark: e.target.value }))}
                  rows={3}
                  placeholder="Add any additional notes about this customer/lead..."
                  className="w-full bg-white border border-brand-border text-brand-text-primary rounded-lg p-2"
                />
              </div>
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                resetBigWingData();
              }}
              className="px-4 py-2 rounded-lg bg-white hover:bg-brand-hover text-brand-text-secondary font-bold border border-brand-border"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCheckingCustomer}
              className="px-4 py-2 rounded-lg bg-brand-accent hover:bg-brand-accent-hover text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isCheckingCustomer ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {isEditMode ? "Updating..." : "Creating..."}
                </>
              ) : (
                isEditMode ? "Update" : "Submit"
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
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

      {/* Customer Details Modal */}
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
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 border-b border-gray-200 pb-6">
                  <div className="col-span-1 md:col-span-2">
                    <p className="text-xs text-gray-500 uppercase font-bold">Location</p>
                    <p className="text-gray-800 font-medium">
                      {detailedCustomer?.location ? (() => {
                        const locMatch = lookupData.locations.find(l => l.officename === detailedCustomer.location);
                        return locMatch?.district ? `${detailedCustomer.location} - ${locMatch.district}` : detailedCustomer.location;
                      })() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold">Pincode</p>
                    <p className="text-gray-800 font-medium">{detailedCustomer?.pincode || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold">Vehicle Model</p>
                    <p className="text-gray-800 font-medium">{detailedCustomer?.vehicleModel || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold">Variant</p>
                    <p className="text-gray-800 font-medium">{detailedCustomer?.variant || 'N/A'}</p>
                  </div>
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
                  <div className="col-span-1 md:col-span-3 lg:col-span-4">
                    <p className="text-xs text-gray-500 uppercase font-bold">Exchange Details</p>
                    <p className="text-gray-800 font-medium">{detailedCustomer?.exchangeDetails || 'N/A'}</p>
                  </div>
                  <div className="col-span-1 md:col-span-3 lg:col-span-4">
                    <p className="text-xs text-gray-500 uppercase font-bold">Remarks</p>
                    <p className="text-gray-800 font-medium">{detailedCustomer?.remarks || 'N/A'}</p>
                  </div>
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
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Created By</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Role</th>
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
                                enquiry.stage === 'BOOKED' ? 'bg-purple-100 text-purple-800' :
                                enquiry.stage === 'ENQUIRED' ? 'bg-yellow-100 text-yellow-800' :
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
                            <td className="px-4 py-3 text-sm">{enquiry.createdBy?.fullName || 'N/A'}</td>
                            <td className="px-4 py-3 text-sm">
                              <span className="px-2 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
                                {enquiry.createdBy?.roles?.join(', ') || 'N/A'}
                              </span>
                            </td>
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