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
  order_weight: number;
  order_amount: number;
  product_sell_price: number;
  product_labor_cost: number;
  product_buy_price: number;
}

interface Order {
  order_id: number;
  order_date: string;
  order_deposit: number;
  products: Product[];
}

interface SearchInput {
  cus_id: string;
  cus_name: string;
  phone_number: string;
}

export default function DisplayOrders() {
  // State Management
  const [orders, setOrders] = useState<Order[]>([]); 
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

      const response = await fetch(`${BASE_URL}/order?cus_id=${cus_id}`, {
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
        setResponseMessage(errorData.detail || "Error fetching orders.");
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
      const response = await fetch(`${BASE_URL}/orders/print?order_id=${orderId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        setResponseMessage("Order not found.");
        return;
      }

      const orderData = await response.json();
      if (!orderData.result || orderData.result.length === 0) {
        setResponseMessage("No order details found.");
        return;
      }

      const order = orderData.result[0];
      generateAndPrintInvoice(order, orderId);

    } catch (error) {
      handleApiError(error, "Failed to fetch order details.");
    }
  };

  // Helper Functions
  const calculateTotal = (orders: any[]): number => {
    if (!Array.isArray(orders) || orders.length === 0) {
      return 0;
    }
    return orders.reduce((total, orderItem) => 
      total + (orderItem.product.order_amount * orderItem.product.product_sell_price) + orderItem.product.product_labor_cost, 0);
  };

  const generateAndPrintInvoice = (order: any, orderId: number) => {
    const { cus_id: customerId, customer_name: customerName, phone_number: phoneNumber, address, orders } = order;

    if (!Array.isArray(orders) || orders.length === 0) {
      setResponseMessage("No order details found.");
      return;
    }

    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
      <head>
        <title></title>
        <style>
          @page { size: A4; margin: 10mm; }
          body { font-family: 'Khmer OS Battambang', Arial, sans-serif; padding: 20px; }
          .header-section {
            display: flex;
            justify-content: space-between; 
            align-items: center;
            margin-bottom: 20px;
            padding-right: 20px;    
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
            display: flex;
            flex-direction: column;   
            text-align: right;        
            gap: 5px;                 
          }

          .date-section {
            
            font-size: 14px;
          }

          .id-section {
            font-size: 14px;
         
          }
                                                    
          .invoice-title { text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0; }
          .customer-info { display: grid; grid-template-columns: 1fr 1fr; margin-bottom: 20px; }
          .customer-info div { padding: 5px 0; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { border: 1px solid black; padding: 8px; text-align: center; }
          .total-section { width: 30%; margin-left: auto; border-collapse: collapse; }
          .total-section tr { height: 30px; }
          .total-section td { border: 1px solid black; padding: 5px 10px; font-size: 14px; }
          .total-section td:first-child { text-align: left; width: 40%; }
          .total-section td:last-child { text-align: right; width: 60%; }
          .signatures { display: flex; justify-content: space-between; margin-top: 50px; text-align: center; }
          .signatures div { width: 200px; }
        </style>
      </head>
      <body>

        <div class="header-section">
          <div class="logo-section">
            <img src="/logo.png" alt="Company Logo" class="logo">
          </div>
          <div class="date-id-section">
            <div class="date-section">កាលបរិច្ឆេទ៖ ${orders[0].order_date}</div>
            <div class="id-section">លេខវិក្កយបត្រ៖ ${orderId}</div>
          </div>
        </div>


        <div class="invoice-title">វិក្កយបត្រ<br>INVOICE</div>

        <div class="customer-info">
        
            <div>ឈ្មោះអតិថិជន​៖ ${customerName}</div>
            <div>លេខអតិថិជន៖ ${customerId}</div>
            <div>លេខទូរស័ព្ទ៖ ${phoneNumber}</div>
            <div>អាសយដ្ឋាន៖ ${address}</div>
             
         
        </div>

        <table>
          <thead>
            <tr>
              <th>ល.រ</th>
              <th>ឈ្មោះទំនិញ</th>
              <th>ទំងន់</th>
              <th>ចំនួន</th>
              <th>តម្លៃ</th>
              <th>ឈ្នូល</th>
              <th>លក់វិញ</th>
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
    <section id="display_orders" className="p-6">
      <div className="container mx-auto">
        <div className="w-full bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-6">ទិញ &លក់: រុករកអតិថិជន</h2>

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
              <div key={index} className="mb-8 p-4 border rounded-lg bg-white shadow-sm">
                {/* Order header with details and print button */}
                <div className="flex justify-between items-start mb-4">
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                    <p className="font-bold">លេខវិក្កយបត្រ: {order.order_id}</p>
                    <p className="font-bold">ប្រាក់កក់: {order.order_deposit}</p>
                    <p className="font-bold">
                      ថ្ងៃកក់: {new Date(order.order_date).toLocaleDateString()}
                    </p>
                    <div></div> {/* Empty div to maintain grid layout */}
                  </div>
                  
                  <button
                    onClick={() => handlePrint(order.order_id)}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    បោះពុម្ព
                  </button>
                </div>

                {/* Products section */}
                <div>
                  <h3 className="font-bold text-lg mb-2 border-b pb-1">ផលិតផល:</h3>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300 text-sm">
                      <thead className="bg-orange-500 text-white">
                        <tr>
                          <th className="border border-gray-300 p-2">ឈ្មោះផលិតផល</th>
                          <th className="border border-gray-300 p-2">ទំងន់</th>
                          <th className="border border-gray-300 p-2">ចំនួន</th>
                          <th className="border border-gray-300 p-2">តំលៃលក់</th>
                          <th className="border border-gray-300 p-2">ឈ្នួល</th>
                          <th className="border border-gray-300 p-2">ប្រាក់កក់</th>
                          <th className="border border-gray-300 p-2">តំលៃទិញចូលវិញ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.products.map((product, idx) => (
                          <tr key={`${order.order_id}-${idx}`} className="hover:bg-gray-50">
                            <td className="border border-gray-300 p-2 text-center">
                              {product.prod_name}
                            </td>
                            <td className="border border-gray-300 p-2 text-center">
                              {product.order_weight}
                            </td>
                            <td className="border border-gray-300 p-2 text-center">
                              {product.order_amount}
                            </td>
                            <td className="border border-gray-300 p-2 text-center">
                              {product.product_sell_price}
                            </td>
                            <td className="border border-gray-300 p-2 text-center">
                              {product.product_labor_cost}
                            </td>
                            <td className="border border-gray-300 p-2 text-center">
                              {order.order_deposit}
                            </td>
                            <td className="border border-gray-300 p-2 text-center">
                              {product.product_buy_price}
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
