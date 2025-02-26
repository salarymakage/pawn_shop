import { useEffect, useState } from "react";

// Constants
const BASE_URL = "http://127.0.0.1:8000/staff";

// Interfaces
interface Client {
  cus_id: number;
  cus_name: string;
  phone_number: string;
  address: string;
}

interface Product {
  prod_name: string;
  pawn_weight: number;
  pawn_amount: number;
  pawn_unit_price: number;
}

interface Pawn {
  pawn_id: number;
  pawn_date: string;
  pawn_deposit: number;
  products: Product[];
}

interface PawnData {
  customer_name: string;
  cus_id: number;
  phone_number: string;
  address: string;
  pawns: Pawn[];
}

interface SearchInput {
  cus_id: string;
  cus_name: string;
  phone_number: string;
}

export default function DisplayOrders() {
  // State Management
  const [orders, setOrders] = useState<Pawn[]>([]);
  const [allClients, setAllClients] = useState<Client[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [responseMessage, setResponseMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [searchInput, setSearchInput] = useState<SearchInput>({
    cus_id: "",
    cus_name: "",
    phone_number: "",
  });

  // Utility Functions
  const getAuthToken = (): string | null => {
    return localStorage.getItem("access_token");
  };

  const handleApiError = (error: any, defaultMessage: string) => {
    console.error(error);
    setResponseMessage(defaultMessage);
  };

  // API Functions
  const fetchClients = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        setResponseMessage("You are not logged in. Please log in.");
        return;
      }

      const response = await fetch(`${BASE_URL}/client`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAllClients(data.result || []);
        setClients(data.result || []);
      } else {
        const errorData = await response.json();
        setResponseMessage(errorData.detail || "Error fetching clients.");
      }
    } catch (error) {
      handleApiError(error, "Failed to connect to the server.");
    }
  };

  const fetchOrders = async (cus_id: number) => {
    try {
      const token = getAuthToken();
      if (!token) {
        setResponseMessage("You are not logged in. Please log in.");
        return;
      }

      const response = await fetch(`${BASE_URL}/pawn?cus_id=${cus_id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data.result || []);
        setShowModal(true);
      } else {
        const errorData = await response.json();
        setResponseMessage(errorData.detail || "Error fetching pawn records.");
      }
    } catch (error) {
      handleApiError(error, "Failed to connect to the server.");
    }
  };

  // Event Handlers
  const handleClientSearch = () => {
    const { cus_id, cus_name, phone_number } = searchInput;
    let filteredClients = [...allClients];

    if (cus_id || cus_name || phone_number) {
      filteredClients = allClients.filter((client) => {
        const matchId = cus_id && client.cus_id === parseInt(cus_id);
        const matchName = cus_name && client.cus_name.toLowerCase().includes(cus_name.toLowerCase());
        const matchPhone = phone_number && client.phone_number.toLowerCase().includes(phone_number.toLowerCase());
        return matchId || matchName || matchPhone;
      });
    }

    setClients(filteredClients);
    setResponseMessage(filteredClients.length > 0 ? "" : "No clients found with the given input.");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput({
      ...searchInput,
      [e.target.name]: e.target.value,
    });
  };

  const handlePrint = async (pawnId: number) => {
    if (!pawnId || isNaN(pawnId)) {
      setResponseMessage("Please enter a valid Pawn ID.");
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/pawn/print?pawn_id=${pawnId}`);
      const result = await response.json();

      if (result.code !== 200 || !result.result.length) {
        setResponseMessage("No pawn data found for the provided ID.");
        return;
      }

      const pawnData: PawnData = result.result[0];
      const pawnDetails = pawnData.pawns[0];

      generateAndPrintInvoice(pawnData, pawnDetails);
    } catch (error) {
      handleApiError(error, "Failed to fetch pawn data.");
    }
  };

  // Helper Functions
  const calculateTotal = (pawnData: PawnData): number => {
    return pawnData.pawns
      .flatMap((pawn) => pawn.products)
      .reduce((total, product) => {
        return total + product.pawn_amount * product.pawn_unit_price;
      }, 0);
  };

  const generateAndPrintInvoice = (pawnData: PawnData, pawnDetails: Pawn) => {
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
            align-items: center;
            margin-bottom: 20px;
          }

          .logo-section {
            padding-left: 1px;
          }

          .logo {
            margin-top: 25px;
            max-height: 100px;
            width: auto;
          }
          .date-id-section {
            text-align: right;
            margin-right: 20px;
            display: flex;
            flex-direction: column;  /* Stack vertically */
            gap: 5px;  /* Space between date and ID */
          }

          .date-section {
            
            font-size: 14px;
          }

          .pawn-id-section {
            font-size: 14px;
            
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
            padding: 5px 0;  
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
          .total-section td {
            border: 1px solid black;
            padding: 5px 10px;
            font-size: 14px;
          }
          .signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 50px;
            text-align: center;
          }
          @media print {
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header-section">
          <div class="logo-section">
            <img src="/logo.png"  alt="Company Logo" class="logo">
          </div>
          <div class="date-id-section">
            <div class="date-section">
              កាលបរិច្ឆេទ៖ ${pawnDetails.pawn_date}
            </div>
            <div class="pawn-id-section">
              លេខវិក្កយបត្រ៖ ${pawnDetails.pawn_id}
            </div>
          </div>
        </div>

        <div class="invoice-title">
          វិក្កយបត្រ<br>
          INVOICE
        </div>

        <div class="customer-info">
        <div>ឈ្មោះអតិថិជន: ${pawnData.customer_name}</div>
        <div>លេខអតិថិជន: ${pawnData.cus_id}</div>
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
            ${pawnData.pawns.flatMap((pawn, pawnIndex) => 
              pawn.products.map((product, index) => `
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
            <td>${calculateTotal(pawnData)}</td>
          </tr>
          <tr>
            <td>កក់មុន</td>
            <td>${pawnDetails.pawn_deposit}</td>
          </tr>
          <tr>
            <td>នៅខ្វះ</td>
            <td>${calculateTotal(pawnData) - pawnDetails.pawn_deposit}</td>
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
    `);

    printWindow.document.close();
  };

  // Effects
  useEffect(() => {
    fetchClients();
  }, []);

  // Render UI
  return (
    <section id="search_pawn" className="p-6">
      <div className="container mx-auto">
        <div className="w-full bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-6">ការរុករកព័ត៌មានអតិថិជនបញ្ចាំ</h2>

          {/* Search Input and Submit Button */}
          <div className="mb-4 flex gap-4">
            <input
              type="text"
              name="cus_id"
              value={searchInput.cus_id}
              onChange={handleInputChange}
              className="flex-1 border border-gray-300 p-2 rounded"
              placeholder="បញ្ចូលលេខសំគាល់អតិថិជន"
            />
            <input
              type="text"
              name="cus_name"
              value={searchInput.cus_name}
              onChange={handleInputChange}
              className="flex-1 border border-gray-300 p-2 rounded"
              placeholder="បញ្ចូលឈ្មោះអតិថិជន"
            />
            <input
              type="text"
              name="phone_number"
              value={searchInput.phone_number}
              onChange={handleInputChange}
              className="flex-1 border border-gray-300 p-2 rounded"
              placeholder="បញ្ចូលលេខទូរសព្ទអតិថិជន"
            />
            <button
              onClick={handleClientSearch}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              ស្វែងរក
            </button>
          </div>

          {/* Clients Table */}
          <h2 className="text-xl font-bold mt-8 mb-4">  </h2>
          {clients.length > 0 ? (
            <div className="overflow-y-auto max-h-[650px] border border-gray-300 rounded-lg">
              <table className="w-full border-collapse border border-gray-300 text-sm">
                <thead className="sticky top-0 bg-orange-500 text-white z-10">
                  <tr>
                    <th className="border border-gray-300 p-2">លេខសំគាល់</th>
                    <th className="border border-gray-300 p-2">ឈ្មោះអតិថិជន</th>
                    <th className="border border-gray-300 p-2">លេខទូរសព្ទ</th>
                    <th className="border border-gray-300 p-2">អាសយដ្ឋាន</th>
                    <th className="border border-gray-300 p-2">លម្អិត</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client) => (
                    <tr key={client.cus_id}>
                      <td className="border border-gray-300 p-2 text-center">
                        {client.cus_id}
                      </td>
                      <td className="border border-gray-300 p-2 text-center">
                        {client.cus_name}
                      </td>
                      <td className="border border-gray-300 p-2 text-center">
                        {client.phone_number}
                      </td>
                      <td className="border border-gray-300 p-2 text-center">
                        {client.address}
                      </td>
                      <td className="border border-gray-300 p-2 text-center">
                        <button
                          onClick={() => {
                            setSelectedClient(client); // Store the selected client
                            fetchOrders(client.cus_id); // Fetch orders for the client
                          }}
                          className="bg-gray-500 text-white px-2 py-1 rounded hover:bg-green-400"
                        >
                          មើលបន្ថែម
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-gray-700 mt-4">{responseMessage}</p>
          )}

          {/* Modal for Orders */}
          {showModal && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
              <div className="bg-white p-6 rounded-lg shadow-lg w-3/4 max-h-[80vh] overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">
                  ព័ត៌មានអតិថិជន: {selectedClient?.cus_name}
                </h2>

                <div className="overflow-y-auto max-h-[60vh]">
            {orders.map((order, index) => (
              <div key={index} className="mb-8 border rounded-lg p-4 bg-white shadow-sm">
                {/* Header section with grid layout and print button */}
                <div className="flex justify-between items-start mb-4">
                  {/* 2x2 Grid for order details */}
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                    <p className="font-bold">លេខវិក្កយបត្រ: {order.pawn_id}</p>
                    <p className="font-bold">ប្រាក់កក់: {order.pawn_deposit}</p>
                    <p className="font-bold">
                      ថ្ងៃកក់: {new Date(order.pawn_date).toLocaleDateString()}
                    </p>
                    <p className="font-bold">
                      ថ្ងៃផុតកំណត់: {new Date(order.pawn_date).toLocaleDateString()}
                    </p>
                  </div>
                  
                  {/* Print button */}
                  <button
                    onClick={() => handlePrint(order.pawn_id)}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    បោះពុម្ព
                  </button>
                </div>

                {/* Products section */}
                <div className="mt-4">
                  <h3 className="font-bold text-lg mb-2 border-b pb-1">ផលិតផល:</h3>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300 text-sm">
                      <thead className="bg-orange-500 text-white">
                        <tr>
                          <th className="border border-gray-300 p-2">ឈ្មោះផលិតផល</th>
                          <th className="border border-gray-300 p-2">ទំងន់</th>
                          <th className="border border-gray-300 p-2">ចំនួន</th>
                          <th className="border border-gray-300 p-2">តំលៃលក់</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.products.map((product, idx) => (
                          <tr key={`${order.pawn_id}-${idx}`}>
                            <td className="border border-gray-300 p-2 text-center">
                              {product.prod_name}
                            </td>
                            <td className="border border-gray-300 p-2 text-center">
                              {product.pawn_weight}
                            </td>
                            <td className="border border-gray-300 p-2 text-center">
                              {product.pawn_amount}
                            </td>
                            <td className="border border-gray-300 p-2 text-center">
                              {product.pawn_unit_price}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ))}
          </div>

      <button
        onClick={() => setShowModal(false)} // Close the modal
        className="bg-red-500 text-white px-4 py-2 mt-4 rounded hover:bg-red-600"
      >
        បិទ
      </button>
    </div>
  </div>
)}

        </div>
      </div>
    </section>
  );
}
