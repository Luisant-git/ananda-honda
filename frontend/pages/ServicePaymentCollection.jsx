import React, { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import DataTable from "../components/DataTable";
import Modal from "../components/Modal";
import SearchableDropdown from "../components/SearchableDropdown";
import { servicePaymentCollectionApi } from "../api/servicePaymentCollectionApi.js";
import { customerApi } from "../api/customerApi.js";
import { salesInvoiceApi } from "../api/salesInvoiceApi.js";
import { servicePaymentModeApi } from "../api/servicePaymentModeApi.js";
import { serviceTypeOfPaymentApi } from "../api/serviceTypeOfPaymentApi.js";
import { serviceTypeOfCollectionApi } from "../api/serviceTypeOfCollectionApi.js";
import { paymentTypeApi } from "../api/paymentTypeApi.js";
import { vehicleModelApi } from "../api/vehicleModelApi.js";
import { menuPermissionApi } from "../api/menuPermissionApi";
import ConfirmModal from '../components/ConfirmModal';
import hondaLogo from "../assets/honda-logo.svg";
import { serviceJobCardApi } from "../api/serviceJobcard";
import { serviceTypeApi } from "../api/serviceTypeApi.js";
import { serviceTypeOfPartApi } from "../api/serviceTypeOfPartApi.js";
import PineLabsModal from "../components/PineLabsModal";

const ServicePaymentCollection = ({ user, subType }) => {
  const [permissions, setPermissions] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [paymentModes, setPaymentModes] = useState([]);
  console.log('service payment modes', paymentModes);
  
  // Determine if current subType is full or advance payment
  const [internalMode, setInternalMode] = useState(subType || 'full');
  
  useEffect(() => {
    setInternalMode(subType || 'full');
  }, [subType]);

  const isFullPaymentMode = internalMode === 'full';
  const isAdvancePaymentMode = internalMode === 'advance';
  const isXyzPaymentMode = internalMode === 'xyz';

  const [paymentTypes, setPaymentTypes] = useState([]);
  const [typeOfPayments, setTypeOfPayments] = useState([]);
  const [vehicleModels, setVehicleModels] = useState([]);
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [loadedCustomer, setLoadedCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const customerSelectionId = useRef(0);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [paymentToCancel, setPaymentToCancel] = useState(null);
  const [showDeleted, setShowDeleted] = useState(false);
  const [deletedPayments, setDeletedPayments] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEntries, setTotalEntries] = useState(0);
  const [itemsPerPage] = useState(10);
  const [serviceTypeOfCollections, setServiceTypeOfCollections] = useState([]);
  const [serviceTypes, setServiceTypes] = useState([]);
  const [pageTitle, setPageTitle] = useState('Service Payment Collection');
  
  const CLOSING_TOLERANCE_RUPEES = 2.0; // Must match backend logic
  
  // Update page title based on subType
  useEffect(() => {
    if (isFullPaymentMode) {
      setPageTitle('Service Payments - Full Payment');
    } else if (isAdvancePaymentMode) {
      setPageTitle('Service Payments - Advance Payment');
    } else if (isXyzPaymentMode) {
      setPageTitle('Additional Service Plan');
    } else {
      setPageTitle('Service Payments');
    }
  }, [subType, isFullPaymentMode, isAdvancePaymentMode, isXyzPaymentMode]);

  // Part selection states
  const [isPartDropdownOpen, setIsPartDropdownOpen] = useState(false);
  const [partSearchTerm, setPartSearchTerm] = useState('');
  const [selectedParts, setSelectedParts] = useState([]);
  const [availableParts, setAvailableParts] = useState([]);
  const [isNewPartModalOpen, setIsNewPartModalOpen] = useState(false);
  const [newPartData, setNewPartData] = useState({
    partNo: '',
    partDescription: '',
    Model: '',
    status: 'ORDERED'
  });

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    totalAmt: "",
    recAmt: "", // This will be the current payment amount
    hasAdditionalPlan: false,
    additionalPlanCollectionIds: [],
    additionalPlanAmount: "",
    additionalPlanAmounts: {},
    paymentType: "full payment",
    paymentTypeId: "",
    // default to pending to avoid accidental 'completed' state
    paymentStatus: "pending",
    vehicleNumber: "",
    paymentModeId: "",
    typeOfPaymentId: "",
    serviceTypeOfCollectionId: "",
    vehicleModelId: "",
    refNo: "",
    remarks: "",
    jobCardNumber: "",
    serviceType: "",
    serviceTypeId: "",
  });

  const normalizedPaymentType = (formData.paymentType || "").toString().toLowerCase().trim();
  
  // Determine if Job Card is mandatory based on payment type
  const requiresJobCard = isFullPaymentMode || isXyzPaymentMode || (isAdvancePaymentMode && normalizedPaymentType === 'full payment');
  const isOptionalJobCard = isAdvancePaymentMode && normalizedPaymentType !== 'full payment';
  
  // Filter Type of Collection to show only JOBCARD and CERAMIC COATING for Full/Advance payments
  const filteredTypeOfCollections = isXyzPaymentMode
    ? serviceTypeOfCollections.filter(item => {
        const typeStr = (item.typeOfCollect || '').toString().toLowerCase();
        return ['rsa', 'amc', 'ew'].includes(typeStr);
      })
    : (isFullPaymentMode || isAdvancePaymentMode)
      ? serviceTypeOfCollections.filter(item => {
          const typeStr = (item.typeOfCollect || '').toString().toLowerCase();
          return typeStr.includes('jobcard') || typeStr.includes('ceramic');
        })
      : serviceTypeOfCollections;

  const additionalPlanCollections = serviceTypeOfCollections.filter(item => {
    const typeStr = (item.typeOfCollect || '').toString().toLowerCase();
    return ['rsa', 'amc', 'ew'].includes(typeStr);
  });

  const isPartPaymentType = (name) => mapMasterNameToKey(name) === 'part payment';

  const paymentSelectValue = paymentTypes.length === 0
    ? formData.paymentType
    : (formData.paymentTypeId ? String(formData.paymentTypeId) : '');
  const [isPineLabsModalOpen, setIsPineLabsModalOpen] = useState(false);
  const [pineLabsTxnId, setPineLabsTxnId] = useState(null);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({
    name: "",
    contactNo: "",
    address: "",
    status: "Walk in Customer",
  });
  const [customerHistory, setCustomerHistory] = useState([]);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [salesInvoiceInfo, setSalesInvoiceInfo] = useState(null);
  const [serviceJobCardInfo, setServiceJobCardInfo] = useState(null);
 
  const isJobCardClosed = (status) => {
    const normalizedStatus = (status || '').toString().toLowerCase().trim();
    return /closed|completed|cancelled|canceled|close/.test(normalizedStatus);
  };

  const isClosedJobCard = isJobCardClosed(serviceJobCardInfo?.status);
  // Calculate total only for current job card payments
  const totalReceivedAmount = isClosedJobCard ? 0 : pendingPayments.reduce((sum, p) => sum + p.recAmt, 0) + (parseFloat(formData.recAmt) || 0);

  const getPaymentTotalAmount = (payment) => {
    if (!payment) return 0;
    if (payment.totalAmt !== undefined && payment.totalAmt !== null) {
      return payment.totalAmt;
    }
    const sessionsTotal = (payment.paymentSessions || []).reduce((sum, session) => sum + (session.amount || 0), 0);
    return sessionsTotal + (payment.recAmt || 0);
  };


  const calculatePaymentSummary = (payment, jobCardInfo) => {
  const totalReceived = payment.totalAmt !== undefined && payment.totalAmt !== null && payment.totalAmt !== 'N/A' 
    ? payment.totalAmt 
    : getPaymentTotalAmount(payment);
  
  const invoiceAmount = jobCardInfo?.totalRevenue || 0;
  const difference = totalReceived - invoiceAmount;
  
  return {
    totalReceived,
    invoiceAmount,
    difference,
    isExtraPaid: difference > 0,
    isShortPaid: difference < 0 && invoiceAmount > 0,
    balance: Math.abs(difference)
  };
};

  const mapMasterNameToKey = (name) => {
    const n = (name || '').toString().toLowerCase().trim();
    if (!n) return '';
    if (n.includes('part')) return 'part payment';
    if (n.includes('advance')) return 'advance payment';
    if (n.includes('full')) return 'full payment';
    return n;
  };

  const getPaymentTypeLabel = (paymentType) => {
    if (!paymentType) return 'N/A';
    const p = paymentType.toString().toLowerCase().trim();
    if (p === 'part payment') return 'Payment for Parts';
    if (p === 'advance payment') return 'Advance payment';
    return paymentType
      .toString()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const paymentTypeBadgeClass = (paymentType) => {
    const p = (paymentType || '').toString().toLowerCase().trim();
    switch (p) {
      case 'part payment':
        return 'text-orange-700 bg-orange-100 px-2 rounded-full text-xs font-semibold';
      case 'advance payment':
        return 'text-indigo-700 bg-indigo-100 px-2 rounded-full text-xs font-semibold';
      case 'full payment':
        return 'text-green-700 bg-green-100 px-2 rounded-full text-xs font-semibold';
      default:
        return 'text-gray-800 bg-gray-100 px-2 rounded-full text-xs font-semibold';
    }
  };


const [isManualJobCard, setIsManualJobCard] = useState(false);
const [manualJobCardData, setManualJobCardData] = useState({
  jobCardNumber: '',
  registrationNumber: '',
  customerName: '',
  mobileNumber: '',
  vehicleDetails: '',
  serviceType: ''
});

// Add state for checking job card status
const [isCheckingJobCard, setIsCheckingJobCard] = useState(false);
const [foundJobCard, setFoundJobCard] = useState(null);

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

// Function to fetch job card by number, optionally ensuring it belongs to the expected mobile number
const fetchJobCardByNumber = async (jobCardNumber, expectedMobileNumber = null) => {
  if (!jobCardNumber) return null;

  const normalizedSearch = jobCardNumber.toString().trim().toLowerCase();
  const normalizedMobile = expectedMobileNumber?.toString().trim();

  try {
    let allJobCards = [];

    try {
      const searchResults = await serviceJobCardApi.search(jobCardNumber);
      allJobCards = Array.isArray(searchResults) ? searchResults : (searchResults.data || []);
    } catch (searchError) {
      // fallback to full list if search endpoint isn't available or fails
      allJobCards = await serviceJobCardApi.getAll();
    }

    const foundJobCard = allJobCards.find(jc => {
      const jcNumber = jc.jobCardNumber?.toString().trim().toLowerCase();
      return jcNumber === normalizedSearch || jcNumber?.includes(normalizedSearch) || normalizedSearch.includes(jcNumber);
    });

    if (!foundJobCard) return null;

    if (normalizedMobile && foundJobCard.mobileNumber?.toString().trim() !== normalizedMobile) {
      console.warn(`Job card found for number ${jobCardNumber} does not match expected mobile ${expectedMobileNumber}. Ignoring.`);
      return null;
    }

    return foundJobCard;
  } catch (error) {
    console.error("Error fetching job card:", error);
    return null;
  }
};


useEffect(() => {
  return () => {
    // Cleanup - increment selection ID to ignore any pending requests
    customerSelectionId.current++;
  };
}, []);

const getLastPaymentForCustomer = async (customer) => {
  if (!customer || !customer.contactNo) return null;

  try {
    if (customer.id && !isNaN(Number(customer.id))) {
      const response = await servicePaymentCollectionApi.getAll(1, 100, customer.id);
      const allPayments = response?.data || [];
      return allPayments.sort((a, b) => new Date(b.date) - new Date(a.date))[0] || null;
    }

    const matchedPayments = payments
      .filter(p => p.contactNo?.toString().trim() === customer.contactNo.toString().trim())
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    return matchedPayments[0] || null;
  } catch (error) {
    console.error("Error fetching last payment for customer:", error);
    return null;
  }
};

const buildPrefillDataFromPayment = (payment) => {
  if (!payment) return {};

  const updated = {};

  if (payment.vehicleNumber && payment.vehicleNumber !== 'N/A') {
    updated.vehicleNumber = payment.vehicleNumber;
  }

  if (payment.vehicleModelId) {
    updated.vehicleModelId = payment.vehicleModelId.toString();
  } else if (payment.vehicleModel) {
    const matchedModel = vehicleModels.find(
      (m) => m.model.toLowerCase().trim() === payment.vehicleModel.toString().toLowerCase().trim()
    );
    if (matchedModel) {
      updated.vehicleModelId = matchedModel.id.toString();
    }
  }

  if (payment.serviceType && payment.serviceType !== 'N/A') {
    updated.serviceType = payment.serviceType;
    const matchedServiceType = serviceTypes.find(
      st => st.name.toLowerCase() === payment.serviceType.toLowerCase()
    );
    if (matchedServiceType) {
      updated.serviceTypeId = matchedServiceType.id.toString();
    }
  }

  if (payment.typeOfCollection) {
    const matchedCollection = serviceTypeOfCollections.find(
      type => type.typeOfCollect?.toLowerCase() === payment.typeOfCollection.toLowerCase()
    );
    if (matchedCollection) {
      updated.serviceTypeOfCollectionId = matchedCollection.id.toString();
    }
  }

  return updated;
};

const handleCustomerSelect = async (customer) => {
  // Increment selection ID to track the latest selection
  const currentSelectionId = ++customerSelectionId.current;
  console.log('Selected customer:', customer.name, 'Selection ID:', currentSelectionId);
  
  // Clear existing data immediately for better UX
  setServiceJobCardInfo(null);
  setCustomerHistory([]);
  setSalesInvoiceInfo(null);
  
  if (customer === "new") {
    setSelectedCustomerId("new");
    setSearchTerm("+ Add New Customer");
    setIsNewCustomer(true);
    setLoadedCustomer(null);
    setFilteredPayments(payments);
    setIsManualJobCard(false);
    setFormData(prev => ({
      ...prev,
      vehicleNumber: "",
      refNo: "",
      jobCardNumber: "",
      serviceType: "",
      serviceTypeId: "",
      serviceTypeOfCollectionId: "",
      vehicleModelId: "",
      recAmt: "",
    }));
    setShowDropdown(false);
    return;
  }
  
  if (customer.source === 'invoice') {
    setSelectedCustomerId("new");
    setSearchTerm(customer.name);
    setIsNewCustomer(true);
    setLoadedCustomer(null);
    setNewCustomerData({
      name: customer.name,
      contactNo: customer.contactNo,
      address: customer.address || "N/A",
      status: "Imported from Invoice",
    });
    setSalesInvoiceInfo(customer.invoiceData);
    setIsManualJobCard(false);

    let matchedModelId = "";
    if (customer.invoiceData.vehicleModel && vehicleModels.length > 0) {
      const invModel = customer.invoiceData.vehicleModel.toLowerCase().trim();
      const matchedModel = vehicleModels.find((m) => {
        const mm = m.model.toLowerCase().trim();
        return invModel && (mm === invModel || invModel.includes(mm) || mm.includes(invModel));
      });
      if (matchedModel) {
        matchedModelId = matchedModel.id.toString();
      }
    }

    setFormData((prev) => ({
      ...prev,
      vehicleNumber: customer.invoiceData.vehicleRegNo || prev.vehicleNumber,
      vehicleModelId: matchedModelId || prev.vehicleModelId,
    }));
    setFilteredPayments(payments);

    const lastPaymentInfo = await getLastPaymentForCustomer(customer);
    // Check if this is still the current selection
    if (customerSelectionId.current !== currentSelectionId) {
      console.log('Selection changed, ignoring invoice payment data');
      return;
    }

    if (lastPaymentInfo) {
      const prefill = buildPrefillDataFromPayment(lastPaymentInfo);
      setFormData(prev => ({ ...prev, ...prefill }));

      if (lastPaymentInfo.jobCardNumber && lastPaymentInfo.jobCardNumber !== 'N/A') {
        const foundJobCard = await fetchJobCardByNumber(lastPaymentInfo.jobCardNumber, customer.contactNo);
        if (customerSelectionId.current !== currentSelectionId) return;
        if (foundJobCard && foundJobCard.mobileNumber?.toString().trim() === customer.contactNo?.toString().trim()) {
          setServiceJobCardInfo(foundJobCard);
        }
      }
    }
    setShowDropdown(false);
    return;
  }
  
  if (customer.source === 'jobcard') {
    setSelectedCustomerId("new");
    setSearchTerm(customer.name);
    setIsNewCustomer(true);
    setLoadedCustomer(null);
    setNewCustomerData({
      name: customer.name,
      contactNo: customer.contactNo,
      address: "NA",
      status: "Service Dealer Customer",
    });
    
    try {
      const allJobCardsForCustomer = await serviceJobCardApi.getAll(customer.contactNo);
      if (customerSelectionId.current !== currentSelectionId) return;
      
      const lastPaymentInfo = await getLastPaymentForCustomer(customer);
      if (customerSelectionId.current !== currentSelectionId) return;
      const lastPaymentPrefill = lastPaymentInfo ? buildPrefillDataFromPayment(lastPaymentInfo) : {};
      
      // Filter job cards that belong to this customer by mobile number
      const customerJobCards = allJobCardsForCustomer.filter(jc => 
        jc.mobileNumber?.toString().trim() === customer.contactNo?.toString().trim()
      );
      
      if (customerJobCards.length > 0) {
        const activeJobCard = customerJobCards.find(jc => {
          const status = (jc.status || '').toString().toLowerCase();
          const isClosed = /closed|completed|cancelled|canceled|close/.test(status);
          return !isClosed && /pending|open/.test(status);
        });
        
        const closedJobCard = customerJobCards.find(jc => {
          const status = (jc.status || '').toString().toLowerCase();
          return /closed|completed|cancelled|canceled|close/.test(status);
        });
        
        if (activeJobCard) {
          setIsManualJobCard(false);
          setServiceJobCardInfo(activeJobCard);
          
          let serviceTypeId = "";
          let serviceTypeName = "";
          if (activeJobCard.serviceType) {
            if (typeof activeJobCard.serviceType === 'object') {
              serviceTypeId = activeJobCard.serviceType.id?.toString() || "";
              serviceTypeName = activeJobCard.serviceType.name || "";
            } else if (typeof activeJobCard.serviceType === 'string') {
              serviceTypeName = activeJobCard.serviceType;
            }
          }
          
          let matchedServiceTypeId = serviceTypeId;
          if (serviceTypeName && serviceTypes.length > 0) {
            const matchedServiceType = serviceTypes.find(
              st => st.name.toLowerCase() === serviceTypeName.toLowerCase()
            );
            if (matchedServiceType) {
              matchedServiceTypeId = matchedServiceType.id.toString();
            }
          }
          
          let matchedModelId = "";
          if (activeJobCard.vehicleDetails && vehicleModels.length > 0) {
            const modelName = activeJobCard.vehicleDetails.toLowerCase().trim();
            const matchedModel = vehicleModels.find((m) => {
              const mm = m.model.toLowerCase().trim();
              return modelName && (mm === modelName || modelName.includes(mm) || mm.includes(modelName));
            });
            if (matchedModel) {
              matchedModelId = matchedModel.id.toString();
            }
          }
          
          setFormData(prev => ({
            ...prev,
            ...lastPaymentPrefill,
            jobCardNumber: activeJobCard.jobCardNumber || "",
            vehicleNumber: activeJobCard.registrationNumber || prev.vehicleNumber,
            serviceTypeId: matchedServiceTypeId,
            serviceType: serviceTypeName,
            vehicleModelId: matchedModelId || prev.vehicleModelId,
          }));
        } else if (closedJobCard) {
          setIsManualJobCard(true);
          setServiceJobCardInfo(closedJobCard);
          
          let matchedModelId = "";
          if (closedJobCard.vehicleDetails && vehicleModels.length > 0) {
            const modelName = closedJobCard.vehicleDetails.toLowerCase().trim();
            const matchedModel = vehicleModels.find((m) => {
              const mm = m.model.toLowerCase().trim();
              return modelName && (mm === modelName || modelName.includes(mm) || mm.includes(modelName));
            });
            if (matchedModel) {
              matchedModelId = matchedModel.id.toString();
            }
          }
          
          setFormData(prev => ({
            ...prev,
            ...lastPaymentPrefill,
            jobCardNumber: "",
            vehicleNumber: closedJobCard.registrationNumber || prev.vehicleNumber,
            serviceTypeId: "",
            serviceType: "",
            vehicleModelId: matchedModelId || prev.vehicleModelId,
          }));
        } else {
          setServiceJobCardInfo(null);
          setIsManualJobCard(true);
          setFormData(prev => ({ ...prev, ...lastPaymentPrefill, jobCardNumber: "" }));
        }
      } else {
        setServiceJobCardInfo(null);
        setIsManualJobCard(true);
        setFormData(prev => ({ ...prev, ...lastPaymentPrefill, jobCardNumber: "" }));
      }
    } catch (error) {
      console.error("Error fetching job cards:", error);
      setServiceJobCardInfo(null);
      setIsManualJobCard(true);
      toast.error('Failed to fetch job card information');
    }
    
    setFilteredPayments(payments);
    setShowDropdown(false);
    return;
  }
  
  





  
    
   
      
   
  

    
  
      

  
      // Regular customer selection
console.log('Regular customer selection:', customer.name, 'ID:', customer.id);
setSelectedCustomerId(customer.id.toString());
setSearchTerm(customer.name);
setLoadedCustomer(customer);
setIsNewCustomer(false);
setIsManualJobCard(false);

const customerPayments = payments.filter(
  (payment) => payment.customerId === customer.id
);
setFilteredPayments(
  customerPayments.map((payment, index) => ({
    ...payment,
    sNo: index + 1,
  }))
);

setFormData(prev => ({
  ...prev,
  vehicleNumber: "",
  refNo: "",
  jobCardNumber: "",
  serviceType: "",
  serviceTypeId: "",
  serviceTypeOfCollectionId: "",
  vehicleModelId: "",
  recAmt: "",
})); // Reset form data when a new customer is selected

const fetchData = async () => {
  // Store the current selection ID at the start
  const thisFetchId = currentSelectionId;
  
  // Check if this fetch is still for the current selection
  if (customerSelectionId.current !== thisFetchId) {
    console.log('Selection changed before fetch, aborting for:', customer.name);
    return;
  }
  
  let invoiceInfo = null;
  let lastPaymentInfo = null;
  let jobCardInfoFromPayment = null;

  // Fetch last payment details
  try {
    const allPaymentsResponse = await servicePaymentCollectionApi.getAll(1, 100, customer.id);
    
    // Check after async operation
    if (customerSelectionId.current !== thisFetchId) {
      console.log('Selection changed after fetching payments, aborting for:', customer.name);
      return;
    }
    
    const allPayments = Array.isArray(allPaymentsResponse) ? allPaymentsResponse : allPaymentsResponse?.data || [];
    const lastPayment = allPayments.sort((a, b) => new Date(b.date) - new Date(a.date))[0];

    if (lastPayment) {
      lastPaymentInfo = lastPayment;

      // Improved version with better validation:
if (lastPayment.jobCardNumber && lastPayment.jobCardNumber !== 'N/A') {
  try {
    // CRITICAL: Pass customer's contact number to ensure job card belongs to this customer
    const foundJobCard = await fetchJobCardByNumber(lastPayment.jobCardNumber, customer.contactNo);
    
    // Check after async operation
    if (customerSelectionId.current !== thisFetchId) {
      console.log('Selection changed after fetching job card, aborting for:', customer.name);
      return;
    }
    
    // DOUBLE VALIDATION: Verify the job card belongs to this customer
    const jobCardBelongsToCustomer = foundJobCard && 
      foundJobCard.mobileNumber?.toString().trim() === customer.contactNo?.toString().trim();
    
    if (jobCardBelongsToCustomer) {
      console.log('Job card belongs to customer:', customer.name, foundJobCard.jobCardNumber);
      jobCardInfoFromPayment = foundJobCard;
    } else if (foundJobCard) {
      // Log the mismatch for debugging
      console.warn('Job card mismatch:', {
        expectedCustomer: customer.name,
        expectedMobile: customer.contactNo,
        jobCardCustomer: foundJobCard.customerName,
        jobCardMobile: foundJobCard.mobileNumber,
        jobCardNumber: foundJobCard.jobCardNumber
      });
      // Do NOT set jobCardInfoFromPayment - this prevents showing wrong customer's job card
      jobCardInfoFromPayment = null;
    }
  } catch (error) {
    console.error("Error fetching job card from payment:", error);
  }
}
    }
  } catch (error) {
    console.error("Error fetching last payment:", error);
  }

  // Fetch invoice info
  try {
    const invoiceResults = await salesInvoiceApi.getAll(customer.contactNo);
    
    // Check after async operation
    if (customerSelectionId.current !== thisFetchId) {
      console.log('Selection changed after fetching invoice, aborting for:', customer.name);
      return;
    }
    
    invoiceInfo = invoiceResults.length > 0 ? invoiceResults[0] : null;
    setSalesInvoiceInfo(invoiceInfo);
  } catch (error) {
    console.error("Error fetching invoice:", error);
  }

  // Fetch customer payment history
  try {
    const historyResponse = await servicePaymentCollectionApi.getAll(1, 1000, customer.id);
    
    // Check after async operation
    if (customerSelectionId.current !== thisFetchId) {
      console.log('Selection changed after fetching history, aborting for:', customer.name);
      return;
    }
    
    setCustomerHistory(historyResponse.data || []);
    
    // Fetch ALL payments for this customer to display in the table (no pagination)
    const allPaymentsResponse = await servicePaymentCollectionApi.getAll(1, 10000, customer.id);
    
    if (customerSelectionId.current !== thisFetchId) {
      console.log('Selection changed after fetching all payments, aborting for:', customer.name);
      return;
    }
    
    const allCustomerPayments = Array.isArray(allPaymentsResponse) ? allPaymentsResponse : allPaymentsResponse?.data || [];
    const formattedPayments = allCustomerPayments.map((payment, index) => ({
      sNo: index + 1,
      id: payment.id,
      date: payment.date,
      receiptNo: payment.receiptNo,
      custId: payment.customer?.custId || payment.custId,
      name: payment.customer?.name || payment.name,
      contactNo: payment.customer?.contactNo || payment.contactNo,
      address: payment.customer?.address || payment.address,
      totalAmt: payment.totalAmt !== undefined && payment.totalAmt !== null ? payment.totalAmt : payment.recAmt || "N/A",
      recAmt: payment.recAmt,
      paymentType: payment.paymentTypeMaster?.name || payment.paymentType,
      paymentTypeLabel: getPaymentTypeLabel(payment.paymentTypeMaster?.name || payment.paymentType),
      paymentStatus: payment.paymentStatus,
      vehicleNumber: payment.vehicleNumber || "N/A",
      paymentMode: payment.paymentMode?.paymentMode || payment.paymentMode,
      typeOfPayment: payment.typeOfPayment?.typeOfMode || payment.typeOfPayment || "N/A",
      typeOfCollection: payment.serviceTypeOfCollection?.typeOfCollect || payment.typeOfCollection || "N/A",
      vehicleModel: payment.vehicleModel?.model || payment.vehicleModel || "N/A",
      enteredBy: payment.user?.username || payment.enteredBy || "N/A",
      refNo: payment.refNo || "N/A",
      remarks: payment.remarks || "N/A",
      jobCardNumber: payment.jobCardNumber || "N/A",
      serviceType: payment.serviceTypeRelation?.name || payment.serviceType || "N/A",
      paymentSessions: payment.paymentSessions || [],
      selectedParts: payment.selectedParts || [],
      customerId: payment.customerId,
      paymentModeId: payment.paymentModeId,
      typeOfPaymentId: payment.typeOfPaymentId,
      serviceTypeOfCollectionId: payment.serviceTypeOfCollectionId,
      vehicleModelId: payment.vehicleModelId,
      serviceTypeId: payment.serviceTypeId,
      cancelledAt: payment.cancelledAt,
      cancelledBy: payment.cancelledByUser?.username || null,
      hasAdditionalPlan: payment.hasAdditionalPlan || false,
      additionalPlanCollections: payment.additionalPlanCollections || [],
      additionalPlanAmount: payment.additionalPlanAmount || '',
      additionalPlanDetails: payment.additionalPlanDetails || {},
      additionalPlanCollectionId: payment.additionalPlanCollectionId || null,
    }));
    setFilteredPayments(formattedPayments);
  } catch (error) {
    console.error("Error fetching history:", error);
  }

  // FINAL CHECK before updating UI - THIS IS CRITICAL
  if (customerSelectionId.current !== thisFetchId) {
    console.log('Selection changed before final UI update, aborting for:', customer.name);
    return;
  }
  
  // Set the job card info for display - ONLY if it belongs to this customer
  if (jobCardInfoFromPayment && jobCardInfoFromPayment.mobileNumber?.toString().trim() === customer.contactNo?.toString().trim()) {
    console.log('Setting job card info for:', customer.name, jobCardInfoFromPayment.jobCardNumber);
    setServiceJobCardInfo(jobCardInfoFromPayment);
  } else {
    setServiceJobCardInfo(null);
  }

  const updatedFormData = { ...formData };
  
  if (lastPaymentInfo) {
    if (lastPaymentInfo.vehicleNumber && lastPaymentInfo.vehicleNumber !== 'N/A') {
      updatedFormData.vehicleNumber = lastPaymentInfo.vehicleNumber;
    }
    
    if (lastPaymentInfo.vehicleModelId) {
      updatedFormData.vehicleModelId = lastPaymentInfo.vehicleModelId.toString();
    } else if (lastPaymentInfo.vehicleModel && vehicleModels.length > 0) {
      const matchedModel = vehicleModels.find(m => 
        m.model.toLowerCase() === lastPaymentInfo.vehicleModel.toLowerCase()
      );
      if (matchedModel) {
        updatedFormData.vehicleModelId = matchedModel.id.toString();
      }
    }
    
    // Only auto-fill job card number if it belongs to this customer and not closed
    if (lastPaymentInfo.jobCardNumber && lastPaymentInfo.jobCardNumber !== 'N/A') {
      try {
        const allJobCards = await serviceJobCardApi.getAll();
        const foundJobCard = allJobCards.find(jc => jc.jobCardNumber === lastPaymentInfo.jobCardNumber);
        
        if (foundJobCard && foundJobCard.mobileNumber?.toString().trim() === customer.contactNo?.toString().trim() && !isJobCardClosed(foundJobCard.status)) {
          updatedFormData.jobCardNumber = lastPaymentInfo.jobCardNumber;
        } else {
          updatedFormData.jobCardNumber = "";
        }
      } catch (err) {
        updatedFormData.jobCardNumber = "";
      }
    } else {
      updatedFormData.jobCardNumber = "";
    }
    
    if (lastPaymentInfo.serviceType && lastPaymentInfo.serviceType !== 'N/A') {
      updatedFormData.serviceType = lastPaymentInfo.serviceType;
      const matchedServiceType = serviceTypes.find(
        st => st.name.toLowerCase() === lastPaymentInfo.serviceType.toLowerCase()
      );
      if (matchedServiceType) {
        updatedFormData.serviceTypeId = matchedServiceType.id.toString();
      }
    }
    
    if (lastPaymentInfo.typeOfCollection && lastPaymentInfo.typeOfCollection !== 'N/A') {
      const matchedCollection = serviceTypeOfCollections.find(
        type => type.typeOfCollect?.toLowerCase() === lastPaymentInfo.typeOfCollection.toLowerCase()
      );
      if (matchedCollection) {
        updatedFormData.serviceTypeOfCollectionId = matchedCollection.id.toString();
      }
    }
    
    // Only show toast if this is still the current selection
    if (customerSelectionId.current === thisFetchId) {
      toast.success(`Loaded last payment details for ${customer.name}`, { duration: 3000 });
    }
  } else if (invoiceInfo && !updatedFormData.vehicleNumber) {
    if (invoiceInfo.vehicleRegNo && !updatedFormData.vehicleNumber) {
      updatedFormData.vehicleNumber = invoiceInfo.vehicleRegNo;
    }
    if (invoiceInfo.vehicleModel && !updatedFormData.vehicleModelId) {
      const invModel = invoiceInfo.vehicleModel.toLowerCase().trim();
      const matchedModel = vehicleModels.find((m) => {
        const mm = m.model.toLowerCase().trim();
        return invModel && (mm === invModel || invModel.includes(mm) || mm.includes(invModel));
      });
      if (matchedModel) {
        updatedFormData.vehicleModelId = matchedModel.id.toString();
      }
    }
  }
  
  // Final check before setting form data
  if (customerSelectionId.current === thisFetchId) {
    console.log('Setting form data for:', customer.name);
    setFormData(updatedFormData);
  } else {
    console.log('NOT setting form data - selection changed to:', customerSelectionId.current);
  }
};

  await fetchData(); // Call fetchData to load details for the selected customer
   
  setShowDropdown(false);
};
// Auto-fetch job card details when job card number changes
useEffect(() => {
  const autoFetchJobCardDetails = async () => {
    // CRITICAL: Only auto-fetch if we have a loaded customer
    if (!loadedCustomer?.contactNo) {
      console.log('No customer loaded, skipping auto-fetch');
      // Clear any existing job card info if no customer is loaded
      if (serviceJobCardInfo) {
        setServiceJobCardInfo(null);
        setFoundJobCard(null);
      }
      return;
    }
    
    // Don't fetch if job card number is empty
    if (!formData.jobCardNumber || formData.jobCardNumber.trim() === '') {
      console.log('No job card number, clearing job card info');
      setServiceJobCardInfo(null);
      setFoundJobCard(null);
      setIsManualJobCard(false);
      return;
    }
    
    // Only fetch for payment types that require a job card
    if (requiresJobCard) {
      // Skip if in edit mode
      if (isEditMode) return;
      
      setIsCheckingJobCard(true);
      
      try {
        // IMPORTANT: Pass the customer's mobile number to validate ownership
        const jobCard = await fetchJobCardByNumber(formData.jobCardNumber, loadedCustomer.contactNo);
        setFoundJobCard(jobCard);
        
        if (jobCard) {
          // Double check that this job card belongs to the loaded customer
          const customerMobile = loadedCustomer.contactNo?.toString().trim();
          const jobCardMobile = jobCard.mobileNumber?.toString().trim();
          
          if (customerMobile !== jobCardMobile) {
            console.warn('Auto-fetched job card does NOT belong to current customer. Ignoring.');
            setServiceJobCardInfo(null);
            setFoundJobCard(null);
            setIsCheckingJobCard(false);
            // Clear the job card number from form since it doesn't belong to this customer
            setFormData(prev => ({ ...prev, jobCardNumber: "" }));
            toast.error(`Job card ${formData.jobCardNumber} does not belong to ${loadedCustomer.name}`, { duration: 3000 });
            return;
          }
          
          console.log('Found existing job card for customer:', loadedCustomer.name, jobCard.jobCardNumber);
          setServiceJobCardInfo(jobCard);
          
          // Auto-fill form data from job card
          let serviceTypeId = "";
          let serviceTypeName = "";
          
          if (jobCard.serviceType) {
            if (typeof jobCard.serviceType === 'object') {
              serviceTypeId = jobCard.serviceType.id?.toString() || "";
              serviceTypeName = jobCard.serviceType.name || "";
            } else if (typeof jobCard.serviceType === 'string') {
              serviceTypeName = jobCard.serviceType;
            }
          }
          
          // Find matching service type from serviceTypes list
          let matchedServiceTypeId = serviceTypeId;
          if (serviceTypeName && serviceTypes.length > 0) {
            const matchedServiceType = serviceTypes.find(
              st => st.name.toLowerCase() === serviceTypeName.toLowerCase()
            );
            if (matchedServiceType) {
              matchedServiceTypeId = matchedServiceType.id.toString();
            }
          }
          
          // Match vehicle model from job card
          let matchedModelId = "";
          if (jobCard.vehicleDetails && vehicleModels.length > 0) {
            const matchedModel = vehicleModels.find((m) => {
              const mm = m.model.toLowerCase().trim();
              const vehicleDetail = jobCard.vehicleDetails.toLowerCase().trim();
              return mm === vehicleDetail || vehicleDetail.includes(mm) || mm.includes(vehicleDetail);
            });
            if (matchedModel) {
              matchedModelId = matchedModel.id.toString();
            }
          }
          
          setFormData(prev => ({
            ...prev,
            vehicleNumber: jobCard.registrationNumber || prev.vehicleNumber,
            serviceTypeId: matchedServiceTypeId || prev.serviceTypeId,
            serviceType: serviceTypeName || prev.serviceType,
            vehicleModelId: matchedModelId || prev.vehicleModelId,
          }));
          
          // Find matching collection type
          if (serviceTypeName && serviceTypeOfCollections.length > 0) {
            const matchedTypeOfCollection = serviceTypeOfCollections.find(
              (type) => type.typeOfCollect?.toLowerCase() === serviceTypeName.toLowerCase()
            );
            if (matchedTypeOfCollection) {
              setFormData(prev => ({
                ...prev,
                serviceTypeOfCollectionId: matchedTypeOfCollection.id.toString()
              }));
            }
          }
          
          setIsManualJobCard(false);
        } else if (formData.jobCardNumber.trim()) {
          // Job card not found for this customer
          setIsManualJobCard(true);
          setServiceJobCardInfo(null);
          setFoundJobCard(null);
          setPendingPayments([]);
          // Don't clear the job card number here - user might want to create a new one
        }
      } catch (error) {
        console.error('Error fetching job card:', error);
        setServiceJobCardInfo(null);
        setFoundJobCard(null);
      } finally {
        setIsCheckingJobCard(false);
      }
    } else {
      // Not a full/advance payment, clear job card info
      setServiceJobCardInfo(null);
      setFoundJobCard(null);
      setIsManualJobCard(false);
    }
  };
  
  const timeoutId = setTimeout(() => {
    autoFetchJobCardDetails();
  }, 500);
  
  return () => clearTimeout(timeoutId);
}, [formData.jobCardNumber, formData.paymentType, serviceTypes, vehicleModels, serviceTypeOfCollections, isEditMode, loadedCustomer?.contactNo, loadedCustomer?.name]);

// Add this useEffect after the existing useEffect declarations
useEffect(() => {
  const autoFetchVehicleFromPayment = async () => {
    if (loadedCustomer && formData.vehicleNumber && !formData.vehicleModelId) {
      try {
        // Try to find vehicle model from customer's previous payments
        const response = await servicePaymentCollectionApi.getAll(1, 100, loadedCustomer.id);
        const payments = response.data || [];
        const paymentWithSameVehicle = payments.find(p => 
          p.vehicleNumber === formData.vehicleNumber && p.vehicleModelId
        );
        
        if (paymentWithSameVehicle && paymentWithSameVehicle.vehicleModelId) {
          setFormData(prev => ({ 
            ...prev, 
            vehicleModelId: paymentWithSameVehicle.vehicleModelId.toString() 
          }));
          toast.success(`Vehicle model auto-filled from previous payment`);
        } else if (vehicleModels.length > 0) {
          // Try to match by pattern
          const matchedModel = vehicleModels.find(model => 
            formData.vehicleNumber.toLowerCase().includes(model.model.toLowerCase())
          );
          if (matchedModel) {
            setFormData(prev => ({ ...prev, vehicleModelId: matchedModel.id.toString() }));
            toast.success(`Vehicle model auto-set to: ${matchedModel.model}`);
          }
        }
      } catch (error) {
        console.error("Error auto-fetching vehicle model:", error);
      }
    }
  };
  
  autoFetchVehicleFromPayment();
}, [formData.vehicleNumber, loadedCustomer, vehicleModels]);

// Auto-fetch vehicle model when vehicle number changes
useEffect(() => {
  const autoFetchVehicleModel = async () => {
    if (formData.vehicleNumber && vehicleModels.length > 0 && !formData.vehicleModelId) {
      try {
        const allJobCards = await serviceJobCardApi.getAll();
        const jobCardWithVehicle = allJobCards.find(jc => 
          jc.registrationNumber === formData.vehicleNumber
        );
        
        if (jobCardWithVehicle && jobCardWithVehicle.vehicleDetails) {
          const matchedModel = vehicleModels.find(m => 
            m.model.toLowerCase() === jobCardWithVehicle.vehicleDetails.toLowerCase()
          );
          if (matchedModel) {
            setFormData(prev => ({ ...prev, vehicleModelId: matchedModel.id.toString() }));
            toast.success(`Vehicle model auto-set to: ${matchedModel.model}`);
            return;
          }
        }
        
        const matchedModel = vehicleModels.find(model => 
          formData.vehicleNumber.toLowerCase().includes(model.model.toLowerCase()) ||
          model.model.toLowerCase().includes(formData.vehicleNumber.toLowerCase())
        );
        
        if (matchedModel) {
          setFormData(prev => ({ ...prev, vehicleModelId: matchedModel.id.toString() }));
          toast.success(`Vehicle model auto-set to: ${matchedModel.model}`);
        }
      } catch (error) {
        console.error("Error auto-fetching vehicle model:", error);
      }
    }
  };
  
  autoFetchVehicleModel();
}, [formData.vehicleNumber, vehicleModels]);

  useEffect(() => {
    fetchCustomers();
    fetchPaymentModes();
    fetchPaymentTypes();
    fetchTypeOfPayments();
    fetchServiceTypeOfCollections();
    fetchVehicleModels();
    fetchPayments();
    fetchPermissions();
    fetchDeletedPayments();
    fetchServiceTypes();
    fetchAvailableParts();
  }, []);

  // Handle subType: set default payment type based on subType
  useEffect(() => {
    if (paymentTypes.length === 0) return;
    
    if (isFullPaymentMode) {
      const fullType = paymentTypes.find(pt => pt.name?.toString().toLowerCase().includes('full'));
      setFormData(prev => ({
        ...prev,
        paymentType: 'full payment',
        paymentTypeId: fullType ? String(fullType.id) : '',
        paymentStatus: 'pending'
      }));
    } else if (isAdvancePaymentMode) {
      const advanceType = paymentTypes.find(pt => pt.name?.toString().toLowerCase().includes('advance'));
      setFormData(prev => ({
        ...prev,
        paymentType: 'advance payment',
        paymentTypeId: advanceType ? String(advanceType.id) : '',
        paymentStatus: 'pending'
      }));
    } else if (isXyzPaymentMode) {
      const servicePlanType = paymentTypes.find(pt => pt.name?.toString().toLowerCase().includes('service plan'));
      setFormData(prev => ({
        ...prev,
        paymentType: 'service plan payment',
        paymentTypeId: servicePlanType ? String(servicePlanType.id) : '',
        paymentStatus: 'pending'
      }));
    }
  }, [isFullPaymentMode, isAdvancePaymentMode, isXyzPaymentMode, paymentTypes]);

  // Apply internalMode filter when payments load or when internalMode changes
  useEffect(() => {
    let filtered = payments || [];
    
    // Apply customer filter
    if (loadedCustomer) {
      filtered = filtered.filter(p => p.customerId === loadedCustomer.id);
    }

    if (!internalMode) {
      setFilteredPayments(filtered);
      return;
    }

    const key = (internalMode || '').toString().toLowerCase().trim();
    if (filtered.length === 0) {
      setFilteredPayments([]);
      return;
    }

    if (key === 'full') {
      filtered = filtered.filter(p => (p.paymentType || '').toString().toLowerCase().includes('full'));
    } else if (key === 'advance') {
      filtered = filtered.filter(p => (p.paymentType || '').toString().toLowerCase().includes('advance'));
    } else if (key === 'xyz') {
      filtered = filtered.filter(p => {
        const type = (p.paymentType || '').toString().toLowerCase();
        const collection = (p.serviceTypeOfCollection?.typeOfCollect || '').toString().toLowerCase();
        return type.includes('service plan') || ['rsa', 'amc', 'ew'].some(val => collection.includes(val));
      });
    }

    setFilteredPayments(filtered);
  }, [internalMode, payments, loadedCustomer]);

  // Add this useEffect to fetch vehicle models when component mounts
useEffect(() => {
  fetchVehicleModels();
}, []);

const handleView = async (payment) => {
  // Start with the payment data
  let updatedPayment = { ...payment };

  // If there's a job card number, fetch additional invoice details
  if (payment.jobCardNumber && payment.jobCardNumber !== 'N/A') {
    try {
      const allJobCards = await serviceJobCardApi.getAll();
      const foundJobCard = allJobCards.find(jc => jc.jobCardNumber === payment.jobCardNumber);
      
      if (foundJobCard) {
        console.log('Found job card for view:', foundJobCard);
        
        // Add invoice info from job card to the payment object
        updatedPayment = {
          ...updatedPayment,
          invoiceNumber: foundJobCard.invoiceNumber || foundJobCard.invoiceNo || 'N/A',
          totalInvoiceAmount: foundJobCard.totalRevenue || foundJobCard.totalInvoiceAmount || 0,
        };
      }
    } catch (error) {
      console.error('Error fetching job card invoice info:', error);
    }
  }
  
  setSelectedPayment(updatedPayment);
  setIsViewModalOpen(true);
};


  // Fetch available parts from master
  const fetchAvailableParts = async () => {
    try {
      const data = await serviceTypeOfPartApi.getEnabledParts();
      setAvailableParts(data);
    } catch (error) {
      console.error('Error fetching parts:', error);
    }
  };

  // Filter parts based on search
  const filteredParts = availableParts.filter(part =>
    part.partNo.toLowerCase().includes(partSearchTerm.toLowerCase()) ||
    (part.partDescription || part.partName || '').toLowerCase().includes(partSearchTerm.toLowerCase()) ||
    (part.Model || '').toLowerCase().includes(partSearchTerm.toLowerCase())
  );

  // Add part to payment
  const handleAddPartToPayment = (part) => {
    if (selectedParts.find(p => p.id === part.id)) {
      toast.error('Part already added');
      return;
    }
    setSelectedParts([...selectedParts, part]);
    toast.success(`${part.partDescription || part.partName} added`);
    setIsPartDropdownOpen(false);
    setPartSearchTerm('');
  };


  // Add this function after the existing state declarations
const fetchLastPaymentDetails = async (customerId) => {
  if (!customerId) return null;
  
  try {
    // Fetch all payments for this customer, sorted by date (most recent first)
    const response = await servicePaymentCollectionApi.getAll(1, 100, customerId);
    const allPayments = response.data || [];
    
    // Find the most recent payment with vehicle information
    const lastPaymentWithVehicle = allPayments
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .find(p => p.vehicleNumber && p.vehicleNumber !== 'N/A' && p.vehicleNumber !== '');
    
    return lastPaymentWithVehicle || null;
  } catch (error) {
    console.error("Error fetching last payment details:", error);
    return null;
  }
};
  // Remove part from payment
  const removePartFromPayment = (partId) => {
    setSelectedParts(prevParts => prevParts.filter(part => part.id !== partId));
    toast.success('Part removed');
  };

  // Add new part to master
  const handleAddNewPart = async () => {
    if (!newPartData.partNo || !newPartData.partDescription) {
      toast.error('Part No and Part Description are required');
      return;
    }

    const normalizedPartNo = newPartData.partNo.trim().toUpperCase();
    const existingPart = availableParts.find(
      (part) => part.partNo?.trim().toUpperCase() === normalizedPartNo
    );

    if (existingPart) {
      toast.error('Part No already exists');
      return;
    }

    try {
      const newPart = await serviceTypeOfPartApi.create(newPartData);
      toast.success('Part added to master successfully!');
      setIsNewPartModalOpen(false);
      setNewPartData({ partNo: '', partDescription: '', Model: '', status: 'ORDERED' });
      await fetchAvailableParts();
      // Auto-add the new part to payment
      setSelectedParts([...selectedParts, newPart]);
    } catch (error) {
      const message = error.message || '';
      if (message.toLowerCase().includes('already exists') || message.toLowerCase().includes('duplicate')) {
        toast.error('Part No already exists');
      } else {
        toast.error(message || 'Error adding part');
      }
      console.error('Error adding part:', error);
    }
  };

  useEffect(() => {
  if (serviceJobCardInfo && !isEditMode) {
    console.log("Processing job card info:", serviceJobCardInfo);

    let serviceTypeId = "";
    let serviceTypeName = "";

    if (serviceJobCardInfo.serviceType) {
      if (typeof serviceJobCardInfo.serviceType === 'object') {
        serviceTypeId = serviceJobCardInfo.serviceType.id?.toString() || "";
        serviceTypeName = serviceJobCardInfo.serviceType.name || "";
      } else if (typeof serviceJobCardInfo.serviceType === 'string') {
        serviceTypeName = serviceJobCardInfo.serviceType;
      }
    }

    if (!serviceTypeName && serviceJobCardInfo.service_type) {
      serviceTypeName = serviceJobCardInfo.service_type;
    }

    console.log("Setting service type - ID:", serviceTypeId, "Name:", serviceTypeName);

    // Find matching service type from serviceTypes list
    if (serviceTypeName && serviceTypes.length > 0) {
      const matchedServiceType = serviceTypes.find(
        st => st.name.toLowerCase() === serviceTypeName.toLowerCase()
      );
      if (matchedServiceType) {
        serviceTypeId = matchedServiceType.id.toString();
      }
    }

    setFormData(prev => ({
      ...prev,
      serviceTypeId: serviceTypeId,
      serviceType: serviceTypeName || prev.serviceType,
      jobCardNumber: isManualJobCard
        ? prev.jobCardNumber
        : (serviceJobCardInfo.jobCardNumber || prev.jobCardNumber),
      vehicleNumber: serviceJobCardInfo.registrationNumber || prev.vehicleNumber,
    }));
  }
}, [serviceJobCardInfo, isEditMode, serviceTypes]);

  const fetchPermissions = async () => {
    try {
      const perms = await menuPermissionApi.get();
      setPermissions(perms);
    } catch (error) {
      console.error('Failed to fetch permissions:', error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".customer-dropdown") && !event.target.closest(".part-dropdown")) {
        setIsPartDropdownOpen(false);
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

 useEffect(() => {
  if (serviceJobCardInfo && !isEditMode && serviceTypeOfCollections.length > 0) {
    const jc = serviceJobCardInfo;
    console.log('Processing job card for vehicle model:', jc);

    let serviceTypeId = "";
    let serviceTypeName = "";

    if (jc.serviceType) {
      if (typeof jc.serviceType === 'object') {
        serviceTypeId = jc.serviceType.id?.toString() || "";
        serviceTypeName = jc.serviceType.name || "";
      } else if (typeof jc.serviceType === 'string') {
        serviceTypeName = jc.serviceType;
      }
    }

    if (!serviceTypeName && jc.service_type) {
      serviceTypeName = jc.service_type;
    }

    // Match vehicle model
    const modelName = jc.vehicleDetails ? jc.vehicleDetails.toLowerCase() : "";
    let matchedModelId = "";
    
    if (modelName && vehicleModels.length > 0) {
      const matchedModel = vehicleModels.find((m) => {
        const mm = m.model.toLowerCase();
        return modelName && (mm === modelName || mm.includes(modelName) || modelName.includes(mm));
      });
      if (matchedModel) {
        matchedModelId = matchedModel.id.toString();
        console.log('Vehicle model matched:', matchedModel.model);
      }
    }

    let matchedCollectionId = "";
    if (serviceTypeName && serviceTypeOfCollections.length > 0) {
      const matchedTypeOfCollection = serviceTypeOfCollections.find(
        (type) => type.typeOfCollect?.toLowerCase() === serviceTypeName.toLowerCase()
      );
      matchedCollectionId = matchedTypeOfCollection ? matchedTypeOfCollection.id.toString() : "";
    }

    setFormData((prev) => ({
      ...prev,
      jobCardNumber: isManualJobCard ? prev.jobCardNumber : (jc.jobCardNumber || prev.jobCardNumber),
      vehicleNumber: jc.registrationNumber || prev.vehicleNumber,
      serviceTypeId: serviceTypeId || prev.serviceTypeId,
      serviceType: serviceTypeName || prev.serviceType,
      serviceTypeOfCollectionId: matchedCollectionId || prev.serviceTypeOfCollectionId,
      vehicleModelId: matchedModelId || prev.vehicleModelId,
    }));
  }
}, [serviceJobCardInfo, vehicleModels, serviceTypeOfCollections, isEditMode]);

useEffect(() => {
  // Clear all job card related state when customer changes
  console.log('Customer changed, clearing all job card data');
  setServiceJobCardInfo(null);
  setFoundJobCard(null);
  setPendingPayments([]);
  setIsManualJobCard(false);
  // Also clear the job card number from form
  setFormData(prev => ({ 
    ...prev, 
    jobCardNumber: "",
    serviceTypeId: "",
    serviceType: "",
    serviceTypeOfCollectionId: "",
    vehicleModelId: "",
    vehicleNumber: ""
  }));
}, [selectedCustomerId, loadedCustomer?.id, loadedCustomer?.contactNo]);

  useEffect(() => {
    if (serviceTypeOfCollections.length > 0 && serviceJobCardInfo) {
      let jobCardServiceType = "";
      if (serviceJobCardInfo.serviceType) {
        if (typeof serviceJobCardInfo.serviceType === 'string') {
          jobCardServiceType = serviceJobCardInfo.serviceType;
        } else if (serviceJobCardInfo.serviceType.name) {
          jobCardServiceType = serviceJobCardInfo.serviceType.name;
        }
      }

      if (jobCardServiceType) {
        const matchedTypeOfCollection = serviceTypeOfCollections.find(
          (type) => type.typeOfCollect?.toLowerCase() === jobCardServiceType.toLowerCase()
        );

        if (matchedTypeOfCollection) {
          setFormData((prev) => ({
            ...prev,
            serviceType: jobCardServiceType,
            serviceTypeOfCollectionId: matchedTypeOfCollection.id.toString()
          }));
        } else {
          setFormData((prev) => ({
            ...prev,
            serviceType: jobCardServiceType
          }));
        }
      }
    }
  }, [serviceTypeOfCollections, serviceJobCardInfo]);

const fetchCustomers = async () => {
  try {
    // Fetch all customers
    const customerData = await customerApi.getAll();
    console.log('Customer Data:', customerData);
    
    // Fetch all invoices
    const invoiceData = await salesInvoiceApi.getAll();
    console.log('Invoice Data:', invoiceData);
    
    // Fetch ALL job cards
    let allJobCards = [];
    try {
      allJobCards = await serviceJobCardApi.getAll();
      console.log('All Job Cards:', allJobCards);
    } catch (error) {
      console.error('Error fetching job cards:', error);
    }

    // Create a Map to store unique customers by contact number
    const customerMap = new Map();
    
    // Helper function to normalize contact number (remove spaces, special chars)
    const normalizeContact = (contact) => {
      if (!contact) return null;
      return contact.toString().trim().replace(/\D/g, '');
    };
    
    // First, add all main customers
    customerData.forEach(c => {
      const normalizedContact = normalizeContact(c.contactNo);
      if (normalizedContact) {
        customerMap.set(normalizedContact, {
          id: c.id,
          name: c.name,
          contactNo: c.contactNo,
          address: c.address || "N/A",
          status: c.status || "Walk in Customer",
          custId: c.custId,
          source: 'customer',
          hasInvoice: false,
          hasJobCard: false,
          hasActiveJobCard: false,
          hasClosedJobCard: false,
          activeJobCard: null,
          closedJobCard: null,
          invoiceData: null,
          jobCardData: null
        });
      }
    });

    // Add invoice information to existing customers or create new ones
    invoiceData.forEach(inv => {
      const contactNo = inv.contactNo || inv.contactInfo;
      const normalizedContact = normalizeContact(contactNo);
      
      if (normalizedContact) {
        if (customerMap.has(normalizedContact)) {
          // Update existing customer
          const existing = customerMap.get(normalizedContact);
          existing.hasInvoice = true;
          existing.invoiceData = inv;
          if (!existing.address || existing.address === "N/A") {
            existing.address = inv.address || "N/A";
          }
          customerMap.set(normalizedContact, existing);
        } else {
          // Create new customer from invoice
          customerMap.set(normalizedContact, {
            id: `inv-${inv.id}`,
            name: inv.customerName,
            contactNo: contactNo,
            address: inv.address || "N/A",
            status: "Imported from Invoice",
            custId: `INV-${inv.id}`,
            source: 'invoice',
            hasInvoice: true,
            hasJobCard: false,
            hasActiveJobCard: false,
            hasClosedJobCard: false,
            activeJobCard: null,
            closedJobCard: null,
            invoiceData: inv,
            jobCardData: null
          });
        }
      }
    });

    // Add job card information to existing customers or create new ones
    allJobCards.forEach(jc => {
      const normalizedContact = normalizeContact(jc.mobileNumber);
      const status = (jc.status || '').toString().toLowerCase().trim();
      const isClosed = /closed|completed|cancelled|canceled|close/.test(status);
      const isActive = !isClosed && /pending|open/.test(status);
      
      if (normalizedContact) {
        if (customerMap.has(normalizedContact)) {
          // Update existing customer
          const existing = customerMap.get(normalizedContact);
          existing.hasJobCard = true;
          if (isActive) {
            existing.hasActiveJobCard = true;
            existing.activeJobCard = jc;
          }
          if (isClosed) {
            existing.hasClosedJobCard = true;
            existing.closedJobCard = jc;
          }
          if (!existing.jobCardData) {
            existing.jobCardData = jc;
          }
          // Update name if needed
          if (jc.customerName && (existing.name === "Unknown" || !existing.name)) {
            existing.name = jc.customerName;
          }
          customerMap.set(normalizedContact, existing);
        } else {
          // Create new customer from job card
          customerMap.set(normalizedContact, {
            id: `jc-${jc.id}`,
            name: jc.customerName || "Unknown",
            contactNo: jc.mobileNumber,
            address: "Imported from Service Master",
            status: "Service Dealer Customer",
            custId: `JC-${jc.id}`,
            source: 'jobcard',
            hasInvoice: false,
            hasJobCard: true,
            hasActiveJobCard: isActive,
            hasClosedJobCard: isClosed,
            activeJobCard: isActive ? jc : null,
            closedJobCard: isClosed ? jc : null,
            invoiceData: null,
            jobCardData: jc
          });
        }
      }
    });

    // Convert map to array and ensure proper display
    const allCustomers = Array.from(customerMap.values()).map(customer => {
      // Ensure the name is properly set
      let displayName = customer.name;
      
      // Add proper badges
      const badges = [];
      if (customer.hasInvoice || customer.source === 'invoice') badges.push('Invoice');
      if (customer.hasJobCard || customer.source === 'jobcard') badges.push('Service Dealership');
      
      return {
        ...customer,
        displayName: displayName,
        badges: badges
      };
    });

    console.log('All Customers (deduplicated):', allCustomers);
    setCustomers(allCustomers);
  } catch (error) {
    console.error("Error fetching customers:", error);
    toast.error('Failed to load customers');
  }
};

// Create new job card
const handleCreateJobCard = async () => {
  if (!manualJobCardData.jobCardNumber) {
    toast.error('Job Card Number is required');
    return;
  }

  try {
    const newJobCard = await serviceJobCardApi.create({
      jobCardNumber: manualJobCardData.jobCardNumber,
      registrationNumber: manualJobCardData.registrationNumber,
      customerName: manualJobCardData.customerName || loadedCustomer?.name,
      mobileNumber: manualJobCardData.mobileNumber || loadedCustomer?.contactNo,
      vehicleDetails: manualJobCardData.vehicleDetails,
      serviceType: manualJobCardData.serviceType,
      status: 'Pending'
    });
    
    toast.success('New Job Card created successfully!');
    setServiceJobCardInfo(newJobCard);
    setFormData(prev => ({ ...prev, jobCardNumber: newJobCard.jobCardNumber }));
    setIsManualJobCard(false);
    setManualJobCardData({
      jobCardNumber: '',
      registrationNumber: '',
      customerName: '',
      mobileNumber: '',
      vehicleDetails: '',
      serviceType: ''
    });
    
    // Refresh customers to update the badge
    fetchCustomers();
  } catch (error) {
    toast.error(error.message || 'Error creating job card');
    console.error('Error creating job card:', error);
  }
};
  const fetchServiceTypes = async () => {
    try {
      const data = await serviceTypeApi.getAll();
      console.log("Fetched service types raw data:", data);

      const typesArray = Array.isArray(data) ? data : data.data || [];
      console.log("Types array:", typesArray);

      const enabledTypes = typesArray.filter((type) => {
        const status = type.status?.toLowerCase();
        return status === 'active' || status === 'enable';
      });

      console.log("Enabled service types:", enabledTypes);
      setServiceTypes(enabledTypes);

      if (enabledTypes.length === 0 && typesArray.length > 0) {
        console.log("No enabled types found, showing all types as fallback");
        setServiceTypes(typesArray);
      }
    } catch (error) {
      console.error("Error fetching service types:", error);
      setServiceTypes([]);
    }
  };

  const fetchPaymentModes = async () => {
    try {
      const data = await servicePaymentModeApi.getAll();
      setPaymentModes(data.filter((mode) => mode.status === "Enable"));
    } catch (error) {
      console.error("Error fetching payment modes:", error);
    }
  };

  const fetchTypeOfPayments = async () => {
    try {
      const data = await serviceTypeOfPaymentApi.getAll();
      setTypeOfPayments(data);
    } catch (error) {
      console.error("Error fetching type of payments:", error);
    }
  };

  const fetchPaymentTypes = async () => {
    try {
      const data = await paymentTypeApi.getAll();
      // Deduplicate by normalized name (case-insensitive) and keep only active
      const seen = new Set();
      const deduped = [];
      (data || []).forEach((pt) => {
        const key = (pt.name || '').toString().toLowerCase().trim();
        if (!seen.has(key) && pt.isActive) {
          seen.add(key);
          deduped.push(pt);
        }
      });
      setPaymentTypes(deduped);
    } catch (error) {
      console.error("Error fetching payment types:", error);
      setPaymentTypes([]);
    }
  };

  const fetchServiceTypeOfCollections = async () => {
    try {
      const data = await serviceTypeOfCollectionApi.getAll();
      setServiceTypeOfCollections(data.filter((type) => type.status === "Enable"));
    } catch (error) {
      console.error("Error fetching service type of collections:", error);
    }
  };

 const fetchVehicleModels = async () => {
  try {
    const data = await vehicleModelApi.getAll();
    const enabledModels = data.filter((model) => model.status === "Enable");
    setVehicleModels(enabledModels);
    console.log('Vehicle Models loaded:', enabledModels);
  } catch (error) {
    console.error("Error fetching vehicle models:", error);
  }
};

  const fetchPayments = async (page = currentPage) => {
  try {
    const response = await servicePaymentCollectionApi.getAll(page, itemsPerPage);
    if (!response || !Array.isArray(response.data)) {
      console.error('Invalid response format:', response);
      setPayments([]);
      setFilteredPayments([]);
      return;
    }
    const startIndex = (page - 1) * itemsPerPage;

    const formattedData = response.data.map((payment, index) => ({
      sNo: startIndex + index + 1,
      id: payment.id,
      date: payment.date,
      receiptNo: payment.receiptNo,
      custId: payment.customer.custId,
      name: payment.customer.name,
      contactNo: payment.customer.contactNo,
      address: payment.customer.address,
      totalAmt: payment.totalAmt !== undefined && payment.totalAmt !== null
        ? payment.totalAmt
        : payment.recAmt || "N/A",
      recAmt: payment.recAmt,
      paymentType: payment.paymentTypeMaster?.name || payment.paymentType,
      paymentTypeLabel: getPaymentTypeLabel(payment.paymentTypeMaster?.name || payment.paymentType),
      paymentStatus: payment.paymentStatus,
      vehicleNumber: payment.vehicleNumber || "N/A",
      paymentMode: payment.paymentMode.paymentMode,
      typeOfPayment: payment.typeOfPayment?.typeOfMode || "N/A",
      typeOfCollection: payment.serviceTypeOfCollection?.typeOfCollect || "N/A",
      vehicleModel: payment.vehicleModel?.model || "N/A",
      enteredBy: payment.user?.username || "N/A",
      refNo: payment.refNo || "N/A",
      remarks: payment.remarks || "N/A",
      jobCardNumber: payment.jobCardNumber || "N/A",
      serviceType: payment.serviceTypeRelation?.name || "N/A",
      paymentSessions: payment.paymentSessions || [],
      selectedParts: payment.selectedParts || [],
      customerId: payment.customerId,
      paymentModeId: payment.paymentModeId,
      typeOfPaymentId: payment.typeOfPaymentId,
      serviceTypeOfCollectionId: payment.serviceTypeOfCollectionId,
      vehicleModelId: payment.vehicleModelId,
      serviceTypeId: payment.serviceTypeId,
      cancelledAt: payment.cancelledAt,
      cancelledBy: payment.cancelledByUser?.username || null,
      hasAdditionalPlan: payment.hasAdditionalPlan || false,
      additionalPlanCollections: payment.additionalPlanCollections || [],
      additionalPlanAmount: payment.additionalPlanAmount || '',
      additionalPlanDetails: payment.additionalPlanDetails || {},
      additionalPlanCollectionId: payment.additionalPlanCollectionId || null,
    }));
    setPayments(formattedData);
    setFilteredPayments(formattedData);
    setTotalPages(response.totalPages);
    setCurrentPage(response.page);
    setTotalEntries(response.total);
  } catch (error) {
    console.error("Error fetching payments:", error);
    setPayments([]);
    setFilteredPayments([]);
  }
};

  const fetchDeletedPayments = async () => {
    try {
      const data = await servicePaymentCollectionApi.getDeleted();
      const formattedData = data.map((payment, index) => ({
        sNo: index + 1,
        id: payment.id,
        date: payment.date,
        receiptNo: payment.receiptNo,
        custId: payment.customer.custId,
        name: payment.customer.name,
        contactNo: payment.customer.contactNo,
        address: payment.customer.address,
        totalAmt: payment.totalAmt || "N/A",
        recAmt: payment.recAmt,
        paymentType: payment.paymentTypeMaster?.name || payment.paymentType,
        paymentTypeLabel: getPaymentTypeLabel(payment.paymentTypeMaster?.name || payment.paymentType),
        paymentStatus: payment.paymentStatus,
        vehicleNumber: payment.vehicleNumber || "N/A",
        paymentMode: payment.paymentMode.paymentMode,
        typeOfPayment: payment.typeOfPayment?.typeOfMode || "N/A",
        typeOfCollection: payment.serviceTypeOfCollection?.typeOfCollect || "N/A",
        vehicleModel: payment.vehicleModel?.model || "N/A",
        enteredBy: payment.user?.username || "N/A",
        deletedBy: payment.deletedByUser?.username || "N/A",
        deletedAt: new Date(payment.deletedAt).toLocaleDateString('en-GB'),
        refNo: payment.refNo || "N/A",
        remarks: payment.remarks || "N/A",
        jobCardNumber: payment.jobCardNumber || "N/A",
        invoiceNumber: payment.invoiceNumber || undefined,
        totalInvoiceAmount: payment.totalInvoiceAmount !== undefined ? payment.totalInvoiceAmount : undefined,
        serviceType: payment.serviceTypeRelation?.name || "N/A",
        paymentSessions: payment.paymentSessions || [],
        customerId: payment.customerId,
        paymentModeId: payment.paymentModeId,
        typeOfPaymentId: payment.typeOfPaymentId,
        serviceTypeOfCollectionId: payment.serviceTypeOfCollectionId,
        vehicleModelId: payment.vehicleModelId,
        serviceTypeId: payment.serviceTypeId,
      }));
      setDeletedPayments(formattedData);
    } catch (error) {
      console.error("Error fetching deleted payments:", error);
    }
  };

  const handleLoadCustomer = () => {
    if (selectedCustomerId === "new") {
      setIsNewCustomer(true);
      setLoadedCustomer(null);
      setFilteredPayments(payments);
    } else if (selectedCustomerId) {
      const customer = customers.find(
        (c) => c.id === parseInt(selectedCustomerId)
      );
      setLoadedCustomer(customer || null);
      setIsNewCustomer(false);
      const customerPayments = payments.filter(
        (payment) => payment.customerId === parseInt(selectedCustomerId)
      );
      setFilteredPayments(
        customerPayments.map((payment, index) => ({
          ...payment,
          sNo: index + 1,
        }))
      );
    } else {
      setLoadedCustomer(null);
      setIsNewCustomer(false);
      setFilteredPayments(payments);
    }
  };

  const handlePaymentStatusChange = (e) => {
    const newStatus = e.target.value;
    let newPaymentType = formData.paymentType;
    let newPaymentTypeId = formData.paymentTypeId;
    
    if (normalizedPaymentType === "part payment" && newStatus === "completed") {
      newPaymentType = "full payment";
      const fullType = paymentTypes.find(pt => pt.name?.toString().toLowerCase().trim() === 'full payment');
      newPaymentTypeId = fullType ? String(fullType.id) : "";
      toast.success("Payment type will be changed to Full Payment", { duration: 3000 });
    }
    
    setFormData({ 
      ...formData, 
      paymentStatus: newStatus,
      paymentType: newPaymentType,
      paymentTypeId: newPaymentTypeId
    });
  };


// Function to check and update job card status after payment
const checkAndUpdateJobCardStatus = async (jobCardNumber, customerId, paymentType = 'full') => {
  if (!jobCardNumber || jobCardNumber === "N/A") return;

  try {
    // Get all job cards
    const allJobCards = await serviceJobCardApi.getAll();
    const jobCard = allJobCards.find(jc => jc.jobCardNumber === jobCardNumber);

    if (!jobCard) return;
    
    // For advance payment, just update the advance amount
    if (paymentType === 'advance') {
      const updatedJobCard = {
        ...jobCard,
        advanceAmount: (jobCard.advanceAmount || 0) + parseFloat(formData.recAmt),
        advancePaymentDate: formData.date,
        status: jobCard.status === 'Pending' ? 'Advance Received' : jobCard.status
      };
      await serviceJobCardApi.update(jobCard.id, updatedJobCard);
      console.log('Advance payment recorded for job card:', jobCardNumber);
      return;
    }
    
    // Check if already closed (for full payment)
    if (isJobCardClosed(jobCard.status)) {
      console.log('Job card already closed:', jobCard.status);
      return;
    }

    const invoiceAmount = jobCard.totalRevenue || 0;
    if (invoiceAmount <= 0) return;

    // Get all completed payments for this job card
    const response = await servicePaymentCollectionApi.getAll(1, 1000, customerId);
    const payments = response.data || [];
    
    const totalPaid = payments
      .filter(p => p.jobCardNumber === jobCardNumber && p.paymentStatus === 'completed')
      .reduce((sum, p) => sum + (parseFloat(p.recAmt) || 0), 0);

    console.log('Job Card Check:', { jobCardNumber, invoiceAmount, totalPaid });

    // If total paid meets or exceeds invoice amount, close the job card
    const isEffectivelyPaid = (totalPaid >= invoiceAmount) || (invoiceAmount - totalPaid <= CLOSING_TOLERANCE_RUPEES);
    if (isEffectivelyPaid) {
      await serviceJobCardApi.update(jobCard.id, {
        ...jobCard,
        status: 'Closed'
      });
      console.log('Job card closed successfully');
      toast.success(`Job Card ${jobCardNumber} has been closed automatically. Full payment received.`);
      
      // Refresh the displayed job card info
      const refreshed = await serviceJobCardApi.getAll();
      const updated = refreshed.find(jc => jc.jobCardNumber === jobCardNumber);
      if (updated) {
        setServiceJobCardInfo(updated);
        setFoundJobCard(updated);
        fetchCustomers();
      }
    }
  } catch (error) {
    console.error("Error updating job card status:", error);
  }
};

const refreshJobCardStatus = async (jobCardNumber) => {
  if (!jobCardNumber) return;
  
  try {
    console.log('Refreshing job card status for:', jobCardNumber);
    const allJobCards = await serviceJobCardApi.getAll();
    const updatedJobCard = allJobCards.find(jc => jc.jobCardNumber === jobCardNumber);
    
    if (updatedJobCard) {
      console.log('Refreshed job card:', {
        number: updatedJobCard.jobCardNumber,
        status: updatedJobCard.status,
        totalRevenue: updatedJobCard.totalRevenue
      });
      
      // Force update both states
      setServiceJobCardInfo(updatedJobCard);
      setFoundJobCard(updatedJobCard);
      
      // Also update the form data if the job card is closed to clear it
      if (updatedJobCard.status === 'Closed') {
        setFormData(prev => ({ ...prev, jobCardNumber: "" }));
        toast.success(`Job Card ${jobCardNumber} is now CLOSED. Full payment received.`);
        fetchPayments(1);
        fetchCustomers();
      }
    }
  } catch (error) {
    console.error('Error refreshing job card status:', error);
  }
};

const handleSubmit = async (e) => {
  e.preventDefault();

  // Validate new customer mobile number
  if (isNewCustomer && !/^\d{10}$/.test(newCustomerData.contactNo)) {
    toast.error("Mobile number must be exactly 10 digits");
    return;
  }

  // Validate vehicle number for part payment
  if (normalizedPaymentType === "part payment" && !formData.vehicleNumber) {
    toast.error("Vehicle number is mandatory for part payment");
    return;
  }

// Validate job card number for full payment OR advance payment (if converting to full)
if (requiresJobCard && !formData.jobCardNumber) {
  toast.error(`Job card number is required for ${formData.paymentType}`);
  return;
}

if (formData.hasAdditionalPlan && (!formData.additionalPlanCollectionIds || formData.additionalPlanCollectionIds.length === 0)) {
  toast.error("Please select at least one Additional Service Plan (e.g. AMC, EW, RSA)");
  return;
}

// Validate additional plan amounts if plans are selected
if (formData.hasAdditionalPlan && formData.additionalPlanCollectionIds && formData.additionalPlanCollectionIds.length > 0) {
  const missingAmounts = formData.additionalPlanCollectionIds.some(id => !formData.additionalPlanAmounts || !formData.additionalPlanAmounts[id]);
  if (missingAmounts) {
    toast.error("Please enter the amount for all selected Additional Service Plans");
    return;
  }
}

// Validate Advance Payment has either Job Card or Parts
if (isAdvancePaymentMode && normalizedPaymentType === "advance payment") {
  if (!formData.jobCardNumber && selectedParts.length === 0) {
    toast.error("For Advance Payment: Please provide either a Job Card Number or select parts");
    return;
  }
}

  const selectedMode = paymentModes.find(m => m.id === parseInt(formData.paymentModeId));
  const isPineLabs = selectedMode && (selectedMode.paymentMode.toLowerCase().includes('pos') || selectedMode.paymentMode.toLowerCase().includes('pine'));

  if (isPineLabs && !pineLabsTxnId && !isEditMode) {
    setIsPineLabsModalOpen(true);
    return;
  }

  setIsSubmitting(true);
  try {
    let customerId = loadedCustomer?.id;

    // Create new customer if needed
    if (isNewCustomer) {
      const newCustomer = await customerApi.create(newCustomerData);
      customerId = newCustomer.id;
      await fetchCustomers();
    }

    // Handle job card creation - for BOTH full payment AND advance payment
let finalJobCardNumber = formData.jobCardNumber;
let createdJobCardId = null;

if ((normalizedPaymentType === "full payment" || normalizedPaymentType === "advance payment") && formData.jobCardNumber) {
  try {
    const allJobCards = await serviceJobCardApi.getAll();
    const existingJobCard = allJobCards.find(jc => jc.jobCardNumber === formData.jobCardNumber);
    
    if (existingJobCard) {
      finalJobCardNumber = existingJobCard.jobCardNumber;
      createdJobCardId = existingJobCard.id;
      
      // For advance payment, update the job card to show advance received
      if (normalizedPaymentType === "advance payment") {

        toast.success(`Advance payment recorded for job card ${finalJobCardNumber}`);
      }
    } else {
      // Create new job card for both full and advance payment
      const newJobCardData = {
        jobCardNumber: formData.jobCardNumber,
        registrationNumber: formData.vehicleNumber || '',
        customerName: loadedCustomer?.name || newCustomerData.name,
        mobileNumber: loadedCustomer?.contactNo || newCustomerData.contactNo,
        vehicleDetails: vehicleModels.find(v => v.id.toString() === formData.vehicleModelId)?.model || '',
        serviceType: serviceTypes.find(s => s.id.toString() === formData.serviceTypeId)?.name || '',
        status: normalizedPaymentType === "advance payment" ? 'Advance Received' : 'Pending'
      };
      
      // Add advance payment fields if applicable
      if (normalizedPaymentType === "advance payment") {
        newJobCardData.advanceAmount = parseFloat(formData.recAmt);
        newJobCardData.advancePaymentDate = formData.date;
      }
      
      const newJobCard = await serviceJobCardApi.create(newJobCardData);
      finalJobCardNumber = newJobCard.jobCardNumber;
      createdJobCardId = newJobCard.id;
      toast.success(`New job card created successfully for ${formData.paymentType}!`);
      fetchCustomers();
    }
  } catch (error) {
    toast.error('Failed to process job card: ' + error.message);
    setIsSubmitting(false);
    return;
  }
}
    // Resolve master by name first to avoid stale paymentTypeId mismatches, then by id.
    const normalizedTypeName = (formData.paymentType || '').toString().toLowerCase().trim();
    const matchedByName = paymentTypes.find(pt => pt.name?.toString().toLowerCase().trim() === normalizedTypeName);
    const matchedById = paymentTypes.find(pt => pt.id === (formData.paymentTypeId ? parseInt(formData.paymentTypeId) : undefined));
    const master = matchedByName || matchedById;
    const submitData = { // Construct submitData based on the new logic
      date: formData.date,
      customerId: customerId,
      recAmt: parseFloat(formData.recAmt),
      paymentType: master ? master.name : formData.paymentType,
      paymentTypeId: master ? master.id : (formData.paymentTypeId ? parseInt(formData.paymentTypeId) : undefined),
      paymentStatus: formData.paymentStatus,
      vehicleNumber: formData.vehicleNumber || undefined,
      paymentModeId: parseInt(formData.paymentModeId),
      typeOfPaymentId: formData.typeOfPaymentId ? parseInt(formData.typeOfPaymentId) : undefined,
      serviceTypeOfCollectionId: formData.serviceTypeOfCollectionId ? parseInt(formData.serviceTypeOfCollectionId) : undefined,
      vehicleModelId: formData.vehicleModelId ? parseInt(formData.vehicleModelId) : undefined,
      enteredBy: user?.id,
      refNo: formData.refNo,
      remarks: formData.remarks,
      jobCardNumber: finalJobCardNumber,
      serviceTypeId: formData.serviceTypeId ? parseInt(formData.serviceTypeId) : undefined,
      selectedParts: selectedParts,
      pineLabsTxnId: pineLabsTxnId,
      hasAdditionalPlan: formData.hasAdditionalPlan,
      additionalPlanCollectionIds: formData.additionalPlanCollectionIds && formData.additionalPlanCollectionIds.length > 0 ? formData.additionalPlanCollectionIds.map(id => parseInt(id)) : undefined,
      additionalPlanAmount: formData.hasAdditionalPlan ? (formData.additionalPlanCollectionIds || []).reduce((sum, id) => sum + (parseFloat((formData.additionalPlanAmounts || {})[id]) || 0), 0) : undefined,
      additionalPlanDetails: formData.hasAdditionalPlan ? Object.fromEntries(Object.entries(formData.additionalPlanAmounts || {}).filter(([k]) => (formData.additionalPlanCollectionIds || []).includes(k))) : undefined,
    };

    // FIRST: Create or update payment
    if (isEditMode) { // If in edit mode, update existing payment
      await servicePaymentCollectionApi.update(editingPayment.id, submitData);
      toast.success("Service payment updated successfully!");
    } else {
      await servicePaymentCollectionApi.create(submitData);
      toast.success("Service payment created successfully!");
    }

  // SECOND: After payment is created, check and update job card status for BOTH full and advance payment (if applicable)
if (finalJobCardNumber) {
  // For advance payment, we already updated the job card above, but we still want to refresh
  if (normalizedPaymentType === "advance payment") {
    setTimeout(async () => {
      await refreshJobCardStatus(finalJobCardNumber);
    }, 1500);
  } else {
    // For full payment, check if total payments meet invoice amount and close job card if needed
    await checkAndUpdateJobCardStatus(finalJobCardNumber, customerId);
    setTimeout(async () => {
      await refreshJobCardStatus(finalJobCardNumber);
    }, 1500);
  }

    // If a part payment was marked completed, update previous payments in the client state
    // but do NOT auto-complete full payments - let user manually change status
    if (normalizedPaymentType === "part payment" && formData.paymentStatus === "completed") {
      try {
        setPayments(prev => prev.map(p => {
          const matchesJob = finalJobCardNumber && p.jobCardNumber === finalJobCardNumber;
          const matchesVehicle = formData.vehicleNumber && p.vehicleNumber === formData.vehicleNumber;
          if (matchesJob || matchesVehicle) {
            return {
              ...p,
              paymentStatus: 'completed'
            };
          }
          return p;
        }));

        setFilteredPayments(prev => prev.map(p => {
          const matchesJob = finalJobCardNumber && p.jobCardNumber === finalJobCardNumber;
          const matchesVehicle = formData.vehicleNumber && p.vehicleNumber === formData.vehicleNumber;
          if (matchesJob || matchesVehicle) {
            return {
              ...p,
              paymentStatus: 'completed'
            };
          }
          return p;
        }));

        setPendingPayments([]);
        setCustomerHistory(prev => (prev || []).map(p => {
          const matchesJob = finalJobCardNumber && p.jobCardNumber === finalJobCardNumber;
          const matchesVehicle = formData.vehicleNumber && p.vehicleNumber === formData.vehicleNumber;
          if (matchesJob || matchesVehicle) return { ...p, paymentStatus: 'completed' };
          return p;
        }));
      } catch (err) {
        console.error('Error updating client-side payment statuses:', err);
      }
    }
}

    // Reset all form states
    setIsPaymentModalOpen(false);
    setIsEditMode(false);
    setEditingPayment(null);
    setIsNewCustomer(false);
    setCustomerHistory([]);
    setPendingPayments([]);
    setSelectedParts([]);
    setIsManualJobCard(false);
    setFoundJobCard(null);
    setPineLabsTxnId(null);
    setManualJobCardData({
      jobCardNumber: '',
      registrationNumber: '',
      customerName: '',
      mobileNumber: '',
      vehicleDetails: '',
      serviceType: ''
    });

    // Reset form data
    setFormData({
      date: new Date().toISOString().split("T")[0],
      totalAmt: "",
      recAmt: "",
      paymentType: "full payment",
      paymentStatus: "pending",
      vehicleNumber: "",
      paymentModeId: "",
      typeOfPaymentId: "",
      serviceTypeOfCollectionId: "",
      vehicleModelId: "",
      refNo: "",
      remarks: "",
      jobCardNumber: "",
      serviceType: "",
      serviceTypeId: "",
      hasAdditionalPlan: false,
      additionalPlanCollectionIds: [],
      additionalPlanAmount: "",
      additionalPlanAmounts: {}
    });

    // Reset customer data
    setNewCustomerData({
      name: "",
      contactNo: "",
      address: "",
      status: "Walk in Customer",
    });

    // Reset selections
    setLoadedCustomer(null);
    setSelectedCustomerId("");
    setSalesInvoiceInfo(null);
    setSearchTerm("");
    setPartSearchTerm("");

    // Refresh payments list
    fetchPayments(1);
    setCurrentPage(1);
    if (showDeleted) fetchDeletedPayments();
    
  } catch (error) {
    toast.error("Error saving service payment");
    console.error("Error saving service payment:", error);
  } finally {
    setIsSubmitting(false);
  }
};
  
const fetchCustomerPayments = (customerId, paymentType, jobCardNumber, vehicleNumber) => { // Refactored to use paymentType string
  if (!customerId) {
    setPendingPayments([]);
    return;
  }

  // Filter out cancelled payments for calculating totals for the current customer
  const customerPayments = payments.filter((p) => p.customerId === customerId && !p.cancelledAt);

  if (jobCardNumber && jobCardNumber !== 'N/A') {
    // If job card is provided, show payments for this job card 
    // AND pending payments for this vehicle (linking them to this job card session)
    setPendingPayments(customerPayments.filter(p => 
      p.jobCardNumber === jobCardNumber || 
      (vehicleNumber && p.vehicleNumber === vehicleNumber && p.paymentStatus === 'pending')
    ));
  } else if (vehicleNumber) {
    // No job card yet, show pending payments for this vehicle
    setPendingPayments(customerPayments.filter(p => 
      p.vehicleNumber === vehicleNumber && p.paymentStatus === 'pending'
    ));
  } else {
    setPendingPayments([]);
  }
};

useEffect(() => {
  if (serviceJobCardInfo && loadedCustomer) {
    fetchCustomerPayments(
      loadedCustomer.id,
      formData.paymentType,
      serviceJobCardInfo.jobCardNumber,
      serviceJobCardInfo.registrationNumber || formData.vehicleNumber
    );
  }
}, [serviceJobCardInfo, loadedCustomer, payments, formData.paymentType, formData.vehicleNumber]);

useEffect(() => { // This useEffect now correctly uses formData.paymentType for fetchCustomerPayments
  const fetchHistory = async () => {
    if (loadedCustomer) {
      try {
        const response = await servicePaymentCollectionApi.getAll(1, 1000, loadedCustomer.id);
        const historyData = response.data || [];
        setCustomerHistory(historyData);
        
        // Ensure pending payments is updated with the full history
        const validHistory = historyData.filter((p) => String(p.customerId) === String(loadedCustomer.id) && !p.cancelledAt);
        const jcNo = formData.jobCardNumber || (serviceJobCardInfo ? serviceJobCardInfo.jobCardNumber : null);
        const vNo = formData.vehicleNumber || (serviceJobCardInfo ? serviceJobCardInfo.registrationNumber : null);
        
        if (jcNo && jcNo !== 'N/A') {
          setPendingPayments(validHistory.filter(p => 
            p.jobCardNumber === jcNo || 
            (vNo && p.vehicleNumber === vNo && p.paymentStatus === 'pending')
          ));
        } else if (vNo) {
          setPendingPayments(validHistory.filter(p => 
            p.vehicleNumber === vNo && p.paymentStatus === 'pending'
          ));
        }
      } catch (error) {
        console.error("Error fetching customer history:", error);
      }
    }
  };
  fetchHistory();

  if (isPaymentModalOpen && !isEditMode && loadedCustomer) { // Ensure fetchCustomerPayments uses the correct paymentType from formData
    fetchCustomerPayments(loadedCustomer.id, formData.paymentType, formData.jobCardNumber, formData.vehicleNumber);
  }
}, [isPaymentModalOpen, formData.paymentType, loadedCustomer, payments, formData.jobCardNumber, formData.vehicleNumber]);

  // Add this useEffect to refresh job card status when modal opens
useEffect(() => {
  const refreshJobCardOnModalOpen = async () => {
    if (isPaymentModalOpen && formData.jobCardNumber) {
      try {
        const allJobCards = await serviceJobCardApi.getAll();
        const latestJobCard = allJobCards.find(jc => jc.jobCardNumber === formData.jobCardNumber);
        if (latestJobCard && latestJobCard.status !== serviceJobCardInfo?.status) {
          console.log('Job card status changed, updating UI:', latestJobCard.status);
          setServiceJobCardInfo(latestJobCard);
          setFoundJobCard(latestJobCard);
        }
      } catch (error) {
        console.error('Error refreshing job card on modal open:', error);
      }
    }
  };
  
  refreshJobCardOnModalOpen();
}, [isPaymentModalOpen, formData.jobCardNumber]);
  const handleOpenNewPayment = () => {
    setIsEditMode(false);
    
    let defaultType = 'full payment';
    let defaultTypeId = '';
    
    if (isFullPaymentMode) {
      const fullType = paymentTypes.find(pt => pt.name?.toString().toLowerCase().includes('full'));
      defaultType = 'full payment';
      defaultTypeId = fullType ? String(fullType.id) : '';
    } else if (isAdvancePaymentMode) {
      const advanceType = paymentTypes.find(pt => pt.name?.toString().toLowerCase().includes('advance'));
      defaultType = 'advance payment';
      defaultTypeId = advanceType ? String(advanceType.id) : '';
    } else if (isXyzPaymentMode) {
      const planType = paymentTypes.find(pt => pt.name?.toString().toLowerCase().includes('service plan'));
      defaultType = 'service plan payment';
      defaultTypeId = planType ? String(planType.id) : '';
    }

    setFormData(prev => ({
      ...prev,
      paymentType: defaultType,
      paymentTypeId: defaultTypeId,
      hasAdditionalPlan: false,
      additionalPlanCollectionIds: [],
      additionalPlanAmount: "",
      additionalPlanAmounts: {}
    }));
    
    setIsPaymentModalOpen(true);
  };

  const handleEdit = (payment) => {
    setIsEditMode(true);
    setEditingPayment(payment);
    const customer = customers.find((c) => c.id === payment.customerId);
    setLoadedCustomer(customer);
    setSelectedCustomerId(customer.id.toString()); // Set selected customer ID
    const canonicalType = mapMasterNameToKey(payment.paymentType);
    const matchedMaster = paymentTypes.find(pt => pt.id === payment.paymentTypeId || pt.name === payment.paymentType);
    setFormData({
      date: new Date(payment.date).toISOString().split("T")[0],
      totalAmt: payment.totalAmt?.toString() || "",
      recAmt: payment.recAmt.toString(),
      hasAdditionalPlan: payment.hasAdditionalPlan || false,
      additionalPlanCollectionIds: payment.additionalPlanCollections ? payment.additionalPlanCollections.map(c => String(c.id)) : (payment.additionalPlanCollectionId ? [String(payment.additionalPlanCollectionId)] : []),
      additionalPlanAmount: payment.additionalPlanAmount?.toString() || "",
      additionalPlanAmounts: payment.additionalPlanDetails || {},
      paymentType: canonicalType || payment.paymentType,
      paymentStatus: payment.paymentStatus,
      paymentTypeId: matchedMaster ? matchedMaster.id : (payment.paymentTypeId || ""),
      vehicleNumber: payment.vehicleNumber || "",
      paymentModeId: payment.paymentModeId.toString(),
      typeOfPaymentId: payment.typeOfPaymentId?.toString() || "",
      serviceTypeOfCollectionId: payment.serviceTypeOfCollectionId?.toString() || "",
      vehicleModelId: payment.vehicleModelId?.toString() || "",
      refNo: payment.refNo || "",
      remarks: payment.remarks,
      jobCardNumber: payment.jobCardNumber || "",
      serviceType: payment.serviceType || "N/A",
      serviceTypeId: payment.serviceTypeId?.toString() || "",
    });
    setIsPaymentModalOpen(true);
  };

  const handleDelete = async () => {
    try {
      await servicePaymentCollectionApi.delete(paymentToDelete.id, user?.id);
      toast.success("Service payment deleted successfully!");
      setIsDeleteModalOpen(false);
      setPaymentToDelete(null);
      fetchPayments(1);
      setCurrentPage(1);
      fetchDeletedPayments();
    } catch (error) {
      toast.error("Error deleting service payment");
      console.error("Error deleting service payment:", error);
    }
  };

  const handleRestore = async (payment) => {
    try {
      await servicePaymentCollectionApi.restore(payment.id);
      toast.success("Service payment restored successfully!");
      fetchPayments(1);
      setCurrentPage(1);
      fetchDeletedPayments();
    } catch (error) {
      toast.error("Error restoring service payment");
      console.error("Error restoring service payment:", error);
    }
  };

  const handleCancel = async () => {
    if (!paymentToCancel?.id) {
      toast.error("Invalid payment selected");
      return;
    }
    try {
      await servicePaymentCollectionApi.cancel(paymentToCancel.id, user?.id);
      toast.success("Service payment cancelled successfully!");
      setIsCancelModalOpen(false);
      setPaymentToCancel(null);
      fetchPayments(currentPage);
    } catch (error) {
      toast.error("Error cancelling service payment");
      console.error("Error cancelling service payment:", error);
    }
  };

  const handleClearAll = async () => {
    try {
      await servicePaymentCollectionApi.clearAll();
      toast.success('All records cleared');
      setIsClearModalOpen(false);
      setPayments([]);
      setFilteredPayments([]);
      fetchPayments(1);
    } catch {
      toast.error('Error clearing records');
    }
  };

  const filteredTypeOfPayments = typeOfPayments.filter(
    (type) =>
      !formData.paymentModeId ||
      type.paymentModeId === parseInt(formData.paymentModeId)
  );

  const normalizedSearch = searchTerm.toString().trim().toLowerCase();
  const filteredCustomers = customers.filter((customer) => {
    const jobCardNumbers = [
      customer.jobCardData?.jobCardNumber,
      customer.activeJobCard?.jobCardNumber,
      customer.closedJobCard?.jobCardNumber
    ]
      .filter(Boolean)
      .map((jc) => jc.toString().toLowerCase());

    const vehicleRegNos = [
      customer.jobCardData?.registrationNumber,
      customer.activeJobCard?.registrationNumber,
      customer.closedJobCard?.registrationNumber,
      customer.invoiceData?.vehicleRegNo
    ]
      .filter(Boolean)
      .map((reg) => reg.toString().toLowerCase());

    return (
      customer.name.toLowerCase().includes(normalizedSearch) ||
      (customer.contactNo && customer.contactNo.includes(searchTerm)) ||
      jobCardNumbers.some((jcNumber) => jcNumber.includes(normalizedSearch)) ||
      vehicleRegNos.some((regNumber) => regNumber.includes(normalizedSearch))
    );
  });


  const numberToWords = (num) => {
    const ones = [
      "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
      "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
      "Seventeen", "Eighteen", "Nineteen",
    ];
    const tens = [
      "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety",
    ];

    if (num === 0) return "Zero";
    if (num < 20) return ones[num];
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? " " + ones[num % 10] : "");
    if (num < 1000) return ones[Math.floor(num / 100)] + " Hundred" + (num % 100 ? " " + numberToWords(num % 100) : "");
    if (num < 100000) return numberToWords(Math.floor(num / 1000)) + " Thousand" + (num % 1000 ? " " + numberToWords(num % 1000) : "");
    if (num < 10000000) return numberToWords(Math.floor(num / 100000)) + " Lakh" + (num % 100000 ? " " + numberToWords(num % 100000) : "");
    return numberToWords(Math.floor(num / 10000000)) + " Crore" + (num % 10000000 ? " " + numberToWords(num % 10000000) : "");
  };

  const handlePrint = (payment) => {
    const currentUser = user;
    const printDate = new Date();
    const formattedDate = `${printDate.getDate().toString().padStart(2, "0")}-${(printDate.getMonth() + 1).toString().padStart(2, "0")}-${printDate.getFullYear()} ${printDate.toLocaleTimeString("en-US", { hour12: true })}`;

    const amountInWords = numberToWords(parseInt(payment.recAmt)) + " Rupees Only.";

    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = 120;
      canvas.height = 90;
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, 120, 90);
      const logoDataUrl = canvas.toDataURL("image/png");

      const printContent = `
        <div style="width: 210mm; height: 297mm; font-family: Arial, sans-serif; font-size: 15px; padding: 20px; box-sizing: border-box;">
          <div style="border: 1px solid #000; padding: 20px; height: 100%; box-sizing: border-box;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 20px;">
              <div style="flex: 1;">
                <h3 style="margin: 0; font-size: 26px; font-weight: bold; margin-bottom: 12px;">ANANDA MOTOWINGS PRIVATE LIMITED</h3>
                <p style="margin: 0; font-size: 15px; line-height: 1.6;">Sy no, 53/2 and 53/3, Carvan Compound, Hosur Road, 6th Mile,<br>Near Silk board Junction, Bomannahalli, Bengaluru,<br>Bengaluru Urban, Karnataka, 560068<br><strong>Contact No :</strong> +919071755550<br><strong>GSTIN:</strong> 29ABBCA7185M1Z2</p>
              </div>
              <div style="margin-left: 20px;">
                <img src="${logoDataUrl}" alt="Honda Logo" style="width: 110px; height: 82px;" />
              </div>
            </div>
            <div style="text-align: center; color: #000; background: white; padding: 12px; margin-bottom: 20px; font-size: 22px; border: 2px solid #000;">
              <strong>SERVICE RECEIPT</strong>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; font-size: 15px;">
              <div><strong>Customer ID:</strong> ${payment.custId}</div>
              <div><strong>Date:</strong> ${new Date(payment.date).toLocaleDateString("en-GB")}</div>
              <div><strong>To:</strong> ${payment.name}</div>
              <div><strong>Receipt No:</strong> ${payment.receiptNo}</div>
              <div><strong>Address:</strong> ${payment.address || "N/A"}</div>
              <div><strong>Payment Towards:</strong> ${payment.typeOfCollection || "N/A"}</div>
              <div><strong>Mobile No:</strong> ${payment.contactNo}</div>
              <div><strong>Vehicle Model:</strong> ${payment.vehicleModel || "N/A"}</div>
              <div><strong>Job Card Number:</strong> ${payment.jobCardNumber || "N/A"}</div>
            </div>
            <p style="margin: 20px 0; font-size: 15px;">We thankfully acknowledge the receipt of your payment towards for Collection - ${payment.typeOfCollection || "N/A"}</p>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 15px;">
              <tr>
                <td style="border: 1px solid #000; padding: 8px; font-weight: bold; width: 40%;">Received Amount:</td>
                <td style="border: 1px solid #000; padding: 8px; width: 60%;"><strong>₹${payment.recAmt}</strong> <span style="font-weight: normal; margin-left: 8px;">${amountInWords}</span></td>
              </tr>
              ${payment.hasAdditionalPlan ? `
              ${payment.additionalPlanCollections && payment.additionalPlanCollections.length > 0 ? 
                `<tr>
                  <td style="border: 1px solid #000; padding: 8px; font-weight: bold; vertical-align: top;">Additional Service Plans:</td>
                  <td style="border: 1px solid #000; padding: 8px;">
                    <div style="display: flex; flex-direction: column; gap: 3px;">
                      ${payment.additionalPlanCollections.map(c => `
                        <div>${payment.additionalPlanCollections.length > 1 ? '• ' : ''}${c.typeOfCollect}: <strong>₹${(payment.additionalPlanDetails && payment.additionalPlanDetails[c.id]) || "0"}</strong></div>
                      `).join('')}
                    </div>
                  </td>
                </tr>`
              : payment.additionalPlanCollectionId ? `
                <tr>
                  <td style="border: 1px solid #000; padding: 8px; font-weight: bold;">Additional Service Plan:</td>
                  <td style="border: 1px solid #000; padding: 8px;">
                    ${(() => {
                      const coll = serviceTypeOfCollections.find(c => String(c.id) === String(payment.additionalPlanCollectionId));
                      return coll ? coll.typeOfCollect : "N/A";
                    })()} - <strong>₹${payment.additionalPlanAmount || "0"}</strong>
                  </td>
                </tr>
              ` : ''}
              ` : ''}
              <tr>
                <td style="border: 1px solid #000; padding: 8px; font-weight: bold; vertical-align: top;">Remarks:</td>
                <td style="border: 1px solid #000; padding: 8px;">${payment.remarks || "N/A"}</td>
              </tr>
            </table>
            <div style="display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 15px;">
              <div><strong>Mode Of Payment:</strong> ${payment.paymentMode}</div>
              <div><strong>Customer Opting ${payment.paymentMode}</strong></div>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 15px;">
              <div><strong>Ref No:</strong> ${payment.refNo || "N/A"}</div>
              <div>${payment.typeOfPayment || "N/A"}</div>
            </div>
            <div style="border: 1px solid #000; padding: 12px; margin-bottom: 25px; font-size: 13px;">
              <div>Issued Subject to Realisation of Cheque.</div>
              <div>Price ruling at the time of delivery will be charged.</div>
              <div>Any refund through cheques only within 25 working days.</div>
              <div>Subject To BANGALORE Jurisdiction.</div>
            </div>
            <div style="text-align: right; margin-bottom: 25px; margin-top: 15px; font-size: 15px;">
              <strong>Received and Verified By</strong>
            </div>
            <div style="text-align: right; margin-bottom: 15px;">
              <div style="margin-top: 50px; font-size: 15px;"><strong>Authorised Signatory with Seal</strong></div>
            </div>
            <div style="font-size: 11px; text-align: center; border-top: 1px solid #000; padding-top: 12px; margin-top: 20px;">
              <strong>Entered by:</strong> ${payment.enteredBy} &nbsp;&nbsp; <strong>Printed by:</strong> ${currentUser?.username || "N/A"} &nbsp;&nbsp; <strong>Printed on:</strong> ${formattedDate}
            </div>
          </div>
        </div>
      `;

      const printWindow = window.open("", "_blank");
      printWindow.document.write(`
        <html>
          <head>
            <title>Service Payment Receipt - ${payment.receiptNo}</title>
            <style>
              @page { size: A4; margin: 0; }
              body { margin: 0; padding: 0; }
            </style>
          </head>
          <body>
            ${printContent}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    };

    img.src = hondaLogo;
  };

  const columns = showDeleted ? [
    { header: "SNo", accessor: "sNo" },
    {
      header: "Date",
      accessor: "date",
      render: (value) => {
        const date = new Date(value);
        return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}`;
      }
    },
    { header: "ReceiptNo", accessor: "receiptNo" },
    { header: "CustId", accessor: "custId" },
    { header: "Name", accessor: "name" },
    { header: "Amount", accessor: "recAmt" },
    { header: "PaymentMode", accessor: "paymentMode" },
    { header: "Job Card No", accessor: "jobCardNumber" },

    { header: "Deleted By", accessor: "deletedBy" },
    { header: "Deleted At", accessor: "deletedAt" },
  ] : [
    { header: "SNo", accessor: "sNo" },
    {
      header: "Date",
      accessor: "date",
      render: (value) => {
        const date = new Date(value);
        return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}`;
      }
    },
    { header: "ReceiptNo", accessor: "receiptNo" },
    { header: "Job Card No", accessor: "jobCardNumber" },
    { header: "CustId", accessor: "custId" },
    { header: "Name", accessor: "name" },
    { header: "Contact No", accessor: "contactNo" },
    { header: "Payment Type", accessor: "paymentTypeLabel" },
    { 
      header: "Status", 
      accessor: "paymentStatus",
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
          value?.toLowerCase() === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
        }`}>
          {value}
        </span>
      )
    },
    { header: "Vehicle No", accessor: "vehicleNumber" },
    { 
      header: "Total Amt", 
      accessor: "totalAmt",
      render: (value, row) => {
        if (row.jobCardNumber && row.jobCardNumber !== 'N/A') {
          const customer = customers.find(c => c.id === row.customerId);
          if (customer) {
            const jc = customer.activeJobCard?.jobCardNumber === row.jobCardNumber ? customer.activeJobCard :
                       customer.closedJobCard?.jobCardNumber === row.jobCardNumber ? customer.closedJobCard :
                       customer.jobCardData?.jobCardNumber === row.jobCardNumber ? customer.jobCardData : null;
            if (jc && jc.totalRevenue !== undefined && jc.totalRevenue !== null && parseFloat(jc.totalRevenue) > 0) {
               return jc.totalRevenue;
            }
          }
          if (serviceJobCardInfo && serviceJobCardInfo.jobCardNumber === row.jobCardNumber && parseFloat(serviceJobCardInfo.totalRevenue) > 0) {
             return serviceJobCardInfo.totalRevenue;
          }
        }
        return value;
      }
    },
    { 
      header: "Received Amt", 
      accessor: "recAmt",
      render: (value) => (
        <span className="text-green-600 font-bold">
          {value}
        </span>
      )
    },
    {
      header: "Pending Amt",
      accessor: "pendingAmount",
      render: (value, row) => {
        let balance = 0;
        if (row.jobCardNumber && row.jobCardNumber !== 'N/A') {
          // Calculate pending for job card: sum all payments for this job card - invoice amount
          const jobCardPayments = payments.filter(p => p.jobCardNumber === row.jobCardNumber && p.customerId === row.customerId && !p.cancelledAt);
          const totalReceivedForJobCard = jobCardPayments.reduce((sum, p) => sum + (parseFloat(p.recAmt) || 0), 0);
          
          let invoiceAmount = parseFloat(row.totalAmt) || 0;
          
          // Find the job card to get actual invoice amount
          const customer = customers.find(c => c.id === row.customerId);
          if (customer) {
            const jc = customer.activeJobCard?.jobCardNumber === row.jobCardNumber ? customer.activeJobCard :
                       customer.closedJobCard?.jobCardNumber === row.jobCardNumber ? customer.closedJobCard :
                       customer.jobCardData?.jobCardNumber === row.jobCardNumber ? customer.jobCardData : null;
            if (jc && jc.totalRevenue !== undefined && jc.totalRevenue !== null && parseFloat(jc.totalRevenue) > 0) {
               invoiceAmount = parseFloat(jc.totalRevenue);
            }
          }
          
          if (serviceJobCardInfo && serviceJobCardInfo.jobCardNumber === row.jobCardNumber && parseFloat(serviceJobCardInfo.totalRevenue) > 0) {
             invoiceAmount = parseFloat(serviceJobCardInfo.totalRevenue);
          }
          
          balance = Math.max(0, invoiceAmount - totalReceivedForJobCard);
        } else if (row.totalAmt && row.totalAmt !== 'N/A') {
          // For non-job-card payments, show difference between total and received
          balance = Math.max(0, parseFloat(row.totalAmt) - parseFloat(row.recAmt));
        }
        // Apply 2 rupees tolerance
        if (balance <= 2) {
          balance = 0;
        }
        
        return (
          <span className={balance > 0 ? "text-red-600 font-semibold" : ""}>
            {balance.toFixed(2)}
          </span>
        );
      }
    },
    { header: "PaymentMode", accessor: "paymentMode" },
    { header: "PaymentType", accessor: "typeOfPayment" },
    { header: "CollectionType", accessor: "typeOfCollection" },
    { header: "Vehicle Model", accessor: "vehicleModel" },
    { header: "Type of Service", accessor: "serviceType" },

    { header: "Ref No", accessor: "refNo" },
    { header: "Remarks", accessor: "remarks" },
  ];

  const normalizeServiceName = (name) => {
    if (!name) return "";
    return name.toUpperCase()
      .replace(/\s+/g, '')
      .replace(/FREE0?([1-9])/g, 'FREE$1');
  };

  const isServiceTypeAllowed = (typeName, history) => {
    if (!typeName) return true;
    const normalizedName = normalizeServiceName(typeName);

    if (!normalizedName.includes("FREE")) return true;

    const activeHistory = (history || []).filter(p => !p.cancelledAt);
    const fullyPaidServiceTypes = new Set();
    
    // Group payments by job card
    const paymentsByJc = {};
    activeHistory.forEach(p => {
       const jcNo = p.jobCardNumber;
       if (!jcNo || jcNo === 'N/A') return;
       if (!paymentsByJc[jcNo]) paymentsByJc[jcNo] = { received: 0, serviceType: normalizeServiceName(p.serviceTypeRelation?.name || p.serviceType || ""), payments: [] };
       paymentsByJc[jcNo].received += (parseFloat(p.recAmt) || 0);
       paymentsByJc[jcNo].payments.push(p);
    });
    
    Object.keys(paymentsByJc).forEach(jcNo => {
       let invoiceAmount = 0;
       if (loadedCustomer) {
          const jc = loadedCustomer.activeJobCard?.jobCardNumber === jcNo ? loadedCustomer.activeJobCard :
                     loadedCustomer.closedJobCard?.jobCardNumber === jcNo ? loadedCustomer.closedJobCard :
                     loadedCustomer.jobCardData?.jobCardNumber === jcNo ? loadedCustomer.jobCardData : null;
          
          if (jc && jc.totalRevenue !== undefined && jc.totalRevenue !== null) {
             invoiceAmount = parseFloat(jc.totalRevenue) || 0;
          } else {
             invoiceAmount = parseFloat(paymentsByJc[jcNo].payments[0].totalAmt) || 0;
          }
       } else {
          invoiceAmount = parseFloat(paymentsByJc[jcNo].payments[0].totalAmt) || 0;
       }
       
       // If invoiceAmount is > 0 and fully paid (with 1 rupee tolerance)
       if (invoiceAmount > 0 && paymentsByJc[jcNo].received >= (invoiceAmount - 1)) {
          fullyPaidServiceTypes.add(paymentsByJc[jcNo].serviceType);
       }
    });

    const hasFree1 = fullyPaidServiceTypes.has("FREE1");
    const hasFree2 = fullyPaidServiceTypes.has("FREE2");
    const hasFree3 = fullyPaidServiceTypes.has("FREE3");

    if (normalizedName === "FREE1") {
      return !hasFree1;
    }

    if (normalizedName === "FREE2") {
      return hasFree1 && !hasFree2;
    }

    if (normalizedName === "FREE3") {
      return hasFree1 && !hasFree3;
    }

    return true;
  };

  const getFilteredServiceTypes = () => {
    if (!loadedCustomer) return serviceTypes;

    return serviceTypes.filter(type => {
      if (isEditMode && type.id.toString() === formData.serviceTypeId) return true;
      return isServiceTypeAllowed(type.name, customerHistory);
    });
  };

 const renderActions = (payment) => {
  if (showDeleted) {
    return permissions?.payment_collection?.service?.restore ? (
      <button onClick={() => handleRestore(payment)} className="text-green-600 hover:underline">Restore</button>
    ) : null;
  }
  if (payment.cancelledAt) {
    return <span className="text-red-600 font-semibold">CANCELLED</span>;
  }
  return (
    <div className="flex gap-2">
      {/* View Button */}
      <button 
        onClick={() => handleView(payment)} 
        className="text-green-600 hover:text-gray-800 hover:underline"
        title="View Details"
      >
       View
      </button>
      {permissions?.payment_collection?.service?.edit && (
        <button onClick={() => handleEdit(payment)} className="text-blue-600 hover:underline">Edit</button>
      )}
      {permissions?.payment_collection?.service?.delete && (
        <button onClick={() => { setPaymentToDelete(payment); setIsDeleteModalOpen(true); }} className="text-red-600 hover:underline">Delete</button>
      )}
      {permissions?.payment_collection?.service?.cancel && (
        <button onClick={() => { setPaymentToCancel(payment); setIsCancelModalOpen(true); }} className="text-orange-600 hover:underline">Cancel</button>
      )}
      <button onClick={() => handlePrint(payment)} className="text-green-600 hover:underline">Print</button>
    </div>
  );
};

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-brand-text-primary whitespace-nowrap">{pageTitle}</h1>
        
        {(!subType || subType === 'full' || subType === 'advance') && !showDeleted && (
          <div className="flex bg-gray-200 p-1 rounded-xl shadow-sm border border-gray-300 w-full md:max-w-md md:mx-auto">
            <button
              onClick={() => setInternalMode('full')}
              className={`flex-1 py-1.5 px-3 text-sm sm:text-base font-bold rounded-lg transition-all duration-200 ${internalMode === 'full' ? 'bg-white text-brand-accent shadow-md scale-[1.02]' : 'text-gray-600 hover:text-gray-900'}`}
            >
              Full Payment
            </button>
            <button
              onClick={() => setInternalMode('advance')}
              className={`flex-1 py-1.5 px-3 text-sm sm:text-base font-bold rounded-lg transition-all duration-200 ${internalMode === 'advance' ? 'bg-white text-brand-accent shadow-md scale-[1.02]' : 'text-gray-600 hover:text-gray-900'}`}
            >
              Advance Payment
            </button>
          </div>
        )}

        <div className="flex gap-2 shrink-0">
          {(user?.username === 'ROOT' && user?.role === 'SUPER_ADMIN') && (
            <button
              onClick={() => setIsClearModalOpen(true)}
              className="px-4 py-2 text-sm sm:text-base rounded-lg font-medium bg-red-600 text-white hover:bg-red-700 whitespace-nowrap"
            >
              Clear All Data
            </button>
          )}
          {permissions?.payment_collection?.service?.view_deleted && (
            <button onClick={() => { setShowDeleted(!showDeleted); if (!showDeleted) fetchDeletedPayments(); }} className={`px-4 py-2 text-sm sm:text-base rounded-lg font-medium whitespace-nowrap ${showDeleted ? "bg-gray-500 text-white hover:bg-gray-600" : "bg-orange-600 text-white hover:bg-orange-700"}`}>
              {showDeleted ? "Show Active" : "Show Trash"}
            </button>
          )}
        </div>
      </div>

      {!showDeleted && (
        <div className="bg-brand-surface p-3 sm:p-4 md:p-6 rounded-lg shadow-sm space-y-4 border border-brand-border">
          <div className="flex flex-col sm:flex-row items-end gap-4">
            <div className="flex-grow w-full">
              <label className="text-sm font-medium text-brand-text-secondary mb-1 block">Select Customer</label>
              <div className="relative customer-dropdown">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setShowDropdown(true); setSelectedCustomerId(""); setLoadedCustomer(null); setFilteredPayments(payments); }}
                  onFocus={() => setShowDropdown(true)}
                  placeholder="Search by name,contact no , Job Card No and Vehicle Reg No"
                  className="w-full bg-white border border-brand-border text-brand-text-primary rounded-lg p-2 focus:ring-brand-accent focus:border-brand-accent"
                />
                {showDropdown && (
                  <div className="absolute z-10 w-full bg-white border border-brand-border rounded-lg mt-1 max-h-60 overflow-y-auto shadow-lg">
                    {permissions?.payment_collection?.service?.add_customer && (
                      <div onClick={() => handleCustomerSelect("new")} className="p-2 hover:bg-brand-hover cursor-pointer border-b border-brand-border font-medium text-green-600">+ Add New Customer</div>
                    )}
{filteredCustomers.map((customer) => (
  <div key={customer.id} onClick={() => handleCustomerSelect(customer)} className="p-2 hover:bg-brand-hover cursor-pointer border-b border-brand-border last:border-b-0">
    <div className="flex justify-between items-center">
      <div className="font-medium">{customer.name}</div>
      <div className="flex gap-1 flex-wrap">
        {customer.hasInvoice && (
          <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-bold uppercase">Invoice</span>
        )}
        {customer.hasJobCard && (
          <span className="text-[10px] bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-bold uppercase">Service Dealership</span>
        )}
        {customer.hasActiveJobCard && customer.activeJobCard ? (() => {
          const status = (customer.activeJobCard.status || '').toString().toLowerCase();
          const trimmed = status.trim();
          const label = trimmed.includes('pending') ? 'Job Card Pending'
            : trimmed.includes('open') ? 'Job Card Open'
            : trimmed.includes('completed') ? 'Job Card Completed'
            : trimmed.includes('cancelled') || trimmed.includes('canceled') ? 'Job Card Cancelled'
            : trimmed.includes('closed') || trimmed.includes('close') ? 'Job Card Closed'
            : `Job Card ${customer.activeJobCard.status}`;
          const bg = trimmed.includes('pending') ? 'bg-yellow-100 text-yellow-700'
            : trimmed.includes('open') ? 'bg-blue-100 text-blue-700'
            : trimmed.includes('completed') ? 'bg-green-100 text-green-700'
            : trimmed.includes('cancelled') || trimmed.includes('canceled') ? 'bg-red-100 text-red-600'
            : trimmed.includes('closed') || trimmed.includes('close') ? 'bg-red-100 text-red-600'
            : 'bg-gray-100 text-gray-700';
          return (
            <span className={`text-[10px] ${bg} px-2 py-0.5 rounded-full font-bold uppercase`}>
              {label}
            </span>
          );
        })() : customer.hasClosedJobCard && customer.closedJobCard && (() => {
          const status = (customer.closedJobCard.status || '').toString().toLowerCase();
          const trimmed = status.trim();
          const label = trimmed.includes('closed') || trimmed.includes('close') ? 'Job Card Closed'
            : trimmed.includes('completed') ? 'Job Card Completed'
            : trimmed.includes('cancelled') || trimmed.includes('canceled') ? 'Job Card Cancelled'
            : `Job Card ${customer.closedJobCard.status}`;
          const bg = 'bg-red-100 text-red-600';
          return (
            <span className={`text-[10px] ${bg} px-2 py-0.5 rounded-full font-bold uppercase`}>
              {label}
            </span>
          );
        })()}
      </div>
    </div>
    <div className="text-sm text-brand-text-secondary">{customer.contactNo}</div>
  </div>
))}
                    {filteredCustomers.length === 0 && searchTerm && searchTerm !== "+ Add New Customer" && (
                      <div className="p-2 text-brand-text-secondary text-center">No customers found</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {(loadedCustomer || isNewCustomer) && (
            <div className="border-t border-brand-border pt-4">
              {isNewCustomer ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                  <div className="space-y-4">
                    <div><label className="text-sm text-brand-text-secondary">Name *</label><input type="text" value={newCustomerData.name} onChange={(e) => setNewCustomerData({ ...newCustomerData, name: e.target.value })} className="w-full bg-white border border-brand-border text-brand-text-primary rounded-lg p-2" required /></div>
                    <div><label className="text-sm text-brand-text-secondary">Mobile Number *</label><input type="text" value={newCustomerData.contactNo} onChange={(e) => { const numericValue = e.target.value.replace(/\D/g, ""); if (numericValue.length > 10) { toast.error("Mobile number cannot exceed 10 digits"); return; } setNewCustomerData({ ...newCustomerData, contactNo: numericValue }); }} className="w-full bg-white border border-brand-border text-brand-text-primary rounded-lg p-2" placeholder="Enter 10 digit mobile number" maxLength="10" required /></div>
                  </div>
                  <div className="space-y-4">
                    <div><label className="text-sm text-brand-text-secondary">Address *</label><textarea value={newCustomerData.address} onChange={(e) => setNewCustomerData({ ...newCustomerData, address: e.target.value })} className="w-full bg-white border border-brand-border text-brand-text-primary rounded-lg p-2" rows={2} required></textarea></div>
                    <div><label className="text-sm text-brand-text-secondary">Status</label><select value={newCustomerData.status} onChange={(e) => { const newStatus = e.target.value; setNewCustomerData({ ...newCustomerData, status: newStatus, address: newStatus === "Service Dealer Customer" ? "NA" : newCustomerData.address }); }} className="w-full bg-white border border-brand-border text-brand-text-primary rounded-lg p-2"><option>Walk in Customer</option><option>Online Enquiry</option><option>Service Dealer Customer</option></select></div>
                    <div className="pt-2 flex justify-start gap-3">
                      {permissions?.payment_collection?.service?.add && (
                        <button onClick={handleOpenNewPayment} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg" disabled={!newCustomerData.name || !newCustomerData.contactNo || !newCustomerData.address}>
                          Pay
                        </button>
                      )}
                      <button onClick={() => { setLoadedCustomer(null); setIsNewCustomer(false); setSearchTerm(''); setSelectedCustomerId(''); setServiceJobCardInfo(null); setSalesInvoiceInfo(null); }} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-6 rounded-lg">
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                    <div className="space-y-4">
                      <div><label className="text-sm text-brand-text-secondary">CustId</label><div className="mt-1 p-2 bg-brand-hover rounded-md text-brand-text-primary">{loadedCustomer.custId}</div></div>
                      <div><label className="text-sm text-brand-text-secondary">Name</label><div className="mt-1 p-2 bg-brand-hover rounded-md text-brand-text-primary">{loadedCustomer.name}</div></div>
                      <div><label className="text-sm text-brand-text-secondary">Mobile Number</label><div className="mt-1 p-2 bg-brand-hover rounded-md text-brand-text-primary">{loadedCustomer.contactNo}</div></div>
                    </div>
                    <div className="space-y-4">
                      <div><label className="text-sm text-brand-text-secondary">Address</label><div className="mt-1 p-2 bg-brand-hover rounded-md text-brand-text-primary">{loadedCustomer.address}</div></div>
                      <div><label className="text-sm text-brand-text-secondary">Status</label><div className="mt-1 p-2 bg-brand-hover rounded-md text-brand-text-primary">{loadedCustomer.status}</div></div>
                      <div className="pt-2 flex justify-start gap-3">
                        {permissions?.payment_collection?.service?.add && (
                          <button onClick={handleOpenNewPayment} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg">
                            Pay
                          </button>
                        )}
                        <button onClick={() => { setLoadedCustomer(null); setIsNewCustomer(false); setSearchTerm(''); setSelectedCustomerId(''); setServiceJobCardInfo(null); setSalesInvoiceInfo(null); }} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-6 rounded-lg">
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                  {salesInvoiceInfo && (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="text-sm font-bold text-blue-900 mb-2">📋 Sales Invoice Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                        {salesInvoiceInfo.vehicleRegNo && <div><span className="text-blue-700 font-medium">Vehicle Reg No:</span><span className="ml-2 text-blue-900">{salesInvoiceInfo.vehicleRegNo}</span></div>}
                        {salesInvoiceInfo.vehicleModel && <div><span className="text-blue-700 font-medium">Vehicle Model:</span><span className="ml-2 text-blue-900">{salesInvoiceInfo.vehicleModel}</span></div>}
                        {salesInvoiceInfo.assignedTo && <div><span className="text-blue-700 font-medium">DSE:</span><span className="ml-2 text-blue-900">{salesInvoiceInfo.assignedTo}</span></div>}
                        {salesInvoiceInfo.actualDeliverDate && <div><span className="text-blue-700 font-medium">Delivery Date:</span><span className="ml-2 text-blue-900">{new Date(salesInvoiceInfo.actualDeliverDate).toLocaleDateString('en-GB')}</span></div>}
                      </div>
                    </div>
                  )}
{/* Display Job Card Information - ONLY if belongs to selected customer */}
{serviceJobCardInfo && loadedCustomer && (() => {
  // Validate that this job card belongs to the selected customer
  const customerMobile = loadedCustomer.contactNo?.toString().trim();
  const jobCardMobile = serviceJobCardInfo.mobileNumber?.toString().trim();
  const belongsToCustomer = customerMobile && jobCardMobile === customerMobile;
  
  // Also check by name as fallback
  const customerName = loadedCustomer.name?.toString().trim().toLowerCase();
  const jobCardName = serviceJobCardInfo.customerName?.toString().trim().toLowerCase();
  const nameMatches = customerName && jobCardName && 
    (customerName === jobCardName || jobCardName.includes(customerName) || customerName.includes(jobCardName));
  
  // Only show if job card belongs to current customer
  if (!belongsToCustomer && !nameMatches) {
    console.warn('Not displaying job card - belongs to different customer:', {
      selectedCustomer: loadedCustomer.name,
      selectedMobile: customerMobile,
      jobCardCustomer: serviceJobCardInfo.customerName,
      jobCardMobile: jobCardMobile,
      jobCardNumber: serviceJobCardInfo.jobCardNumber
    });
    return null;
  }
  
  // Do not show if job card is closed
  if (isJobCardClosed(serviceJobCardInfo.status)) {
    return null;
  }
  
  const sourcePayments = customerHistory.length > 0 && String(customerHistory[0]?.customerId) === String(loadedCustomer?.id) ? customerHistory : payments;
  const jobCardPayments = sourcePayments.filter(p => p.jobCardNumber === serviceJobCardInfo.jobCardNumber && String(p.customerId) === String(loadedCustomer?.id) && !p.cancelledAt);
  const totalJobCardReceived = jobCardPayments.reduce((sum, p) => sum + (parseFloat(p.recAmt) || 0), 0);
  const jobCardInvoiceAmount = parseFloat(serviceJobCardInfo.totalRevenue) || 0;
  const jobCardBalance = Math.max(0, jobCardInvoiceAmount - totalJobCardReceived);

  return (
    <div className={`mt-4 p-4 rounded-lg border ${
      (serviceJobCardInfo.status || '').toString().toLowerCase().trim() === 'pending' ? 'bg-yellow-50 border-yellow-200' :
      (serviceJobCardInfo.status || '').toString().toLowerCase().trim() === 'open' ? 'bg-blue-50 border-blue-200' :
      ['closed', 'completed'].includes((serviceJobCardInfo.status || '').toString().toLowerCase().trim()) ? 'bg-gray-50 border-gray-300' :
      ['cancelled', 'canceled'].includes((serviceJobCardInfo.status || '').toString().toLowerCase().trim()) ? 'bg-red-50 border-red-200' :
      'bg-green-50 border-green-200'
    }`}>
      <h4 className={`text-sm font-bold mb-3 flex items-center gap-2 ${
        (serviceJobCardInfo.status || '').toString().toLowerCase().trim() === 'pending' ? 'text-yellow-800' :
        (serviceJobCardInfo.status || '').toString().toLowerCase().trim() === 'open' ? 'text-blue-800' :
        ['closed', 'completed'].includes((serviceJobCardInfo.status || '').toString().toLowerCase().trim()) ? 'text-gray-600' :
        ['cancelled', 'canceled'].includes((serviceJobCardInfo.status || '').toString().toLowerCase().trim()) ? 'text-red-800' :
        'text-green-800'
      }`}>
        📋 Previous Service Dealership Information
        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
          (serviceJobCardInfo.status || '').toString().toLowerCase().trim() === 'pending' ? 'bg-yellow-100 text-yellow-700' :
          (serviceJobCardInfo.status || '').toString().toLowerCase().trim() === 'open' ? 'bg-blue-100 text-blue-700' :
          ['closed', 'completed'].includes((serviceJobCardInfo.status || '').toString().toLowerCase().trim()) ? 'bg-gray-200 text-gray-700' :
          ['cancelled', 'canceled'].includes((serviceJobCardInfo.status || '').toString().toLowerCase().trim()) ? 'bg-red-100 text-red-700' :
          'bg-gray-100 text-gray-700'
        }`}>
          Status: {serviceJobCardInfo.status}
        </span>
        {(['closed', 'completed', 'cancelled', 'canceled'].includes((serviceJobCardInfo.status || '').toString().toLowerCase().trim())) && (
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 ml-2">
            Reference Only
          </span>
        )}
      </h4>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
        <div>
          <span className="font-medium text-gray-600">Job Card No:</span>
          <span className="ml-2 font-semibold">{serviceJobCardInfo.jobCardNumber || "N/A"}</span>
        </div>
        <div>
          <span className="font-medium text-gray-600">Vehicle Reg No:</span>
          <span className="ml-2">{serviceJobCardInfo.registrationNumber || "N/A"}</span>
        </div>
        <div>
          <span className="font-medium text-gray-600">Vehicle Model:</span>
          <span className="ml-2">{serviceJobCardInfo.vehicleDetails || "N/A"}</span>
        </div>
        <div>
          <span className="font-medium text-gray-600">Service Type:</span>
          <span className="ml-2">{typeof serviceJobCardInfo.serviceType === 'object' ? serviceJobCardInfo.serviceType?.name || "N/A" : serviceJobCardInfo.serviceType || "N/A"}</span>
        </div>
        <div>
          <span className="font-medium text-gray-600">Customer Name:</span>
          <span className="ml-2">{serviceJobCardInfo.customerName || "N/A"}</span>
        </div>
        <div>
          <span className="font-medium text-gray-600">Created Date:</span>
          <span className="ml-2">{serviceJobCardInfo.createdAt ? new Date(serviceJobCardInfo.createdAt).toLocaleDateString('en-GB') : "N/A"}</span>
        </div>
        {!isJobCardClosed(serviceJobCardInfo.status) && serviceJobCardInfo.invoiceNumber && serviceJobCardInfo.invoiceNumber !== 'N/A' && (
          <div>
            <span className="font-medium text-gray-600">Invoice Number:</span>
            <span className="ml-2 font-semibold">{serviceJobCardInfo.invoiceNumber}</span>
          </div>
        )}
        {!isJobCardClosed(serviceJobCardInfo.status) && (
          <>
            {serviceJobCardInfo.totalRevenue > 0 && (
              <div>
                <span className="font-medium text-gray-600">Total Invoice Amount:</span>
                <span className="ml-2 font-semibold">₹{serviceJobCardInfo.totalRevenue}</span>
              </div>
            )}
            <div>
              <span className="font-medium text-gray-600">Total Amount Received:</span>
              <span className="ml-2 font-semibold">₹{totalJobCardReceived}</span>
            </div>
            {serviceJobCardInfo.totalRevenue > 0 && (
              <div>
                <span className="font-medium text-gray-600">Balance to Pay:</span>
                <span className={`ml-2 font-semibold ${((serviceJobCardInfo.totalRevenue || 0) - totalJobCardReceived) > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                  ₹{Math.max(0, (parseFloat(serviceJobCardInfo.totalRevenue) || 0) - totalJobCardReceived).toFixed(2)}
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
})()}


                </>
              )}
            </div>
          )}
        </div>
      )}


      <DataTable
        columns={columns}
        data={showDeleted ? deletedPayments : filteredPayments}
        actionButtons={renderActions}
        rowClassName={(row) => row.cancelledAt ? '!bg-red-100' : ''}
        pagination={!showDeleted && !loadedCustomer ? { page: currentPage, limit: itemsPerPage, total: totalEntries, totalPages: totalPages, onPageChange: (page) => { setCurrentPage(page); fetchPayments(page); } } : undefined}
        disablePagination={!!loadedCustomer}
      />

      <Modal isOpen={isPaymentModalOpen} onClose={() => { setIsPaymentModalOpen(false); setPendingPayments([]); setSelectedParts([]); setPartSearchTerm(''); }} title={isEditMode ? "Edit Service Payment" : "Service Payment Entry"} maxWidth="max-w-4xl">
        <form id="service-payment-form" className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            {/* Row 1: Basic Info */}
            <div><label className="block text-sm font-medium text-brand-text-secondary mb-1">Date <span className="text-red-500">*</span></label><input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full bg-white border border-brand-border text-brand-text-primary rounded-lg p-2" required disabled /></div>
            <div><label className="block text-sm font-medium text-brand-text-secondary mb-1">Payment Type <span className="text-red-500">*</span></label>
              <select
                value={paymentSelectValue}
                onChange={(e) => {
                  const selectedId = e.target.value;
                  if (paymentTypes.length === 0) { // Fallback if master data not loaded yet
                    // fallback: treat value as name
                    const canonical = mapMasterNameToKey(selectedId);
                    setFormData({
                      ...formData,
                      paymentType: canonical,
                      paymentTypeId: "",
                      paymentStatus: "pending"
                    });
                    if (loadedCustomer) fetchCustomerPayments(loadedCustomer.id, selectedId, formData.jobCardNumber);
                    return;
                  }
                  // Use master data
                  const matched = paymentTypes.find(pt => String(pt.id) === String(selectedId));
                  const canonical = matched ? mapMasterNameToKey(matched.name) : mapMasterNameToKey(selectedId);
                  setFormData({
                    ...formData,
                    paymentType: canonical,
                    paymentTypeId: matched ? String(matched.id) : "",
                    paymentStatus: "pending"
                  });
                  if (loadedCustomer) fetchCustomerPayments(loadedCustomer.id, matched ? matched.name : selectedId, formData.jobCardNumber);
                }}
                className="w-full bg-white border border-brand-border text-brand-text-primary rounded-lg p-2"
                required
              >
                {paymentTypes.length === 0 ? (
                  <>
                    <option value="full payment">Full Payment</option>
                    <option value="part payment">Payment for Parts</option>
                    <option value="advance payment">Advance payment</option>
                  </>
                ) : (
                  paymentTypes.map((pt) => (
                    <option key={pt.id} value={String(pt.id)}>{pt.name}</option>
                  ))
                )}
              </select>
            </div>

            {/* Row 2: Vehicle Info */}
            <div><label className="block text-sm font-medium text-brand-text-secondary mb-1">Vehicle Number {normalizedPaymentType === "part payment" && <span className="text-red-500">*</span>}</label><input type="text" value={formData.vehicleNumber} onChange={(e) => { const vehicleNum = e.target.value.toUpperCase(); setFormData({ ...formData, vehicleNumber: vehicleNum }); }} className="w-full bg-white border border-brand-border text-brand-text-primary rounded-lg p-2" placeholder="Enter vehicle number" required={normalizedPaymentType === "part payment"} /></div>
            <div>
              {(() => {
                const selectedTypeOfCollection = serviceTypeOfCollections.find(type => type.id === parseInt(formData.serviceTypeOfCollectionId));
                return !selectedTypeOfCollection?.disableVehicleModel ? (
                  <SearchableDropdown label="Vehicle Model" value={formData.vehicleModelId} onChange={(value) => setFormData({ ...formData, vehicleModelId: value })} options={vehicleModels.map(model => ({ value: model.id.toString(), label: model.model }))} />
                ) : (
                  <div className="hidden md:block"></div>
                );
              })()}
            </div>

            {/* Row 3: Service Info - Job Card Number */}
            {(normalizedPaymentType === 'full payment' || normalizedPaymentType === 'service plan payment') && (
              <div>
                <label className="block text-sm font-medium text-brand-text-secondary mb-1">
                  Job Card Number <span className="text-red-500">*</span>
                </label>

                <div className="space-y-2">
                  <input
                    type="text"
                    value={formData.jobCardNumber}
                    onChange={(e) => {
                      const newJobCardNumber = e.target.value.toUpperCase();
                      setFormData({ ...formData, jobCardNumber: newJobCardNumber });
                      setIsManualJobCard(false);
                      setFoundJobCard(null);
                      setServiceJobCardInfo(null);
                      setPendingPayments([]);
                    }}
                    className="w-full bg-white border border-brand-border text-brand-text-primary rounded-lg p-2"
                    placeholder="JC-BWKA0105-02-2526-000000"
                    required={true}
                  />
                </div>
              </div>
            )}

            <SearchableDropdown
              label="Type of Service"
              value={formData.serviceTypeId}
              onChange={(value) => {
                const selectedType = serviceTypes.find(type => type.id.toString() === value);
                setFormData({
                  ...formData,
                  serviceTypeId: value,
                  serviceType: selectedType?.name || ""
                });
                if (selectedType?.name && serviceTypeOfCollections.length > 0) {
                  const matchedTypeOfCollection = serviceTypeOfCollections.find(
                    (type) => type.typeOfCollect?.toLowerCase() === selectedType.name.toLowerCase()
                  );
                  if (matchedTypeOfCollection) {
                    setFormData(prev => ({
                      ...prev,
                      serviceTypeOfCollectionId: matchedTypeOfCollection.id.toString()
                    }));
                  }
                }
              }}
              options={getFilteredServiceTypes().map(type => ({
                value: type.id.toString(),
                label: type.name
              }))}
              required
              placeholder="Select service type"
              disabled={serviceTypes.length === 0}
            />

            {/* Row 4: Collection & Amount */}
            <SearchableDropdown label="Type of Collection" value={formData.serviceTypeOfCollectionId} onChange={(value) => { const selectedType = filteredTypeOfCollections.find(type => type.id === parseInt(value)); setFormData({ ...formData, serviceTypeOfCollectionId: value, vehicleModelId: selectedType?.disableVehicleModel ? "" : formData.vehicleModelId }); }} options={filteredTypeOfCollections.map(type => ({ value: type.id.toString(), label: type.typeOfCollect }))} />
            <div>
              <label className="block text-sm font-medium text-brand-text-secondary mb-1">Receipt Amount <span className="text-red-500">*</span></label>
              <input type="number" step="0.01" value={formData.recAmt} onChange={(e) => setFormData({ ...formData, recAmt: e.target.value })} className="w-full bg-white border border-brand-border text-brand-text-primary rounded-lg p-2" required />
            </div>

            {normalizedPaymentType === 'full payment' && (
              <div className="col-span-1 md:col-span-2 bg-blue-50 p-4 rounded-lg border border-blue-100">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-brand-text-primary">
                  <input
                    type="checkbox"
                    checked={formData.hasAdditionalPlan}
                    onChange={(e) => {
                      setFormData({ 
                        ...formData, 
                        hasAdditionalPlan: e.target.checked,
                        additionalPlanCollectionIds: e.target.checked ? formData.additionalPlanCollectionIds : [],
                        additionalPlanAmount: e.target.checked ? formData.additionalPlanAmount : "",
                        additionalPlanAmounts: e.target.checked ? formData.additionalPlanAmounts : {}
                      })
                    }}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  Additional Service Plan
                </label>
                
                {formData.hasAdditionalPlan && (
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-brand-text-secondary mb-2">Type of Collection <span className="text-red-500">*</span></label>
                      <div className="flex flex-wrap gap-4">
                        {additionalPlanCollections.map(type => (
                          <label key={type.id} className="flex items-center gap-2 cursor-pointer font-medium text-brand-text-primary">
                            <input
                              type="checkbox"
                              checked={(formData.additionalPlanCollectionIds || []).includes(String(type.id))}
                              onChange={(e) => {
                                const newIds = e.target.checked 
                                  ? [...(formData.additionalPlanCollectionIds || []), String(type.id)]
                                  : (formData.additionalPlanCollectionIds || []).filter(id => id !== String(type.id));
                                setFormData({ ...formData, additionalPlanCollectionIds: newIds });
                              }}
                              className="w-4 h-4 text-brand-accent rounded border-gray-300 focus:ring-brand-accent"
                            />
                            {type.typeOfCollect}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col gap-3">
                      {(formData.additionalPlanCollectionIds || []).map(id => {
                        const plan = additionalPlanCollections.find(p => String(p.id) === id);
                        if (!plan) return null;
                        return (
                          <div key={id}>
                            <label className="block text-sm font-medium text-brand-text-secondary mb-1">
                              {plan.typeOfCollect} Amount <span className="text-red-500">*</span>
                            </label>
                            <input 
                              type="number" 
                              step="0.01" 
                              value={(formData.additionalPlanAmounts || {})[id] || ""} 
                              onChange={(e) => setFormData({ 
                                ...formData, 
                                additionalPlanAmounts: {
                                  ...(formData.additionalPlanAmounts || {}),
                                  [id]: e.target.value
                                } 
                              })} 
                              className="w-full bg-white border border-brand-border text-brand-text-primary rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500" 
                              required={true} 
                              placeholder={`Enter amount for ${plan.typeOfCollect}`}
                            />
                          </div>
                        );
                      })}
                      {(!formData.additionalPlanCollectionIds || formData.additionalPlanCollectionIds.length === 0) && (
                        <div className="text-sm text-brand-text-secondary italic">Select a plan to enter amount.</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Row 5: Payment Method */}
            <SearchableDropdown label="Payment Mode" value={formData.paymentModeId} onChange={(value) => setFormData({ ...formData, paymentModeId: value, typeOfPaymentId: "" })} options={paymentModes.map(mode => ({ value: mode.id.toString(), label: mode.paymentMode }))} required />
            <SearchableDropdown label="Type of Payment Mode" value={formData.typeOfPaymentId} onChange={(value) => setFormData({ ...formData, typeOfPaymentId: value })} options={filteredTypeOfPayments.map(type => ({ value: type.id.toString(), label: type.typeOfMode }))} />

            {/* Row 6: Reference Number */}
            <div><label className="block text-sm font-medium text-brand-text-secondary mb-1">Reference Number</label><input type="text" value={formData.refNo} onChange={(e) => setFormData({ ...formData, refNo: e.target.value })} className="w-full bg-white border border-brand-border text-brand-text-primary rounded-lg p-2" /></div>

            {/* Part Selection for Part Payment and Advance Payment */}
            {(normalizedPaymentType === "part payment" || (isAdvancePaymentMode && normalizedPaymentType === "advance payment")) && (
              <div className="relative part-dropdown">
                <label className="block text-sm font-medium text-brand-text-secondary mb-1">Select Part</label>
                <input
                  type="text"
                  value={partSearchTerm}
                  onChange={(e) => {
                    setPartSearchTerm(e.target.value);
                    setIsPartDropdownOpen(true);
                  }}
                  onFocus={() => setIsPartDropdownOpen(true)}
                  placeholder="Search by part no or name..."
                  className="w-full bg-white border border-brand-border text-brand-text-primary rounded-lg p-2 focus:ring-brand-accent focus:border-brand-accent"
                />
                {isPartDropdownOpen && (
                  <div className="absolute z-10 w-full bg-white border border-brand-border rounded-lg mt-1 max-h-60 overflow-y-auto shadow-lg">
                    {/* Add New Part Option */}
                    <div
                      onClick={() => {
                        setIsPartDropdownOpen(false);
                        setIsNewPartModalOpen(true);
                      }}
                      className="p-2 hover:bg-brand-hover cursor-pointer border-b border-brand-border font-medium text-green-600"
                    >
                      + Add New Part
                    </div>
                    {filteredParts.length === 0 ? (
                      <div className="p-2 text-brand-text-secondary text-center">No parts found</div>
                    ) : (
                      filteredParts.map((part) => (
                        <div
                          key={part.id}
                          onClick={() => handleAddPartToPayment(part)}
                          className="p-2 hover:bg-brand-hover cursor-pointer border-b border-brand-border last:border-b-0"
                        >
                          <div className="font-medium">{part.partNo}</div>
                          <div className="text-sm text-brand-text-secondary">{part.partDescription || part.partName} {part.Model ? `(${part.Model})` : ''}</div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Selected Parts List */}
            {(normalizedPaymentType === "part payment" || (isAdvancePaymentMode && normalizedPaymentType === "advance payment")) && selectedParts.length > 0 && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-brand-text-secondary mb-2">Added Parts</label>
                <div className="bg-gray-50 border border-brand-border rounded-lg max-h-40 overflow-y-auto">
                  {selectedParts.map((part, index) => (
                    <div key={part.id} className="flex justify-between items-center p-2 border-b border-brand-border last:border-b-0">
                      <div>
                        <span className="font-medium text-sm">{index + 1}. {part.partNo}</span>
                        <span className="text-gray-500 mx-2">-</span>
                        <span className="text-sm text-brand-text-secondary">{part.partDescription || part.partName} {part.Model ? `(${part.Model})` : ''}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removePartFromPayment(part.id)}
                        className="text-red-600 hover:text-red-800 text-xs"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payment Status */}
            {normalizedPaymentType === "part payment" && (
              <div>
                <label className="block text-sm font-medium text-brand-text-secondary mb-1">Payment Status <span className="text-red-500">*</span></label>
                <select
                  value={formData.paymentStatus}
                  onChange={handlePaymentStatusChange}
                  className="w-full bg-white border border-brand-border text-brand-text-primary rounded-lg p-2"
                  required
                >
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                </select>
                {formData.paymentStatus === "completed" && normalizedPaymentType === "part payment" && (
                  <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                    ⚡ Note: This will change Payment Type to "Full Payment"
                  </p>
                )}
                {formData.paymentStatus === "completed" && normalizedPaymentType === "full payment" && (
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    ✓ Payment will be processed as Full Payment
                  </p>
                )}
              </div>
            )}

            {/* Row 7 - Full Width Remarks */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-brand-text-secondary mb-1">Remarks</label>
              <textarea value={formData.remarks} onChange={(e) => setFormData({ ...formData, remarks: e.target.value })} className="w-full bg-white border border-brand-border text-brand-text-primary rounded-lg p-2" rows={2}></textarea>
            </div>

            {/* Previous Payments Info - Full Width (for BOTH part and full payment) */}
            {(pendingPayments.length > 0 || (isClosedJobCard && serviceJobCardInfo)) && (
              <div className="md:col-span-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                <label className="block text-sm font-medium text-blue-900 mb-2">
                  Payment Session Summary {formData.vehicleNumber ? `(Vehicle: ${formData.vehicleNumber})` : ''}
                </label>
                {!isClosedJobCard ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {/* Only show saved/submitted payments - NO "New Entry" preview */}
                    {pendingPayments.length > 0 ? (
                      pendingPayments.map((payment) => (
                        <div key={payment.id} className="flex justify-between text-sm border-b border-blue-100 pb-2">
                          <div className="flex gap-4">
                            <span className="text-blue-800 font-medium">{payment.receiptNo}</span>
                            <span className="text-blue-600">{new Date(payment.date).toLocaleDateString('en-GB')}</span>
                            <span className={paymentTypeBadgeClass(payment.paymentTypeMaster?.name || payment.paymentType)}>{getPaymentTypeLabel(payment.paymentTypeMaster?.name || payment.paymentType)}</span>
                            {payment.vehicleNumber && payment.vehicleNumber !== 'N/A' && (
                              <span className="text-blue-600">Vehicle: {payment.vehicleNumber}</span>
                            )}
                          </div>
                          <div className="flex gap-4">
                            <span className="font-medium text-blue-900">₹{payment.recAmt}</span>
                            <span className={`text-xs px-2 rounded-full ${
                              payment.paymentStatus === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {payment.paymentStatus}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-blue-600 text-center py-2">No previous payments recorded</p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-brand-text-secondary">This job card is closed. Previous payments are hidden.</p>
                )}

                {/* Calculate total received and balance */}
                {!isClosedJobCard && (() => { // <-- Added !isClosedJobCard condition here
                  const totalReceived = pendingPayments.reduce((sum, p) => sum + p.recAmt, 0);
                  const invoiceAmount = serviceJobCardInfo?.totalRevenue || 0;
                  const balanceAmount = invoiceAmount - totalReceived;

                  return (
                    <>
                      <div className="border-t border-blue-300 pt-2 mt-2 flex justify-between font-bold">
                        <span className="text-blue-900">Total Amount Received:</span>
                        <span className="text-blue-900">₹{totalReceived}</span>
                      </div>

                      {/* Show Invoice Amount and Balance if job card exists and has invoice amount */}
                      {serviceJobCardInfo && invoiceAmount > 0 && (
                        <>
                          <div className="flex justify-between text-sm mt-1">
                            <span className="text-blue-700">Total Invoice Amount:</span>
                            <span className="text-blue-700 font-semibold">₹{invoiceAmount}</span>
                          </div>
                          <div className={`flex justify-between font-bold mt-1 pt-1 border-t border-blue-200 ${balanceAmount > CLOSING_TOLERANCE_RUPEES ? 'text-orange-600' : 'text-green-600'}`}>
                            <span>Balance to Pay:</span>
                            <span>₹{balanceAmount > CLOSING_TOLERANCE_RUPEES ? balanceAmount.toFixed(2) : '0.00'}</span>
                          </div>
                          {balanceAmount <= CLOSING_TOLERANCE_RUPEES && (
                            <div className="text-green-600 text-xs mt-1 text-center font-semibold">
                              ✓ Fully Paid! Job card will be closed automatically.
                            </div>
                          )}
                        </>
                      )}
                    </>
                  );
                })()}
              </div>
            )}

            {/* Total Paid Amount Info - Full Width */}
            {normalizedPaymentType === "part payment" && formData.paymentStatus === "completed" && pendingPayments.length > 0 && !isClosedJobCard && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-brand-text-secondary mb-1">Total Paid Amount <span className="text-red-500">*</span></label>
                <input type="number" step="0.01" value={pendingPayments.reduce((sum, p) => sum + p.recAmt, 0) + (parseFloat(formData.recAmt) || 0)} className="w-full bg-gray-100 border border-brand-border text-brand-text-primary rounded-lg p-2 cursor-not-allowed" readOnly />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="px-4 py-2 rounded-lg bg-white hover:bg-brand-hover text-brand-text-secondary font-bold border border-brand-border">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded-lg bg-brand-accent hover:bg-brand-accent-hover text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {isEditMode ? "Updating..." : "Submitting..."}
                </>
              ) : (
                isEditMode ? "Update" : "Submit"
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add New Part Modal */}
      <Modal isOpen={isNewPartModalOpen} onClose={() => { setIsNewPartModalOpen(false); setNewPartData({ partNo: '', partDescription: '', Model: '', status: 'ORDERED' }); }} title="Add New Part to Master" maxWidth="max-w-md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-brand-text-secondary mb-1">Part No <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={newPartData.partNo}
              onChange={(e) => setNewPartData({ ...newPartData, partNo: e.target.value.toUpperCase() })}
              className="w-full bg-white border border-brand-border text-brand-text-primary rounded-lg p-2"
              placeholder="Enter part number"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-text-secondary mb-1">Part Description <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={newPartData.partDescription}
              onChange={(e) => setNewPartData({ ...newPartData, partDescription: e.target.value })}
              className="w-full bg-white border border-brand-border text-brand-text-primary rounded-lg p-2"
              placeholder="Enter part description"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-text-secondary mb-1">Model</label>
            <input
              type="text"
              value={newPartData.Model}
              onChange={(e) => setNewPartData({ ...newPartData, Model: e.target.value })}
              className="w-full bg-white border border-brand-border text-brand-text-primary rounded-lg p-2"
              placeholder="Enter part model"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-text-secondary mb-1">Status</label>
            <select
              value={newPartData.status}
              onChange={(e) => setNewPartData({ ...newPartData, status: e.target.value })}
              className="w-full bg-white border border-brand-border text-brand-text-primary rounded-lg p-2"
            >
              <option value="ORDERED">ORDERED</option>
              <option value="RECEIVED">RECEIVED</option>
              <option value="NOT_RECEIVED">NOT_RECEIVED</option>
            </select>
          </div>
          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={() => { setIsNewPartModalOpen(false); setNewPartData({ partNo: '', partDescription: '', Model: '', status: 'ORDERED' }); }}
              className="px-4 py-2 rounded-lg bg-white hover:bg-brand-hover text-brand-text-secondary font-bold border border-brand-border"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAddNewPart}
              className="px-4 py-2 rounded-lg bg-brand-accent hover:bg-brand-accent-hover text-white font-bold"
            >
              Add Part
            </button>
          </div>
        </div>
      </Modal>
{/* View Payment Details Modal */}
<Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Payment Details" maxWidth="max-w-4xl">
  {selectedPayment && (
    <div className="space-y-6">
      {/* Customer Information */}
      <div>
        <h3 className="text-lg font-semibold text-brand-text-primary border-b border-brand-border pb-2 mb-3">Customer Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-brand-text-secondary uppercase">Customer ID</label>
            <div className="text-brand-text-primary font-medium">{selectedPayment.custId}</div>
          </div>
          <div>
            <label className="text-xs text-brand-text-secondary uppercase">Customer Name</label>
            <div className="text-brand-text-primary font-medium">{selectedPayment.name}</div>
          </div>
          <div>
            <label className="text-xs text-brand-text-secondary uppercase">Contact Number</label>
            <div className="text-brand-text-primary font-medium">{selectedPayment.contactNo}</div>
          </div>
          <div>
            <label className="text-xs text-brand-text-secondary uppercase">Address</label>
            <div className="text-brand-text-primary">{selectedPayment.address}</div>
          </div>
        </div>
      </div>

     {/* Payment Information */}
{/* Payment Information */}
<div>
  <h3 className="text-lg font-semibold text-brand-text-primary border-b border-brand-border pb-2 mb-3">Payment Information</h3>
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    <div>
      <label className="text-xs text-brand-text-secondary uppercase">Receipt No</label>
      <div className="text-brand-text-primary font-medium">{selectedPayment.receiptNo}</div>
    </div>
    <div>
      <label className="text-xs text-brand-text-secondary uppercase">Date</label>
      <div className="text-brand-text-primary font-medium">
        {new Date(selectedPayment.date).toLocaleDateString('en-GB')}
      </div>
    </div>
    <div>
      <label className="text-xs text-brand-text-secondary uppercase">Payment Type</label>
      <div className="text-brand-text-primary font-medium">{getPaymentTypeLabel(selectedPayment.paymentType)}</div>
    </div>
    <div>
      <label className="text-xs text-brand-text-secondary uppercase">Payment Status</label>
      <div className="text-brand-text-primary font-medium">
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
          selectedPayment.paymentStatus === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
        }`}>
          {selectedPayment.paymentStatus}
        </span>
      </div>
    </div>
    <div>
      <label className="text-xs text-brand-text-secondary uppercase">Received Amount</label>
      <div className="text-green-600 font-bold text-lg">₹{selectedPayment.recAmt}</div>
    </div>
    <div>
      <label className="text-xs text-brand-text-secondary uppercase">Total Amount</label>
      <div className="text-brand-text-primary font-medium">₹{selectedPayment.totalAmt !== undefined && selectedPayment.totalAmt !== null && selectedPayment.totalAmt !== 'N/A' ? selectedPayment.totalAmt : getPaymentTotalAmount(selectedPayment)}</div>
    </div>
    {/* Invoice Information - Only show if available from job card */}
    {selectedPayment.invoiceNumber && selectedPayment.invoiceNumber !== 'N/A' && (
      <div>
        <label className="text-xs text-brand-text-secondary uppercase">Invoice Number</label>
        <div className="text-brand-text-primary font-medium">{selectedPayment.invoiceNumber}</div>
      </div>
    )}
    {selectedPayment.totalInvoiceAmount !== undefined && selectedPayment.totalInvoiceAmount !== null && selectedPayment.totalInvoiceAmount > 0 && (
      <>
        <div>
          <label className="text-xs text-brand-text-secondary uppercase">Total Invoice Amount</label>
          <div className="text-blue-600 font-bold">₹{selectedPayment.totalInvoiceAmount.toLocaleString('en-IN')}</div>
        </div>
        {/* Show Payment Summary with Extra Amount */}
        {(() => {
          const totalReceived = selectedPayment.totalAmt !== undefined && selectedPayment.totalAmt !== null && selectedPayment.totalAmt !== 'N/A' 
            ? parseFloat(selectedPayment.totalAmt)
            : getPaymentTotalAmount(selectedPayment);
          const invoiceAmount = parseFloat(selectedPayment.totalInvoiceAmount);
          const difference = totalReceived - invoiceAmount;
          const tolerance = CLOSING_TOLERANCE_RUPEES;
          const isExtraPaid = difference > tolerance;
          const isShortPaid = difference < -tolerance;
          const isEffectivelyEqual = Math.abs(difference) <= tolerance;
          const displayedBalance = Math.max(0, Math.abs(difference) - tolerance);

          return (
            <>
              {isExtraPaid && (
                <div>
                  <label className="text-xs text-brand-text-secondary uppercase">Extra Paid Amount</label>
                  <div className="text-orange-600 font-medium text-lg">+ ₹{Math.abs(difference).toLocaleString('en-IN')}</div>
                  <div className="text-xs text-green-600 mt-1">Amount paid above invoice</div>
                </div>
              )}
              {isShortPaid && (
                <div>
                  <label className="text-xs text-brand-text-secondary uppercase">Balance to Pay</label>
                  <div className="text-orange-600 font-medium text-lg">₹{Math.abs(difference).toLocaleString('en-IN')}</div>
                  <div className="text-xs text-orange-600 mt-1">Remaining amount due</div>
                </div>
              )}
              {isEffectivelyEqual && invoiceAmount > 0 && (
                <div>
                  <label className="text-xs text-brand-text-secondary uppercase">Payment Status</label>
                  <div className="text-green-600 font-medium">Fully Paid ✓</div>
                  <div className="text-xs text-green-600 mt-1">Within ₹{tolerance.toFixed(2)} tolerance</div>
                </div>
              )}
            </>
          );
        })()}
      </>
    )}
    <div>
      <label className="text-xs text-brand-text-secondary uppercase">Payment Mode</label>
      <div className="text-brand-text-primary">{selectedPayment.paymentMode}</div>
    </div>
    <div>
      <label className="text-xs text-brand-text-secondary uppercase">Type of Payment</label>
      <div className="text-brand-text-primary">{selectedPayment.typeOfPayment}</div>
    </div>
  </div>
</div>

      {/* Vehicle Information */}
      <div>
        <h3 className="text-lg font-semibold text-brand-text-primary border-b border-brand-border pb-2 mb-3">Vehicle Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-brand-text-secondary uppercase">Vehicle Number</label>
            <div className="text-brand-text-primary font-medium">{selectedPayment.vehicleNumber}</div>
          </div>
          <div>
            <label className="text-xs text-brand-text-secondary uppercase">Vehicle Model</label>
            <div className="text-brand-text-primary">{selectedPayment.vehicleModel}</div>
          </div>
          <div>
            <label className="text-xs text-brand-text-secondary uppercase">Job Card Number</label>
            <div className="text-brand-text-primary">{selectedPayment.jobCardNumber}</div>
          </div>
        </div>
      </div>

      {/* Service Information */}
      <div>
        <h3 className="text-lg font-semibold text-brand-text-primary border-b border-brand-border pb-2 mb-3">Service Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-brand-text-secondary uppercase">Service Type</label>
            <div className="text-brand-text-primary">{selectedPayment.serviceType}</div>
          </div>
          <div>
            <label className="text-xs text-brand-text-secondary uppercase">Collection Type</label>
            <div className="text-brand-text-primary">{selectedPayment.typeOfCollection}</div>
          </div>
        </div>
      </div>

      {/* Service Parts Information */}
      {selectedPayment.selectedParts && selectedPayment.selectedParts.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-brand-text-primary border-b border-brand-border pb-2 mb-3">Service Parts</h3>
          <div className="bg-gray-50 border border-brand-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-2 text-left">SNo</th>
                  <th className="px-3 py-2 text-left">Part No</th>
                  <th className="px-3 py-2 text-left">Part Description</th>
                  <th className="px-3 py-2 text-left">Model</th>
                </tr>
              </thead>
              <tbody>
                {selectedPayment.selectedParts.map((part, idx) => (
                  <tr key={idx} className="border-t border-brand-border">
                    <td className="px-3 py-2">{idx + 1}</td>
                    <td className="px-3 py-2">{part.partNo}</td>
                    <td className="px-3 py-2">{part.partDescription || part.partName}</td>
                    <td className="px-3 py-2">{part.Model || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Additional Service Plans */}
      {selectedPayment.hasAdditionalPlan && selectedPayment.additionalPlanCollections && selectedPayment.additionalPlanCollections.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-brand-text-primary border-b border-brand-border pb-2 mb-3">Additional Service Plans</h3>
          <div className="bg-gray-50 border border-brand-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-2 text-left">SNo</th>
                  <th className="px-3 py-2 text-left">Plan Type</th>
                  <th className="px-3 py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {selectedPayment.additionalPlanCollections.map((plan, idx) => {
                  const amount = selectedPayment.additionalPlanDetails && selectedPayment.additionalPlanDetails[plan.id] 
                    ? selectedPayment.additionalPlanDetails[plan.id] 
                    : "0";
                  return (
                    <tr key={idx} className="border-t border-brand-border">
                      <td className="px-3 py-2">{idx + 1}</td>
                      <td className="px-3 py-2">{plan.typeOfCollect}</td>
                      <td className="px-3 py-2 text-right">₹{parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-100 font-semibold border-t border-brand-border">
                <tr>
                  <td className="px-3 py-2 text-right" colSpan={2}>Total Plan Amount</td>
                  <td className="px-3 py-2 text-right">₹{parseFloat(selectedPayment.additionalPlanAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Previous Payment Sessions (for completed part payments) */}
      {selectedPayment.paymentSessions && selectedPayment.paymentSessions.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-brand-text-primary border-b border-brand-border pb-2 mb-3">
            {getPaymentTypeLabel(selectedPayment.paymentType)} Payment Session Summary {selectedPayment.vehicleNumber ? `(Vehicle: ${selectedPayment.vehicleNumber})` : ''}
          </h3>
          <div className="bg-gray-50 border border-brand-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-2 text-left">Receipt No</th>
                  <th className="px-3 py-2 text-left">Date</th>
                  <th className="px-3 py-2 text-left">Vehicle</th>
                  <th className="px-3 py-2 text-left">Type</th>
                  <th className="px-3 py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {selectedPayment.paymentSessions.map((session, idx) => (
                  <tr key={idx} className="border-t border-brand-border">
                    <td className="px-3 py-2">{session.receiptNo}</td>
                    <td className="px-3 py-2">{new Date(session.date).toLocaleDateString('en-GB')}</td>
                    <td className="px-3 py-2">{session.vehicleNumber || selectedPayment.vehicleNumber || 'N/A'}</td>
                    <td className="px-3 py-2"><span className={paymentTypeBadgeClass(session.paymentTypeMaster?.name || session.paymentType || selectedPayment.paymentType)}>{getPaymentTypeLabel(session.paymentTypeMaster?.name || session.paymentType || selectedPayment.paymentType)}</span></td>
                    <td className="px-3 py-2 text-right">₹{session.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Additional Information */}
      <div>
        <h3 className="text-lg font-semibold text-brand-text-primary border-b border-brand-border pb-2 mb-3">Additional Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-brand-text-secondary uppercase">Reference Number</label>
            <div className="text-brand-text-primary">{selectedPayment.refNo || 'N/A'}</div>
          </div>
          <div>
            <label className="text-xs text-brand-text-secondary uppercase">Entered By</label>
            <div className="text-brand-text-primary">{selectedPayment.enteredBy}</div>
          </div>
          <div className="md:col-span-2">
            <label className="text-xs text-brand-text-secondary uppercase">Remarks</label>
            <div className="text-brand-text-primary">{selectedPayment.remarks || 'N/A'}</div>
          </div>
        </div>
      </div>
    </div>
  )}
</Modal>

      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Delete">
        <div className="space-y-4"><p className="text-brand-text-primary">Are you sure you want to delete service payment <strong>{paymentToDelete?.receiptNo}</strong>?</p><div className="flex justify-end gap-4"><button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 rounded-lg bg-white hover:bg-brand-hover text-brand-text-secondary font-bold border border-brand-border">Cancel</button><button onClick={handleDelete} className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold">Delete</button></div></div>
      </Modal>

      <Modal isOpen={isCancelModalOpen} onClose={() => setIsCancelModalOpen(false)} title="Confirm Cancel Payment">
        <div className="space-y-4"><p className="text-brand-text-primary">Are you sure you want to cancel service payment <strong>{paymentToCancel?.receiptNo}</strong>? The amount will be set to ₹0.</p><div className="flex justify-end gap-4"><button onClick={() => setIsCancelModalOpen(false)} className="px-4 py-2 rounded-lg bg-white hover:bg-brand-hover text-brand-text-secondary font-bold border border-brand-border">No</button><button onClick={handleCancel} className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold">Yes, Cancel Payment</button></div></div>
      </Modal>

      <ConfirmModal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        onConfirm={handleClearAll}
        title="Confirm Clear All"
        message="Are you sure you want to delete ALL service payment collection records? This action cannot be undone and will permanently erase the data."
        confirmText="Yes, Clear All"
      />

      <PineLabsModal
        isOpen={isPineLabsModalOpen}
        onClose={() => setIsPineLabsModalOpen(false)}
        amount={formData.recAmt}
        customerName={loadedCustomer ? loadedCustomer.name : newCustomerData.name}
        mobileNumber={loadedCustomer ? loadedCustomer.contactNo : newCustomerData.contactNo}
        referenceId={formData.jobCardNumber || formData.refNo || ''}
        createdBy={user?.id}
        onSuccess={(txId) => {
          setPineLabsTxnId(txId);
          setIsPineLabsModalOpen(false);
          // Small delay to allow state update before auto-submitting
          setTimeout(() => {
            const submitEvent = new Event('submit', { cancelable: true, bubbles: true });
            const form = document.getElementById('service-payment-form');
            if (form) form.dispatchEvent(submitEvent);
          }, 100);
        }}
      />
    </div>
  );
};

export default ServicePaymentCollection;
