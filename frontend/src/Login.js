import React, { useState } from "react";
import axios from "axios";

function Login({ onLogin }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/login", { code }, { withCredentials: true });
      if (res.data.success) {
        onLogin(); // Call parent function to set logged-in state
      } else {
        setError("Invalid code");
      }
    } catch (err) {
      setError("Invalid code");
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100">
      <form onSubmit={handleSubmit} className="p-4 shadow rounded bg-light">
        <h3 className="mb-3 text-center">Enter Access Code</h3>
        <input
          type="password"
          className="form-control mb-3"
          placeholder="Enter code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        {error && <div className="text-danger mb-2">{error}</div>}
        <button className="btn btn-primary w-100" type="submit">Login</button>
      </form>
    </div>
  );
}

export default Login;
