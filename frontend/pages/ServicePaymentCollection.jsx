import React, { useState, useEffect } from "react";
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
import hondaLogo from "../assets/honda-logo.svg";
import { serviceJobCardApi } from "../api/serviceJobcard";
import { serviceTypeApi } from "../api/serviceTypeApi.js";

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
  }, []);

  // Effect to set service type from job card info
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
      
      if (serviceTypeName) {
        setFormData(prev => ({
          ...prev,
          serviceTypeId: serviceTypeId,
          serviceType: serviceTypeName
        }));
      }
    }
  }, [serviceJobCardInfo, isEditMode]);

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
      if (!event.target.closest(".customer-dropdown")) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (serviceJobCardInfo && !isEditMode && serviceTypeOfCollections.length > 0) {
      const jc = serviceJobCardInfo;
      
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
      
      const modelName = jc.vehicleDetails ? jc.vehicleDetails.toLowerCase() : "";
      const matchedModel = vehicleModels.find((m) => {
        const mm = m.model.toLowerCase();
        return (
          modelName &&
          (mm === modelName || mm.includes(modelName) || modelName.includes(mm))
        );
      });
      
      let matchedCollectionId = "";
      if (serviceTypeName) {
        const matchedTypeOfCollection = serviceTypeOfCollections.find(
          (type) => type.typeOfCollect?.toLowerCase() === serviceTypeName.toLowerCase()
        );
        matchedCollectionId = matchedTypeOfCollection ? matchedTypeOfCollection.id.toString() : "";
      }
      
      setFormData((prev) => ({
        ...prev,
        jobCardNumber: jc.jobCardNumber || prev.jobCardNumber,
        vehicleNumber: jc.registrationNumber || prev.vehicleNumber,
        serviceTypeId: serviceTypeId || prev.serviceTypeId,
        serviceType: serviceTypeName || prev.serviceType,
        serviceTypeOfCollectionId: matchedCollectionId || prev.serviceTypeOfCollectionId,
        vehicleModelId: matchedModel ? matchedModel.id.toString() : prev.vehicleModelId,
      }));
    }
  }, [serviceJobCardInfo, vehicleModels, serviceTypeOfCollections, isEditMode]);

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
      const [customerData, invoiceData, jobCardData] = await Promise.all([
        customerApi.getAll(),
        salesInvoiceApi.getAll(),
        serviceJobCardApi.getAll(),
      ]);

      const invoiceContacts = new Set(invoiceData.map(inv => inv.contactInfo));
      const jobCardContacts = new Set(jobCardData.map(jc => jc.mobileNumber));

      const enrichedCustomerData = customerData.map(c => ({
        ...c,
        hasInvoice: invoiceContacts.has(c.contactNo),
        hasJobCard: jobCardContacts.has(c.contactNo),
      }));

      const customerContacts = new Set(customerData.map(c => c.contactNo));
      const external = [];
      const seenContacts = new Set();

      invoiceData.forEach(inv => {
        if (!customerContacts.has(inv.contactInfo) && !seenContacts.has(inv.contactInfo)) {
          external.push({
            id: `inv-${inv.id}`,
            name: inv.customerName,
            contactNo: inv.contactInfo,
            address: inv.address || "N/A",
            isInvoice: true,
            invoiceData: inv,
          });
          seenContacts.add(inv.contactInfo);
        }
      });

      jobCardData.forEach(jc => {
        if (!customerContacts.has(jc.mobileNumber) && !seenContacts.has(jc.mobileNumber)) {
          external.push({
            id: `jc-${jc.id}`,
            name: jc.customerName || "Unknown",
            contactNo: jc.mobileNumber,
            address: "Imported from Service Master",
            isJobCard: true,
            jobCardData: jc,
          });
          seenContacts.add(jc.mobileNumber);
        }
      });

      setCustomers([...enrichedCustomerData, ...external]);
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

