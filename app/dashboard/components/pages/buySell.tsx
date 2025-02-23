"use client";

import { useState, useEffect, useRef } from "react";
import Image from 'next/image';

// Types and Interfaces
interface ProductDetail {
  customer_id: number;
  prod_id: number;
  prod_name: string;
  order_weight: string;
  order_amount: number;
  product_sell_price: number;
  product_labor_cost: number;
  product_buy_price: number;
}

interface Order {
  order_date: string;
  order_deposit: number;
  product: {
    prod_name: string;
    order_weight: string;
    order_amount: number;
    product_sell_price: number;
    product_labor_cost: number;
    product_buy_price: number;
  };
}

interface OrderResponse {
  cus_id: string;
  customer_name: string;
  phone_number: string;
  address: string;
  orders: Order[];
}

// Constants
const BASE_URL = "http://127.0.0.1:8000/staff";

// Utility Functions
const getAuthToken = (): string | null => {
  return localStorage.getItem("access_token");
};

const handleApiError = (error: unknown): string => {
  if (typeof error === 'object' && error && 'detail' in error) {
    return String((error as { detail: string }).detail);
  }
  return "Failed to connect to the server.";
};

const calculateTotal = (orders: Order[]): number => {
  if (!Array.isArray(orders) || orders.length === 0) {
    return 0;
  }
  return orders.reduce((total, orderItem) => 
    total + (orderItem.product.order_amount * orderItem.product.product_sell_price) + orderItem.product.product_labor_cost, 0
  );
};

