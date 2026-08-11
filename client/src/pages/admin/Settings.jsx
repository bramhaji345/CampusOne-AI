import "./settings.css";
import AdminLayout from "../../layouts/AdminLayout";
import { FaSave } from "react-icons/fa";

export default function Settings() {
  return (
    <AdminLayout>

      <div className="settings-page">

        <div className="settings-header">
          <h2>Settings</h2>
          <p>Manage system configuration and preferences</p>
        </div>

        <div className="settings-card">

          <h3>College Information</h3>

          <div className="form-grid">

            <div className="form-group">
              <label>College Name</label>
              <input
                type="text"
                defaultValue="CampusOne Engineering College"
              />
            </div>

            <div className="form-group">
              <label>College Code</label>
              <input
                type="text"
                defaultValue="CAMPUS001"
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                defaultValue="admin@campusone.ai"
              />
            </div>

            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="text"
                defaultValue="+91 9876543210"
              />
            </div>

            <div className="form-group full-width">
              <label>College Address</label>
              <textarea
                rows="4"
                defaultValue="Hyderabad, Telangana"
              ></textarea>
            </div>

          </div>

        </div>

        <div className="settings-card">

          <h3>System Preferences</h3>

          <div className="switch-row">

            <span>Enable Email Notifications</span>

            <input type="checkbox" defaultChecked />

          </div>

          <div className="switch-row">

            <span>Enable SMS Notifications</span>

            <input type="checkbox" />

          </div>

          <div className="switch-row">

            <span>Dark Mode</span>

            <input type="checkbox" />

          </div>

        </div>

        <div className="settings-card">

          <h3>Security</h3>

          <div className="form-grid">

            <div className="form-group">
              <label>Current Password</label>
              <input
                type="password"
                placeholder="Enter current password"
              />
            </div>

            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                placeholder="Enter new password"
              />
            </div>

            <div className="form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                placeholder="Confirm password"
              />
            </div>

          </div>

        </div>

        <div className="save-section">

          <button className="save-btn">

            <FaSave />

            Save Changes

          </button>

        </div>

      </div>

    </AdminLayout>
  );
}