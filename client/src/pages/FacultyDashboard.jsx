import DashboardCard from "../components/dashboardcard";
import "./FacultyDashboard.css";

function FacultyDashboard() {
  return (
    <>
      <h2>Faculty Dashboard</h2>

      <div className="cards">
        <DashboardCard title="Today's Classes" value="5" />

        <DashboardCard title="Attendance Taken" value="24" />

        <DashboardCard title="Pending Assignments" value="3" />

        <DashboardCard title="Students" value="180" />
      </div>

      <div className="schedule">
        <h3>Today's Schedule</h3>

        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Subject</th>
              <th>Room</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td>9:00 AM</td>
              <td>DBMS</td>
              <td>Lab-1</td>
            </tr>

            <tr>
              <td>11:00 AM</td>
              <td>Operating Systems</td>
              <td>Room 204</td>
            </tr>

            <tr>
              <td>2:00 PM</td>
              <td>AI</td>
              <td>Lab-3</td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}

export default FacultyDashboard;