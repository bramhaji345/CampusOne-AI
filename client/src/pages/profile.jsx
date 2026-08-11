import React from "react";
import { useNavigate } from "react-router-dom";
import "./profile.css";

function Profile({ student, setStudent }) {
  const navigate = useNavigate();

  // Change profile image
  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (file) {
      const imageUrl = URL.createObjectURL(file);

      setStudent({
        ...student,
        profileImage: imageUrl,
      });
    }
  };

  return (
    <div className="profile-container">

      <h2 className="page-title">Student Profile</h2>

      <div className="profile-card">

        {/* Left Section */}
        <div className="profile-left">

          <img
            src={student.profileImage}
            alt="Student"
            className="profile-image"
          />

          <input
            type="file"
            id="imageUpload"
            accept="image/*"
            hidden
            onChange={handleImageChange}
          />

          <label htmlFor="imageUpload" className="change-photo-btn">
            Change Photo
          </label>

          <h3>{student.name}</h3>
          <p>{student.department}</p>

          <button
            className="edit-btn"
            onClick={() => navigate("/edit-profile")}
          >
            Edit Profile
          </button>

        </div>

        {/* Right Section */}
        <div className="profile-right">

          <div className="profile-info">

            <div className="info-box">
              <label>Roll Number</label>
              <p>{student.rollNo}</p>
            </div>

            <div className="info-box">
              <label>Department</label>
              <p>{student.department}</p>
            </div>

            <div className="info-box">
              <label>Year</label>
              <p>{student.year}</p>
            </div>

            <div className="info-box">
              <label>Semester</label>
              <p>{student.semester}</p>
            </div>

            <div className="info-box">
              <label>Email</label>
              <p>{student.email}</p>
            </div>

            <div className="info-box">
              <label>Phone</label>
              <p>{student.phone}</p>
            </div>

            <div className="info-box">
              <label>Gender</label>
              <p>{student.gender}</p>
            </div>

            <div className="info-box">
              <label>Date of Birth</label>
              <p>{student.dob}</p>
            </div>

            <div className="info-box">
              <label>Blood Group</label>
              <p>{student.bloodGroup}</p>
            </div>

            <div className="info-box">
              <label>CGPA</label>
              <p>{student.cgpa}</p>
            </div>

            <div className="info-box">
              <label>Attendance</label>
              <p>{student.attendance}</p>
            </div>

            <div className="info-box full-width">
              <label>Address</label>
              <p>{student.address}</p>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Profile;