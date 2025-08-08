import React, { useEffect, useState } from "react";
import axios from "axios";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import "bootstrap/dist/css/bootstrap.min.css";
import { API_BASE_URL } from "./config";

function CalendarPage() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    axios.get(`${API_BASE_URL}/exercises`)
      .then(res => {
        const formatted = res.data.map((exercise) => ({
          title: `${exercise[1]} (${exercise[4]} min)`, // name + duration
          start: exercise[5], // date field from backend
          allDay: true
        }));
        setEvents(formatted);
      })
      .catch(err => console.error(err));
  }, []);

  const handleDateClick = (info) => {
    alert(`Clicked on ${info.dateStr}`);
    // Optional: filter exercises for that date and show in modal
  };

  return (
    <div className="container my-4">
      <h2 className="mb-3">📅 Exercise Calendar</h2>
      <div className="card shadow border-0 p-3">
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={events}
          dateClick={handleDateClick}
        />
      </div>
    </div>
  );
}

export default CalendarPage;
