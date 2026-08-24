import "./profile.css";
import AdminLayout from "../../layouts/AdminLayout";
import { FaCamera, FaSave, FaLock } from "react-icons/fa";

export default function Profile() {
  return (
    <AdminLayout>

      <div className="profile-page">

        <div className="profile-header">
          <h2>Admin Profile</h2>
          <p>Manage your account information</p>
        </div>

        <div className="profile-container">

          {/* Left Card */}

          <div className="profile-card">

            <div className="profile-image">

              <img
                src="https://i.pravatar.cc/180"
                alt="Admin"
              />

              <button>
                <FaCamera />
              </button>

            </div>

            <h3>Administrator</h3>

            <p>System Administrator</p>

            <div className="profile-info">

              <div>
                <span>Email</span>
                <strong>admin@campusone.ai</strong>
              </div>

              <div>
                <span>Phone</span>
                <strong>+91 9876543210</strong>
              </div>

              <div>
                <span>Role</span>
                <strong>Super Admin</strong>
              </div>

            </div>

          </div>

          {/* Right Card */}

          <div className="profile-details">

            <div className="card">

              <h3>Personal Information</h3>

              <div className="form-grid">

                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    defaultValue="Administrator"
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
                  <label>Phone</label>
                  <input
                    type="text"
                    defaultValue="+91 9876543210"
                  />
                </div>

                <div className="form-group">
                  <label>Designation</label>
                  <input
                    type="text"
                    defaultValue="System Administrator"
                  />
                </div>

              </div>

              <button className="save-btn">

                <FaSave />

                Save Profile

              </button>

            </div>

            <div className="card">

              <h3>Change Password</h3>

              <div className="form-group">
                <label>Current Password</label>
                <input
                  type="password"
                  placeholder="Current Password"
                />
              </div>

              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  placeholder="New Password"
                />
              </div>

              <div className="form-group">
                <label>Confirm Password</label>
                <input
                  type="password"
                  placeholder="Confirm Password"
                />
              </div>

              <button className="password-btn">

                <FaLock />

                Change Password

              </button>

            </div>

          </div>

        </div>

      </div>

    </AdminLayout>
  );
}