// API Service
const apiService = {
  async fetchNextClientId(token: string): Promise<string | null> {
    try {
      const response = await fetch(`${BASE_URL}/next-client-id`, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (!response.ok) return null;
      const data = await response.json();
      return data?.result?.id;
    } catch (error) {
      console.error("Error fetching next client ID:", error);
      return null;
    }
  },

  async fetchNextOrderId(token: string): Promise<number | null> {
    try {
      const response = await fetch(`${BASE_URL}/next-order-id`, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (!response.ok) return null;
      const data = await response.json();
      return data?.result?.id;
    } catch (error) {
      console.error("Error fetching next order ID:", error);
      return null;
    }
  },

  async fetchOrderDetails(orderId: number, token: string): Promise<OrderResponse | null> {
    try {
      const response = await fetch(`${BASE_URL}/orders/print?order_id=${orderId}`, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (!response.ok) return null;
      const data = await response.json();
      return data.result[0];
    } catch (error) {
      console.error("Error fetching order details:", error);
      return null;
    }
  }
};

export default function BuySellRecord() {
  // State Management
  const [cusName, setCusName] = useState("");
  const [address, setAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [orderDate, setOrderDate] = useState("");
  const [orderDeposit, setOrderDeposit] = useState<number>(0);
  const [lastOrderId, setLastOrderId] = useState<number | null>(null);
  const [orderHistory, setOrderHistory] = useState<Order[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [orderProductDetail, setOrderProductDetail] = useState<ProductDetail[]>([
    {
      customer_id: 0,
      prod_id: 0,
      prod_name: "",
      order_weight: "",
      order_amount: 0,
      product_sell_price: 0,
      product_labor_cost: 0,
      product_buy_price: 0,
    },
  ]);
  
  const [responseMessage, setResponseMessage] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [nextClientId, setNextClientId] = useState("");
  const [orderId, setOrderId] = useState<number | null>(null);
  const [orderToPrint, setOrderToPrint] = useState(null);

  // Form Handling
  const formHandlers = {
    addProduct: () => {
      setOrderProductDetail((prev) => [
        ...prev,
        {
          customer_id: 0,
          prod_id: 0,
          prod_name: "",
          order_weight: "",
          order_amount: 0,
          product_sell_price: 0,
          product_labor_cost: 0,
          product_buy_price: 0,
        },
      ]);
    },

    deleteRow: (index: number) => {
      setOrderProductDetail((prev) => prev.filter((_, i) => i !== index));
    },

    resetForm: () => {
      setCusName("");
      setAddress("");
      setPhoneNumber("");
      setInvoiceNumber("");
      setOrderDate("");
      setOrderDeposit(0);
      setCustomerName("");
      setOrderProductDetail([
        {
          customer_id: 0,
          prod_id: 0,
          prod_name: "",
          order_weight: "",
          order_amount: 0,
          product_sell_price: 0,
          product_labor_cost: 0,
          product_buy_price: 0,
        },
      ]);
    },

    calculateTotalPrice: (): number => {
      return orderProductDetail.reduce((total, product) => {
        return total + product.product_labor_cost + product.order_amount * product.product_sell_price;
      }, 0);
    }
  };

  // Invoice Generation
  const invoiceHandlers = {
    generateInvoice: (order: OrderResponse, orderId: number) => {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        setResponseMessage("Failed to open print window");
        return;
      }

      printWindow.document.write(invoiceHandlers.generateInvoiceHTML(order, orderId));
      printWindow.document.close();
      printWindow.print();
    },

    generateInvoiceHTML: (order: OrderResponse, orderId: number) => {
      const { cus_id: customerId, customer_name: customerName, phone_number: phoneNumber, address, orders } = order;

      if (!Array.isArray(orders) || orders.length === 0) {
        setResponseMessage("No order details found.");
        return "";
      }

      return `
        <html>
          <head>
            <style>
              body {
                font-family: 'Khmer OS', Arial, sans-serif;
                margin: 0;
                padding: 20px;
              }
              .invoice-header {
                text-align: center;
                margin-bottom: 20px;
              }
              .logo-section {
                margin-bottom: 10px;
              }
              .logo {
                max-width: 150px;
              }
              .company-name {
                font-size: 24px;
                font-weight: bold;
                margin: 10px 0;
              }
              .contact-info {
                font-size: 14px;
                margin: 5px 0;
              }
              .customer-details {
                margin: 20px 0;
              }
              .customer-row {
                margin: 5px 0;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
              }
              th, td {
                border: 1px solid #ddd;
                padding: 8px;
                text-align: left;
              }
              th {
                background-color: #f5f5f5;
              }
              .total-section {
                margin-top: 20px;
                text-align: right;
              }
              .signatures {
                margin-top: 50px;
                display: flex;
                justify-content: space-between;
              }
              .signature-box {
                text-align: center;
                width: 200px;
              }
              .signature-line {
                border-top: 1px solid #000;
                margin-top: 50px;
              }
              @media print {
                body {
                  padding: 0;
                  margin: 0;
                }
                .no-print {
                  display: none;
                }
              }
            </style>
          </head>
          <body>
            <div class="invoice-header">
              <div class="logo-section">
                <img src="/logo.png" alt="Company Logo" class="logo">
              </div>
              <div class="date-id-section">
                <div class="date-section">កាលបរិច្ឆេទ៖ ${orders[0].order_date}</div>
                <div class="id-section">លេខវិក្កយបត្រ៖ ${orderId}</div>
              </div>
            </div>

            <div class="customer-details">
              <div class="customer-row">ឈ្មោះអតិថិជន៖ ${customerName}</div>
              <div class="customer-row">លេខទូរស័ព្ទ៖ ${phoneNumber}</div>
              <div class="customer-row">អាសយដ្ឋាន៖ ${address}</div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>ល.រ</th>
                  <th>ឈ្មោះទំនិញ</th>
                  <th>ទម្ងន់</th>
                  <th>ចំនួន</th>
                  <th>តម្លៃ</th>
                  <th>តម្លៃកម្មាល</th>
                  <th>តម្លៃទិញ</th>
                </tr>
              </thead>
              <tbody>
                ${orders.map((orderItem, index) => `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${orderItem.product.prod_name}</td>
                    <td>${orderItem.product.order_weight}</td>
                    <td>${orderItem.product.order_amount}</td>
                    <td>${orderItem.product.product_sell_price}</td>
                    <td>${orderItem.product.product_labor_cost}</td>
                    <td>${orderItem.product.product_buy_price}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <table class="total-section">
              <tr><td>សរុប</td><td>${calculateTotal(orders)}</td></tr>
              <tr><td>កក់មុន</td><td>${orders[0].order_deposit}</td></tr>
              <tr><td>នៅខ្វះ</td><td>${calculateTotal(orders) - orders[0].order_deposit}</td></tr>
            </table>

            <div class="signatures">
              <div class="signature-box">
                <div class="signature-line"></div>
                <div>ហត្ថលេខាអ្នកទិញ</div>
              </div>
              <div class="signature-box">
                <div class="signature-line"></div>
                <div>ហត្ថលេខាអ្នកលក់</div>
              </div>
            </div>
          </body>
        </html>
      `;
    }
  };

  // Effects
  useEffect(() => {
    const initializeForm = async () => {
      const token = getAuthToken();
      if (!token) return;

      try {
        const [clientId, orderId] = await Promise.all([
          apiService.fetchNextClientId(token),
          apiService.fetchNextOrderId(token),
        ]);

        if (clientId) setNextClientId(clientId);
        if (orderId) setOrderId(orderId);
      } catch (error) {
        console.error("Error initializing form:", error);
        setResponseMessage(handleApiError(error));
      }
    };

    initializeForm();
  }, []);

  // Product Management Functions
  const updateProduct = (index: number, field: string, value: string | number) => {
    setOrderProductDetail((prev) =>
      prev.map((product, i) =>
        i === index
          ? {
              ...product,
              [field]: value || "",
            }
          : product
      )
    );
  };

  // Order Management Functions
  const cancelOrder = async () => {
    console.log("Cancelling order and resetting fields...");
    formHandlers.resetForm();
    
    try {
      const newClientId = await apiService.fetchNextClientId(getAuthToken() as string);
      const newOrderId = await apiService.fetchNextOrderId(getAuthToken() as string);

      if (newClientId) {
        setCustomerId(newClientId);
      }
      if (newOrderId) {
        setOrderId(newOrderId);
      }

      setResponseMessage("ការបញ្ជាទិញត្រូវបានបោះបង់");
    } catch (error) {
      console.error("Error fetching next IDs:", error);
      setResponseMessage(handleApiError(error));
    }
  };

  const handleSubmit = async () => {
    const token = getAuthToken();
    if (!token) {
      setResponseMessage("Authentication failed. Please log in.");
      return;
    }

    const payload = {
      order_id: orderId || null,
      cus_id: customerId || nextClientId,
      cus_name: customerName,
      address: address,
      phone_number: phoneNumber,
      invoice_number: invoiceNumber || "N/A",
      order_date: orderDate || "N/A",
      order_deposit: orderDeposit,
      order_product_detail: [...orderProductDetail],
    };

    try {
      const response = await fetch(`${BASE_URL}/order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (response.ok) {
        setResponseMessage("ការបញ្ជាទិញត្រូវបានបញ្ចូលដោយជោគជ័យ");
        formHandlers.resetForm();
        const [newClientId, newOrderId] = await Promise.all([
          apiService.fetchNextClientId(token),
          apiService.fetchNextOrderId(token),
        ]);
        setNextClientId(newClientId || "");
        setOrderId(newOrderId);
      } else {
        throw new Error(data.detail || "Failed to create order");
      }
    } catch (error) {
      setResponseMessage(handleApiError(error));
    }
  };

  const validateForm = (idToSubmit: string): boolean => {
    if (!idToSubmit || !customerName.trim() || !phoneNumber.trim() || !address.trim()) {
      setResponseMessage("សូមត្រួតពិនិត្យឡើងវិញ");
      return false;
    }

    if (
      orderProductDetail.length === 0 ||
      orderProductDetail.some(
        (product) =>
          !product.prod_name.trim() ||
          !product.order_weight.trim() ||
          product.order_amount <= 0 ||
          product.product_sell_price <= 0
      )
    ) {
      setResponseMessage("Please add at least one valid product with all fields filled.");
      return false;
    }

    return true;
  };

  const handleSubmitSuccess = async (responseData: any) => {
    setResponseMessage("ការបញ្ជាទិញត្រូវបានរក្សាទុក");
    
    const newClientId = await apiService.fetchNextClientId(getAuthToken() as string);
    const newOrderId = await apiService.fetchNextOrderId(getAuthToken() as string);
    
    if (newClientId) setCustomerId(newClientId);
    if (newOrderId) setOrderId(newOrderId);
    
    formHandlers.resetForm();
  };

  // Print Functions
  const handlePrint = async (orderId: number) => {
    if (!orderId || isNaN(orderId)) {
      setResponseMessage("Please enter a valid Order ID.");
      return;
    }

    const token = getAuthToken();
    if (!token) {
      setResponseMessage("Authentication failed. Please log in.");
      return;
    }

    try {
      const orderData = await apiService.fetchOrderDetails(orderId, token);
      if (!orderData) {
        setResponseMessage("No order details found.");
        return;
      }
      invoiceHandlers.generateInvoice(orderData, orderId);
    } catch (error) {
      setResponseMessage(handleApiError(error));
    }
  };

  // API Functions
  const fetchNextClientId = async () => {
    try {
      console.log("Fetching next client ID...");
      const token = getAuthToken();
      if (!token) {
        console.error("No authentication token found. User may not be logged in.");
        return null;
      }

      const response = await fetch(`${BASE_URL}/next-client-id`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.error(`Failed to fetch next client ID. Status: ${response.status}`);
        return null;
      }

      const data = await response.json();
      console.log("API Response (Next Client ID):", data);

      if (data?.result?.id !== undefined) {
        return data.result.id; //  Return the fetched Client ID
      } else {
        console.error("Unexpected API response format:", data);
        return null;
      }
    } catch (error) {
      console.error("Error fetching next client ID:", error);
      return null;
    }
  };

  const fetchNextOrderId = async () => {
    try {
      console.log("Fetching next order ID...");
      const token = getAuthToken();
      if (!token) {
        console.error("No authentication token found. User may not be logged in.");
        return null;
      }

      const response = await fetch(`${BASE_URL}/next-order-id`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.error(`API request failed. Status: ${response.status}`);
        return null;
      }

      const data = await response.json();
      console.log("API Response (Next Order ID):", data);

      if (data?.result?.id !== undefined) {
        return data.result.id; //  Return the fetched Order ID
      } else {
        console.error("Unexpected API response format:", data);
        return null;
      }
    } catch (error) {
      console.error("Error fetching next order ID:", error);
      return null;
    }
  };

  const searchByPhoneNumber = async () => {
    if (!phoneNumber.trim()) {
      setResponseMessage("Please enter a phone number to search.");
      return;
    }

    const token = getAuthToken();
    if (!token) {
      setResponseMessage("Authentication failed. Please log in.");
      return;
    }

    const url = `${BASE_URL}/order/client_phone?phone_number=${phoneNumber}`;
    console.log("Fetching from API:", url);

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      console.log("API Response Status:", response.status);

      if (response.status === 403) {
        setResponseMessage("Access denied. Please check your permissions.");
        return;
      }

      if (!response.ok) {
        setResponseMessage("មិនមានអតិថិជន");
        setCustomerName("");
        setAddress("");
        const newClientId = await fetchNextClientId();
        if (newClientId) {
          setCustomerId(newClientId);
          console.log("Updated Customer ID:", newClientId);
        } else {
          console.warn("No new Client ID fetched.");
        }
        return;
      }

      const data = await response.json();
      console.log("Fetched Customer Data:", data);

      if (data.code === 200 && data.result.length > 0) {
        const customer = data.result[0]; // Extract the first (or only) customer record

        setCustomerName(customer.cus_name || ""); // Set customer name
        setAddress(customer.address || ""); // Set address
        setCustomerId(customer.cus_id || ""); // Set customer ID (now last)

        setResponseMessage("ស្វែងរកជោគជ័យ");
      } else {
        setResponseMessage("មិនមានអតិថិជន");
        setCustomerId("");
        setCustomerName("");
        setAddress("");
      }
    } catch (error) {
      console.error("Error fetching customer details:", error);
      setResponseMessage("Failed to fetch customer details.");
    }
  };

  const handleUpdateOrder = async () => {
    if (!phoneNumber.trim()) {
      console.warn("Phone number is missing, switching to order creation...");
      await handleSubmit(); //  If no phone, create order
      return;
    }

    const token = getAuthToken();
    if (!token) {
      setResponseMessage("Authentication failed. Please log in.");
      return;
    }

    //  Fetch order_id using phone number
    const orderId = await fetchOrderIdByPhone();

    if (!orderId) {
      console.warn("Order not found, switching to order creation...");
      await handleSubmit(); //  No order found? Create a new one
      return;
    }

    //  Check if order has products (to prevent updating an empty order)
    if (!orderProductDetail.length || orderProductDetail.every(p => !p.prod_name.trim())) {
      console.warn("No products found in the order, switching to creation...");
      await handleSubmit(); //  If no valid products, create a new order instead
      return;
    }

    const updatedOrder = {
      order_id: orderId, 
      cus_name: customerName || "",
      address: address || "",
      phone_number: phoneNumber,
      order_deposit: orderDeposit || 0,
      order_date: orderDate || new Date().toISOString().split("T")[0],
      order_product_detail: orderProductDetail.map((product) => ({
        prod_id: product.prod_id ?? null,
        prod_name: product.prod_name || "",
        order_weight: product.order_weight || "",
        order_amount: product.order_amount || 0,
        product_sell_price: product.product_sell_price || 0,
        product_labor_cost: product.product_labor_cost || 0,
        product_buy_price: product.product_buy_price || 0,
      })),
    };

    console.log("Sending Update Request:", updatedOrder);

    try {
      const response = await fetch(`${BASE_URL}/orders/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(updatedOrder),
      });

      const data = await response.json();
      console.log("API Response:", data);

      if (response.ok) {
        setResponseMessage("Order updated successfully!");
        setIsEditing(false); //  Exit edit mode after success
      } else {
        console.warn("Failed to update order, switching to create...");
        await handleSubmit(); //  If update fails, try creating instead
      }
    } catch (error) {
      console.error("Error updating order:", error);
      setResponseMessage("Error updating order. Please try again.");
    }
  };

  const fetchOrderIdByPhone = async () => {
    try {
      const response = await fetch(`${BASE_URL}/order?phone_number=${phoneNumber}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${getAuthToken()}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      if (response.ok && data.result.length > 0) {
        return data.result[0].order_id; //  Extract `order_id` from the first order found
      } else {
        return null;
      }
    } catch (error) {
      console.error("Error fetching order ID:", error);
      return null;
    }
  };

  return (
    <section id="buy_sell" className="p-6">
      <h1 className="text-2xl font-bold mb-6">កត់ត្រាការទិញ & លក់</h1>
      <div className="container mx-auto flex gap-6">
        {/* Left Section: Customer Information */}
        <div className="w-2/6 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">ព័ត៌មានអតិថិជន</h2>
          <div className="space-y-4">
          <div className="form-group">
            <label htmlFor="id" className="block text-gray-700 mb-2">
              លេខសំគាល់អតិថិជន:
            </label>
            <input
              type="number"
              id="id"
              value={customerId && customerId !== "null" && customerId !== "" ? customerId : nextClientId || ""}
              className="w-full border border-gray-300 p-2 rounded bg-gray-100"
              placeholder={nextClientId ? `Next ID: ${fetchNextClientId}` : "Loading..."}
              readOnly
            />


          </div>

          <div className="form-group">
            <label htmlFor="customerName" className="block text-gray-700 mb-2">
              ឈ្មោះអតិថិជន:
            </label>
            <input
              type="text"
              id="customerName"
              value={customerName} // Use a separate state for Name
              onChange={(e) => setCustomerName(e.target.value)} // Update customerName state
              className="w-full border border-gray-300 p-2 rounded"
              placeholder="បញ្ចូលឈ្មោះអតិថិជន"
            />
          </div>


            <div className="form-group">
              <label htmlFor="phone" className="block text-gray-700 mb-2">
                លេខទូរស័ព្ទ:
              </label>
              <input
                  type="text"
                  id="phone"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full border border-gray-300 p-2 rounded"
                  placeholder="បញ្ចូលលេខទូរស័ព្ទ"
                />
            </div>
            <div className="form-group">
              <label htmlFor="address" className="block text-gray-700 mb-2">
                អាសយដ្ឋាន:
              </label>
              <input
                type="text"
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded"
                placeholder="បញ្ចូលអាសយដ្ឋាន"
              />
            </div>
          </div>
          <button
                onClick={searchByPhoneNumber}
                className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 mt-6"
              >
                ស្វែងរក
              </button>

              {/* {!isEditing ? (
                    <button
                    onClick={() => setIsEditing(true)}
                    className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 mt-6"
                    style={{ marginLeft: "60px" }}
                    >
                    Edit Order
                    </button>
                ) : (
                  <button
                    onClick={handleUpdateOrder}
                    className="bg-green-500 text-white py-2 px-6 rounded hover:bg-green-600 shadow-md"
                  >
                    Save Changes
                  </button>
                )} */}

              <div className="flex justify-center gap-4 mt-6">
                
              </div>
        </div>

        {/* Right Section: Product Information */}
        <div className="flex-1 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">ព័ត៌មានផលិតផល</h2>
          <div className="form-group flex gap-4">
          {/* Invoice Number */}
          <div className="flex-1">
            <label htmlFor="invoiceNumber" className="block text-gray-700 mb-2">
              លេខវិក្កយបត្រ:
            </label>
            <input
              type="text"
              id="invoiceNumber"
              value={orderId !== null ? orderId : lastOrderId || "Loading..."} //  Handle undefined state
              className="w-full border border-gray-300 p-2 rounded bg-gray-100 "
              placeholder="លេខវិក្កយបត្រ"
              readOnly
              // onChange={(e) => setOrderId(e.target.value)}
          />

          </div>
          {/* Order Date */}
          <div className="flex-1">
            <label htmlFor="orderDate" className="block text-gray-700 mb-2">
              ថ្ងៃបញ្ជាទិញ:
            </label>
            <input
              type="date"
              id="orderDate"
              value={orderDate}
              onChange={(e) => setOrderDate(e.target.value)}
              className="w-full border border-gray-300 p-2 rounded"
            />
          </div>
        </div>

        <div className="flex justify-center items-center h-20">
          <button
            onClick={formHandlers.addProduct}
            className="bg-gray-500 text-white py-2 px-4 rounded hover:bg-green-600"
          >
            បន្ថែមផលិតផល
          </button>
        </div>

          {/* <button
            onClick={removeProduct}
            className="bg-gray-500 text-white py-2 px-4 rounded hover:bg-red-600 mb-4"
          >
            លប់ចោលផលិតផល
          </button> */}
          <div className="w-full overflow-auto max-h-60 border border-gray-300 mt-4" 
     style={{ scrollbarGutter: "stable" }} // Ensures stable width even with a scrollbar
>
  <table className="w-full border-collapse border border-gray-300">
    <thead>
      <tr className="bg-orange-500 text-white">
        <th className="border border-gray-300 p-2">ឈ្មោះផលិតផល</th>
        <th className="border border-gray-300 p-2 w-24">ទំងន់</th> 
        <th className="border border-gray-300 p-2">ចំនួន</th>
        <th className="border border-gray-300 p-2">តំលៃលក់</th>
        <th className="border border-gray-300 p-2">ឈ្នួល</th>
        <th className="border border-gray-300 p-2">តំលៃទិញ</th>
        <th className="border border-gray-300 p-2"></th>
      </tr>
    </thead>
    <tbody>
      {orderProductDetail.map((product, index) => (
        <tr key={index}>
          <td className="border border-gray-300 p-2">
            <input
              type="text"
              value={product.prod_name}
              onChange={(e) => updateProduct(index, "prod_name", e.target.value)}
              className="w-full p-1 bg-transparent border-none focus:outline-none focus:ring-0"
              placeholder="ឈ្មោះ"
            />
          </td>
          {/* <td className="border border-gray-300 p-2 flex w-24">
           
            <input
              type="number"
              value={(product.order_weight || "").toString().replace(/\D/g, "0")} 
              onChange={(e) => {
                const numericPart = e.target.value.replace(/\D/g, ""); 
                const unitPart = (product.order_weight || "").toString().replace(/\d/g, "") || "";
                updateProduct(index, "order_weight", `${numericPart}${unitPart}`);
              }}
              className="w-2/4 p-1 bg-transparent border-none focus:outline-none focus:ring-0 text-right"
              placeholder="0"
            />
           
            <input
              type="text"
              value={(product.order_weight || "").toString().replace(/\d/g, "")} 
              onChange={(e) => {
                const unitPart = e.target.value.replace(/\d/g, "");
                const numericPart = (product.order_weight || "").toString().match(/\d+/)?.[0] || ""; 
                updateProduct(index, "order_weight", `${numericPart}${unitPart}`);
              }}
              className="w-2/4 p-1 bg-transparent border-none focus:outline-none focus:ring-0 text-left"
              placeholder=""
            />
          </td> */}

          <td className="border border-gray-300 p-2">
            <input
              type="text"
              value={product.order_weight}
              onChange={(e) => updateProduct(index, "order_weight", e.target.value)}
              className="w-full p-1 bg-transparent border-none focus:outline-none focus:ring-0 placeholder-gray-400 placeholder-opacity-50"
              placeholder="0"
            />
          </td>

          <td className="border border-gray-300 p-2">
  <input
    type="number"
    value={product.order_amount}
    onChange={(e) =>
      updateProduct(index, "order_amount", parseInt(e.target.value) || 0)
    }
    className="w-full p-1 bg-transparent border-none focus:outline-none focus:ring-0 placeholder-gray-400 placeholder-opacity-50"
    placeholder="0"
  />
</td>
<td className="border border-gray-300 p-2">
  <input
    type="number"
    value={product.product_sell_price}
    onChange={(e) =>
      updateProduct(index, "product_sell_price", parseFloat(e.target.value) || 0)
    }
    className="w-full p-1 bg-transparent border-none focus:outline-none focus:ring-0 placeholder-gray-400 placeholder-opacity-50"
    placeholder="0.00"
  />
</td>
<td className="border border-gray-300 p-2">
  <input
    type="number"
    value={product.product_labor_cost}
    onChange={(e) =>
      updateProduct(index, "product_labor_cost", parseFloat(e.target.value) || 0)
    }
    className="w-full p-1 bg-transparent border-none focus:outline-none focus:ring-0 placeholder-gray-400 placeholder-opacity-50"
    placeholder="0.00"
  />
</td>
<td className="border border-gray-300 p-2">
  <input
    type="number"
    value={product.product_buy_price}
    onChange={(e) =>
      updateProduct(index, "product_buy_price", parseFloat(e.target.value) || 0)
    }
    className="w-full p-1 bg-transparent border-none focus:outline-none focus:ring-0 placeholder-gray-400 placeholder-opacity-50"
    placeholder="0.00"
  />
</td>

          <td className="border border-gray-300 p-2">
            <button
              onClick={() => formHandlers.deleteRow(index)}
              className="bg-red-500 text-white py-1 px-3 rounded hover:bg-red-600"
            >
              លប់
            </button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>

          <div className="form-group flex gap-4 mt-4">
  {/* Total Price */}
  <div className="flex-1">
    <label htmlFor="totalPrice" className="block text-gray-700 mb-2">
      តម្លៃសរុប:
    </label>
    <input
      type="number"
      id="totalPrice"
      value={formHandlers.calculateTotalPrice()}
      readOnly
      className="w-full border border-gray-300 p-2 rounded bg-gray-100"
    />
  </div>

  {/* Order Deposit */}
  <div className="flex-1">
    <label htmlFor="orderDeposit" className="block text-gray-700 mb-2">
      កក់/បង់សរុប:
    </label>
    <input
      type="number"
      id="orderDeposit"
      value={orderDeposit}
      onChange={(e) => setOrderDeposit(parseFloat(e.target.value))}
      // className="w-full p-1 bg-transparent border-none focus:outline-none focus:ring-0 placeholder-gray-400 placeholder-opacity-50"
      placeholder="0"
      
      
      className="w-full border border-gray-300 p-2 rounded"
    />
  </div>
</div>


<div className="flex justify-center gap-4 mt-6">
      {/* <button
        onClick={async () => {
          await handleUpdateOrder(); 
        }}
        className="bg-gray-500 text-white py-2 px-6 rounded hover:bg-blue-600 shadow-md"
      >
        កត់ត្រាទុក
      </button> */}
      <button
        onClick={handleSubmit}
        className="bg-gray-500 text-white py-2 px-6 rounded hover:bg-blue-600 shadow-md"
      >
        កត់ត្រាទុក
      </button>

  <button
              onClick={() => handlePrint(orderId)}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              បោះពុម្ព
            </button>

  <button
    onClick={cancelOrder}
    className="bg-gray-500 text-white py-2 px-6 rounded hover:bg-red-600 shadow-md"
  >
    លប់ចោល
  </button>
</div>


        </div>
        </div>
        {responseMessage && (
          <div className="mt-4 p-4 bg-gray-100 border border-gray-300 rounded">
            <p>{responseMessage}</p>
          </div>
        )}
    </section>

  );
}
