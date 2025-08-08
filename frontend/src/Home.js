import React, { useEffect, useState } from "react";
import axios from "axios";
import 'bootstrap/dist/css/bootstrap.min.css';

function Home() {
  const [exercises, setExercises] = useState([]);
  const [form, setForm] = useState({
    name: "",
    reps: "",
    sets: "",
    duration: "",
    date: ""
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const entriesPerPage = 10; // Show 10 entries per page

  const fetchExercises = () => {
    axios.get(`http://${API_BASE_URL}/exercises`, { withCredentials: true })
      .then(res => setExercises(res.data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchExercises();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    axios.post(`http://${API_BASE_URL}/exercises`, form, { withCredentials: true })
      .then(() => {
        setForm({ name: "", reps: "", sets: "", duration: "", date: "" });
        fetchExercises(); // Refresh table
      })
      .catch(err => console.error(err));
  };

  const handleDelete = (id) => {
  if (window.confirm("Are you sure you want to delete this exercise?")) {
    axios.delete(`http://${API_BASE_URL}/exercises/${id}`, { withCredentials: true })
      .then(() => fetchExercises()) // Refresh table
      .catch(err => console.error(err));
    }
  };

  const [sortOrder, setSortOrder] = useState("desc"); // default: latest first
  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  // Calculate pagination
  const indexOfLastEntry = currentPage * entriesPerPage;
  const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
  
  // Sort by date descending (latest first)
  const sortedExercises = [...exercises].sort((a, b) => {
    if (sortOrder === "asc") {
      return new Date(a[5]) - new Date(b[5]); // Oldest first
    } else {
      return new Date(b[5]) - new Date(a[5]); // Latest first
    }
  });

  // Then apply pagination
  const currentEntries = sortedExercises.slice(indexOfFirstEntry, indexOfLastEntry);  

  const totalPages = Math.ceil(exercises.length / entriesPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };



  return (
    <div className="container mt-4">
      <h3 className="mb-4 text-primary fw-bold">Your Exercise Records</h3>

      {/* Form */}
      <form className="row g-3 mb-4" onSubmit={handleSubmit}>
        <div className="col-md-3">
          <input type="text" className="form-control" name="name"
                 placeholder="Exercise Name" value={form.name} onChange={handleChange} required />
        </div>
        <div className="col-md-1">
          <input type="number" className="form-control" name="reps"
                 placeholder="Reps" value={form.reps} onChange={handleChange} />
        </div>
        <div className="col-md-1">
          <input type="number" className="form-control" name="sets"
                 placeholder="Sets" value={form.sets} onChange={handleChange} />
        </div>
        <div className="col-md-2">
          <input type="number" className="form-control" name="duration"
                 placeholder="Duration (min)" value={form.duration} onChange={handleChange} />
        </div>
        <div className="col-md-3">
          <input type="date" className="form-control" name="date"
                 value={form.date} onChange={handleChange} />
        </div>
        <div className="col-md-2">
          <button type="submit" className="btn btn-primary w-100">Add</button>
        </div>
      </form>

      {/* Table */}
      <table className="table table-bordered table-hover text-center">
        <thead className="table-primary">
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>Reps</th>
            <th>Sets</th>
            <th>Duration (min)</th>
            <th style={{ cursor: "pointer" }} onClick={toggleSortOrder}>
              Date {sortOrder === "asc" ? "▲" : "▼"}
            </th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {currentEntries.map((ex, i) => (
            <tr key={ex[0]}>
              <td>{indexOfFirstEntry + i + 1}</td> {/* Relative numbering */}
              <td>{ex[1]}</td>
              <td>{ex[2]}</td>
              <td>{ex[3]}</td>
              <td>{ex[4]}</td>
              <td>
                  {new Date(ex[5]).toLocaleDateString('en-GB', {
                    weekday: 'short',  // Fri
                    day: '2-digit',    // 01
                    month: 'short',    // Aug
                    year: 'numeric'    // 2025
                  })}
              </td>
              <td>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(ex[0])}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="d-flex justify-content-center mt-3">
        <nav>
          <ul className="pagination">
            {[...Array(totalPages)].map((_, i) => (
              <li
                key={i}
                className={`page-item ${currentPage === i + 1 ? "active" : ""}`}
              >
                <button className="page-link" onClick={() => handlePageChange(i + 1)}>
                  {i + 1}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}

export default Home;
