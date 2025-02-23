"use client";

import React, { useState, useEffect } from "react";

// Constants
const BASE_URL = "http://127.0.0.1:8000/staff";

// Types and Interfaces
interface PawnProduct {
  prod_name: string;
  pawn_weight: string;
  pawn_amount: number;
  pawn_unit_price: number;
}

interface PawnFormData {
  pawn_id: number;
  cus_id: number;
  cus_name: string;
  address: string;
  phone_number: string;
  pawn_deposit: number;
  pawn_date: string;
  pawn_expire_date: string;
  pawn_product_detail: PawnProduct[];
}

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

export default function RecordPawn() {
  // Initial States
  const initialFormState: PawnFormData = {
    pawn_id: 0,
    cus_id: 0,
    cus_name: "",
    address: "",
    phone_number: "",
    pawn_deposit: 0,
    pawn_date: "",
    pawn_expire_date: "",
    pawn_product_detail: [
      {
        prod_name: "",
        pawn_weight: "",
        pawn_amount: 0,
        pawn_unit_price: 0,
      },
    ],
  };

  // State Management
  const [formData, setFormData] = useState<PawnFormData>(initialFormState);
  const [responseMessage, setResponseMessage] = useState("");
  const [nextPawnId, setNextPawnId] = useState("");
  const [nextClientId, setNextClientId] = useState(0);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);

  // Form Input Handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleProductChange = (index: number, field: string, value: string) => {
    let newValue = value;
    if (typeof value === "string") {
      newValue = value.replace(/^0+/, ""); // Remove leading zeros
    }

    setFormData((prev) => ({
      ...prev,
      pawn_product_detail: prev.pawn_product_detail.map((product, i) =>
        i === index
          ? {
              ...product,
              [field]: field.includes("amount") || field.includes("price")
                ? Number(newValue) || "" // Ensure it's a number or empty string
                : newValue,
            }
          : product
      ),
    }));
  };

  // Product Management Functions
  const handleAddProduct = () => {
    setFormData((prev) => ({
      ...prev,
      pawn_product_detail: [
        ...prev.pawn_product_detail,
        {
          prod_name: "",
          pawn_weight: "",
          pawn_amount: 0,
          pawn_unit_price: 0,
        },
      ],
    }));
  };

  const deleteRow = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      pawn_product_detail: prev.pawn_product_detail.filter((_, i) => i !== index),
    }));
  };

  // Calculation Functions
  const calculateTotal = (): number => {
    return formData.pawn_product_detail.reduce(
      (sum, product) => sum + (Number(product.pawn_amount) * Number(product.pawn_unit_price) || 0),
      0
    );
  };

  // API Functions
  const fetchCustomerByPhoneNumber = async () => {
    if (!phoneNumber.trim()) {
      setResponseMessage("Please enter a phone number to search.");
      return;
    }

    const token = getAuthToken();
    if (!token) {
      setResponseMessage("Authentication failed. Please log in.");
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/order/client_phone?phone_number=${phoneNumber}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        setResponseMessage("No records found for this phone number.");
        return;
      }

      const data = await response.json();

      if (data.code === 200 && data.result.length > 0) {
        const firstRecord = data.result[0];
        setFormData((prev) => ({
          ...prev,
          cus_id: firstRecord.cus_id ?? 0,
          cus_name: firstRecord.cus_name ?? "",
          address: firstRecord.address ?? "",
        }));
        setResponseMessage("ស្វែងរកជោគជ័យ");
      } else {
        setResponseMessage("មិនមានអតិថិជន");
      }
    } catch (error) {
      console.error("Error fetching customer data:", error);
      setResponseMessage(handleApiError(error));
    }
  };

  const fetchNextPawnId = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        console.error("No authentication token found.");
        return;
      }

      const response = await fetch(`${BASE_URL}/next-pawn-id`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok || !data.result || typeof data.result.id !== "number") {
        console.error("Invalid response format for next_pawn_id:", data);
        return;
      }

      setNextPawnId(data.result.id);
    } catch (error) {
      console.error("Error fetching next pawn ID:", error);
    }
  };

  const fetchNextClientId = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        console.error("No authentication token found.");
        return;
      }

      const response = await fetch(`${BASE_URL}/next-client-id`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok || !data.result || typeof data.result.id !== "number") {
        console.error("Invalid response format for next_client_id:", data);
        return;
      }

      setNextClientId(data.result.id);
    } catch (error) {
      console.error("Error fetching next client ID:", error);
    }
  };

  // Form Submission Handlers
  const handleSubmit = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        setResponseMessage("Authentication failed. Please log in.");
        return;
      }

      let pawnIdToUse = nextPawnId;
      if (!pawnIdToUse) {
        await fetchNextPawnId();
        pawnIdToUse = nextPawnId;
      }

      if (!pawnIdToUse) {
        setResponseMessage("Failed to retrieve a valid Pawn ID.");
        return;
      }

      const updatedFormData = {
        ...formData,
        pawn_id: pawnIdToUse,
      };

      const response = await fetch(`${BASE_URL}/pawn`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(updatedFormData),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 400 && result.detail.includes("already exists")) {
          setResponseMessage(`Pawn ID ${pawnIdToUse} already exists.`);
          return;
        }
        throw new Error(result.detail || "Failed to submit");
      }

      setResponseMessage(`Pawn record successfully created! (Pawn ID: ${pawnIdToUse})`);
    } catch (error) {
      console.error("Error:", error);
      setResponseMessage(handleApiError(error));
    }
  };

  const handleEditPawn = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        setResponseMessage("Authentication failed. Please log in.");
        return;
      }

      if (!formData.pawn_id) {
        setResponseMessage("Pawn ID is missing. Cannot update.");
        return;
      }

      const formattedProducts = formData.pawn_product_detail.map((product) => ({
        prod_id: product.prod_id ?? null,
        prod_name: product.prod_name ?? "",
        pawn_weight: String(product.pawn_weight),
        pawn_amount: Number(product.pawn_amount),
        pawn_unit_price: Number(product.pawn_unit_price),
      }));

      const updatePayload = {
        pawn_id: formData.pawn_id,
        cus_id: formData.cus_id ?? null,
        customer_name: formData.cus_name ?? "",
        address: formData.address ?? "",
        phone_number: formData.phone_number ?? "",
        pawn_deposit: Number(formData.pawn_deposit),
        pawn_expire_date: formData.pawn_expire_date,
        products: formattedProducts,
        deleteOldProducts: true,
      };

      const response = await fetch(`${BASE_URL}/pawn/${formData.pawn_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(updatePayload),
      });

      if (!response.ok) {
        const errorResponse = await response.json();
        throw new Error(errorResponse.detail || "Failed to update");
      }

      setResponseMessage("Pawn record updated successfully!");
      setIsEditMode(true);
    } catch (error) {
      console.error("Error:", error);
      setResponseMessage(handleApiError(error));
    }
  };

  // Print Functions
  const handlePrint = async () => {
    const pawnId = nextPawnId;
    try {
      const response = await fetch(`${BASE_URL}/pawn/print?pawn_id=${pawnId}`);
      const result = await response.json();

      if (result.code !== 200 || !result.result.length) {
        setResponseMessage("No pawn data found for the provided ID.");
        return;
      }

      const pawnData = result.result[0];
      const pawnDetails = pawnData.pawns[0];

      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        setResponseMessage("Failed to open print window.");
        return;
      }

      printWindow.document.write(generateInvoiceHTML(pawnData, pawnDetails));
      printWindow.document.close();
    } catch (error) {
      console.error("Error fetching pawn data:", error);
      setResponseMessage("An error occurred while fetching pawn data.");
    }
  };

  const generateInvoiceHTML = (pawnData: any, pawnDetails: any) => {
    return `
      <html>
        <head>
          <title>វិក្កយបត្រ</title>
          <style>
            @page { size: A4; margin: 10mm; }
            body {
              font-family: 'Khmer OS Battambang', Arial, sans-serif;
              margin: 0;
              padding: 20px;
            }
            .header-section {
              display: flex;
              justify-content: space-between;
              margin-bottom: 20px;
            }
            .date-section { text-align: right; margin-right: 20px; }
            .invoice-title {
              text-align: center;
              font-size: 24px;
              font-weight: bold;
              margin: 20px 0;
            }
            .customer-info {
              display: grid;
              grid-template-columns: 1fr 1fr;
              margin-bottom: 20px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            th, td {
              border: 1px solid black;
              padding: 8px;
              text-align: center;
            }
            .total-section {
              width: 30%;
              margin-left: auto;
              border-collapse: collapse;
            }
            .signatures {
              display: flex;
              justify-content: space-between;
              margin-top: 50px;
              text-align: center;
            }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header-section">
            <div></div>
            <div class="date-section">កាលបរិច្ឆេទ៖ ${pawnDetails.pawn_date}</div>
            <div class="pawn-id-section">លេខ៖ ${pawnDetails.pawn_id}</div>
          </div>

          <div class="invoice-title">
            វិក្កយបត្រ<br>
            INVOICE
          </div>

          <div class="customer-info">
            <div>លេខអតិថិជន: ${pawnData.cus_id}</div>
            <div>ឈ្មោះអតិថិជន: ${pawnData.customer_name}</div>
            <div>លេខទូរស័ព្ទ: ${pawnData.phone_number}</div>
            <div>អាសយដ្ឋាន: ${pawnData.address}</div>
          </div>

          <table>
            <thead>
              <tr>
                <th>ល.រ</th>
                <th>ឈ្មោះទំនិញ</th>
                <th>ទំងន់</th>
                <th>ចំនួន</th>
                <th>តំលៃ</th>
              </tr>
            </thead>
            <tbody>
              ${pawnData.pawns.flatMap((pawn: any, pawnIndex: number) => 
                pawn.products.map((product: any, index: number) => `
                  <tr>
                    <td>${pawnIndex + index + 1}</td>
                    <td>${product.prod_name}</td>
                    <td>${product.pawn_weight}</td>
                    <td>${product.pawn_amount}</td>
                    <td>${product.pawn_unit_price}</td>
                  </tr>
                `)
              ).join('')}
            </tbody>
          </table>

          <table class="total-section">
            <tr>
              <td>សរុប</td>
              <td>${calculateTotal()}</td>
            </tr>
            <tr>
              <td>កក់មុន</td>
              <td>${pawnDetails.pawn_deposit}</td>
            </tr>
            <tr>
              <td>នៅខ្វះ</td>
              <td>${calculateTotal() - pawnDetails.pawn_deposit}</td>
            </tr>
          </table>

          <div class="signatures">
            <div>ហត្ថលេខាអ្នកទិញ</div>
            <div>ហត្ថលេខាអ្នកលក់</div>
          </div>

          <script>
            window.onload = function() {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `;
  };

  // Reset Functions
  const handleReset = async () => {
    setPhoneNumber("");
    setFormData(initialFormState);
    
    try {
      const newClientId = await fetchNextClientId();
      if (newClientId) {
        setFormData((prev) => ({ ...prev, cus_id: newClientId }));
      }

      const newPawnId = await fetchNextPawnId();
      if (newPawnId) {
        setFormData((prev) => ({ ...prev, pawn_id: newPawnId }));
      }
    } catch (error) {
      console.error("Error fetching next IDs:", error);
    }
  };

  // Initialize Component
  useEffect(() => {
    fetchNextPawnId();
    fetchNextClientId();
  }, []);

  return (
    <section id="record_pawn" className="p-6">
      <h1 className="text-2xl font-bold mb-6">កត់ត្រាការបញ្ជាំ</h1>
      <div className="container mx-auto flex flex-wrap gap-6">
        {/* Left Section */}
        <div className="w-2/6 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">ព័ត៌មានអតិថិជន</h2>
          <div className="space-y-4">
            <div className="form-group">
              <label htmlFor="customerID" className="block text-gray-700 mb-2">
                លេខសំគាល់:
              </label>
              <input
                type="text"
                // value={nextClientId !== null ? nextClientId.toString() : "Loading..."} 
                value={formData.cus_id !== 0 ? formData.cus_id.toString() : (nextClientId !== null ? nextClientId.toString() : "Loading...")}
                readOnly
                className="w-full border border-gray-300 p-2 rounded bg-gray-50"
            />

            </div>
            <div className="form-group">
              <label htmlFor="cus_name" className="block text-gray-700 mb-2">
                ឈ្មោះ:
              </label>
              <input
                type="text"
                name="cus_name"
                value={formData.cus_name}
                onChange={handleInputChange}
                placeholder="បញ្ជូលឈ្មោះអតិថិជន"
                className="w-full border border-gray-300 p-2 rounded"
              />
            </div>
            <div className="form-group">
              <label htmlFor="phone_number" className="block text-gray-700 mb-2">
                លេខទូរសព្ទ:
              </label>
              <input
                type="text"
                id="phone"
                value={phoneNumber}
                onChange={(e) => {
                  const newPhoneNumber = e.target.value;
                  setPhoneNumber(newPhoneNumber);
                  setFormData((prev) => ({
                    ...prev,
                    phone_number: newPhoneNumber,
                  }));
                }}
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
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="បញ្ជូលអាសយដ្ឋាន"
                className="w-full border border-gray-300 p-2 rounded"
              />
            </div>
          </div>
          <button
            onClick={fetchCustomerByPhoneNumber}
            className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 mt-4"
          >
            ស្វែងរក
          </button>
    
          {/* <button
            type="button"
            onClick={handleEditPawn} //  Update instead of submit
            className="bg-yellow-500 text-white py-2 px-4 rounded hover:bg-yellow-600"
          >
            កែសម្រួល
          </button> */}

        </div>

        {/* Right Section */}
        <div className="w-3/5 flex-1 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">ព័ត៌មានផលិតផល</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="form-group">
              <label htmlFor="orderpawnID" className="block text-gray-700 mb-2">
                លេខវិក្កយបត្រ:
              </label>
              <input
                type="text"
                value={nextPawnId !== null ? nextPawnId : "Loading..."}
                readOnly
                className="w-full border border-gray-300 p-2 rounded bg-gray-50"
              />
            </div>


              {/* <div className="form-group">
                <label htmlFor="date" className="block text-gray-700 mb-2">
                  កាលបរិច្ឆេទ:
                </label>
                <input
                  type="date"
                  name="pawn_date"
                  value={formData.pawn_date}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 p-2 rounded"
                />
              </div> */}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-group">
                <label htmlFor="checkin" className="block text-gray-700 mb-2">
                  ថ្ងៃបញ្ចាំ:
                </label>
                <input
                  type="date"
                  name="pawn_date"
                  value={formData.pawn_date}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 p-2 rounded"
                />
              </div>
              <div className="form-group">
                <label htmlFor="checkout" className="block text-gray-700 mb-2">
                  ថ្ងៃផុតកំណត់:
                </label>
                <input
                  type="date"
                  name="pawn_expire_date"
                  value={formData.pawn_expire_date}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 p-2 rounded"
                />
              </div>
            </div>
          </div>

          {/* Button Row */}
          <div className="flex justify-center gap-4 mt-4">
            <button
              type="button"
              onClick={handleAddProduct}
              className="bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600"
            >
              បន្ថែមផលិតផល
            </button>
            {/* <button
              type="button"
              onClick={handleRemoveProduct}
              className="bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600"
              disabled={formData.pawn_product_detail.length <= 1}
            >
              លប់ចោលផលិតផល
            </button> */}
          </div>

          {/* Table */}
          <div className="w-full overflow-auto max-h-60 border border-gray-300 mt-4"
          style={{ scrollbarGutter: "stable" }}
          >
  <table className="w-full border-collapse">
    <thead className="sticky top-0 bg-orange-500 text-white">
      <tr>
        <th className="border border-gray-300 p-2">ឈ្មោះ</th>
        <th className="border border-gray-300 p-2">ទំងន់</th>
        <th className="border border-gray-300 p-2">ចំនួន</th>
        <th className="border border-gray-300 p-2">តំលៃបញ្ចាំ</th>
        <th className="border border-gray-300 p-2"></th>
      </tr>
    </thead>
    <tbody>
      {formData.pawn_product_detail.map((product, index) => (
        <tr key={index} className="bg-white">
          <td className="border border-gray-300 p-2">
            <input
              type="text"
              value={product.prod_name}
              onChange={(e) => handleProductChange(index, "prod_name", e.target.value)}
              className="w-full p-1 bg-transparent border-none focus:outline-none focus:ring-0"
              placeholder="ឈ្មោះ"
            />
          </td>
          <td className="border border-gray-300 p-2">
            <input
              type="text"
              value={product.pawn_weight}
              onChange={(e) => handleProductChange(index, "pawn_weight", e.target.value)}
              className="w-full p-1 bg-transparent border-none focus:outline-none focus:ring-0"
              placeholder="0"
            />
          </td>
          <td className="border border-gray-300 p-2">
            <input
              type="number"
              value={product.pawn_amount}
              onChange={(e) => handleProductChange(index, "pawn_amount", e.target.value)}
              className="w-full p-1 bg-transparent border-none focus:outline-none focus:ring-0"
            />
          </td>
          <td className="border border-gray-300 p-2">
            <input
              type="number"
              value={product.pawn_unit_price}
              onChange={(e) => handleProductChange(index, "pawn_unit_price", e.target.value)}
              className="w-full p-1 bg-transpare nt border-none focus:outline-none focus:ring-0"
            />
          </td>
          <td className="border border-gray-300 p-2 text-center">
            <button
              onClick={() => deleteRow(index)}
              className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
            >
              លុប
            </button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
          {/* Summary Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div className="form-group">
              <label htmlFor="totalAmount" className="block text-gray-700 mb-2">
                តំលៃសរុប:
              </label>
              <input
                type="number"
                readOnly
                value={calculateTotal()}
                className="w-full border border-gray-300 p-2 rounded bg-gray-50"
              />
            </div>
            <div className="form-group">
              <label htmlFor="pawn_deposit" className="block text-gray-700 mb-2">
              ប្រាក់ឲ្យមុន:
              </label>
              <input
                type="number"
                name="pawn_deposit"
                value={formData.pawn_deposit}
                onChange={handleInputChange}
                className="w-full border border-gray-300 p-2 rounded"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4 mt-4">
            <button
              type="button"
              // onClick={formData.pawn_id ? handleEditPawn : handleSubmit}
              onClick={handleSubmit}
              className="bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600"
            >
              កត់ត្រាទុក
            </button>
            <button
              type="button"
              onClick={handlePrint} //  Click to print "Hello, World!"
              className="bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600"
            >
              បោះពុម្ពវិក្កយបត្រ
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600"
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