const fetchServiceTypes = async () => {
  try {
    const data = await serviceTypeApi.getAll();
    console.log("Fetched service types raw data:", data);
    
    // Handle both array response or response with data property
    const typesArray = Array.isArray(data) ? data : data.data || [];
    console.log("Types array:", typesArray);
    
    // Filter by status - note: your backend uses "ACTIVE" not "Enable"
    const enabledTypes = typesArray.filter((type) => {
      // Convert status to lowercase for case-insensitive comparison
      const status = type.status?.toLowerCase();
      return status === 'active' || status === 'enable';
    });
    
    console.log("Enabled service types:", enabledTypes);
    setServiceTypes(enabledTypes);
    
    // If no enabled types, show all types as fallback
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
      setVehicleModels(data.filter((model) => model.status === "Enable"));
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
        refNo: payment.refNo || "N/A",
        remarks: payment.remarks || "N/A",
        jobCardNumber: payment.jobCardNumber || "N/A",
        serviceType: payment.serviceTypeRelation?.name || "N/A",
        paymentSessions: payment.paymentSessions || [],
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

 const handleSubmit = async (e) => {
  e.preventDefault();

  if (isNewCustomer && !/^\d{10}$/.test(newCustomerData.contactNo)) {
    toast.error("Mobile number must be exactly 10 digits");
    return;
  }

  if (formData.paymentType === "part payment" && !formData.vehicleNumber) {
    toast.error("Vehicle number is mandatory for part payment");
    return;
  }

  setIsSubmitting(true);
  try {
    let customerId = loadedCustomer?.id;

    if (isNewCustomer) {
      const newCustomer = await customerApi.create(newCustomerData);
      customerId = newCustomer.id;
      await fetchCustomers();
    }

    const totalAmt = formData.paymentStatus === 'completed' 
      ? pendingPayments.reduce((sum, p) => sum + p.recAmt, 0) + parseFloat(formData.recAmt)
      : undefined;

    const submitData = {
      date: formData.date,
      customerId: customerId,
      totalAmt: totalAmt,
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
      jobCardNumber: formData.jobCardNumber,
      serviceTypeId: formData.serviceTypeId ? parseInt(formData.serviceTypeId) : undefined,
      
    };

    if (isEditMode) {
      await servicePaymentCollectionApi.update(editingPayment.id, submitData);
      toast.success("Service payment updated successfully!");
    } else {
      await servicePaymentCollectionApi.create(submitData);
      toast.success("Service payment created successfully!");
    }

    setIsPaymentModalOpen(false);
    setIsEditMode(false);
    setEditingPayment(null);
    setIsNewCustomer(false);
    setCustomerHistory([]);
    setPendingPayments([]);
    
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
    
    setNewCustomerData({
      name: "",
      contactNo: "",
      address: "",
      status: "Walk in Customer",
    });
    
    setLoadedCustomer(null);
    setSelectedCustomerId("");
    setSalesInvoiceInfo(null);
    setServiceJobCardInfo(null);
    setSearchTerm("");
    
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
  const fetchPendingPayments = (customerId) => {
    if (!customerId) {
      setPendingPayments([]);
      return;
    }
    const pending = payments.filter(
      (p) => p.customerId === customerId && 
             p.paymentStatus === "pending" &&
             p.paymentType === "part payment"
    );
    setPendingPayments(pending);
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
      fetchPendingPayments(loadedCustomer.id);
    }
  }, [isPaymentModalOpen, formData.paymentType, loadedCustomer]);

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

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.contactNo.includes(searchTerm)
  );

  const handleCustomerSelect = async (customer) => {
    if (customer === "new") {
      setSelectedCustomerId("new");
      setSearchTerm("+ Add New Customer");
      setIsNewCustomer(true);
      setLoadedCustomer(null);
      setFilteredPayments(payments);
      setSalesInvoiceInfo(null);
      setServiceJobCardInfo(null);
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
    } else if (customer.isInvoice) {
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
      setServiceJobCardInfo(null);

      setFormData((prev) => ({
        ...prev,
        vehicleNumber: customer.invoiceData.vehicleRegNo || prev.vehicleNumber,
        vehicleModelId: vehicleModels.find((m) => {
          const model = m.model.toLowerCase();
          const invModel = customer.invoiceData.vehicleModel?.toLowerCase() || "";
          return invModel && (model === invModel || invModel.includes(model) || model.includes(invModel));
        })?.id.toString() || prev.vehicleModelId,
      }));
      setFilteredPayments(payments);
    } else if (customer.isJobCard) {
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
      setSalesInvoiceInfo(null);
      setServiceJobCardInfo(customer.jobCardData);
      
      const jc = customer.jobCardData;
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
      
      const modelName = jc.vehicleDetails ? jc.vehicleDetails.toLowerCase() : "";
      const matchedModel = vehicleModels.find((m) => {
        const mm = m.model.toLowerCase();
        return modelName && (mm === modelName || mm.includes(modelName) || modelName.includes(mm));
      });
      
      let matchedCollectionId = "";
      if (serviceTypeOfCollections.length > 0 && serviceTypeName) {
        const matchedTypeOfCollection = serviceTypeOfCollections.find(
          (type) => type.typeOfCollect?.toLowerCase() === serviceTypeName.toLowerCase()
        );
        matchedCollectionId = matchedTypeOfCollection ? matchedTypeOfCollection.id.toString() : "";
      }
      
      setFormData(prev => ({
        ...prev,
        jobCardNumber: jc.jobCardNumber || prev.jobCardNumber,
        vehicleNumber: jc.registrationNumber || prev.vehicleNumber,
        serviceTypeId: serviceTypeId,
        serviceType: serviceTypeName,
        serviceTypeOfCollectionId: matchedCollectionId || prev.serviceTypeOfCollectionId,
        vehicleModelId: matchedModel ? matchedModel.id.toString() : prev.vehicleModelId,
      }));
      
      setFilteredPayments(payments);
    } else {
      setSelectedCustomerId(customer.id.toString());
      setSearchTerm(customer.name);
      setLoadedCustomer(customer);
      setIsNewCustomer(false);

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

      setServiceJobCardInfo(null);
      setSalesInvoiceInfo(null);

      const fetchData = async () => {
        let invoiceInfo = null;
        let jobCardInfo = null;
        
        try {
          const invoiceResults = await salesInvoiceApi.getAll(customer.contactNo);
          invoiceInfo = invoiceResults.length > 0 ? invoiceResults[0] : null;
          setSalesInvoiceInfo(invoiceInfo);
        } catch (error) {
          console.error("Error fetching invoice:", error);
        }
        
        try {
          const jobCardResults = await serviceJobCardApi.getAll(customer.contactNo);
          jobCardInfo = jobCardResults && jobCardResults.length > 0 ? jobCardResults[0] : null;
          if (jobCardInfo) {
            setServiceJobCardInfo(jobCardInfo);
          }
        } catch (error) {
          console.error("Error fetching job card:", error);
        }
        
        setFormData(prev => {
          const updated = { ...prev };
          
          if (invoiceInfo) {
            updated.vehicleNumber = invoiceInfo.vehicleRegNo || prev.vehicleNumber;
            updated.vehicleModelId = vehicleModels.find((m) => {
              const mm = m.model.toLowerCase();
              const im = invoiceInfo.vehicleModel?.toLowerCase() || "";
              return im && (mm === im || im.includes(mm) || mm.includes(im));
            })?.id.toString() || prev.vehicleModelId;
          }
          
          if (jobCardInfo) {
            let serviceTypeId = "";
            let serviceTypeName = "";
            if (jobCardInfo.serviceType) {
              if (typeof jobCardInfo.serviceType === 'object') {
                serviceTypeId = jobCardInfo.serviceType.id?.toString() || "";
                serviceTypeName = jobCardInfo.serviceType.name || "";
              } else if (typeof jobCardInfo.serviceType === 'string') {
                serviceTypeName = jobCardInfo.serviceType;
              }
            }
            
            let matchedCollectionId = "";
            if (serviceTypeOfCollections.length > 0 && serviceTypeName) {
              const matchedTypeOfCollection = serviceTypeOfCollections.find(
                (type) => type.typeOfCollect?.toLowerCase() === serviceTypeName.toLowerCase()
              );
              matchedCollectionId = matchedTypeOfCollection ? matchedTypeOfCollection.id.toString() : "";
            }
            
            updated.jobCardNumber = jobCardInfo.jobCardNumber || prev.jobCardNumber;
            updated.serviceTypeId = serviceTypeId;
            updated.serviceType = serviceTypeName || prev.serviceType;
            updated.serviceTypeOfCollectionId = matchedCollectionId || prev.serviceTypeOfCollectionId;
            
            if (!updated.vehicleModelId && jobCardInfo.vehicleDetails) {
              const modelName = jobCardInfo.vehicleDetails.toLowerCase();
              const matchedModel = vehicleModels.find((m) => {
                const mm = m.model.toLowerCase();
                return modelName && (mm === modelName || mm.includes(modelName) || modelName.includes(mm));
              });
              updated.vehicleModelId = matchedModel ? matchedModel.id.toString() : prev.vehicleModelId;
            }
            
            if (!updated.vehicleNumber && jobCardInfo.registrationNumber) {
              updated.vehicleNumber = jobCardInfo.registrationNumber;
            }
          }
          
          return updated;
        });
      };
      
      await fetchData();
    }

    setShowDropdown(false);
  };

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

  const getFilteredServiceTypes = () => {
    if (!loadedCustomer) return serviceTypes;

    // Helper to normalize names (e.g., "FREE 02" -> "FREE2", "Free 1" -> "FREE1")
    const normalize = (name) => {
      if (!name) return "";
      return name.toUpperCase()
        .replace(/\s+/g, '')               // Remove all spaces
        .replace(/FREE0?([1-9])/g, 'FREE$1'); // Normalize FREE01/FREE 01 to FREE1
    };

    // Filter out cancelled payments from history
    const activeHistory = customerHistory.filter(p => !p.cancelledAt);
    
    // Get used service names
    const usedNames = activeHistory.map(p => {
      const name = p.serviceTypeRelation?.name || p.serviceType || "";
      return normalize(name);
    });
    
    // Check if services are already in history
    const hasFree1 = usedNames.includes("FREE1");
    const hasFree2 = usedNames.includes("FREE2");
    const hasFree3 = usedNames.includes("FREE3");

    console.log("Customer Service History Normalized:", usedNames);
    console.log("Status - Free1:", hasFree1, "Free2:", hasFree2, "Free3:", hasFree3);

    return serviceTypes.filter(type => {
      // If we're editing, always include the currently selected type
      if (isEditMode && type.id.toString() === formData.serviceTypeId) return true;

      const name = normalize(type.name);
      
      // FREE1 logic: Show if not already done
      if (name === "FREE1") {
        return !hasFree1;
      }
      
      // FREE2 logic: Show only AFTER FREE1 is done, and if FREE2 itself is not done
      if (name === "FREE2") {
        return hasFree1 && !hasFree2;
      }
      
      // FREE3 logic: Show only AFTER FREE1 is done, and if FREE3 itself is not done
      if (name === "FREE3") {
        return hasFree1 && !hasFree3;
      }
      
      return true; // Show other services (PAID, etc.) always
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
                  placeholder="Search by name or contact number"
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
                          <div className="flex gap-1">
                            {(customer.isInvoice || customer.hasInvoice) && <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-bold uppercase">Invoice</span>}
                            {(customer.isJobCard || customer.hasJobCard) && <span className="text-[10px] bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-bold uppercase">Service Dealership</span>}
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
                  {serviceJobCardInfo && (
                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="text-sm font-bold text-green-900 mb-2">📋 Service DealerShip Customer Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                        <div><span className="text-green-700 font-medium">Job Card No:</span><span className="ml-2 text-green-900">{serviceJobCardInfo.jobCardNumber || "N/A"}</span></div>
                        <div><span className="text-green-700 font-medium">Vehicle Reg No:</span><span className="ml-2 text-green-900">{serviceJobCardInfo.registrationNumber || "N/A"}</span></div>
                        <div><span className="text-green-700 font-medium">Vehicle Model:</span><span className="ml-2 text-green-900">{serviceJobCardInfo.vehicleDetails || "N/A"}</span></div>
                        <div><span className="text-green-700 font-medium">Service Type:</span><span className="ml-2 text-green-900">{typeof serviceJobCardInfo.serviceType === 'object' ? serviceJobCardInfo.serviceType?.name || "N/A" : serviceJobCardInfo.serviceType || "N/A"}</span></div>
                        <div><span className="text-green-700 font-medium">Customer Name:</span><span className="ml-2 text-green-900">{serviceJobCardInfo.customerName || "N/A"}</span></div>
                        <div><span className="text-green-700 font-medium">Status:</span><span className="ml-2 text-green-900">{serviceJobCardInfo.status || "N/A"}</span></div>
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

      <Modal isOpen={isPaymentModalOpen} onClose={() => { setIsPaymentModalOpen(false); setPendingPayments([]); }} title={isEditMode ? "Edit Service Payment" : "Service Payment Entry"} maxWidth="max-w-4xl">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            {/* Row 1: Basic Info */}
            <div><label className="block text-sm font-medium text-brand-text-secondary mb-1">Date <span className="text-red-500">*</span></label><input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full bg-white border border-brand-border text-brand-text-primary rounded-lg p-2" required disabled /></div>
            <div><label className="block text-sm font-medium text-brand-text-secondary mb-1">Payment Type <span className="text-red-500">*</span></label><select value={formData.paymentType} onChange={(e) => { const newPaymentType = e.target.value; setFormData({ ...formData, paymentType: newPaymentType, paymentStatus: newPaymentType === "full payment" ? "completed" : "pending" }); if (loadedCustomer) fetchPendingPayments(loadedCustomer.id); }} className="w-full bg-white border border-brand-border text-brand-text-primary rounded-lg p-2" required><option value="full payment">Full Payment</option><option value="part payment">Part Payment</option></select></div>

            {/* Row 2: Vehicle Info (User Requested) */}
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

            {/* Row 3: Service Info (User Requested Job Card Number) */}
            <div><label className="block text-sm font-medium text-brand-text-secondary mb-1">Job Card Number {formData.paymentType === "full payment" && <span className="text-red-500">*</span>}</label><input type="text" value={formData.jobCardNumber} onChange={(e) => setFormData({ ...formData, jobCardNumber: e.target.value })} className="w-full bg-white border border-brand-border text-brand-text-primary rounded-lg p-2" placeholder="Enter job card number" required={formData.paymentType === "full payment"} /></div>
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

            {/* Row 6: Misc */}
            <div><label className="block text-sm font-medium text-brand-text-secondary mb-1">Reference Number</label><input type="text" value={formData.refNo} onChange={(e) => setFormData({ ...formData, refNo: e.target.value })} className="w-full bg-white border border-brand-border text-brand-text-primary rounded-lg p-2" /></div>
            <div>
              {formData.paymentType === "part payment" && (
                <div>
                  <label className="block text-sm font-medium text-brand-text-secondary mb-1">Payment Status <span className="text-red-500">*</span></label>
                  <select value={formData.paymentStatus} onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })} className="w-full bg-white border border-brand-border text-brand-text-primary rounded-lg p-2" required>
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              )}
            </div>

            {/* Row 7 - Full Width Remarks */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-brand-text-secondary mb-1">Remarks</label>
              <textarea value={formData.remarks} onChange={(e) => setFormData({ ...formData, remarks: e.target.value })} className="w-full bg-white border border-brand-border text-brand-text-primary rounded-lg p-2" rows={2}></textarea>
            </div>

            {/* Previous Payments Info - Full Width */}
            {formData.paymentType === "part payment" && pendingPayments.length > 0 && (
              <div className="md:col-span-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                <label className="block text-sm font-medium text-blue-900 mb-2">Previous Received Part Payments for this customer</label>
                <div className="space-y-2">
                  {pendingPayments.map((payment) => (
                    <div key={payment.id} className="flex justify-between text-sm">
                      <span className="text-blue-800">{payment.receiptNo} - {new Date(payment.date).toLocaleDateString('en-GB')} - {payment.vehicleNumber}</span>
                      <span className="font-medium text-blue-900">₹{payment.recAmt}</span>
                    </div>
                  ))}
                  <div className="border-t border-blue-300 pt-2 mt-2 flex justify-between font-bold">
                    <span className="text-blue-900">Total Received:</span>
                    <span className="text-blue-900">₹{pendingPayments.reduce((sum, p) => sum + p.recAmt, 0)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Total Paid Amount Info - Full Width */}
            {formData.paymentType === "part payment" && formData.paymentStatus === "completed" && pendingPayments.length > 0 && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-brand-text-secondary mb-1">Total Paid Amount <span className="text-red-500">*</span></label>
                <input type="number" step="0.01" value={pendingPayments.reduce((sum, p) => sum + p.recAmt, 0) + (parseFloat(formData.recAmt) || 0)} className="w-full bg-gray-100 border border-brand-border text-brand-text-primary rounded-lg p-2 cursor-not-allowed" placeholder="Auto-calculated total amount" readOnly />
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