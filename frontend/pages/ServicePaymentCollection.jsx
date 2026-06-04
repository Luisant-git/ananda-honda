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
import { vehicleModelApi } from "../api/vehicleModelApi.js";
import { menuPermissionApi } from "../api/menuPermissionApi";
import hondaLogo from "../assets/honda.png";
import { serviceJobCardApi } from "../api/serviceJobcard";
import { serviceTypeApi } from "../api/serviceTypeApi.js";
import { serviceTypeOfPartApi } from "../api/serviceTypeOfPartApi.js";

const ServicePaymentCollection = ({ user }) => {
  const [permissions, setPermissions] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [paymentModes, setPaymentModes] = useState([]);
  console.log('service payment modes', paymentModes);

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
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEntries, setTotalEntries] = useState(0);
  const [itemsPerPage] = useState(10);
  const [serviceTypeOfCollections, setServiceTypeOfCollections] = useState([]);
  const [serviceTypes, setServiceTypes] = useState([]);
  
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
    recAmt: "",
    paymentType: "full payment",
    paymentStatus: "completed",
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
    return ['closed', 'completed', 'cancelled', 'canceled', 'close'].includes(normalizedStatus);
  };

  const isClosedJobCard = isJobCardClosed(serviceJobCardInfo?.status);
  // Calculate total only for current job card payments
  const totalReceivedAmount = isClosedJobCard ? 0 : pendingPayments.reduce((sum, p) => sum + p.recAmt, 0);

  const getPaymentTotalAmount = (payment) => {
    if (!payment) return 0;
    if (payment.totalAmt !== undefined && payment.totalAmt !== null) {
      return payment.totalAmt;
    }
    const sessionsTotal = (payment.paymentSessions || []).reduce((sum, session) => sum + (session.amount || 0), 0);
    return sessionsTotal + (payment.recAmt || 0);
  };

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

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
  
  if (customer.isInvoice) {
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
  
  if (customer.isJobCard) {
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
          return status === 'pending' || status === 'open';
        });
        
        const closedJobCard = customerJobCards.find(jc => {
          const status = (jc.status || '').toString().toLowerCase();
          return ['closed', 'completed', 'cancelled', 'canceled'].includes(status);
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
  }));

  const fetchData = async () => {
    // Check if this fetch is still for the current selection
    if (customerSelectionId.current !== currentSelectionId) {
      console.log('Selection changed, aborting fetch for:', customer.name);
      return;
    }
    
    let invoiceInfo = null;
    let lastPaymentInfo = null;
    let jobCardInfoFromPayment = null;

    // Fetch last payment details
    try {
      const allPaymentsResponse = await servicePaymentCollectionApi.getAll(1, 100, customer.id);
      if (customerSelectionId.current !== currentSelectionId) return;
      
      const allPayments = Array.isArray(allPaymentsResponse) ? allPaymentsResponse : allPaymentsResponse?.data || [];
      const lastPayment = allPayments.sort((a, b) => new Date(b.date) - new Date(a.date))[0];

      if (lastPayment) {
        lastPaymentInfo = lastPayment;

        if (lastPayment.jobCardNumber && lastPayment.jobCardNumber !== 'N/A') {
          try {
            const foundJobCard = await fetchJobCardByNumber(lastPayment.jobCardNumber, customer.contactNo);
            if (customerSelectionId.current !== currentSelectionId) return;
            if (foundJobCard && foundJobCard.mobileNumber?.toString().trim() === customer.contactNo?.toString().trim()) {
              jobCardInfoFromPayment = foundJobCard;
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
      if (customerSelectionId.current !== currentSelectionId) return;
      invoiceInfo = invoiceResults.length > 0 ? invoiceResults[0] : null;
      setSalesInvoiceInfo(invoiceInfo);
    } catch (error) {
      console.error("Error fetching invoice:", error);
    }

    // Fetch customer payment history
    try {
      const historyResponse = await servicePaymentCollectionApi.getAll(1, 1000, customer.id);
      if (customerSelectionId.current !== currentSelectionId) return;
      setCustomerHistory(historyResponse.data || []);
    } catch (error) {
      console.error("Error fetching history:", error);
    }

    if (customerSelectionId.current !== currentSelectionId) return;
    
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
      
      toast.success(`Loaded last payment details for ${customer.name}`, { duration: 3000 });
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
    
    if (customerSelectionId.current === currentSelectionId) {
      console.log('Setting form data for:', customer.name);
      setFormData(updatedFormData);
    }
  };

  await fetchData();
  setShowDropdown(false);
};
// Auto-fetch job card details when job card number changes
useEffect(() => {
  const autoFetchJobCardDetails = async () => {
    if (formData.jobCardNumber && formData.paymentType === "full payment" && !isEditMode) {
      setIsCheckingJobCard(true);
      const jobCard = await fetchJobCardByNumber(formData.jobCardNumber);
      setFoundJobCard(jobCard);
      
      if (jobCard) {
        console.log('Found existing job card:', jobCard);
        setServiceJobCardInfo(jobCard);
        
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
        setIsManualJobCard(true);
        setServiceJobCardInfo(null);
        setPendingPayments([]);
        toast(`Job card "${formData.jobCardNumber}" not found. You can create a new one.`, { duration: 3000 });
      }
      setIsCheckingJobCard(false);
    }
  };
  
  const timeoutId = setTimeout(() => {
    autoFetchJobCardDetails();
  }, 500);
  
  return () => clearTimeout(timeoutId);
}, [formData.jobCardNumber, formData.paymentType, serviceTypes, vehicleModels, serviceTypeOfCollections, isEditMode]);


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
    fetchTypeOfPayments();
    fetchServiceTypeOfCollections();
    fetchVehicleModels();
    fetchPayments();
    fetchPermissions();
    fetchDeletedPayments();
    fetchServiceTypes();
    fetchAvailableParts();
  }, []);

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
    // Clear stale service job card info whenever the selected customer changes.
    setServiceJobCardInfo(null);
  }, [selectedCustomerId, loadedCustomer?.id]);

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
      const isActive = status === 'pending' || status === 'open';
      const isClosed = ['closed', 'completed', 'cancelled', 'canceled', 'close'].includes(status);
      
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
      if (customer.hasInvoice || customer.isInvoice) badges.push('Invoice');
      if (customer.hasJobCard || customer.isJobCard) badges.push('Service Dealership');
      
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
      paymentType: payment.paymentType,
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
        paymentType: payment.paymentType,
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
    
    if (formData.paymentType === "part payment" && newStatus === "completed") {
      newPaymentType = "full payment";
      toast.success("Payment type will be changed to Full Payment", { duration: 3000 });
    }
    
    setFormData({ 
      ...formData, 
      paymentStatus: newStatus,
      paymentType: newPaymentType
    });
  };


  // Function to check and update job card status after payment
