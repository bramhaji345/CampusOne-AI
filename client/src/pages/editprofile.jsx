import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./editprofile.css";

function EditProfile({ student, setStudent }) {
  const navigate = useNavigate();

  const [formData, setFormData] = useState(student);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (file) {
      const imageURL = URL.createObjectURL(file);

      setFormData({
        ...formData,
        profileImage: imageURL,
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Update Profile Data
    setStudent(formData);

    alert("Profile Updated Successfully!");

    navigate("/profile");
  };

  return (
    <div className="edit-container">

      <h2>Edit Student Profile</h2>

      <form onSubmit={handleSubmit}>

        <div className="image-section">

          <img
            src={formData.profileImage}
            alt="Student"
            className="edit-profile-image"
          />

          <input
            type="file"
            id="uploadImage"
            accept="image/*"
            hidden
            onChange={handleImageChange}
          />

          <label htmlFor="uploadImage" className="upload-btn">
            Change Photo
          </label>

        </div>

        <div className="form-grid">

          <div className="input-group">
            <label>Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
            />
          </div>

          <div className="input-group">
            <label>Roll Number</label>
            <input
              type="text"
              name="rollNo"
              value={formData.rollNo}
              onChange={handleChange}
            />
          </div>

          <div className="input-group">
            <label>Department</label>
            <input
              type="text"
              name="department"
              value={formData.department}
              onChange={handleChange}
            />
          </div>

          <div className="input-group">
            <label>Year</label>
            <input
              type="text"
              name="year"
              value={formData.year}
              onChange={handleChange}
            />
          </div>

          <div className="input-group">
            <label>Semester</label>
            <input
              type="text"
              name="semester"
              value={formData.semester}
              onChange={handleChange}
            />
          </div>

          <div className="input-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className="input-group">
            <label>Phone</label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>

          <div className="input-group">
            <label>Gender</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
            >
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
          </div>

          <div className="input-group">
            <label>Date of Birth</label>
            <input
              type="date"
              name="dob"
              value={formData.dob}
              onChange={handleChange}
            />
          </div>

          <div className="input-group">
            <label>Blood Group</label>
            <input
              type="text"
              name="bloodGroup"
              value={formData.bloodGroup}
              onChange={handleChange}
            />
          </div>

          <div className="input-group">
            <label>CGPA</label>
            <input
              type="text"
              name="cgpa"
              value={formData.cgpa}
              onChange={handleChange}
            />
          </div>

          <div className="input-group">
            <label>Attendance</label>
            <input
              type="text"
              name="attendance"
              value={formData.attendance}
              onChange={handleChange}
            />
          </div>

          <div className="input-group full-width">
            <label>Address</label>
            <textarea
              name="address"
              rows="4"
              value={formData.address}
              onChange={handleChange}
            />
          </div>

        </div>

        <div className="button-group">

          <button
            type="button"
            className="cancel-btn"
            onClick={() => navigate("/profile")}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="save-btn"
          >
            Save Changes
          </button>

        </div>

      </form>

    </div>
  );
}

export default EditProfile;