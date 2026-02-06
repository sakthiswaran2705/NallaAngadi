import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@blueprintjs/core";
import Navbar from "./Navbar";

const API_BASE = import.meta.env.VITE_BACKEND_URL;
const HIGHEST_PLAN = "premium";

// --- Icons Component ---
const Icons = {
  CreditCard: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>,
  Calendar: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>,
  Zap: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>,
  Check: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
};

// --- Popup Animation Variants ---
const popupVariants = {
    initial: { opacity: 0, y: -50, scale: 0.9 },
    animate: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 20 } },
    exit: { opacity: 0, y: -20, scale: 0.9, transition: { duration: 0.2 } }
};

function Payments() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const token = localStorage.getItem("ACCESS_TOKEN");

  const [loading, setLoading] = useState(true);
  const [planData, setPlanData] = useState(null);

  // Popup State
  const [popup, setPopup] = useState(null);

  // ================= HELPERS: POPUP =================
  const showPopup = (type, title, message, action = null) => {
      setPopup({ type, title, message, action });
      if (!action) {
        setTimeout(() => setPopup(null), 3500);
      }
  };

  const handlePopupClick = () => {
    if (popup && popup.action) {
        popup.action();
    }
    setPopup(null);
  };

  // ================= FETCH PLAN =================
  const fetchPlan = async () => {
    try {
      const res = await fetch(`${API_BASE}/my-plan/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.status && data.subscribed) {
        setPlanData(data);
      } else {
        // Fallback for starter/free users
        setPlanData({
            plan: "Starter",
            expiry_date: null, // Set to null for starter
            amount: 0,
            usage: { shops_used: 0, offers_used: 0 },
            limits: { shops: 1, offers: 2 }
        });
      }
    } catch (err) {
      showPopup("error", t("Error"), t("Failed to load plan details"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlan();
  }, []);

  // ================= AUTOPAY =================
  const enableAutoPay = async () => {
    if (!token) {
        showPopup("warning", t("Login Required"), t("Please login first"));
        return;
    }

    // --- CHECK STARTER PLAN ---
    if (!planData || planData.plan.toLowerCase() === "starter") {
        showPopup(
            "warning",
            t("Upgrade Required"),
            t("You are on the Starter Plan. Click here to subscribe."),
            () => navigate("/plan")
        );
        return;
    }

    try {
      const res = await fetch(`${API_BASE}/autopay/create/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ plan_name: planData.plan }),
      });

      const data = await res.json();
      if (!data.subscription_id) {
          showPopup("error", t("Error"), t("Failed to initiate AutoPay"));
          return;
      }

      const options = {
        key: data.key_id || window.RAZORPAY_KEY_ID,
        subscription_id: data.subscription_id,
        name: "Nalla Angadi",
        description: `AutoPay for ${planData.plan}`,
        handler: function () {
          showPopup(
            "success",
            "Processing",
            "Payment successful. Plan will activate shortly."
          );

          setTimeout(() => {
            fetchPlan();
          }, 3000);
        },

        modal: {
            ondismiss: function () {
                showPopup("warning", t("Cancelled"), t("AutoPay setup cancelled"));
            }
        },
        theme: { color: "#000000" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("AutoPay Error:", err);
      showPopup("error", t("Server Error"), t("Something went wrong. Try again."));
    }
  };

  const goToUpgrade = () => navigate("/plan");

  // ================= DATE HELPERS =================
  const formatDate = (dateString) => {
    if (!dateString) return "---";
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getDaysRemaining = (expiryDate) => {
    if (!expiryDate) return 0;
    const total = Date.parse(expiryDate) - Date.parse(new Date());
    const days = Math.floor(total / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };
  const autopayActive =
  planData?.autopay === true &&
  planData?.subscription_status === "active";

  const calculateProgress = (used, total) => {
    if (!total) return 0;
    const pct = (used / total) * 100;
    return pct > 100 ? 100 : pct;
  };

  // ================= STYLES FOR POPUP =================
  const getIconStyle = (type) => {
    const base = { width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "12px", flexShrink: 0 };
    if (type === 'success') return { ...base, background: '#d1fae5', color: '#059669' };
    if (type === 'warning') return { ...base, background: '#fef3c7', color: '#d97706' };
    return { ...base, background: '#fee2e2', color: '#dc2626' };
  };

  const getPopupIcon = (type) => {
    if (type === 'success') return 'tick-circle';
    if (type === 'warning') return 'warning-sign';
    return 'error';
  };

  // ================= RENDER =================
  if (loading) return <div className="container py-5 text-center text-muted">{t("Loading payment details...")}</div>;

  const isHighestPlan = planData?.plan?.toLowerCase() === HIGHEST_PLAN.toLowerCase();
  const isStarter = planData?.plan?.toLowerCase() === "starter";
  const daysLeft = getDaysRemaining(planData?.expiry_date);

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* --- POPUP NOTIFICATION --- */}
      <AnimatePresence>
        {popup && (
            <motion.div
                initial="initial"
                animate="animate"
                exit="exit"
                variants={popupVariants}
                onClick={handlePopupClick}
                style={{
                    position: "fixed",
                    top: "24px",
                    right: "24px",
                    background: "#fff",
                    padding: "16px 20px",
                    borderRadius: "16px",
                    display: "flex",
                    gap: "16px",
                    boxShadow: "0 10px 40px rgba(0,0,0,0.12)",
                    zIndex: 9999,
                    border: "1px solid #f3f4f6",
                    alignItems: "center",
                    minWidth: "320px",
                    cursor: popup.action ? "pointer" : "default"
                }}
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

      <div className="container-fluid px-0">
        <Navbar />
      </div>

      <div className="container py-5" style={{ maxWidth: 800 }}>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="fw-bold mb-1">{t("Subscription & Billing")}</h2>
            <p className="text-muted mb-0">{t("Manage your plan, billing history and usage.")}</p>
          </div>
        </div>

        <div className="row g-4">

          {/* === LEFT COLUMN: PLAN DETAILS === */}
          <div className="col-md-7">

            {/* Active Plan Card */}
            <div className="card shadow-sm border-0 mb-4 bg-primary text-white" style={{ borderRadius: "16px", background: "linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%)" }}>
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-start mb-4">
                  <div>
                    <div className="badge bg-white text-primary mb-2 px-3 py-1 rounded-pill fw-bold text-uppercase">
                      {planData?.plan || "Starter"} Plan
                    </div>
                    <h1 className="fw-bold display-6 mb-0 text-capitalize">{planData?.plan || "Starter"}</h1>
                  </div>
                  <div className="bg-white bg-opacity-25 p-2 rounded-circle">
                    <Icons.CreditCard />
                  </div>
                </div>

                <div className="d-flex align-items-center mt-3">
                  <div className="me-4">
                    <small className="opacity-75 d-block text-uppercase fw-bold" style={{ fontSize: "0.75rem" }}>Status</small>
                    <span className="fw-bold d-flex align-items-center">
                      <span className="bg-success rounded-circle d-inline-block me-2" style={{ width: 8, height: 8 }}></span>
                      Active
                    </span>
                  </div>
                  <div>
                    <small className="opacity-75 d-block text-uppercase fw-bold" style={{ fontSize: "0.75rem" }}>Renews Price</small>
                    <span className="fw-bold">
                        {isStarter ? "Free" : `₹${planData?.amount || "0"}`}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Expiry Details */}
            <div className="card shadow-sm border-0 mb-4" style={{ borderRadius: "16px" }}>
              <div className="card-body p-4">
                <h5 className="fw-bold mb-3 d-flex align-items-center">
                  <span className="me-2 text-muted"><Icons.Calendar /></span>
                  <span style={{ fontFamily: "Noto Sans Tamil, system-ui, sans-serif" }}>
                    {t("Billing Cycle")}
                  </span>
                </h5>

                {/* --- CHANGED LOGIC HERE --- */}
                {isStarter ? (
                    <div className="p-3 bg-light rounded-3 mb-2 text-center">
                        <h5 className="fw-bold text-dark mb-1">{t("You are in Starter Plan")}</h5>
                        <p className="text-muted small mb-0">{t("Lifetime free validity.")}</p>
                    </div>
                ) : (
                    <div className="d-flex align-items-center justify-content-between p-3 bg-light rounded-3 mb-2">
                        <div>
                            <small className="text-muted d-block fw-bold text-uppercase" style={{ fontSize: "0.7rem" }}>{t("Expiry Date")}</small>
                            <span className="fw-bold text-dark fs-5">{formatDate(planData?.expiry_date)}</span>
                        </div>
                        <div className="text-end">
                            <small className="text-muted d-block fw-bold text-uppercase" style={{ fontSize: "0.7rem" }}>{t("Time Remaining")}</small>
                            <span className={`fw-bold fs-5 ${daysLeft < 5 ? 'text-danger' : 'text-success'}`}>
                            {daysLeft} {t("Days")}
                            </span>
                        </div>
                    </div>
                )}

                <small className="text-muted">
                    {isStarter
                        ? t("Upgrade to a paid plan to unlock more features.")
                        : t("Your plan will automatically expire on this date unless AutoPay is enabled.")}
                </small>
              </div>
            </div>

            {/* AutoPay Section */}
            <div className="card shadow-sm border-0" style={{ borderRadius: "16px" }}>
              <div className="card-body p-4 d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="fw-bold mb-1 d-flex align-items-center">
                    <span className="me-2 text-warning"><Icons.Zap /></span>
                    {t("Enable AutoPay")}
                  </h6>
                  <p className="text-muted small mb-0">{t("Automatically renew your plan to avoid interruption.")}</p>
                </div>
                {!autopayActive && (
                  <button
                    className="btn btn-dark btn-sm px-3 py-2"
                    onClick={enableAutoPay}
                  >
                    {t("Enable Now")}
                  </button>
                )}

              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: USAGE & ACTIONS  */}
          <div className="col-md-5">

            {/* Usage Stats */}
            <div className="card shadow-sm border-0 mb-4 h-100" style={{ borderRadius: "16px" }}>
              <div className="card-body p-4">
                <h5 className="fw-bold mb-4">{t("Current Usage")}</h5>

                {/* Shops Usage */}
                <div className="mb-4">
                  <div className="d-flex justify-content-between mb-1">
                    <span className="fw-bold small text-muted">{t("Shops Created")}</span>
                    <span className="fw-bold small">{planData?.usage?.shops_used || 0} / {planData?.limits?.shops || 0}</span>
                  </div>
                  <div className="progress" style={{ height: "8px", borderRadius: "10px" }}>
                    <div
                      className="progress-bar bg-primary"
                      role="progressbar"
                      style={{ width: `${calculateProgress(planData?.usage?.shops_used, planData?.limits?.shops)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Offers Usage */}
                <div className="mb-4">
                  <div className="d-flex justify-content-between mb-1">
                    <span className="fw-bold small text-muted">{t("Offers Posted")}</span>
                    <span className="fw-bold small">{planData?.usage?.offers_used || 0} / {planData?.limits?.offers || 0}</span>
                  </div>
                  <div className="progress" style={{ height: "8px", borderRadius: "10px" }}>
                    <div
                      className="progress-bar bg-info"
                      role="progressbar"
                      style={{ width: `${calculateProgress(planData?.usage?.offers_used, planData?.limits?.offers)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Conditional Upgrade Button */}
                {!isHighestPlan ? (
                  <div className="mt-5 text-center">
                    <p className="text-muted small mb-3">{t("Need more limits? Upgrade to our Premium plan for unlimited access.")}</p>
                    <button className="btn btn-outline-primary w-100 py-2 fw-bold" onClick={goToUpgrade}>
                      {t("Upgrade Plan")}
                    </button>
                  </div>
                ) : (
                  <div className="mt-5 text-center p-3 bg-success bg-opacity-10 rounded-3">
                    <div className="text-success mb-2"><Icons.Check /></div>
                    <h6 className="fw-bold text-success mb-1">{t("Highest Plan Active")}</h6>
                    <p className="text-muted small mb-0">{t("You are on the top tier plan. Enjoy full access!")}</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default Payments;