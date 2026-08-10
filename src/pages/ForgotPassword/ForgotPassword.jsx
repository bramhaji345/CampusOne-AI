import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaEnvelope
} from "react-icons/fa6";

import "./ForgotPassword.css";

export default function ForgotPassword() {

  const navigate = useNavigate();

  const [email, setEmail] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!email.trim()) {
      alert("Please enter your College ID or Email.");
      return;
    }

    alert("Password reset instructions have been sent.");
  };

  return (
    <div className="forgot-page">

      <div className="forgot-card">

        <button
          type="button"
          className="back-button"
          onClick={() => navigate("/")}
        >
          <FaArrowLeft />
          Back to Login
        </button>


        <div className="forgot-icon">
          <FaEnvelope />
        </div>


        <h2>Forgot Password?</h2>

        <p>
          Enter your College ID or registered email
          address to reset your password.
        </p>


        <form onSubmit={handleSubmit}>

          <label>
            College ID / Email
          </label>


          <div className="forgot-input">

            <FaEnvelope />

            <input
              type="text"
              placeholder="Enter College ID or Email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
            />

          </div>


          <button
            type="submit"
            className="reset-button"
          >
            Send Reset Instructions
          </button>

        </form>

      </div>

    </div>
  );
}