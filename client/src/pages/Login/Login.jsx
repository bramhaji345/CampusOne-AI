import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/images/logo.png";
import {
  FaUserGraduate,
  FaBookOpen,
  FaUserShield,
  FaUser,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaArrowRight,
  FaChartSimple,
  FaRobot,
  FaClipboardList,
  FaGraduationCap
} from "react-icons/fa6";

import "./Login.css";

export default function Login() {

  const navigate = useNavigate();

  const [role, setRole] = useState("student");
  const [showPassword, setShowPassword] = useState(false);

  const [collegeId, setCollegeId] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);

  const demoUsers = {
    student: {
      id: "CS2204001",
      password: "student123"
    },
    faculty: {
      id: "FAC1001",
      password: "faculty123"
    },
    admin: {
      id: "ADMIN01",
      password: "admin123"
    }
  };

  const selectRole = (newRole) => {
    setRole(newRole);
    setCollegeId("");
    setPassword("");
  };

  const useDemo = () => {
    setCollegeId(demoUsers[role].id);
    setPassword(demoUsers[role].password);
  };

  const handleLogin = (e) => {
    e.preventDefault();

    if (!collegeId || !password) {
      alert("Please enter College ID and Password");
      return;
    }

    if (role === "student") {
      navigate("/student-dashboard");
    } else if (role === "faculty") {
      navigate("/faculty-dashboard");
    } else {
      navigate("/admin-dashboard");
    }
  };

  return (
    <div className="login-page">

      {/* ================= LEFT ================= */}

      <section className="left-panel">

        <div className="circle circle-one"></div>
        <div className="circle circle-two"></div>

        {/* Logo */}

        <div className="brand">

          <div className="logo">
            <b>C</b>
            <FaGraduationCap />
          </div>

          <div>
            <h1>CampusOne AI</h1>
            <p>AI Powered Campus Portal</p>
          </div>

        </div>


        {/* Hero */}

        <div className="hero">

          <h2>
            Your entire
            <br />
            campus life,
            <br />
            <span>in one place.</span>
          </h2>

          <p>
            AI-powered attendance tracking, real-time academic
            insights, assignments, notifications, and a personal
            academic assistant — all unified in one platform.
          </p>

        </div>


        {/* Campus Illustration */}

        <div className="campus">

          <div className="sun"></div>

          <div className="building">

            <div className="roof"></div>

            <div className="tower">
              <span>AI</span>
            </div>

            <div className="windows">
              <i></i>
              <i></i>
              <i></i>
            </div>

            <div className="door"></div>

          </div>

        </div>


        {/* Features */}

        <div className="features">

          <div className="feature">

            <div className="feature-icon">
              <FaChartSimple />
            </div>

            <b>Attendance</b>
            <small>Live monitoring</small>

          </div>


          <div className="feature">

            <div className="feature-icon">
              <FaRobot />
            </div>

            <b>AI Assistant</b>
            <small>Smart learning</small>

          </div>


          <div className="feature">

            <div className="feature-icon">
              <FaClipboardList />
            </div>

            <b>Assignments</b>
            <small>Easy management</small>

          </div>

        </div>


        <p className="quote">
          “Everything you need for your campus journey.”
        </p>

      </section>


      {/* ================= RIGHT ================= */}

      <section className="right-panel">

        <div className="form-container">

          {/* Heading */}

          <div className="heading">

            <h2>Sign in to your account</h2>

            <p>
              Choose your role and enter your credentials below.
            </p>

          </div>


          {/* Role */}

          <div className="roles">

            <button
              type="button"
              className={`role ${
                role === "student" ? "active" : ""
              }`}
              onClick={() => selectRole("student")}
            >
              <FaUserGraduate />
              Student
            </button>


            <button
              type="button"
              className={`role ${
                role === "faculty" ? "active" : ""
              }`}
              onClick={() => selectRole("faculty")}
            >
              <FaBookOpen />
              Faculty
            </button>


            <button
              type="button"
              className={`role ${
                role === "admin" ? "active" : ""
              }`}
              onClick={() => selectRole("admin")}
            >
              <FaUserShield />
              Admin
            </button>

          </div>


          {/* Form */}

          <form onSubmit={handleLogin}>

            <label>College ID</label>

            <div className="input-box">

              <FaUser />

              <input
                type="text"
                placeholder="Enter College ID"
                value={collegeId}
                onChange={(e) =>
                  setCollegeId(e.target.value)
                }
              />

            </div>


            <label>Password</label>

            <div className="input-box">

              <FaLock />

              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter Password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
              />

              <button
                type="button"
                className="eye"
                onClick={() =>
                  setShowPassword(!showPassword)
                }
              >
                {showPassword ? (
                  <FaEyeSlash />
                ) : (
                  <FaEye />
                )}
              </button>

            </div>


            {/* Options */}

            <div className="options">

              <label className="remember">

                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) =>
                    setRemember(e.target.checked)
                  }
                />

                Remember Me

              </label>


             <button
               type="button"
               className="forgot"
               onClick={() => navigate("/forgot-password")}
>
  Forgot Password?
</button> 
            </div>


            {/* Login */}

            <button
              type="submit"
              className="signin"
            >
              Sign In
              <FaArrowRight />
            </button>

          </form>


          {/* Demo credentials */}

          <div className="demo">

            <div className="demo-title">
              ✨
              <div>
                <b>Demo Credentials</b>
                <small>Click "Use" to autofill</small>
              </div>
            </div>


            <div className="demo-row">

              <div className="demo-user">

                <div className="demo-icon">
                  <FaUserGraduate />
                </div>

                <div>
                  <b>Student</b>
                  <small>CS2204001</small>
                </div>

              </div>

              <button
                type="button"
                onClick={() => {
                  setRole("student");
                  setCollegeId("CS2204001");
                  setPassword("student123");
                }}
              >
                Use
              </button>

            </div>


            <div className="demo-row">

              <div className="demo-user">

                <div className="demo-icon">
                  <FaBookOpen />
                </div>

                <div>
                  <b>Faculty</b>
                  <small>FAC1001</small>
                </div>

              </div>

              <button
                type="button"
                onClick={() => {
                  setRole("faculty");
                  setCollegeId("FAC1001");
                  setPassword("faculty123");
                }}
              >
                Use
              </button>

            </div>


            <div className="demo-row">

              <div className="demo-user">

                <div className="demo-icon">
                  <FaUserShield />
                </div>

                <div>
                  <b>Admin</b>
                  <small>ADMIN01</small>
                </div>

              </div>

              <button
                type="button"
                onClick={() => {
                  setRole("admin");
                  setCollegeId("ADMIN01");
                  setPassword("admin123");
                }}
              >
                Use
              </button>

            </div>

          </div>

        </div>


        <footer>
          ♥ Made with care for a better campus experience.
        </footer>

      </section>

    </div>
  );
}