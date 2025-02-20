import React, { useState, useEffect } from "react";
// import { useState } from "react";

export default function RecordPawn() {
  // Initial form state
  const initialFormState = {
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

  // Form state
  // const [formData, setFormData] = useState(initialFormState);
  const [responseMessage, setResponseMessage] = useState("");
  // const [nextPawnId, setNextPawnId] = useState(0);  //  Initialize as number
  const [nextClientId, setNextClientId] = useState(0);  //  Initialize as number
  // const [phoneNumber, setPhoneNumber] = useState("");  //  This is fine as a string
  const [phoneNumber, setPhoneNumber] = useState(""); 
  const [formData, setFormData] = useState(initialFormState);
  // const [formData, setFormData] = useState(initialFormState);
  // const [responseMessage, setResponseMessage] = useState("");
  const [nextPawnId, setNextPawnId] = useState(""); //  Ensure it's a string initially
  const [isEditMode, setIsEditMode] = useState(false);


  // Handle input changes for main form fields
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const deleteRow = (index) => {
    setFormData((prev) => ({
      ...prev,
      pawn_product_detail: prev.pawn_product_detail.filter((_, i) => i !== index),
    }));
  };
  
  const fetchCustomerByPhoneNumber = async () => {
    if (!phoneNumber.trim()) {
      setResponseMessage("Please enter a phone number to search.");
      return;
    }
  
    const token = localStorage.getItem("access_token");
    if (!token) {
      setResponseMessage("Authentication failed. Please log in.");
      return;
    }
  
    const url = `http://127.0.0.1:8000/staff/order/client_phone?phone_number=${phoneNumber}`;
  
    try {
      const response = await fetch(url, {
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
  
        console.log("Fetched Record:", firstRecord); // 🔥 Debugging Log
  
        //  Preserve existing form fields
        setFormData((prev) => ({
          ...prev, // Keep existing data like pawn_product_detail
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
      setResponseMessage("Failed to fetch customer details.");
    }
  };
  


  const handleEditPawn = async () => {
    try {
        const token = localStorage.getItem("access_token");

        if (!formData.pawn_id) {
            setResponseMessage("Pawn ID is missing. Cannot update.");
            return;
        }

        // Ensure each product has a valid `prod_id` or fallback to `prod_name`
        const formattedProducts = formData.pawn_product_detail.map((product) => ({
            prod_id: product.prod_id ?? null, // Ensure it's either a valid ID or `null`
            prod_name: product.prod_name ?? "", // Ensure `prod_name` exists
            pawn_weight: String(product.pawn_weight), // Ensure weight is a string
            pawn_amount: Number(product.pawn_amount), // Convert to number
            pawn_unit_price: Number(product.pawn_unit_price), // Convert to number
        }));

        const updatePayload = {
            pawn_id: formData.pawn_id, // Ensure `pawn_id` is included
            cus_id: formData.cus_id ?? null, // Include `cus_id`
            customer_name: formData.cus_name ?? "", //  Fix: Rename `cus_name` to `customer_name`
            address: formData.address ?? "", // Ensure `address` is sent
            phone_number: formData.phone_number ?? "", // Ensure `phone_number` is sent
            pawn_deposit: Number(formData.pawn_deposit),
            pawn_expire_date: formData.pawn_expire_date,
            products: formattedProducts,
            deleteOldProducts: true, //  Add this flag to trigger deletion on the backend
        };

        console.log("🔹 Sending Update Request:", updatePayload); //  Debugging log

        const response = await fetch(
            `http://127.0.0.1:8000/staff/pawn/${formData.pawn_id}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(updatePayload),
            }
        );

        if (!response.ok) {
            const errorResponse = await response.json();
            console.error(" API Error Response:", errorResponse);
            throw new Error(errorResponse.detail || "Failed to update");
        }

        const result = await response.json();
        console.log(" Success:", result);

        setResponseMessage("Pawn record updated successfully! ");

        // Keep edit mode enabled for further updates
        setIsEditMode(true);
    } catch (error) {
        console.error(" Error:", error);
        setResponseMessage(`Failed to update data: ${error.message}`);
    }
};
  

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
      <head>
        <title>វិក្កយបត្រ</title>
        <style>
          @page {
            size: A4;
            margin: 10mm;
          }
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
          .date-section {
            text-align: right;
            margin-right: 20px;
          }
          .copy-mark {
            position: absolute;
            top: 10px;
            right: 10px;
            border: 1px solid black;
            padding: 5px;
          }
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
          .customer-info div {
            margin: 5px 0;
            padding: 5px;
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
            margin-right: 0;
            border-collapse: collapse;
          }
          .total-section td {
            border: 1px solid black;
            padding: 5px 10px;
            font-size: 14px;
          }
          .total-section td:first-child {
            text-align: left;
          }
          .total-section td:last-child {
            text-align: right;
          }
          .signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 50px;
            text-align: center;
          }
          .signatures div {
            width: 200px;
          }
          @media print {
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header-section">
        <div></div>
        <div class="date-section">
          កាលបរិច្ឆេទ៖ ${formData.pawn_date} 
        </div>
      </div>

        <div class="invoice-title">
          វិក្កយបត្រ<br>
          INVOICE
        </div>

        <div class="customer-info">
          <div>លេខអតិថិជន: ${formData.cus_id}</div>
          <div>ឈ្មោះអតិថិជន:  ${formData.cus_name}</div>
          <div>លេខទូរស័ព្ទ: ${formData.phone_number}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th>ល.រ</th>
              <th>ឈ្មោះទំនិញ</th>
              <th>ទំងន់</th>
              <th>ចំនួន</th>
              <th>តំលៃ</th>
              <th>សរុបរួម</th>
            </tr>
          </thead>
          <tbody>
            ${formData.pawn_product_detail.map((product, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${product.prod_name}</td>
                <td>${product.pawn_weight}</td>
                <td>${product.pawn_amount}</td>
                <td>${product.pawn_unit_price}</td>
                <td>${(product.pawn_amount * product.pawn_unit_price)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <table class="total-section">
          <tr>
            <td>សរុប</td>
            <td>${calculateTotal()}</td>
          </tr>
          <tr>
            <td>កក់មុន</td>
            <td>${formData.pawn_deposit}</td>
          </tr>
          <tr>
            <td>នៅខ្វះ</td>
            <td>${calculateTotal() - formData.pawn_deposit}</td>
          </tr>
        </table>

        <div class="signatures">
          <div>
            ហត្ថលេខាអ្នកទិញ
          </div>
          <div>
            ហត្ថលេខាអ្នកលក់
          </div>
        </div>

        <script>
          window.onload = function() {
            window.print();
            window.close();
          };
        </script>
      </body>
    </html>
    `);
    printWindow.document.close();
  };
  
  
  
  
  
  // Handle changes in product details
  const handleProductChange = (index, field, value) => {
    // Remove leading zeros from numeric inputs
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
  

  // Add new product row
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

  // Remove last product row
  const handleRemoveProduct = () => {
    if (formData.pawn_product_detail.length > 1) {
      setFormData((prev) => ({
        ...prev,
        pawn_product_detail: prev.pawn_product_detail.slice(0, -1),
      }));
    }
  };

  // Calculate total amount
  const calculateTotal = () => {
    return formData.pawn_product_detail.reduce(
      (sum, product) => sum + (Number(product.pawn_amount) * Number(product.pawn_unit_price) || 0),
      0
    );
  };
  
  const handleSubmit = async () => {
    try {
        const token = localStorage.getItem("access_token");

        if (!token) {
            setResponseMessage("Authentication failed. Please log in.");
            return;
        }

        let pawnIdToUse = nextPawnId; // ✅ Use current state first

        // ✅ Ensure we have a valid Pawn ID before submitting
        if (!pawnIdToUse) {
            console.log("Fetching next pawn ID before submission...");
            await fetchNextPawnId(); // ✅ Fetches next pawn ID
            pawnIdToUse = nextPawnId; // ✅ Retrieve updated value
        }

        if (!pawnIdToUse) {
            setResponseMessage("Failed to retrieve a valid Pawn ID.");
            return;
        }

        // ✅ Ensure `formData` is updated with the correct Pawn ID
        const updatedFormData = {
            ...formData,
            pawn_id: pawnIdToUse, // ✅ Use the correct pawn ID
        };

        console.log("🔹 Submitting Pawn Record with ID:", pawnIdToUse);

        const response = await fetch("http://127.0.0.1:8000/staff/pawn", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(updatedFormData), // ✅ Send updated pawn_id in payload
        });

        const result = await response.json();
        console.log("Success:", result);

        if (!response.ok) {
            if (response.status === 400 && result.detail.includes("already exists")) {
                setResponseMessage(`Pawn ID ${pawnIdToUse} already exists.`);
                console.log(`Pawn ID ${pawnIdToUse} already exists. Submission blocked.`);
                return;
            }
            throw new Error(result.detail || "Failed to submit");
        }

        setResponseMessage(`Pawn record successfully created! (Pawn ID: ${pawnIdToUse})`);

    } catch (error) {
        console.error("Error:", error);
        setResponseMessage(`Failed to submit data: ${error.message}`);
    }
};



  
  const fetchNextPawnId = async () => {
    try {
        console.log("Fetching next pawn ID...");
        const token = localStorage.getItem("access_token");
        if (!token) {
            console.error("No authentication token found. User may not be logged in.");
            return;
        }

        const response = await fetch("http://localhost:8000/staff/next-pawn-id", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
        });

        const data = await response.json(); // Convert response to JSON

        if (!response.ok || !data.result || typeof data.result.id !== "number") {
            console.error("Invalid response format for next_pawn_id:", data);
            return;
        }

        setNextPawnId(data.result.id);
        console.log("Extracted Next Pawn ID:", data.result.id);
    } catch (error) {
        console.error("Error fetching next pawn ID:", error);
    }
  };


  const fetchNextClientId = async () => {
    try {
        console.log("Fetching next client ID...");
        const token = localStorage.getItem("access_token");
        if (!token) {
            console.error("No authentication token found. User may not be logged in.");
            return;
        }

        const response = await fetch("http://127.0.0.1:8000/staff/next-client-id", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
        });

        const data = await response.json(); //  Convert response to JSON

        if (!response.ok || !data.result || typeof data.result.id !== "number") {
            console.error(" Invalid response format for next_client_id:", data);
            return;
        }

        setNextClientId(data.result.id);  //  Update state properly
        console.log(" Extracted Next Client ID:", data.result.id);
    } catch (error) {
        console.error(" Error fetching next client ID:", error);
    }
};





  useEffect(() => {
    console.log("Fetching Next Pawn and Client ID...");
    fetchNextPawnId();
    fetchNextClientId();  //  Ensure this is called
  }, []);

  // Reset form
  const handleReset = async () => {
    console.log("⏳ Resetting form...");
    
    setPhoneNumber(""); // Reset separate phoneNumber state
    setFormData(initialFormState); //  Reset entire form to initial state
    
    try {
      //  Fetch and set the next Client ID
      const newClientId = await fetchNextClientId();
      if (newClientId) {
        setFormData((prev) => ({ ...prev, cus_id: newClientId }));
        console.log(" Updated Client ID:", newClientId);
      } else {
        console.warn("⚠️ No new Client ID fetched.");
      }
  
      //  Fetch and set the next Pawn ID
      const newPawnId = await fetchNextPawnId();
      if (newPawnId) {
        setFormData((prev) => ({ ...prev, pawn_id: newPawnId }));
        console.log(" Updated Pawn ID:", newPawnId);
      } else {
        console.warn("⚠️ No new Pawn ID fetched.");
      }
  
    } catch (error) {
      console.error("Error fetching next IDs:", error);
    }
  };
  
  

  return (
    <section id="record_pawn" className="p-6">
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
                value={phoneNumber} //  Keep tracking with `phoneNumber` state
                onChange={(e) => {
                  const newPhoneNumber = e.target.value;
                  setPhoneNumber(newPhoneNumber); //  Update phone number separately
                  setFormData((prev) => ({
                    ...prev,
                    phone_number: newPhoneNumber, //  Update inside `formData`
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
        <th className="border border-gray-300 p-2">តំលៃបញ្ចាំ</th>
        <th className="border border-gray-300 p-2">ចំនួន</th>
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