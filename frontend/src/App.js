import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import axios from "axios";
import Home from "./Home";
import Statistics from "./Statistics";
// import CalendarPage from "./CalendarPage";
import Login from "./Login";
import './App.css';

function App() {
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    axios.get("http://localhost:5000/check-auth", { withCredentials: true })
      .then(res => setAuthenticated(res.data.authenticated))
      .catch(() => setAuthenticated(false));
  }, []);

  const handleLogout = () => {
    axios.post("http://localhost:5000/logout", {}, { withCredentials: true })
      .then(() => setAuthenticated(false))
      .catch(err => console.error(err));
  };

  if (!authenticated) {
    return <Login onLogin={() => setAuthenticated(true)} />;
  }

  return (
    <Router>
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary mb-4 shadow">
        <div className="container">
          <Link className="navbar-brand fw-bold text-white" to="/">Exercise Tracker</Link>
          <div className="navbar-nav">
            <Link className="nav-link mx-2 custom-link" to="/">Home</Link>
            <Link className="nav-link mx-2 custom-link" to="/statistics">Statistics</Link>
            {/* <Link className="nav-link mx-2 custom-link" to="/calendar">Calendar</Link> */}
            <button className="btn btn-danger btn-sm ms-3" onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/statistics" element={<Statistics />} />
        {/* <Route path="/calendar" element={<CalendarPage />} /> */}
      </Routes>
    </Router>
  );
}

export default App;
