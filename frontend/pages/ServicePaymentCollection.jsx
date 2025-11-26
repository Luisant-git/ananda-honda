import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import DataTable from "../components/DataTable";
import Modal from "../components/Modal";
import SearchableDropdown from "../components/SearchableDropdown";
import { servicePaymentCollectionApi } from "../api/servicePaymentCollectionApi.js";
import { customerApi } from "../api/customerApi.js";
import { servicePaymentModeApi } from "../api/servicePaymentModeApi.js";
import { serviceTypeOfPaymentApi } from "../api/serviceTypeOfPaymentApi.js";
import { typeOfCollectionApi } from "../api/typeOfCollectionApi.js";
import { vehicleModelApi } from "../api/vehicleModelApi.js";
import { menuPermissionApi } from "../api/menuPermissionApi";
import hondaLogo from "../assets/honda-logo.svg";

const ServicePaymentCollection = ({ user }) => {
  const [permissions, setPermissions] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [paymentModes, setPaymentModes] = useState([]);
  console.log('service payment modes', paymentModes);
  
  const [typeOfPayments, setTypeOfPayments] = useState([]);
  const [typeOfCollections, setTypeOfCollections] = useState([]);
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
  const [showDeleted, setShowDeleted] = useState(false);
  const [deletedPayments, setDeletedPayments] = useState([]);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    recAmt: "",
    paymentModeId: "",
    typeOfPaymentId: "",
    typeOfCollectionId: "",
    vehicleModelId: "",
    refNo: "",
    remarks: "",
    jobCardNumber: "",
  });
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({
    name: "",
    contactNo: "",
    address: "",
    status: "Walk in Customer",
  });

  useEffect(() => {
    fetchCustomers();
    fetchPaymentModes();
    fetchTypeOfPayments();
    fetchTypeOfCollections();
    fetchVehicleModels();
    fetchPayments();
    fetchPermissions();
    fetchDeletedPayments();
  }, []);

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

  const fetchCustomers = async () => {
    try {
      const data = await customerApi.getAll();
      setCustomers(data);
    } catch (error) {
      console.error("Error fetching customers:", error);
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

  const fetchTypeOfCollections = async () => {
    try {
      const data = await typeOfCollectionApi.getAll();
      setTypeOfCollections(data.filter((type) => type.status === "Enable"));
    } catch (error) {
      console.error("Error fetching type of collections:", error);
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

  const fetchPayments = async () => {
    try {
      const data = await servicePaymentCollectionApi.getAll();
      const formattedData = data.map((payment, index) => ({
        sNo: index + 1,
        id: payment.id,
        date: payment.date,
        receiptNo: payment.receiptNo,
        custId: payment.customer.custId,
        name: payment.customer.name,
        contactNo: payment.customer.contactNo,
        address: payment.customer.address,
        recAmt: payment.recAmt,
        paymentMode: payment.paymentMode.paymentMode,
        typeOfPayment: payment.typeOfPayment?.typeOfMode || "N/A",
        typeOfCollection: payment.typeOfCollection?.typeOfCollect || "N/A",
        vehicleModel: payment.vehicleModel?.model || "N/A",
        enteredBy: payment.user?.username || "N/A",
        refNo: payment.refNo || "N/A",
        remarks: payment.remarks || "N/A",
        jobCardNumber: payment.jobCardNumber || "N/A",
        customerId: payment.customerId,
        paymentModeId: payment.paymentModeId,
        typeOfPaymentId: payment.typeOfPaymentId,
        typeOfCollectionId: payment.typeOfCollectionId,
        vehicleModelId: payment.vehicleModelId,
      }));
      setPayments(formattedData);
      setFilteredPayments(formattedData);
    } catch (error) {
      console.error("Error fetching payments:", error);
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
        recAmt: payment.recAmt,
        paymentMode: payment.paymentMode.paymentMode,
        typeOfPayment: payment.typeOfPayment?.typeOfMode || "N/A",
        typeOfCollection: payment.typeOfCollection?.typeOfCollect || "N/A",
        vehicleModel: payment.vehicleModel?.model || "N/A",
        enteredBy: payment.user?.username || "N/A",
        deletedBy: payment.deletedByUser?.username || "N/A",
        deletedAt: new Date(payment.deletedAt).toLocaleDateString('en-GB'),
        refNo: payment.refNo || "N/A",
        remarks: payment.remarks || "N/A",
        jobCardNumber: payment.jobCardNumber || "N/A",
        customerId: payment.customerId,
        paymentModeId: payment.paymentModeId,
        typeOfPaymentId: payment.typeOfPaymentId,
        typeOfCollectionId: payment.typeOfCollectionId,
        vehicleModelId: payment.vehicleModelId,
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

    // Validate mobile number for new customer
    if (isNewCustomer && !/^\d{10}$/.test(newCustomerData.contactNo)) {
      toast.error("Mobile number must be exactly 10 digits");
      return;
    }

    try {
      let customerId = loadedCustomer?.id;

      // Create new customer if needed
      if (isNewCustomer) {
        const newCustomer = await customerApi.create(newCustomerData);
        customerId = newCustomer.id;
        await fetchCustomers(); // Refresh customer list
      }

      const submitData = {
        date: formData.date,
        customerId: customerId,
        recAmt: parseFloat(formData.recAmt),
        paymentModeId: parseInt(formData.paymentModeId),
        typeOfPaymentId: formData.typeOfPaymentId
          ? parseInt(formData.typeOfPaymentId)
          : undefined,
        typeOfCollectionId: formData.typeOfCollectionId
          ? parseInt(formData.typeOfCollectionId)
          : undefined,
        vehicleModelId: formData.vehicleModelId
          ? parseInt(formData.vehicleModelId)
          : undefined,
        enteredBy: user?.id,
        refNo: formData.refNo,
        remarks: formData.remarks,
        jobCardNumber: formData.jobCardNumber,
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
      setFormData({
        date: new Date().toISOString().split("T")[0],
        recAmt: "",
        paymentModeId: "",
        typeOfPaymentId: "",
        typeOfCollectionId: "",
        vehicleModelId: "",
        refNo: "",
        remarks: "",
        jobCardNumber: "",
      });
      setNewCustomerData({
        name: "",
        contactNo: "",
        address: "",
        status: "Walk in Customer",
      });
      fetchPayments();
      if (showDeleted) fetchDeletedPayments();
    } catch (error) {
      toast.error("Error saving service payment");
      console.error("Error saving service payment:", error);
    }
  };

  const handleEdit = (payment) => {
    setIsEditMode(true);
    setEditingPayment(payment);
    const customer = customers.find((c) => c.id === payment.customerId);
    setLoadedCustomer(customer);
    setSelectedCustomerId(customer.id.toString());
    setFormData({
      date: new Date(payment.date).toISOString().split("T")[0],
      recAmt: payment.recAmt.toString(),
      paymentModeId: payment.paymentModeId.toString(),
      typeOfPaymentId: payment.typeOfPaymentId?.toString() || "",
      typeOfCollectionId: payment.typeOfCollectionId?.toString() || "",
      vehicleModelId: payment.vehicleModelId?.toString() || "",
      refNo: payment.refNo || "",
      remarks: payment.remarks,
      jobCardNumber: payment.jobCardNumber || "",
    });
    setIsPaymentModalOpen(true);
  };

  const handleDelete = async () => {
    try {
      await servicePaymentCollectionApi.delete(paymentToDelete.id, user?.id);
      toast.success("Service payment deleted successfully!");
      setIsDeleteModalOpen(false);
      setPaymentToDelete(null);
      fetchPayments();
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
      fetchPayments();
      fetchDeletedPayments();
    } catch (error) {
      toast.error("Error restoring service payment");
      console.error("Error restoring service payment:", error);
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

  const handleCustomerSelect = (customer) => {
    if (customer === "new") {
      setSelectedCustomerId("new");
      setSearchTerm("+ Add New Customer");
      setIsNewCustomer(true);
      setLoadedCustomer(null);
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
    }
    setShowDropdown(false);
  };

  const numberToWords = (num) => {
    const ones = [
      "",
      "One",
      "Two",
      "Three",
      "Four",
      "Five",
      "Six",
      "Seven",
      "Eight",
      "Nine",
      "Ten",
      "Eleven",
      "Twelve",
      "Thirteen",
      "Fourteen",
      "Fifteen",
      "Sixteen",
      "Seventeen",
      "Eighteen",
      "Nineteen",
    ];
    const tens = [
      "",
      "",
      "Twenty",
      "Thirty",
      "Forty",
      "Fifty",
      "Sixty",
      "Seventy",
      "Eighty",
      "Ninety",
    ];

    if (num === 0) return "Zero";
    if (num < 20) return ones[num];
    if (num < 100)
      return (
        tens[Math.floor(num / 10)] + (num % 10 ? " " + ones[num % 10] : "")
      );
    if (num < 1000)
      return (
        ones[Math.floor(num / 100)] +
        " Hundred" +
        (num % 100 ? " " + numberToWords(num % 100) : "")
      );
    if (num < 100000)
      return (
        numberToWords(Math.floor(num / 1000)) +
        " Thousand" +
        (num % 1000 ? " " + numberToWords(num % 1000) : "")
      );
    if (num < 10000000)
      return (
        numberToWords(Math.floor(num / 100000)) +
        " Lakh" +
        (num % 100000 ? " " + numberToWords(num % 100000) : "")
      );
    return (
      numberToWords(Math.floor(num / 10000000)) +
      " Crore" +
      (num % 10000000 ? " " + numberToWords(num % 10000000) : "")
    );
  };

  const handlePrint = (payment) => {
    const currentUser = user;
    const printDate = new Date();
    const formattedDate = `${printDate
      .getDate()
      .toString()
      .padStart(2, "0")}-${(printDate.getMonth() + 1)
      .toString()
      .padStart(
        2,
        "0"
      )}-${printDate.getFullYear()} ${printDate.toLocaleTimeString("en-US", {
      hour12: true,
    })}`;

    const amountInWords =
      numberToWords(parseInt(payment.recAmt)) + " Rupees Only.";

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
  <!-- Row 1: Customer ID | Date -->
  <div style="padding: 2px 5px 2px 5px;"><strong>Customer ID:</strong> ${
    payment.custId
  }</div>
  <div style="padding: 2px 5px 2px 5px;"><strong>Date:</strong> ${new Date(
    payment.date
  ).toLocaleDateString("en-GB")}</div>
  
  <!-- Row 2: To | Receipt No -->
  <div style="padding: 2px 5px 2px 5px;"><strong>To:</strong> ${payment.name}</div>
  <div style="padding: 2px 5px 2px 5px;"><strong>Receipt No:</strong> ${
    payment.receiptNo
  }</div>
  
  <!-- Row 3: Address | Payment Towards -->
  <div style="padding: 2px 5px 2px 5px;"><strong>Address:</strong> ${
    payment.address || "N/A"
  }</div>
  <div style="padding: 2px 5px 2px 5px;"><strong>Payment Towards:</strong> ${
    payment.typeOfCollection || "N/A"
  }</div>
  
  <!-- Row 4: Mobile No | Vehicle Model -->
  <div style="padding: 2px 5px 2px 5px;"><strong>Mobile No:</strong> ${
    payment.contactNo
  }</div>
  <div style="padding: 2px 5px 2px 5px;"><strong>Vehicle Model:</strong> ${
    payment.vehicleModel || "N/A"
  }</div>
  
  <!-- Row 5: Job Card Number -->
  <div style="padding: 2px 5px 2px 5px;"><strong>Job Card Number:</strong> ${
    payment.jobCardNumber || "N/A"
  }</div>
</div>
          
          <p style="margin: 25px 0; font-size: 16px;">We thankfully acknowledge the receipt of your payment towards for Collection - ${
            payment.typeOfCollection || "N/A"
          }
          </p>
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 16px;">
            <tr>
              <td style="border: 1px solid #000; padding: 10px; font-weight: bold; width: 50%;">Received Amount:</td>
              <td style="border: 1px solid #000; padding: 10px; font-weight: bold; width: 50%;">REMARKS</td>
            </tr>
            <tr>
              <td style="border: 1px solid #000; padding: 10px; text-align: center;">₹${
                payment.recAmt
              }<br>${amountInWords}</td>
              <td style="border: 1px solid #000; padding: 10px; text-align: center;">${
                payment.remarks || "N/A"
              }</td>
            </tr>
          </table>
          
          <div style="display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 16px;">
            <div><strong>Mode Of Payment:</strong> ${payment.paymentMode}</div>
            <div><strong>Customer Opting ${payment.paymentMode}</strong></div>
          </div>
          
          <div style="display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 16px;">
            <div><strong>Ref No:</strong> ${payment.refNo || "N/A"}</div>
            <div style="margin-top: 5px;">${
              payment.typeOfPayment || "N/A"
            }</div>
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
            <strong>Entered by:</strong> ${
              payment.enteredBy
            } &nbsp;&nbsp; <strong>Printed by:</strong> ${
        currentUser?.username || "N/A"
      } &nbsp;&nbsp; <strong>Printed on:</strong> ${formattedDate}
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
        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      },
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
        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      },
    },
    { header: "ReceiptNo", accessor: "receiptNo" },
    { header: "CustId", accessor: "custId" },
    { header: "Name", accessor: "name" },
    { header: "Contact No", accessor: "contactNo" },
    { header: "Amount", accessor: "recAmt" },
    { header: "PaymentMode", accessor: "paymentMode" },
    { header: "PaymentType", accessor: "typeOfPayment" },
    { header: "CollectionType", accessor: "typeOfCollection" },
    { header: "Vehicle Model", accessor: "vehicleModel" },
    { header: "Job Card No", accessor: "jobCardNumber" },
    { header: "Ref No", accessor: "refNo" },
    { header: "Remarks", accessor: "remarks" },
  ];

  const renderActions = (payment) => {
    if (showDeleted) {
      return permissions?.payment_collection?.service?.restore ? (
        <button
          onClick={() => handleRestore(payment)}
          className="text-green-600 hover:underline"
        >
          Restore
        </button>
      ) : null;
    }
    return (
      <div className="flex gap-2">
        {permissions?.payment_collection?.service?.edit && (
          <button
            onClick={() => handleEdit(payment)}
            className="text-blue-600 hover:underline"
          >
            Edit
          </button>
        )}
        {permissions?.payment_collection?.service?.delete && (
          <button
            onClick={() => {
              setPaymentToDelete(payment);
              setIsDeleteModalOpen(true);
            }}
            className="text-red-600 hover:underline"
          >
            Delete
          </button>
        )}
        <button
          onClick={() => handlePrint(payment)}
          className="text-green-600 hover:underline"
        >
          Print
        </button>
      </div>
    );
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-xl sm:text-2xl font-bold text-brand-text-primary">
          Service Payment Collection
        </h1>
{permissions?.payment_collection?.service?.view_deleted && (
          <button
            onClick={() => {
              setShowDeleted(!showDeleted);
              if (!showDeleted) fetchDeletedPayments();
            }}
            className={`px-4 py-2 rounded-lg font-medium ${
              showDeleted
                ? "bg-gray-500 text-white hover:bg-gray-600"
                : "bg-orange-600 text-white hover:bg-orange-700"
            }`}
          >
            {showDeleted ? "Show Active" : "Show Trash"}
          </button>
        )}
      </div>



      {!showDeleted && (
        <div className="bg-brand-surface p-3 sm:p-4 md:p-6 rounded-lg shadow-sm space-y-4 border border-brand-border">
          <div className="flex flex-col sm:flex-row items-end gap-4">
            <div className="flex-grow w-full">
              <label className="text-sm font-medium text-brand-text-secondary mb-1 block">
                Select Customer
              </label>
              <div className="relative customer-dropdown">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowDropdown(true);
                    setSelectedCustomerId("");
                    setLoadedCustomer(null);
                    setFilteredPayments(payments);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  placeholder="Search by name or contact number"
                  className="w-full bg-white border border-brand-border text-brand-text-primary rounded-lg p-2 focus:ring-brand-accent focus:border-brand-accent"
                />
                {showDropdown && (
                  <div className="absolute z-10 w-full bg-white border border-brand-border rounded-lg mt-1 max-h-60 overflow-y-auto shadow-lg">
                    {permissions?.payment_collection?.service?.add_customer && (
                      <div
                        onClick={() => handleCustomerSelect("new")}
                        className="p-2 hover:bg-brand-hover cursor-pointer border-b border-brand-border font-medium text-green-600"
                      >
                        + Add New Customer
                      </div>
                    )}
                    {filteredCustomers.map((customer) => (
                      <div
                        key={customer.id}
                        onClick={() => handleCustomerSelect(customer)}
                        className="p-2 hover:bg-brand-hover cursor-pointer border-b border-brand-border last:border-b-0"
                      >
                        <div className="font-medium">{customer.name}</div>
                        <div className="text-sm text-brand-text-secondary">
                          {customer.contactNo}
                        </div>
                      </div>
                    ))}
                    {filteredCustomers.length === 0 &&
                      searchTerm &&
                      searchTerm !== "+ Add New Customer" && (
                        <div className="p-2 text-brand-text-secondary text-center">
                          No customers found
                        </div>
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
                    <div>
                      <label className="text-sm text-brand-text-secondary">
                        Name *
                      </label>
                      <input
                        type="text"
                        value={newCustomerData.name}
                        onChange={(e) =>
                          setNewCustomerData({
                            ...newCustomerData,
                            name: e.target.value,
                          })
                        }
                        className="w-full bg-white border border-brand-border text-brand-text-primary rounded-lg p-2 focus:ring-brand-accent focus:border-brand-accent"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm text-brand-text-secondary">
                        Mobile Number *
                      </label>
                      <input
                        type="text"
                        value={newCustomerData.contactNo}
                        onChange={(e) => {
                          const numericValue = e.target.value.replace(/\D/g, "");
                          if (numericValue.length > 10) {
                            toast.error("Mobile number cannot exceed 10 digits");
                            return;
                          }
                          setNewCustomerData({
                            ...newCustomerData,
                            contactNo: numericValue,
                          });
                        }}
                        className="w-full bg-white border border-brand-border text-brand-text-primary rounded-lg p-2 focus:ring-brand-accent focus:border-brand-accent"
                        placeholder="Enter 10 digit mobile number"
                        maxLength="10"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-brand-text-secondary">
                        Address *
                      </label>
                      <textarea
                        value={newCustomerData.address}
                        onChange={(e) =>
                          setNewCustomerData({
                            ...newCustomerData,
                            address: e.target.value,
                          })
                        }
                        className="w-full bg-white border border-brand-border text-brand-text-primary rounded-lg p-2 focus:ring-brand-accent focus:border-brand-accent"
                        rows={2}
                        required
                      ></textarea>
                    </div>
                    <div>
                      <label className="text-sm text-brand-text-secondary">
                        Status
                      </label>
                      <select
                        value={newCustomerData.status}
                        onChange={(e) =>
                          setNewCustomerData({
                            ...newCustomerData,
                            status: e.target.value,
                          })
                        }
                        className="w-full bg-white border border-brand-border text-brand-text-primary rounded-lg p-2 focus:ring-brand-accent focus:border-brand-accent"
                      >
                        <option>Walk in Customer</option>
                        <option>Online Enquiry</option>
                      </select>
                    </div>
                    <div className="pt-2 flex justify-start">
                      {permissions?.payment_collection?.service?.add && (
                        <button
                          onClick={() => setIsPaymentModalOpen(true)}
                          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg"
                          disabled={
                            !newCustomerData.name ||
                            !newCustomerData.contactNo ||
                            !newCustomerData.address
                          }
                        >
                          Pay
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-brand-text-secondary">
                        CustId
                      </label>
                      <div className="mt-1 p-2 bg-brand-hover rounded-md text-brand-text-primary">
                        {loadedCustomer.custId}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-brand-text-secondary">
                        Name
                      </label>
                      <div className="mt-1 p-2 bg-brand-hover rounded-md text-brand-text-primary">
                        {loadedCustomer.name}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-brand-text-secondary">
                        Mobile Number
                      </label>
                      <div className="mt-1 p-2 bg-brand-hover rounded-md text-brand-text-primary">
                        {loadedCustomer.contactNo}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-brand-text-secondary">
                        Address
                      </label>
                      <div className="mt-1 p-2 bg-brand-hover rounded-md text-brand-text-primary">
                        {loadedCustomer.address}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-brand-text-secondary">
                        Status
                      </label>
                      <div className="mt-1 p-2 bg-brand-hover rounded-md text-brand-text-primary">
                        {loadedCustomer.status}
                      </div>
                    </div>
                    <div className="pt-2 flex justify-start">
                      {permissions?.payment_collection?.service?.add && (
                        <button
                          onClick={() => setIsPaymentModalOpen(true)}
                          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg"
                        >
                          Pay
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <DataTable
        columns={columns}
        data={showDeleted ? deletedPayments : filteredPayments}
        actionButtons={renderActions}
      />

      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title={isEditMode ? "Edit Service Payment" : "Service Payment Entry"}
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-brand-text-secondary mb-1">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
              className="w-full bg-white border border-brand-border text-brand-text-primary rounded-lg p-2 focus:ring-brand-accent focus:border-brand-accent"
              required
              disabled
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-text-secondary mb-1">
              Received Amount <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.recAmt}
              onChange={(e) =>
                setFormData({ ...formData, recAmt: e.target.value })
              }
              className="w-full bg-white border border-brand-border text-brand-text-primary rounded-lg p-2 focus:ring-brand-accent focus:border-brand-accent"
              required
            />
          </div>
          <SearchableDropdown
            label="Payment Mode"
            value={formData.paymentModeId}
            onChange={(value) => setFormData({ ...formData, paymentModeId: value, typeOfPaymentId: "" })}
            options={paymentModes.map(mode => ({ value: mode.id.toString(), label: mode.paymentMode }))}
            required
          />
          <SearchableDropdown
            label="Type of Payment Mode"
            value={formData.typeOfPaymentId}
            onChange={(value) => setFormData({ ...formData, typeOfPaymentId: value })}
            options={filteredTypeOfPayments.map(type => ({ value: type.id.toString(), label: type.typeOfMode }))}
          />
          <SearchableDropdown
            label="Type of Collection"
            value={formData.typeOfCollectionId}
            onChange={(value) => {
              const selectedType = typeOfCollections.find(type => type.id === parseInt(value));
              setFormData({ ...formData, typeOfCollectionId: value, vehicleModelId: selectedType?.disableVehicleModel ? "" : formData.vehicleModelId });
            }}
            options={typeOfCollections.map(type => ({ value: type.id.toString(), label: type.typeOfCollect }))}
          />
          {(() => {
            const selectedTypeOfCollection = typeOfCollections.find(
              (type) => type.id === parseInt(formData.typeOfCollectionId)
            );
            return !selectedTypeOfCollection?.disableVehicleModel && (
              <SearchableDropdown
                label="Vehicle Model"
                value={formData.vehicleModelId}
                onChange={(value) => setFormData({ ...formData, vehicleModelId: value })}
                options={vehicleModels.map(model => ({ value: model.id.toString(), label: model.model }))}
              />
            );
          })()}
          <div>
            <label className="block text-sm font-medium text-brand-text-secondary mb-1">
              Job Card Number
            </label>
            <input
              type="text"
              value={formData.jobCardNumber}
              onChange={(e) =>
                setFormData({ ...formData, jobCardNumber: e.target.value })
              }
              className="w-full bg-white border border-brand-border text-brand-text-primary rounded-lg p-2 focus:ring-brand-accent focus:border-brand-accent"
              placeholder="Enter job card number"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-text-secondary mb-1">
              Reference Number
            </label>
            <input
              type="text"
              value={formData.refNo}
              onChange={(e) =>
                setFormData({ ...formData, refNo: e.target.value })
              }
              className="w-full bg-white border border-brand-border text-brand-text-primary rounded-lg p-2 focus:ring-brand-accent focus:border-brand-accent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-text-secondary mb-1">
              Remarks
            </label>
            <textarea
              value={formData.remarks}
              onChange={(e) =>
                setFormData({ ...formData, remarks: e.target.value })
              }
              className="w-full bg-white border border-brand-border text-brand-text-primary rounded-lg p-2 focus:ring-brand-accent focus:border-brand-accent"
              rows={2}
            ></textarea>
          </div>
          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={() => setIsPaymentModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-white hover:bg-brand-hover text-brand-text-secondary font-bold border border-brand-border"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-brand-accent hover:bg-brand-accent-hover text-white font-bold"
            >
              {isEditMode ? "Update" : "Submit"}
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
          <p className="text-brand-text-primary">
            Are you sure you want to delete service payment{" "}
            <strong>{paymentToDelete?.receiptNo}</strong>?
          </p>
          <div className="flex justify-end gap-4">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-white hover:bg-brand-hover text-brand-text-secondary font-bold border border-brand-border"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
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

export default ServicePaymentCollection;