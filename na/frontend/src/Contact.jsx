import React, { useState } from "react";
import Navbar from "./Navbar.jsx";
import { Icon } from "@blueprintjs/core";

const API_BASE = import.meta.env.VITE_BACKEND_URL;

// ==========================================================
// 1. TRANSLATION TEXT (SAME FORMAT AS SHOPDETAILS)
// ==========================================================
const TXT = {
  title: { en: "Contact Us", ta: "எங்களை தொடர்பு கொள்ள" },
  subtitle: {
    en: "Have questions? We'd love to hear from you.",
    ta: "உங்களுடைய கேள்விகளை கேளுங்கள், நாங்கள் உதவ தயாராக இருக்கிறோம்."
  },
  getInTouch: { en: "Get in Touch", ta: "தொடர்பில் இருங்கள்" },
  desc: {
    en: "Fill up the form and our team will get back to you within 24 hours.",
    ta: "படிவத்தை நிரப்புங்கள், 24 மணி நேரத்தில் தொடர்பு கொள்கிறோம்."
  },
  name: { en: "Full Name", ta: "முழு பெயர்" },
  email: { en: "Email", ta: "மின்னஞ்சல்" },
  phone: { en: "Phone", ta: "தொலைபேசி" },
  message: { en: "Message", ta: "செய்தி" },
  msgPlaceholder: { en: "How can we help you?", ta: "எப்படி உதவலாம்?" },
  send: { en: "Send Message", ta: "செய்தி அனுப்பவும்" },
  sending: { en: "Sending...", ta: "அனுப்பப்படுகிறது..." },
  success: {
    en: "Message sent successfully! We will contact you soon.",
    ta: "உங்கள் தகவல் வெற்றிகரமாக அனுப்பப்பட்டது!"
  },
  error: {
    en: "Something went wrong. Please try again.",
    ta: "ஏதோ பிழை ஏற்பட்டது. மீண்டும் முயற்சிக்கவும்."
  },
  location: { en: "Location", ta: "இடம்" }
};

// ==========================================================
// ⭐ CONTACT COMPONENT
// ==========================================================
export default function Contact() {
  const lang = localStorage.getItem("LANG") || "en";
  const t = (key) => TXT[key]?.[lang] || TXT[key]?.en || key;

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    message: ""
  });

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(t("sending"));

    try {
      const res = await fetch(`${API_BASE}/contact/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (!res.ok) throw new Error("Failed");

      setStatus(t("success"));
      setFormData({ name: "", email: "", mobile: "", message: "" });
    } catch {
      setStatus(t("error"));
    } finally {
      setLoading(false);
      setTimeout(() => setStatus(""), 4000);
    }
  };

  return (
    <>
      <Navbar />

      <style>
        {`
        body {
          background: #f8fafc;
          font-family: 'Plus Jakarta Sans','Noto Sans Tamil',sans-serif;
        }
        .contact-container {
          max-width: 1100px;
          margin: 0 auto;
          padding-bottom: 80px;
        }
        .contact-card {
          background: white;
          border-radius: 20px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.08);
          border: 1px solid #e2e8f0;
          overflow: hidden;
        }
        .info-card {
          background: linear-gradient(135deg, #2563eb, #1e40af);
          color: white;
          padding: 40px;
          height: 100%;
        }
        .form-card {
          padding: 40px;
        }
        .form-control {
          border-radius: 12px;
          padding: 14px;
          border: 1px solid #e2e8f0;
          font-weight: 500;
        }
        .form-control:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 2px rgba(37,99,235,0.15);
        }
        .submit-btn {
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          border: none;
          padding: 14px;
          border-radius: 14px;
          font-weight: 800;
          letter-spacing: .5px;
        }
        `}
      </style>

      <div className="container contact-container mt-5">
        {/* HEADER */}
        <div className="text-center mb-5">
          <h1 className="fw-bold">{t("title")}</h1>
          <p className="text-muted">{t("subtitle")}</p>
        </div>

        <div className="row g-4">
          {/* LEFT INFO */}
          <div className="col-lg-5">
            <div className="contact-card info-card">
              <h3 className="fw-bold mb-4">{t("getInTouch")}</h3>
              <p className="opacity-75 mb-5">{t("desc")}</p>

              <div className="mb-4 d-flex gap-3">
                <Icon icon="map-marker" size={20} />
                <div>
                  <div className="fw-bold">{t("location")}</div>
                  <div className="opacity-75">Thanjavur, Tamil Nadu</div>
                </div>
              </div>

              <div className="mb-4 d-flex gap-3">
                <Icon icon="envelope" size={20} />
                <div className="fw-bold">cholainfotech26@gmail.com</div>
              </div>

              <div className="d-flex gap-3">
                <Icon icon="phone" size={20} />
                <div className="fw-bold">+91 8870462434</div>
              </div>
            </div>
          </div>

          {/* RIGHT FORM */}
          <div className="col-lg-7">
            <div className="contact-card form-card">
              <h3 className="fw-bold mb-4">{t("send")}</h3>

              <form onSubmit={handleSubmit}>
                <input
                  className="form-control mb-3"
                  name="name"
                  placeholder={t("name")}
                  value={formData.name}
                  onChange={handleChange}
                  required
                />

                <input
                  type="email"
                  className="form-control mb-3"
                  name="email"
                  placeholder={t("email")}
                  value={formData.email}
                  onChange={handleChange}
                  required
                />

                <input
                  className="form-control mb-3"
                  name="mobile"
                  placeholder={t("phone")}
                  value={formData.mobile}
                  onChange={handleChange}
                  required
                />

                <textarea
                  className="form-control mb-4"
                  rows="4"
                  name="message"
                  placeholder={t("msgPlaceholder")}
                  value={formData.message}
                  onChange={handleChange}
                  required
                />

                <button className="submit-btn w-100 text-white" disabled={loading}>
                  {loading ? t("sending") : t("send")}
                </button>

                {status && (
                  <div className="alert alert-info text-center mt-4 fw-bold">
                    {status}
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
