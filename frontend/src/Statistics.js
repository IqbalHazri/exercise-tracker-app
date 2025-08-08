import React, { useEffect, useState } from "react";
import axios from "axios";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

function Statistics() {
  const [stats, setStats] = useState({ daily: [], weekly: [], monthly: [] });

  useEffect(() => {
    axios.get("http://localhost:5000/statistics", { withCredentials: true })
      .then(res => setStats(res.data))
      .catch(err => console.error(err));
  }, []);

  const makeChartData = (labels, data, label) => ({
    labels,
    datasets: [
      {
        label,
        data,
        backgroundColor: "rgba(75,192,192,0.4)",
        borderColor: "rgb(75,192,192)",
        borderWidth: 2
      }
    ]
  });

  return (
    <div className="container mt-4">
      <h3 className="mb-4 text-primary fw-bold">Exercise Statistics</h3>

      <h4 className="mt-4">Minutes per Day</h4>
      <Line data={makeChartData(stats.daily.map(d => d.label), stats.daily.map(d => d.minutes), "Minutes")} />

      <h4 className="mt-4">Minutes per Week</h4>
      <Bar data={makeChartData(stats.weekly.map(d => d.label), stats.weekly.map(d => d.minutes), "Minutes")} />

      <h4 className="mt-4">Minutes per Month</h4>
      <Bar data={makeChartData(stats.monthly.map(d => d.label), stats.monthly.map(d => d.minutes), "Minutes")} />
    </div>
  );
}

export default Statistics;
