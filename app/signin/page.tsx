"use client";

import axios, { AxiosError } from "axios";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

interface LoginResponse {
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
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResponseMessage("");

    try {
      const response = await axios.post<LoginResponse>(
        "http://127.0.0.1:8000/sign_in",
        {
          phone_number: phoneNumber,
          password: password,
        }
      );

      const { access_token } = response.data.result;
      
      if (access_token) {
        localStorage.setItem("access_token", access_token);
        setResponseMessage("Login successful! Redirecting...");
        router.push("/dashboard");
      } else {
        setResponseMessage("Login successful, but no token received.");
      }
    } catch (error) {
      let errorMessage = "An unexpected error occurred. Please try again.";
      
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<ApiError>;
        
        if (axiosError.response) {
          // Server responded with an error
          errorMessage = axiosError.response.data?.detail || "Server error occurred";
        } else if (axiosError.request) {
          // Request was made but no response received
          errorMessage = "No response from server. Please check your connection.";
        } else {
          // Error in request configuration
          errorMessage = "Error in making the request. Please try again.";
        }
      }
      
      setResponseMessage(`Error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto text-center p-6">
      <h1 className="text-2xl font-bold mb-6">Login</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col">
          <label className="text-left mb-1">Phone Number:</label>
          <input
            type="text"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            required
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
        </div>
        <div className="flex flex-col">
          <label className="text-left mb-1">Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          disabled={isLoading}
        >
          {isLoading ? "Logging in..." : "Login"}
        </button>
      </form>
      {responseMessage && (
        <p className={`mt-4 ${responseMessage.includes("Error") ? "text-red-600" : "text-green-600"}`}>
          {responseMessage}
        </p>
      )}
    </div>
  );
};

export default Login;