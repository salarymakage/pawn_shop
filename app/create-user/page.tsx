"use client";

import axios, { AxiosError } from "axios";
import React, { useState } from "react";

// Type definitions
interface ApiResponse {
  result: {
    access_token: string;
  };
}

interface ApiError {
  detail: string;
}

const Login = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [responseMessage, setResponseMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResponseMessage("");

    try {
      const response = await axios.post<ApiResponse>(
        "http://127.0.0.1:8000/sign_in",
        {
          phone_number: phoneNumber,
          password: password,
        }
      );

      // Extract access_token from the response
      const { access_token } = response.data.result;

      if (access_token) {
        localStorage.setItem("access_token", access_token);
        setResponseMessage("Login successful!");
        // Optionally redirect here
        window.location.href = "/dashboard";
      } else {
        setResponseMessage("Login successful but no token received");
      }

    } catch (err) {
      let errorMessage = "An unexpected error occurred";

      if (axios.isAxiosError(err)) {
        const error = err as AxiosError<ApiError>;
        
        if (error.response) {
          // Server returned an error response (4xx, 5xx)
          errorMessage = error.response.data?.detail || error.response.statusText;
        } else if (error.request) {
          // Request was made but no response received
          errorMessage = "No response from server. Please check your connection.";
        } else {
          // Something happened in setting up the request
          errorMessage = error.message || "Failed to make request";
        }
      }

      setResponseMessage(`Error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 text-center">Login</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium">
            Phone Number:
          </label>
          <input
            type="text"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            required
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">
            Password:
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
            disabled={isLoading}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded
                   hover:bg-blue-700 transition-colors duration-200
                   disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Logging in..." : "Login"}
        </button>
      </form>

      {responseMessage && (
        <p className={`mt-4 text-center ${
          responseMessage.includes("Error") 
            ? "text-red-600" 
            : "text-green-600"
        }`}>
          {responseMessage}
        </p>
      )}
    </div>
  );
};

export default Login;