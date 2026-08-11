
import React from "react";
import "./StudentProfile.css";

const student = {
  name: "C. Harshitha",
  rollNumber: "23CSE301",
  department: "Computer Science & Engineering",
  year: "3rd Year",
  semester: "Semester 1",
  section: "CSE-3",
  cgpa: "9.18",

  email: "c.harshitha@campusone.edu",
  phone: "+91 9876543210",

  dateOfBirth: "18 May 2005",
  gender: "Female",
  bloodGroup: "B+",

  address: "Ongole, Andhra Pradesh",

  fatherName: "C. Srinivas",
  motherName: "C. Lakshmi",
  parentPhone: "+91 9441265845",

  admissionYear: "2023",
  academicYear: "2026-27",

  mentor: "Assistant Professor Sindhu Ruth",
};

export default function StudentProfile() {
  return (
    <div className="profile-page">

      <div className="profile-card">

        {/* Profile Header */}

        <div className="profile-header">

          <div className="profile-image">
            👤
          </div>

          <div className="profile-info">
            <h2>{student.name}</h2>

            <p><strong>Roll No:</strong> {student.rollNumber}</p>

            <p>{student.department}</p>

            <p>
              {student.year} | {student.semester} | {student.section}
            </p>

            <span className="status">
              Active Student
            </span>
          </div>

          <button className="edit-btn">
            Edit Profile
          </button>

        </div>

        {/* Summary */}

        <div className="summary">

          <div className="summary-card">
            <h3>{student.cgpa}</h3>
            <p>CGPA</p>
          </div>

          <div className="summary-card">
            <h3>{student.year}</h3>
            <p>Current Year</p>
          </div>

          <div className="summary-card">
            <h3>{student.section}</h3>
            <p>Section</p>
          </div>

          <div className="summary-card">
            <h3>{student.academicYear}</h3>
            <p>Academic Year</p>
          </div>

        </div>

        {/* Personal Information */}

        <div className="card">

          <h3>👤 Personal Information</h3>

          <p><strong>Name :</strong> {student.name}</p>

          <p><strong>Date of Birth :</strong> {student.dateOfBirth}</p>

          <p><strong>Gender :</strong> {student.gender}</p>

          <p><strong>Blood Group :</strong> {student.bloodGroup}</p>

          <p><strong>Email :</strong> {student.email}</p>

          <p><strong>Phone :</strong> {student.phone}</p>

        </div>

        {/* Academic Information */}

        <div className="card">

          <h3>🎓 Academic Information</h3>

          <p><strong>Roll Number :</strong> {student.rollNumber}</p>

          <p><strong>Department :</strong> {student.department}</p>

          <p><strong>Year :</strong> {student.year}</p>

          <p><strong>Semester :</strong> {student.semester}</p>

          <p><strong>Section :</strong> {student.section}</p>

          <p><strong>Admission Year :</strong> {student.admissionYear}</p>

          <p><strong>Academic Year :</strong> {student.academicYear}</p>

          <p><strong>CGPA :</strong> {student.cgpa}</p>

          <p><strong>Mentor :</strong> {student.mentor}</p>

        </div>

        {/* Parent Details */}

        <div className="card">

          <h3>👨‍👩‍👧 Parent Details</h3>

          <p><strong>Father Name :</strong> {student.fatherName}</p>

          <p><strong>Mother Name :</strong> {student.motherName}</p>

          <p><strong>Parent Phone :</strong> {student.parentPhone}</p>

        </div>

        {/* Address */}

        <div className="card">

          <h3>📍 Address</h3>

          <p>{student.address}</p>

        </div>

      </div>

    </div>
  );
}