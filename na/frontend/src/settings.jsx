import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion"; // Import Framer Motion
import { Icon } from "@blueprintjs/core"; // Import Blueprint Icon
import Navbar from "./Navbar.jsx";

const API_BASE = import.meta.env.VITE_BACKEND_URL;

// --- Simple SVG Icons for the Settings UI ---
const Icons = {
  Lock: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>,
  Bell: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>,
  CreditCard: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>,
  ChevronRight: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>,
};

// --- Popup Animation Variants (From Pricing Page) ---
const popupVariants = {
    initial: { opacity: 0, y: -50, scale: 0.9 },
    animate: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 20 } },
    exit: { opacity: 0, y: -20, scale: 0.9, transition: { duration: 0.2 } }
};

function Settings() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const token = localStorage.getItem("ACCESS_TOKEN");

  // ---------------- STATE ----------------
  const [activeTab, setActiveTab] = useState("security");

  // Popup State (From Pricing Page)
  const [popup, setPopup] = useState(null);

  // Security State
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loadingPwd, setLoadingPwd] = useState(false);

  // Notifications State
  const [emailNotif, setEmailNotif] = useState(false);
  const [pushNotif, setPushNotif] = useState(false);
  const [loadingNotif, setLoadingNotif] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // ---------------- HELPERS ----------------
  // Helper to trigger the popup
  const showPopup = (type, message, title = "") => {
      setPopup({ type, message, title });
      setTimeout(() => setPopup(null), 3000);
  };

  // ---------------- EFFECTS ----------------
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${API_BASE}/user/notification-settings/`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const result = await res.json();
          if (result.status && result.data) {
            setEmailNotif(result.data.email);
            setPushNotif(result.data.push);
          }
        }
      } catch (error) {
        console.error("Network error fetching settings", error);
      } finally {
        setInitialLoading(false);
      }
    };

    fetchSettings();
  }, [token]);

  // ---------------- HANDLERS ----------------
  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword) {
      showPopup("warning", t("Please fill in all password fields."), "Error");
      return;
    }

    try {
      setLoadingPwd(true);
      const res = await fetch(`${API_BASE}/user/change-password/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          old_password: oldPassword,
          new_password: newPassword
        }),
      });

      const data = await res.json();

      if (res.ok) {
        showPopup("success", t("Success! Your password has been updated."), "Success");
        setOldPassword("");
        setNewPassword("");
      } else {
        showPopup("danger", data.message || t("Failed to update password."), "Error");
      }
    } catch (err) {
      showPopup("danger", t("Server error. Please try again later."), "Error");
    } finally {
      setLoadingPwd(false);
    }
  };

  const saveNotifications = async () => {
    try {
      setLoadingNotif(true);
      const res = await fetch(`${API_BASE}/user/notification-settings/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: emailNotif,
          push: pushNotif,
        }),
      });

      if (res.ok) {
        showPopup("success", t("Notification preferences saved successfully."), "Success");
      } else {
        showPopup("danger", t("Failed to save preferences."), "Error");
      }
    } catch (err) {
      showPopup("danger", t("Server error while saving preferences."), "Error");
    } finally {
      setLoadingNotif(false);
    }
  };

  const goToPayments = () => navigate("/payments");

  // ---------------- RENDER HELPERS ----------------
  const renderTabButton = (id, label, Icon) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`d-flex align-items-center w-100 px-3 py-3 border-0 text-start transition-all ${
        activeTab === id
          ? "bg-primary text-white shadow-sm rounded-3 fw-medium"
          : "bg-transparent text-secondary hover-bg-light"
      }`}
      style={{ marginBottom: "8px", transition: "all 0.2s" }}
    >
      <span className="me-3 opacity-75"><Icon /></span>
      <span>{label}</span>
      {activeTab === id && (
        <span className="ms-auto">
          <Icons.ChevronRight />
        </span>
      )}
    </button>
  );

  // Helper to determine icon based on type
  const getPopupIcon = (type) => {
    if (type === 'success') return 'tick-circle';
    if (type === 'warning') return 'warning-sign';
    return 'error';
  };

  // Helper for dynamic colors based on type
  const getIconStyle = (type) => {
    const base = { ...styles.toastIcon };
    if (type === 'success') {
        return { ...base, background: '#d1fae5', color: '#059669' }; // Green
    } else if (type === 'warning') {
        return { ...base, background: '#fef3c7', color: '#d97706' }; // Yellow
    } else {
        return { ...base, background: '#fee2e2', color: '#dc2626' }; // Red
    }
  };

  return (
      <div style={{ overflowX: "hidden", fontFamily: "'Inter', sans-serif" }}>

        {/* --- POPUP NOTIFICATION (FRAMER MOTION) --- */}
        <AnimatePresence>
            {popup && (
                <motion.div
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    variants={popupVariants}
                    onClick={() => setPopup(null)}
                    style={styles.toast}
                >
                    <div style={getIconStyle(popup.type)}>
                        <Icon icon={getPopupIcon(popup.type)} iconSize={18} />
                    </div>
                    <div>
                        <h5 style={{ margin: "0 0 4px 0", fontSize: "14px", fontWeight: "bold", color: "#1f2937" }}>
                            {popup.title}
                        </h5>
                        <p style={{ margin: 0, fontSize: "13px", color: "#6b7280" }}>
                            {popup.message}
                        </p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* FULL WIDTH NAVBAR */}
        <div className="container-fluid px-0">
          <Navbar />
        </div>

        {/* PAGE CONTENT */}
        <div className="container pt-4 pb-5" style={{ maxWidth: "1000px" }}>
          {/* Header */}
          <div className="mb-5">
            <h2 className="fw-bold text-dark">{t("Account Settings")}</h2>
            <p className="text-muted">
              {t("Manage your security preferences and subscription details.")}
            </p>
          </div>

          <div className="row g-4">
            {/* LEFT SIDEBAR */}
            <div className="col-md-3">
              <div
                className="card border-0 shadow-sm"
                style={{ borderRadius: "16px", overflow: "hidden" }}
              >
                <div className="card-body p-2">
                  <div className="d-flex flex-column">
                    {renderTabButton("security", t("Security"), Icons.Lock)}
                    {renderTabButton("notifications", t("Notifications"), Icons.Bell)}
                    {renderTabButton("billing", t("Billing & Plans"), Icons.CreditCard)}
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT CONTENT AREA */}
            <div className="col-md-9">
              <div
                className="card border-0 shadow-sm h-100"
                style={{ borderRadius: "16px", minHeight: "400px" }}
              >
                <div className="card-body p-4 p-md-5">

                  {/* --- SECURITY TAB --- */}
                  {activeTab === "security" && (
                    <div className="fade-in-up">
                      <h4 className="fw-bold mb-4">{t("Change Password")}</h4>

                      <div className="mb-4" style={{ maxWidth: "500px" }}>
                        <label className="form-label text-muted small fw-bold text-uppercase">
                          {t("Current Password")}
                        </label>
                        <input
                          type="password"
                          className="form-control form-control-lg bg-light border-0 mb-3"
                          placeholder={t("Enter current password")}
                          value={oldPassword}
                          onChange={(e) => setOldPassword(e.target.value)}
                        />

                        <label className="form-label text-muted small fw-bold text-uppercase">
                          {t("New Password")}
                        </label>
                        <input
                          type="password"
                          className="form-control form-control-lg bg-light border-0 mb-4"
                          placeholder={t("Enter new password")}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                        />

                        <div className="d-flex justify-content-end">
                          <button
                            className="btn btn-dark btn-lg px-4"
                            onClick={handleChangePassword}
                            disabled={loadingPwd}
                            style={{ borderRadius: "8px" }}
                          >
                            {loadingPwd ? t("Updating...") : t("Update Password")}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* --- NOTIFICATIONS TAB --- */}
                  {activeTab === "notifications" && (
                    <div className="fade-in-up">
                      <h4 className="fw-bold mb-4">{t("Notification Preferences")}</h4>
                      <p className="text-muted mb-4">
                        {t("Choose how you want to be notified about updates and activity.")}
                      </p>

                      {initialLoading ? (
                        <div className="d-flex justify-content-center py-5">
                          <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">{t("Loading...")}</span>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="list-group list-group-flush border rounded-3 mb-4">
                            <div className="list-group-item d-flex justify-content-between align-items-center p-4">
                              <div>
                                <h6 className="mb-1 fw-bold">{t("Email Notifications")}</h6>
                                <small className="text-muted">
                                  {t("Receive updates and newsletters via email.")}
                                </small>
                              </div>
                              <div className="form-check form-switch">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  style={{ width: "3em", height: "1.5em", cursor: "pointer" }}
                                  checked={emailNotif}
                                  onChange={() => setEmailNotif(!emailNotif)}
                                />
                              </div>
                            </div>

                            <div className="list-group-item d-flex justify-content-between align-items-center p-4">
                              <div>
                                <h6 className="mb-1 fw-bold">{t("Push Notifications")}</h6>
                                <small className="text-muted">
                                  {t("Receive real-time alerts on your device.")}
                                </small>
                              </div>
                              <div className="form-check form-switch">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  style={{ width: "3em", height: "1.5em", cursor: "pointer" }}
                                  checked={pushNotif}
                                  onChange={() => setPushNotif(!pushNotif)}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="d-flex justify-content-end">
                            <button
                              className="btn btn-dark btn-lg px-4"
                              onClick={saveNotifications}
                              disabled={loadingNotif}
                              style={{ borderRadius: "8px" }}
                            >
                              {loadingNotif ? t("Saving...") : t("Save Preferences")}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* --- BILLING TAB --- */}
                  {activeTab === "billing" && (
                    <div className="fade-in-up">
                      <div className="d-flex justify-content-between align-items-start mb-4">
                        <div>
                          <h4 className="fw-bold">{t("Billing & History")}</h4>
                          <p className="text-muted">
                            {t("Manage your payment methods and view invoices.")}
                          </p>
                        </div>
                        <span className="badge bg-success bg-opacity-10 text-success px-3 py-2 rounded-pill">
                          {t("Active Subscription")}
                        </span>
                      </div>

                      <div
                        className="card bg-light border-0 p-4 mb-4"
                        style={{ borderRadius: "12px" }}
                      >
                        <div className="d-flex align-items-center">
                          <div className="bg-white p-3 rounded-circle shadow-sm text-primary me-3">
                            <Icons.CreditCard />
                          </div>
                          <div>
                            <h6 className="mb-1 fw-bold">{t("Payment Portal")}</h6>
                            <p className="mb-0 text-muted small">
                              {t("Access your full payment history and invoices.")}
                            </p>
                          </div>
                          <button
                            className="btn btn-outline-dark ms-auto"
                            onClick={goToPayments}
                            style={{ borderRadius: "8px" }}
                          >
                            {t("Manage Billing")}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>
          </div>
        </div>

        {/* INTERNAL CSS for UI (Animation classes) */}
        <style>{`
          .hover-bg-light:hover { background-color: #f8f9fa; color: #000; }
          .fade-in-up { animation: fadeInUp 0.3s ease-out forwards; }
          @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
          .form-control:focus { box-shadow: none; border: 2px solid #0d6efd; background-color: #fff; }
        `}</style>
      </div>
  );
}

// --- STYLES OBJECT (MATCHING PRICING PAGE TOAST) ---
const styles = {
    toast: {
        position: "fixed",
        top: "24px",
        right: "24px", // Top right position like standard toasts
        background: "#fff",
        padding: "16px 20px",
        borderRadius: "16px",
        display: "flex",
        gap: "16px",
        boxShadow: "0 10px 40px rgba(0,0,0,0.12)",
        zIndex: 9999,
        border: "1px solid #f3f4f6",
        alignItems: "center",
        minWidth: "300px",
        maxWidth: "400px"
    },
    toastIcon: {
        width: "40px",
        height: "40px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "12px",
        flexShrink: 0
    }
};

export default Settings;