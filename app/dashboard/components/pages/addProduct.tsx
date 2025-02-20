"use client";

import { useEffect, useState } from "react";

interface Product {
  id: number;
  name: string;
  price: number;
  amount: number;
}

const BASE_URL = "http://127.0.0.1:8000/staff";

export default function AddProduct() {
  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState(0);
  const [productAmount, setProductAmount] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [responseMessage, setResponseMessage] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [lastProductId, setLastProductId] = useState(null);

  useEffect(() => {
    handleSearch();
    fetchLastProductId();
  }, []);

//   const fetchLastProductId = async () => {
//     try {
//         const token = localStorage.getItem("access_token");
//         if (!token) {
//             setResponseMessage("Authentication failed. Please log in.");
//             return;
//         }

//         const response = await fetch(`${BASE_URL}/last-id`, {
//             method: "GET",
//             headers: {
//                 "Content-Type": "application/json",
//                 "Authorization": `Bearer ${token}`  //  Include token for authorization
//             }
//         });

//         if (response.ok) {
//             const data = await response.json();
//             setLastProductId(data.last_product_id);
//         } else if (response.status === 403) {
//             setResponseMessage("Access denied. You are not authorized.");
//         } else {
//             setResponseMessage("Failed to fetch the last product ID.");
//         }
//     } catch (error) {
//         setResponseMessage("Error connecting to the server.");
//     }
// };


const fetchLastProductId = async () => {
  try {
    const token = localStorage.getItem("access_token");
    if (!token) {
      console.error("Authentication failed. Please log in.");
      return;
    }

    const response = await fetch(`${BASE_URL}/next-product-id`, { //  Updated endpoint
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();

      console.log("API Response:", data); // Debugging: Log API response

      //  Ensure we only store the ID, not the entire object
      if (data && data.result && typeof data.result.id === "number") {
        setLastProductId(data.result.id); //  Store only the ID
      } else {
        console.error("Invalid response format:", data);
      }
    } else {
      console.error("Failed to fetch the last product ID.");
    }
  } catch (error) {
    console.error("Error connecting to the server:", error);
  }
};



const handleSubmit = async () => {
  if (!productName || productPrice <= 0 || productAmount <= 0) {
    setResponseMessage("សូមបំពេញឲ្យបានត្រឹមត្រូវ");
    return;
  }

  const token = localStorage.getItem("access_token");
  if (!token) {
    setResponseMessage("សូមចូលគណនីម្តងទៀត");
    return;
  }

  const payload = {
    prod_name: productName,
    unit_price: productPrice,
    product_sell_price: productPrice,
    amount: productAmount,
  };

  try {
    const response = await fetch(`${BASE_URL}/product`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      setResponseMessage("ផលិតផលត្រូវបានដាក់បញ្ចូលដោយជោគជ័យ");
      setProductName("");
      setProductPrice(0);
      setProductAmount(0);

      //  Ensure fetchLastProductId is correctly defined before using it
      if (typeof fetchLastProductId === "function") {
        await fetchLastProductId();
      } else {
        console.error("fetchLastProductId is not defined.");
      }

      //  Ensure handleSearch is also defined before calling it
      if (typeof handleSearch === "function") {
        await handleSearch();
      } else {
        console.error("handleSearch is not defined.");
      }
    } else {
      const errorData = await response.json();
      setResponseMessage(errorData.detail || "Error adding product.");
    }
  } catch (error) {
    setResponseMessage("Failed to connect to the server.");
  }
};

  
  const handleSearch = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setResponseMessage("You are not logged in. Please log in to continue.");
      return;
    }

    try {
      const query = searchInput || productName;
      const url = query
        ? `${BASE_URL}/products/search/${query}`
        : `${BASE_URL}/product`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const result = Array.isArray(data.result) ? data.result : [data.result];
        setProducts(result);
        setResponseMessage("");
      } else {
        const errorData = await response.json();
        setResponseMessage(errorData.detail || "Error retrieving products.");
        setProducts([]);
      }
    } catch (error) {
      setResponseMessage("Failed to connect to the server.");
      setProducts([]);
    }
  };

  const handleDelete = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setResponseMessage("Authentication failed. Please log in.");
      return;
    }
  
    // Check both searchInput (ID) and productName
    if (!searchInput && !productName) {
      setResponseMessage("Please enter a product ID or name to delete.");
      return;
    }
  
    // Determine whether the search input is numeric (for ID-based deletion)
    const isNumeric = searchInput && /^\d+$/.test(searchInput);
  
    // Construct the deletion URL based on available inputs
    const url = isNumeric
      ? `${BASE_URL}/products/${searchInput}` // Delete by ID
      : `${BASE_URL}/products/name/${productName}`; // Delete by name
  
    try {
      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
  
      if (response.ok || response.status === 404) {
        setResponseMessage(
          `ផលិតផលត្រូវបានលុបពីប្រព័ន្ធដោយជោគជ័យ!`
          // } '${isNumeric ? searchInput : productName}' ត្រូវបានលុបពីប្រព័ដោយជោគជ័យ!`
        );
        // );
  
        // Clear both fields after deletion
        setSearchInput("");
        setProductName("");
  
        // Update the product list
        setProducts((prevProducts) =>
          prevProducts.filter((product) =>
            isNumeric
              ? product.id !== parseInt(searchInput)
              : product.name.toLowerCase() !== productName.toLowerCase()
          )
        );
  
        // Optionally refresh the last product ID
        fetchLastProductId();
      } else {
        const errorData = await response.json();
        setResponseMessage(errorData.detail || "Error deleting product.");
      }
    } catch (error) {
      setResponseMessage("Failed to connect to the server.");
    }
  };

  const handleEdit = async () => {
    if (!searchInput && !productName) {
      setResponseMessage("Please enter a product ID or name to edit.");
      return;
    }
  
    const token = localStorage.getItem("access_token");
    if (!token) {
      setResponseMessage("Authentication failed. Please log in.");
      return;
    }

    //  Corrected JSON keys to match FastAPI
    const payload = {
      prod_id: searchInput ? parseInt(searchInput) : null, //  Changed from product_id
      prod_name: productName ? productName : null, //  Changed from product_name
      unit_price: productPrice || undefined, //  Only include if provided
      amount: productAmount || undefined, //  Only include if provided
    };

    try {
      const response = await fetch(`http://127.0.0.1:8000/staff/product`, { //  Correct API URL
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json(); //  Read API response

      if (response.ok) {
        setResponseMessage(" ផលិតផលត្រូវបានកែប្រែដោយជោគជ័យ!");
        setSearchInput("");
        setProductName("");
        setProductPrice(0);
        setProductAmount(0);
        handleSearch(); //  Refresh product list after update
      } else {
        setResponseMessage(data.detail || " Error editing product.");
      }
    } catch (error) {
      setResponseMessage(" Failed to connect to the server.");
    }
  };



  return (
    <section id="add_product" className="active">
      <div className="container mx-auto p-4 h-full">
        <div className="flex flex-wrap gap-4 h-full">
          <div className="w-2/5 bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">ព័ត៌មានផលិតផល</h2>
            <div className="flex flex-col">
              <div className="form-group mb-4">
                <label htmlFor="searchInput" className="block text-gray-700 mb-2">
                  លេខសំគាល់:
                </label>
                <input
                  type="number"
                  id="searchInput"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full border border-gray-300 p-2 rounded"
                  placeholder={lastProductId !== null && lastProductId !== undefined ? `${lastProductId}` : "Loading..."} //  Fix for undefined issue
                />

              </div>
              <div className="form-group mb-4">
                <label htmlFor="productName" className="block text-gray-700 mb-2">
                  ឈ្មោះ:
                </label>
                <input
                  type="text"
                  id="productName"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full border border-gray-300 p-2 rounded"
                  placeholder="បញ្ចូលឈ្មោះផលិតផល"
                />
              </div>

              <div className="form-group mb-4">
                <label htmlFor="productPrice" className="block text-gray-700 mb-2">
                  តំលៃក្នុងមួយឯកតា:
                </label>
                <input
                  type="number"
                  id="productPrice"
                  value={productPrice || ""} // Use empty string if value is 0 or NaN
                  onChange={(e) => setProductPrice(parseFloat(e.target.value) || 0)} // Ensure numeric conversion
                  className="w-full border border-gray-300 p-2 rounded"
                  placeholder="បញ្ចូលតម្លៃ"
                />
              </div>

              <div className="form-group mb-4">
                <label htmlFor="productAmount" className="block text-gray-700 mb-2">
                  ចំនួន:
                </label>
                <input
                  type="number"
                  id="productAmount"
                  value={productAmount || ""} // Use empty string if value is 0 or NaN
                  onChange={(e) => setProductAmount(parseInt(e.target.value) || 0)} // Ensure numeric conversion
                  className="w-full border border-gray-300 p-2 rounded"
                  placeholder="បញ្វូលចំនួន"
                />
              </div>

            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <button
                onClick={handleSubmit}
                type="button"
                className="bg-gray-500 text-white py-2 px-4 rounded hover:bg-green-600"
              >
                កត់ត្រាទុក
              </button>
              
              <button
                onClick={handleSearch}
                type="button"
                className="bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600"
              >
                រុករក
              </button>
              
              <button
                onClick={handleDelete}
                type="button"
                className="bg-gray-500 text-white py-2 px-4 rounded hover:bg-red-600"
              >
                លប់ចោល
              </button>
              
              <button
                onClick={handleEdit}
                type="button"
                className="bg-gray-500 text-white py-2 px-4 rounded hover:bg-yellow-600"
              >
                កែប្រែផលិតផល
              </button>
            </div>

          </div>

          <div className="flex-1 bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">លទ្ធផលពីការរុករក</h2>
            <div className="overflow-y-auto max-h-[650px] border border-gray-300 rounded-lg">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-orange-500 text-white sticky top-0 z-10">
                    <th className="border border-gray-300 p-2">លេខសំគាល់</th>
                    <th className="border border-gray-300 p-2">ឈ្មោះផលិតផល</th>
                    <th className="border border-gray-300 p-2">តំលៃក្នុងមួយឯកតា</th>
                    <th className="border border-gray-300 p-2">ចំនួន</th>
                  </tr>
                </thead>
                <tbody>
                  {products.length > 0 ? (
                    products.map((product, index) => (
                      <tr key={product.id || `temp-key-${index}`} className="bg-gray-100 hover:bg-gray-200">
                        <td className="border border-gray-300 p-2">{product.id}</td>
                        <td className="border border-gray-300 p-2">{product.name}</td>
                        <td className="border border-gray-300 p-2">{product.price}</td>
                        <td className="border border-gray-300 p-2">{product.amount}</td>
                      </tr>
                    ))
                  ) : (
                    <tr className="bg-gray-100">
                      <td colSpan={4} className="border border-gray-300 p-2 text-center">
                        No products found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {responseMessage && (
          <div className="mt-4 p-4 bg-gray-100 border border-gray-300 rounded">
            <p>{responseMessage}</p>
          </div>
        )}
      </div>
    </section>
  );
}
