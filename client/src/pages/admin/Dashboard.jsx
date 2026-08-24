import "./dashboard.css";
import AdminLayout from "../../layouts/AdminLayout";
import StatCard from "../../components/StatCard";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  Tooltip
} from "recharts";

const attendanceData = [
  { month: "Jan", value: 82 },
  { month: "Feb", value: 86 },
  { month: "Mar", value: 88 },
  { month: "Apr", value: 91 },
  { month: "May", value: 94 },
  { month: "Jun", value: 96 },
];

const activities = [
  "Student Rahul Registered",
  "Faculty Attendance Updated",
  "Bonafide Certificate Approved",
  "Notice Added",
  "New Department Created"
];

export default function Dashboard() {
  return (
    <AdminLayout>

      <div className="dashboard">

        <div className="page-title">
          <h2>Dashboard</h2>
          <p>Welcome back, Administrator 👋</p>
        </div>

        <div className="stats-grid">

          <StatCard
            title="Students"
            value="1,540"
            color="#4F8EF7"
          />

          <StatCard
            title="Faculty"
            value="92"
            color="#16C784"
          />

          <StatCard
            title="Departments"
            value="12"
            color="#F59E0B"
          />

          <StatCard
            title="Pending Requests"
            value="18"
            color="#EF4444"
          />

        </div>

        <div className="dashboard-row">

          <div className="chart-card">

            <h3>Attendance Analytics</h3>

            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month"/>
                <Tooltip/>
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#4F8EF7"
                  fill="#4F8EF7"
                />
              </AreaChart>
            </ResponsiveContainer>

          </div>

          <div className="activity-card">

            <h3>Recent Activities</h3>

            <ul>

              {activities.map((item,index)=>(
                <li key={index}>{item}</li>
              ))}

            </ul>

          </div>

        </div>

      </div>

    </AdminLayout>
  );
}