const checkAndUpdateJobCardStatus = async (jobCardNumber, customerId) => {
  if (!jobCardNumber || jobCardNumber === "N/A") return;

  try {
    // Get all job cards
    const allJobCards = await serviceJobCardApi.getAll();
    const jobCard = allJobCards.find(jc => jc.jobCardNumber === jobCardNumber);

    if (!jobCard) return;
    
    // Check if already closed
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
    if (totalPaid >= invoiceAmount) {
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
  if (formData.paymentType === "part payment" && !formData.vehicleNumber) {
    toast.error("Vehicle number is mandatory for part payment");
    return;
  }

  // Validate job card number for full payment
  if (formData.paymentType === "full payment" && !formData.jobCardNumber) {
    toast.error("Job card number is mandatory for full payment");
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

    // Handle job card creation
    let finalJobCardNumber = formData.jobCardNumber;
    let createdJobCardId = null;

    if (formData.paymentType === "full payment" && formData.jobCardNumber) {
      try {
        const allJobCards = await serviceJobCardApi.getAll();
        const existingJobCard = allJobCards.find(jc => jc.jobCardNumber === formData.jobCardNumber);
        
        if (existingJobCard) {
          finalJobCardNumber = existingJobCard.jobCardNumber;
          createdJobCardId = existingJobCard.id;
        } else {
          const newJobCard = await serviceJobCardApi.create({
            jobCardNumber: formData.jobCardNumber,
            registrationNumber: formData.vehicleNumber || '',
            customerName: loadedCustomer?.name || newCustomerData.name,
            mobileNumber: loadedCustomer?.contactNo || newCustomerData.contactNo,
            vehicleDetails: vehicleModels.find(v => v.id.toString() === formData.vehicleModelId)?.model || '',
            serviceType: serviceTypes.find(s => s.id.toString() === formData.serviceTypeId)?.name || '',
            status: 'Pending'
          });
          finalJobCardNumber = newJobCard.jobCardNumber;
          createdJobCardId = newJobCard.id;
          toast.success('New job card created successfully!');
          fetchCustomers();
        }
      } catch (error) {
        toast.error('Failed to create job card: ' + error.message);
        setIsSubmitting(false);
        return;
      }
    }

    const submitData = {
      date: formData.date,
      customerId: customerId,
      recAmt: parseFloat(formData.recAmt),
      paymentType: formData.paymentType,
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
    };

    // FIRST: Create or update payment
    if (isEditMode) {
      await servicePaymentCollectionApi.update(editingPayment.id, submitData);
      toast.success("Service payment updated successfully!");
    } else {
      await servicePaymentCollectionApi.create(submitData);
      toast.success("Service payment created successfully!");
    }

    // SECOND: After payment is created, check and update job card status
    if (finalJobCardNumber) {
      await checkAndUpdateJobCardStatus(finalJobCardNumber, customerId);
      
      // THIRD: Refresh the job card info from the database after a short delay
      setTimeout(async () => {
        await refreshJobCardStatus(finalJobCardNumber);
      }, 1500);
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
  
const fetchCustomerPayments = (customerId, jobCardNumber) => {
  if (!customerId) {
    setPendingPayments([]);
    return;
  }
  
  // Filter by BOTH customerId AND jobCardNumber
  if (jobCardNumber && jobCardNumber !== 'N/A') {
    const jobCardPayments = payments.filter(
      (p) => p.customerId === customerId && p.jobCardNumber === jobCardNumber
    );
    setPendingPayments(jobCardPayments);
  } else {
    setPendingPayments([]);
  }
};

useEffect(() => {
  const fetchHistory = async () => {
    if (isPaymentModalOpen && loadedCustomer) {
      try {
        const response = await servicePaymentCollectionApi.getAll(1, 1000, loadedCustomer.id);
        setCustomerHistory(response.data || []);
      } catch (error) {
        console.error("Error fetching customer history:", error);
      }
    }
  };
  fetchHistory();

  if (isPaymentModalOpen && !isEditMode && loadedCustomer) {
    // Get the current job card number from formData
    const currentJobCardNumber = formData.jobCardNumber;
    
    if (currentJobCardNumber && currentJobCardNumber !== 'N/A') {
      // Filter payments for THIS SPECIFIC job card only
      const jobCardPayments = payments.filter(
        (p) => p.customerId === loadedCustomer.id && p.jobCardNumber === currentJobCardNumber
      );
      setPendingPayments(jobCardPayments);
      console.log('Payments for job card:', currentJobCardNumber, jobCardPayments);
    } else {
      // No job card number yet (new service entry)
      setPendingPayments([]);
    }
  }
}, [isPaymentModalOpen, formData.paymentType, loadedCustomer, payments, formData.jobCardNumber]);

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
  const handleEdit = (payment) => {
    setIsEditMode(true);
    setEditingPayment(payment);
    const customer = customers.find((c) => c.id === payment.customerId);
    setLoadedCustomer(customer);
    setSelectedCustomerId(customer.id.toString());
    setFormData({
      date: new Date(payment.date).toISOString().split("T")[0],
      totalAmt: payment.totalAmt?.toString() || "",
      recAmt: payment.recAmt.toString(),
      paymentType: payment.paymentType,
      paymentStatus: payment.paymentStatus,
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

    return (
      customer.name.toLowerCase().includes(normalizedSearch) ||
      customer.contactNo.includes(searchTerm) ||
      jobCardNumbers.some((jcNumber) => jcNumber.includes(normalizedSearch))
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
        <div style="width: 210mm; height: 297mm; font-family: Arial, sans-serif; font-size: 14px; padding: 20px; box-sizing: border-box;">
          <div style="border: 1px solid #000; padding: 20px; height: 100%; box-sizing: border-box;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 25px;">
              <div style="flex: 1;">
                <h3 style="margin: 0; font-size: 28px; font-weight: bold; margin-bottom: 15px;">ANANDA MOTOWINGS PRIVATE LIMITED</h3>
                <p style="margin: 0; font-size: 16px; line-height: 1.6;">Sy no, 53/2 and 53/3, Carvan Compound, Hosur Road, 6th Mile,<br>Near Silk board Junction, Bomannahalli, Bengaluru,<br>Bengaluru Urban, Karnataka, 560068<br><strong>Contact No :</strong> +919071755550<br><strong>GSTIN:</strong> 29ABBCA7185M1Z2</p>
              </div>
              <div style="margin-left: 20px;">
                <img src="${logoDataUrl}" alt="Honda Logo" style="width: 120px; height: 90px;" />
              </div>
            </div>
            <div style="text-align: center; color: #000; background: white; padding: 15px; margin-bottom: 30px; font-size: 24px; border: 3px solid #000;">
              <strong>SERVICE RECEIPT</strong>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 25px; font-size: 16px;">
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
            <p style="margin: 25px 0; font-size: 16px;">We thankfully acknowledge the receipt of your payment towards for Collection - ${payment.typeOfCollection || "N/A"}</p>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 16px;">
              <tr>
                <td style="border: 1px solid #000; padding: 10px; font-weight: bold; width: 50%;">Received Amount:</td>
                <td style="border: 1px solid #000; padding: 10px; font-weight: bold; width: 50%;">REMARKS</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 10px; text-align: center;">₹${payment.recAmt}<br>${amountInWords}</td>
                <td style="border: 1px solid #000; padding: 10px; text-align: center;">${payment.remarks || "N/A"}</td>
              </tr>
            </table>
            <div style="display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 16px;">
              <div><strong>Mode Of Payment:</strong> ${payment.paymentMode}</div>
              <div><strong>Customer Opting ${payment.paymentMode}</strong></div>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 16px;">
              <div><strong>Ref No:</strong> ${payment.refNo || "N/A"}</div>
              <div>${payment.typeOfPayment || "N/A"}</div>
            </div>
            <div style="border: 1px solid #000; padding: 15px; margin-bottom: 30px; font-size: 14px;">
              <div>Issued Subject to Realisation of Cheque.</div>
              <div>Price ruling at the time of delivery will be charged.</div>
              <div>Any refund through cheques only within 25 working days.</div>
              <div>Subject To BANGALORE Jurisdiction.</div>
            </div>
            <div style="text-align: right; margin-bottom: 40px; margin-top: 20px; font-size: 16px;">
              <strong>Received and Verified By</strong>
            </div>
            <div style="text-align: right; margin-bottom: 20px;">
              <div style="margin-top: 60px; font-size: 16px;"><strong>Authorised Signatory with Seal</strong></div>
            </div>
            <div style="font-size: 10px; text-align: center; border-top: 1px solid #000; padding-top: 10px; margin-top: 20px;">
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
    { header: "Payment Type", accessor: "paymentType" },
    { header: "Status", accessor: "paymentStatus" },
    { header: "Vehicle No", accessor: "vehicleNumber" },
    { header: "Total Amt", accessor: "totalAmt" },
    { header: "Received Amt", accessor: "recAmt" },
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

    const usedNames = activeHistory.map(p => {
      const name = p.serviceTypeRelation?.name || p.serviceType || "";
      return normalizeServiceName(name);
    });

    const hasFree1 = usedNames.includes("FREE1");
    const hasFree2 = usedNames.includes("FREE2");
    const hasFree3 = usedNames.includes("FREE3");

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
      <div className="flex justify-between items-center">
        <h1 className="text-xl sm:text-2xl font-bold text-brand-text-primary">Service Payment Collection</h1>
        {permissions?.payment_collection?.service?.view_deleted && (
          <button onClick={() => { setShowDeleted(!showDeleted); if (!showDeleted) fetchDeletedPayments(); }} className={`px-4 py-2 rounded-lg font-medium ${showDeleted ? "bg-gray-500 text-white hover:bg-gray-600" : "bg-orange-600 text-white hover:bg-orange-700"}`}>
            {showDeleted ? "Show Active" : "Show Trash"}
          </button>
        )}
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
                  placeholder="Search by name,contact number or Job card number"
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
        {customer.hasActiveJobCard && customer.activeJobCard && (() => {
          const status = (customer.activeJobCard.status || '').toString().toLowerCase();
          const trimmed = status.trim();
          const label = trimmed === 'pending' ? 'Job Card Pending'
            : trimmed === 'open' ? 'Job Card Open'
            : trimmed === 'completed' ? 'Job Card Completed'
            : trimmed === 'cancelled' || trimmed === 'canceled' ? 'Job Card Cancelled'
            : trimmed === 'closed' || trimmed === 'close' ? 'Job Card Closed'
            : `Job Card ${customer.activeJobCard.status}`;
          const bg = trimmed === 'pending' ? 'bg-yellow-100 text-yellow-700'
            : trimmed === 'open' ? 'bg-blue-100 text-blue-700'
            : trimmed === 'completed' ? 'bg-green-100 text-green-700'
            : trimmed === 'cancelled' || trimmed === 'canceled' ? 'bg-red-100 text-red-600'
            : trimmed === 'closed' || trimmed === 'close' ? 'bg-red-100 text-red-600'
            : 'bg-gray-100 text-gray-700';
          return (
            <span className={`text-[10px] ${bg} px-2 py-0.5 rounded-full font-bold uppercase`}>
              {label}
            </span>
          );
        })()}
        {customer.hasClosedJobCard && !customer.hasActiveJobCard && customer.closedJobCard && (() => {
          const status = (customer.closedJobCard.status || '').toString().toLowerCase();
          const trimmed = status.trim();
          const label = trimmed === 'closed' || trimmed === 'close' ? 'Job Card Closed'
            : trimmed === 'completed' ? 'Job Card Completed'
            : trimmed === 'cancelled' || trimmed === 'canceled' ? 'Job Card Cancelled'
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
                    <div className="pt-2 flex justify-start">{permissions?.payment_collection?.service?.add && (<button onClick={() => setIsPaymentModalOpen(true)} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg" disabled={!newCustomerData.name || !newCustomerData.contactNo || !newCustomerData.address}>Pay</button>)}</div>
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
                      <div className="pt-2 flex justify-start">{permissions?.payment_collection?.service?.add && (<button onClick={() => setIsPaymentModalOpen(true)} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg">Pay</button>)}</div>
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
{/* Display Job Card Information for ALL Statuses */}
{/* Display Job Card Information for ALL Statuses - For Reference Only */}
{serviceJobCardInfo && (
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
      {serviceJobCardInfo.invoiceNumber && serviceJobCardInfo.invoiceNumber !== 'N/A' && (
        <div>
          <span className="font-medium text-gray-600">Invoice Number:</span>
          <span className="ml-2 font-semibold">{serviceJobCardInfo.invoiceNumber}</span>
        </div>
      )}
      {serviceJobCardInfo.totalRevenue > 0 && (
        <div>
          <span className="font-medium text-gray-600">Total Invoice Amount:</span>
          <span className="ml-2 font-semibold">₹{serviceJobCardInfo.totalRevenue}</span>
        </div>
      )}
    </div>
  </div>
)}


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
        pagination={!showDeleted ? { page: currentPage, limit: itemsPerPage, total: totalEntries, totalPages: totalPages, onPageChange: (page) => { setCurrentPage(page); fetchPayments(page); } } : undefined}
      />

      <Modal isOpen={isPaymentModalOpen} onClose={() => { setIsPaymentModalOpen(false); setPendingPayments([]); setSelectedParts([]); setPartSearchTerm(''); }} title={isEditMode ? "Edit Service Payment" : "Service Payment Entry"} maxWidth="max-w-4xl">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            {/* Row 1: Basic Info */}
            <div><label className="block text-sm font-medium text-brand-text-secondary mb-1">Date <span className="text-red-500">*</span></label><input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full bg-white border border-brand-border text-brand-text-primary rounded-lg p-2" required disabled /></div>
            <div><label className="block text-sm font-medium text-brand-text-secondary mb-1">Payment Type <span className="text-red-500">*</span></label>
              <select 
                value={formData.paymentType} 
                onChange={(e) => { 
                  const newPaymentType = e.target.value; 
                  setFormData({ ...formData, paymentType: newPaymentType, paymentStatus: newPaymentType === "full payment" ? "completed" : "pending" }); 
                  if (loadedCustomer) fetchCustomerPayments(loadedCustomer.id, formData.jobCardNumber); 
                }} 
                className="w-full bg-white border border-brand-border text-brand-text-primary rounded-lg p-2" 
                required
              >
                <option value="full payment">Full Payment</option>
                <option value="part payment">Part Payment</option>
              </select>
            </div>

            {/* Row 2: Vehicle Info */}
            <div><label className="block text-sm font-medium text-brand-text-secondary mb-1">Vehicle Number {formData.paymentType === "part payment" && <span className="text-red-500">*</span>}</label><input type="text" value={formData.vehicleNumber} onChange={(e) => { const vehicleNum = e.target.value.toUpperCase(); setFormData({ ...formData, vehicleNumber: vehicleNum }); }} className="w-full bg-white border border-brand-border text-brand-text-primary rounded-lg p-2" placeholder="Enter vehicle number" required={formData.paymentType === "part payment"} /></div>
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
{formData.paymentType === "full payment" && (
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
        placeholder="Enter Job Card Number (will auto-fetch if exists)"
        required
      />
      
      {/* Show status message */}
      {formData.jobCardNumber && formData.paymentType === "full payment" && (
        <div className="flex items-center gap-2 text-sm">
          {isCheckingJobCard ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-brand-accent"></div>
              <span className="text-brand-text-secondary">Checking job card...</span>
            </div>
          ) : foundJobCard ? (
            <div className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span className="text-green-600">Job card found! Details auto-filled.</span>
            </div>
          ) : isManualJobCard && formData.jobCardNumber ? (
            <div className="flex items-center gap-2">
              <span className="text-amber-600">⚠️</span>
              <span className="text-amber-600">Job card not found. Will create new one on submission.</span>
            </div>
          ) : null}
        </div>
      )}
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
            <SearchableDropdown label="Type of Collection" value={formData.serviceTypeOfCollectionId} onChange={(value) => { const selectedType = serviceTypeOfCollections.find(type => type.id === parseInt(value)); setFormData({ ...formData, serviceTypeOfCollectionId: value, vehicleModelId: selectedType?.disableVehicleModel ? "" : formData.vehicleModelId }); }} options={serviceTypeOfCollections.map(type => ({ value: type.id.toString(), label: type.typeOfCollect }))} />
            <div><label className="block text-sm font-medium text-brand-text-secondary mb-1">Amount <span className="text-red-500">*</span></label><input type="number" step="0.01" value={formData.recAmt} onChange={(e) => setFormData({ ...formData, recAmt: e.target.value })} className="w-full bg-white border border-brand-border text-brand-text-primary rounded-lg p-2" required /></div>

            {/* Row 5: Payment Method */}
            <SearchableDropdown label="Payment Mode" value={formData.paymentModeId} onChange={(value) => setFormData({ ...formData, paymentModeId: value, typeOfPaymentId: "" })} options={paymentModes.map(mode => ({ value: mode.id.toString(), label: mode.paymentMode }))} required />
            <SearchableDropdown label="Type of Payment Mode" value={formData.typeOfPaymentId} onChange={(value) => setFormData({ ...formData, typeOfPaymentId: value })} options={filteredTypeOfPayments.map(type => ({ value: type.id.toString(), label: type.typeOfMode }))} />

            {/* Row 6: Reference Number */}
            <div><label className="block text-sm font-medium text-brand-text-secondary mb-1">Reference Number</label><input type="text" value={formData.refNo} onChange={(e) => setFormData({ ...formData, refNo: e.target.value })} className="w-full bg-white border border-brand-border text-brand-text-primary rounded-lg p-2" /></div>
            
            {/* Part Selection for Part Payment */}
            {formData.paymentType === "part payment" && (
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
            {formData.paymentType === "part payment" && selectedParts.length > 0 && (
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
            {formData.paymentType === "part payment" && (
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
                {formData.paymentStatus === "completed" && formData.paymentType === "part payment" && (
                  <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                    ⚡ Note: This will change Payment Type to "Full Payment"
                  </p>
                )}
                {formData.paymentStatus === "completed" && formData.paymentType === "full payment" && (
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
            {(pendingPayments.length > 0 || isClosedJobCard) && (
              <div className="md:col-span-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                <label className="block text-sm font-medium text-blue-900 mb-2">
                  Previous Payments for this customer {formData.paymentType === "full payment" && "(All Payments)"}
                </label>
                {!isClosedJobCard ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {pendingPayments.map((payment) => (
                      <div key={payment.id} className="flex justify-between text-sm border-b border-blue-100 pb-2">
                        <div className="flex gap-4">
                          <span className="text-blue-800 font-medium">{payment.receiptNo}</span>
                          <span className="text-blue-600">{new Date(payment.date).toLocaleDateString('en-GB')}</span>
                          {payment.paymentType === 'part payment' && (
                            <span className="text-orange-600 text-xs bg-orange-100 px-2 rounded-full">Part Payment</span>
                          )}
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
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-brand-text-secondary">This job card is closed. Previous payments are hidden.</p>
                )}
                <div className="border-t border-blue-300 pt-2 mt-2 flex justify-between font-bold">
                  <span className="text-blue-900">Total Amount Received:</span>
                  <span className="text-blue-900">₹{totalReceivedAmount}</span>
                </div>
              </div>
            )}

            {/* Total Paid Amount Info - Full Width */}
            {formData.paymentType === "part payment" && formData.paymentStatus === "completed" && pendingPayments.length > 0 && !isClosedJobCard && (
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
      <div className="text-brand-text-primary font-medium">{selectedPayment.paymentType}</div>
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
      <div className="text-brand-text-primary font-medium text-lg">₹{selectedPayment.recAmt}</div>
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
      <div>
        <label className="text-xs text-brand-text-secondary uppercase">Total Invoice Amount</label>
        <div className="text-brand-text-primary font-medium">₹{selectedPayment.totalInvoiceAmount.toLocaleString('en-IN')}</div>
      </div>
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

      {/* Previous Payment Sessions (for completed part payments) */}
      {selectedPayment.paymentSessions && selectedPayment.paymentSessions.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-brand-text-primary border-b border-brand-border pb-2 mb-3">Previous Payment Sessions</h3>
          <div className="bg-gray-50 border border-brand-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-2 text-left">Receipt No</th>
                  <th className="px-3 py-2 text-left">Date</th>
                  <th className="px-3 py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {selectedPayment.paymentSessions.map((session, idx) => (
                  <tr key={idx} className="border-t border-brand-border">
                    <td className="px-3 py-2">{session.receiptNo}</td>
                    <td className="px-3 py-2">{new Date(session.date).toLocaleDateString('en-GB')}</td>
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
    </div>
  );
};

export default ServicePaymentCollection;

