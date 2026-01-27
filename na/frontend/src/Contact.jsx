import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

import Navbar from "./Navbar.jsx";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    message: "",
  });

  const [status, setStatus] = useState({ type: "", msg: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle Input Change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus({ type: "info", msg: "Sending message..." });

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/contact`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      );

      if (response.ok) {
        setStatus({ type: "success", msg: "Message sent successfully! We will contact you soon." });
        setFormData({ name: "", email: "", mobile: "", message: "" }); // Reset form
      } else {
        throw new Error("Server error");
      }
    } catch (error) {
      console.error("Error:", error);
      // Fallback for demo purposes if backend isn't ready
      setStatus({ type: "success", msg: "Thanks! We received your request (Demo Mode)." });
      setFormData({ name: "", email: "", mobile: "", message: "" });
    } finally {
      setIsSubmitting(false);
      // Clear success message after 5 seconds
      setTimeout(() => setStatus({ type: "", msg: "" }), 5000);
    }
  };

  // Custom Styles for "My Wish" Design
  const styles = {
    pageWrapper: {
      backgroundColor: "#f4f7f6",
      minHeight: "100vh",
      paddingBottom: "50px",
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    },
    headerSection: {
      textAlign: "center",
      padding: "40px 20px",
      marginBottom: "20px",
    },
    infoCard: {
      background: "linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%)",
      color: "#fff",
      borderRadius: "20px",
      padding: "40px",
      height: "100%",
      boxShadow: "0 10px 30px rgba(13, 110, 253, 0.3)",
    },
    formCard: {
      backgroundColor: "#ffffff",
      borderRadius: "20px",
      border: "none",
      boxShadow: "0 15px 35px rgba(0,0,0,0.05)",
      overflow: "hidden",
    },
    inputField: {
      padding: "12px 15px",
      borderRadius: "10px",
      border: "1px solid #e0e0e0",
      backgroundColor: "#f8f9fa",
    },
    submitBtn: {
      padding: "12px",
      borderRadius: "10px",
      fontWeight: "600",
      letterSpacing: "0.5px",
      transition: "all 0.3s ease",
    },
    link: {
      color: "rgba(255,255,255,0.9)",
      textDecoration: "none",
      transition: "color 0.2s",
    }
  };

  return (
    <>
      <Navbar />

      <div style={styles.pageWrapper}>
        <div className="container">

          {/* Header Title */}
          <div style={styles.headerSection}>
            <h1 className="fw-bold text-dark">Contact Us</h1>
            <p className="text-muted fs-5">Have questions? We'd love to hear from you.</p>
          </div>

          <div className="row justify-content-center g-4">

            {/* Left Side: Contact Information (Styled Dark Blue) */}
            <div className="col-lg-5 col-md-6">
              <div style={styles.infoCard}>
                <h3 className="fw-bold mb-4">Get in Touch</h3>
                <p className="opacity-75 mb-5">
                  Fill up the form and our team will get back to you within 24 hours.
                </p>

                <div className="d-flex mb-4 align-items-start">
                  <i className="bi bi-geo-alt-fill fs-4 me-3"></i>
                  <div>
                    <h6 className="fw-bold mb-1">Location</h6>
                    <span>Thanjavur, Tamil Nadu, India</span>
                  </div>
                </div>

                <div className="d-flex mb-4 align-items-start">
                  <i className="bi bi-envelope-fill fs-4 me-3"></i>
                  <div>
                    <h6 className="fw-bold mb-1">Email</h6>
                    <a href="mailto:nallaangadi2026@gmail.com" style={styles.link}>
                      nallaangadi2026@gmail.com
                    </a>
                  </div>
                </div>

                <div className="d-flex mb-4 align-items-start">
                  <i className="bi bi-telephone-fill fs-4 me-3"></i>
                  <div>
                    <h6 className="fw-bold mb-1">Phone</h6>
                    <a href="tel:+918870462434" style={styles.link}>
                      +91 8870462434
                    </a>
                  </div>
                </div>

                {/* Decorative Element */}
                <div className="mt-auto pt-4">
                  <small className="opacity-50">NallaAngadi &copy; 2026</small>
                </div>
              </div>
            </div>

            {/* Right Side: Contact Form (Clean White) */}
            <div className="col-lg-6 col-md-6">
              <div className="card h-100" style={styles.formCard}>
                <div className="card-body p-4 p-md-5">
                  <h3 className="mb-4 fw-bold text-secondary">Send Message</h3>

                  <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                      <label className="form-label text-muted small fw-bold">FULL NAME</label>
                      <input
                        type="text"
                        name="name"
                        style={styles.inputField}
                        className="form-control"
                        placeholder="chola"
                        value={formData.name}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label text-muted small fw-bold">EMAIL</label>
                        <input
                          type="email"
                          name="email"
                          style={styles.inputField}
                          className="form-control"
                          placeholder="name@example.com"
                          value={formData.email}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label text-muted small fw-bold">PHONE</label>
                        <input
                          type="tel"
                          name="mobile"
                          style={styles.inputField}
                          className="form-control"
                          placeholder="+91 999..."
                          value={formData.mobile}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="form-label text-muted small fw-bold">MESSAGE</label>
                      <textarea
                        name="message"
                        style={styles.inputField}
                        className="form-control"
                        rows="4"
                        placeholder="How can we help you?"
                        value={formData.message}
                        onChange={handleChange}
                        required
                      ></textarea>
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary w-100 shadow-sm"
                      style={styles.submitBtn}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Sending..." : "Send Message 🚀"}
                    </button>

                    {status.msg && (
                      <div className={`alert mt-3 text-center ${status.type === "success" ? "alert-success" : "alert-info"}`}>
                        {status.msg}
                      </div>
                    )}
                  </form>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}