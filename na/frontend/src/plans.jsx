import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@blueprintjs/core";
import plansData from "./plans.json";
import Navbar from "./Navbar.jsx";
import { FEATURES, PLAN_INCLUDES } from "./config_include";
import AddonCard from "./AddonCard";
import Footer from "./footer.jsx"
const API_BASE = import.meta.env.VITE_BACKEND_URL;

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

/* ================= LANGUAGE CONFIG ================= */
const LANG = localStorage.getItem("LANG") || "en";

const TXT = {
  title: { en: "Choose Your Growth Plan", ta: "உங்கள் வளர்ச்சி திட்டத்தை தேர்வு செய்யுங்கள்" },
  subtitle: { en: "Select the perfect plan to boost your business visibility.", ta: "உங்கள் வணிகத் தெரிவுநிலையை அதிகரிக்க சரியான திட்டத்தைத் தேர்ந்தெடுக்கவும்." },
  chooseSilver: { en: "Upgrade to Silver", ta: "சில்வர் தேர்வு" },
  choosePlatinum: { en: "Get Platinum", ta: "பிளாட்டினம் தேர்வு" },
  chooseGold: { en: "Go Gold", ta: "கோல்ட் தேர்வு" },
  chooseStarter: { en: "Free", ta: "இலவசம்" },
  currentPlanBtn: { en: "Active Plan", ta: "செயலில் உள்ள திட்டம்" },
  processing: { en: "Processing...", ta: "செயலாக்குகிறது..." },
  includes: { en: "Everything in the plan:", ta: "திட்டத்தில் அடங்கியவை:" },
  benefitsTitle: { en: "Nalla Angadi Helps You Grow Your Business", ta: "நல்ல அங்காடி உங்கள் வணிக வளர்ச்சிக்கு உதவுகிறது" },
  benefit1Title: { en: "Increase Daily Visibility", ta: "தினசரி காணப்படும் அளவு அதிகரிப்பு" },
  benefit1Text: { en: "Show your business to new users daily.", ta: "உங்கள் வணிகத்தை தினமும் புதிய பயனர்களுக்கு காட்டுங்கள்." },
  benefit2Title: { en: "Grow Revenue", ta: "வருமானம் அதிகரிக்க" },
  benefit2Text: { en: "Daily reach helps increase customers.", ta: "தினசரி அணுகல் அதிக வாடிக்கையாளர்களை உருவாக்கும்." },
  benefit3Title: { en: "More Customers", ta: "அதிக வாடிக்கையாளர்கள்" },
  benefit3Text: { en: "More visibility → more calls.", ta: "அதிக காண்பிப்பு → அதிக அழைப்புகள்." },
  successTitle: { en: "Payment Successful!", ta: "கட்டணம் வெற்றிகரமாக செலுத்தப்பட்டது!" },
  successMsg: { en: "Your subscription is now active.", ta: "உங்கள் சந்தா இப்போது செயலில் உள்ளது." },
  continueBtn: { en: "Go to Dashboard", ta: "முகப்புக்குச் செல்" },
  transId: { en: "Transaction ID:", ta: "பரிவர்த்தனை எண்:" },
  loginReqTitle: { en: "Login Required", ta: "உள்நுழைவு தேவை" },
  loginReqMsg: { en: "Please login to purchase a plan.", ta: "திட்டத்தை வாங்க உள்நுழையவும்." },
  freeLabel: { en: "Free", ta: "இலவசம்" },
  day: { en: "day", ta: "நாள்" },
  activeBadge: { en: "ACTIVE PLAN", ta: "செயலில் உள்ளது" }
};

const popupVariants = {
    initial: { opacity: 0, y: -50, scale: 0.9 },
    animate: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 20 } },
    exit: { opacity: 0, y: -20, scale: 0.9, transition: { duration: 0.2 } }
};

export default function PricingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [popup, setPopup] = useState(null);
  const [currentPlan, setCurrentPlan] = useState(null);

  const showPopup = (type, message, title = "", action = null) => {
      setPopup({ type, message, title, action });
      setTimeout(() => setPopup(null), 3000);
  };

  useEffect(() => {
    loadRazorpayScript();
    const fetchPlan = async () => {
       const token = localStorage.getItem("ACCESS_TOKEN");
       if(!token) return;
       try {
           const res = await fetch(`${API_BASE}/my-plan/`, { headers: { Authorization: `Bearer ${token}` } });
           const data = await res.json();
           if(data.status && data.subscribed) setCurrentPlan(data.plan);
           else setCurrentPlan("starter");
       } catch (e) { setCurrentPlan("starter"); }
    };
    fetchPlan();
  }, []);

  const handlePlanPayment = async (plan) => {
    const token = localStorage.getItem("ACCESS_TOKEN");
    if (!token) {
      showPopup("warning", TXT.loginReqMsg[LANG], TXT.loginReqTitle[LANG], () => navigate("/login", { state: { from: location.pathname } }));
      return;
    }
    setProcessingId(plan.id);
    try {
      const orderRes = await fetch(`${API_BASE}/payment/create-order/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ plan_id: plan.id }),
      });
      const orderData = await orderRes.json();
      const options = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: "INR",
        name: "NallaAngadi",
        order_id: orderData.order_id,
        handler: async function (response) {
            const verifyRes = await fetch(`${API_BASE}/payment/verify/`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify(response),
            });
            const verifyData = await verifyRes.json();
            if (verifyData.status) {
                await fetch(`${API_BASE}/payment/save/`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                  body: JSON.stringify({ order_id: orderData.order_id, payment_id: response.razorpay_payment_id, plan_id: plan.id, status: "success" }),
                });
                setPaymentDetails({ id: response.razorpay_payment_id, plan: plan.name[LANG] });
                setShowSuccessModal(true);
                setCurrentPlan(plan.id);
            }
        },
        modal: { ondismiss: () => setProcessingId(null) },
        theme: { color: "#3B82F6" },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) { setProcessingId(null); }
  };

  const handleCloseSuccess = () => { setShowSuccessModal(false); navigate("/dashboard"); };

  return (
    <div style={styles.page}>
      <div style={styles.navContainer}>
        <Navbar variant="plan" />
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Sans+Tamil:wght@400;500;600;700&display=swap');
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes float { 0% { transform: translateY(0px) scale(1.05); } 50% { transform: translateY(-10px) scale(1.05); } 100% { transform: translateY(0px) scale(1.05); } }
        .plan-card { transition: all 0.3s ease; }
        .plan-card:hover { transform: translateY(-8px); }
        .plan-card-platinum { animation: float 6s ease-in-out infinite; }
        @media (max-width: 900px) { .plan-row { flex-direction: column; align-items: center; } .plan-card-platinum { transform: scale(1) !important; animation: none; margin: 20px 0; } }
      `}</style>

      <AnimatePresence>
        {popup && (
            <motion.div className="custom-popup-toast" variants={popupVariants} initial="initial" animate="animate" exit="exit" onClick={() => setPopup(null)} style={styles.toast}>
                <div className={`popup-icon-box ${popup.type}`} style={styles.toastIcon}><Icon icon="info-sign" iconSize={18} /></div>
                <div className="popup-content"><h5>{popup.title}</h5><p>{popup.message}</p></div>
            </motion.div>
        )}
      </AnimatePresence>

      {showSuccessModal && (
        <div style={styles.modalOverlay}>
          <div className="success-modal" style={styles.modalCard}>
            <Icon icon="tick-circle" size={40} color="#10b981" />
            <h2 style={styles.modalTitle}>{TXT.successTitle[LANG]}</h2>
            <p style={styles.modalText}>{TXT.successMsg[LANG]}</p>
            <button style={styles.continueBtn} onClick={handleCloseSuccess}>{TXT.continueBtn[LANG]}</button>
          </div>
        </div>
      )}

      <div style={styles.contentContainer}>
        <div style={{ marginBottom: "60px" }}>
            <h1 style={styles.title}>{TXT.title[LANG]}</h1>
            <p style={styles.subtitle}>{TXT.subtitle[LANG]}</p>
        </div>

        <div className="plan-row" style={styles.planRow}>
          {plansData.plans.map((plan) => {
            const isPlatinum = plan.id === "platinum";
            const isStarter = plan.id === "starter";
            const isCurrent = currentPlan === plan.id;

            let cardStyle = isPlatinum ? styles.cardPlatinum : (plan.id === "silver" ? styles.cardSilver : (isStarter ? styles.cardStarter : styles.cardGold));
            let badgeStyle = isPlatinum ? styles.badgePlatinum : (plan.id === "silver" ? styles.badgeSilver : (isStarter ? styles.badgeStarter : styles.badgeGold));
            let priceStyle = isPlatinum ? styles.pricePlatinum : (plan.id === "gold" ? styles.priceGold : styles.priceSilver);
            let buttonStyle = isPlatinum ? styles.startPlatinum : (plan.id === "silver" ? styles.startSilver : styles.startGold);
            let dividerStyle = isPlatinum ? styles.dividerPlatinum : (plan.id === "gold" ? styles.dividerGold : styles.dividerSilver);

            return (
              <div key={plan.id} className={`plan-card ${isPlatinum ? 'plan-card-platinum' : ''}`} style={cardStyle}>

                {/* --- 1. FLOATING ACTIVE BADGE (KEPT) --- */}
                {isCurrent && (
                  <div style={styles.activeBadge}>
                    <Icon icon="tick-circle" size={14} color="#fff" />
                    {TXT.activeBadge[LANG]}
                  </div>
                )}

                {/* Standard Badge (Most Popular/Best Value) */}
                <div style={badgeStyle}>{isPlatinum ? "MOST POPULAR" : plan.badge}</div>

                <h2 style={styles.planName}>{plan.name[LANG]}</h2>
                <p style={styles.planType}>{plan.type[LANG]}</p>
                <div style={{ margin: "20px 0" }}>
                  <h1 style={priceStyle}>
                    {plan.displayPrice === "0" || plan.displayPrice === 0 ? TXT.freeLabel[LANG] : `₹${plan.displayPrice}`}
                    <span style={styles.priceMonth}>{plan.period[LANG]}</span>
                  </h1>
                  {!isStarter && Number.isFinite(Number(plan.dayPrice)) && (
                      <p style={styles.dayPrice}>
                        ₹{Number(plan.dayPrice)} / {TXT.day[LANG]}
                      </p>
                    )}
                </div>

                {/* --- 2. BUTTON LOGIC (MODIFIED) --- */}
                {/* If isCurrent is true, we render NOTHING (null) here. We only show buttons if it is NOT the current plan. */}
                {!isCurrent && (
                  !isStarter ? (
                    // Normal Upgrade Button
                    <button style={buttonStyle} onClick={() => handlePlanPayment(plan)}>
                      {processingId === plan.id ? TXT.processing[LANG] : (TXT[`choose${plan.badge}`]?.[LANG] || TXT.chooseStarter[LANG])}
                    </button>
                  ) : (
                    // Starter Info Badge (Only if not current)
                    <div style={styles.starterBadgeContainer}><span style={styles.starterBadgeText}>{TXT.chooseStarter[LANG]}</span></div>
                  )
                )}
                {/* --------------------------- */}

                <div style={dividerStyle}></div>
                <h3 style={styles.includesTitle}>{TXT.includes[LANG]}</h3>
                <ul style={{ listStyle: "none", padding: 0, textAlign: "left" }}>
                  {(PLAN_INCLUDES[plan.id] || []).map((key) => (<li key={key} style={styles.featureItem}><span style={{marginRight: "10px", color: isPlatinum?'#818cf8':'#10b981'}}>✓</span> {FEATURES[key]?.[LANG]}</li>))}
                </ul>
              </div>
            );
          })}
        </div>

        <div style={{marginTop: "60px"}}><AddonCard activePlanName={currentPlan} showPopup={showPopup} /></div>

        <div style={styles.benefitSection}>
            <h2 style={styles.benefitHeading}>{TXT.benefitsTitle[LANG]}</h2>
            <div style={styles.benefitContainer}>
                <div style={styles.benefitCard}>
                    <div style={styles.benefitIcon}>👁️</div>
                    <h3 style={styles.benefitTitle}>{TXT.benefit1Title[LANG]}</h3>
                    <p style={styles.benefitText}>{TXT.benefit1Text[LANG]}</p>
                </div>
                <div style={styles.benefitCard}>
                    <div style={styles.benefitIcon}>📈</div>
                    <h3 style={styles.benefitTitle}>{TXT.benefit2Title[LANG]}</h3>
                    <p style={styles.benefitText}>{TXT.benefit2Text[LANG]}</p>
                </div>
                <div style={styles.benefitCard}>
                    <div style={styles.benefitIcon}>📞</div>
                    <h3 style={styles.benefitTitle}>{TXT.benefit3Title[LANG]}</h3>
                    <p style={styles.benefitText}>{TXT.benefit3Text[LANG]}</p>
                </div>
            </div>
        </div>

       <Footer/>
      </div>
    </div>
  );
}

const styles = {
    page: { background: "#F9FAFB", width: "100%", minHeight: "100vh", fontFamily: "'Inter', 'Noto Sans Tamil', sans-serif" },
    navContainer: { background: "#fff", borderBottom: "1px solid #eee", position: "sticky", top: 0, zIndex: 100 },
    contentContainer: { padding: "40px 20px", textAlign: "center", maxWidth: "1400px", margin: "0 auto" },
    title: { fontSize: "44px", fontWeight: 800, marginBottom: "16px", letterSpacing: "-1px", color: "#111827" },
    subtitle: { color: "#6b7280", fontSize: "18px", maxWidth: "600px", margin: "0 auto" },
    dayPrice: { fontSize: "14px", color: "#6b7280", marginTop: "6px", fontWeight: "500" },
    planRow: { display: "flex", justifyContent: "center", gap: "24px", alignItems: "flex-start", paddingTop: "20px" },
    planName: { fontSize: "22px", fontWeight: "700", marginTop: "15px" },
    planType: { fontSize: "12px", fontWeight: "600", opacity: 0.5, textTransform: "uppercase" },
    priceMonth: { fontSize: "14px", opacity: 0.5, marginLeft: "4px" },
    includesTitle: { fontSize: "11px", fontWeight: "700", marginBottom: "16px", textTransform: "uppercase", opacity: 0.4 },
    featureItem: { marginBottom: "12px", fontSize: "14px", display: "flex", opacity: 0.9 },

    starterBadgeContainer: { width: "100%", padding: "14px", background: "#f9fafb", borderRadius: "12px", border: "1px dashed #d1d5db", marginTop: "10px" },
    starterBadgeText: { fontSize: "14px", fontWeight: "600", color: "#6b7280" },
    cardStarter: { background: "#fff", width: "320px", padding: "32px 24px", borderRadius: "20px", border: "1px solid #e5e7eb", position: "relative" },
    badgeStarter: { background: "#f3f4f6", color: "#6b7280", padding: "4px 12px", borderRadius: "20px", position: "absolute", top: "-12px", left: "50%", transform: "translateX(-50%)", fontSize: "12px" },
    cardSilver: { background: "#fff", width: "320px", padding: "32px 24px", borderRadius: "20px", border: "1px solid #e5e7eb", position: "relative" },
    badgeSilver: { background: "#94a3b8", color: "#fff", padding: "4px 12px", borderRadius: "20px", position: "absolute", top: "-12px", left: "50%", transform: "translateX(-50%)", fontSize: "12px" },
    priceSilver: { fontSize: "42px", fontWeight: "800" },
    startSilver: { width: "100%", padding: "14px", background: "#334155", color: "#fff", borderRadius: "12px", border: "none", cursor: "pointer", fontWeight: "600" },
    dividerSilver: { height: "1px", background: "#f1f5f9", margin: "24px 0" },
    cardPlatinum: { background: "#0f172a", width: "350px", padding: "40px 28px", borderRadius: "24px", color: "#fff", position: "relative", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" },
    badgePlatinum: { background: "linear-gradient(90deg, #6366f1, #a855f7)", color: "#fff", padding: "6px 16px", borderRadius: "20px", position: "absolute", top: "-14px", left: "50%", transform: "translateX(-50%)", fontSize: "12px", fontWeight: "700" },
    pricePlatinum: { fontSize: "48px", fontWeight: "800" },
    startPlatinum: { width: "100%", padding: "16px", background: "#fff", color: "#0f172a", borderRadius: "12px", border: "none", cursor: "pointer", fontWeight: "700" },
    dividerPlatinum: { height: "1px", background: "rgba(255,255,255,0.1)", margin: "24px 0" },
    cardGold: { background: "#fffbeb", width: "320px", padding: "32px 24px", borderRadius: "20px", border: "1px solid #fcd34d", position: "relative" },
    badgeGold: { background: "#f59e0b", color: "#fff", padding: "4px 12px", borderRadius: "20px", position: "absolute", top: "-12px", left: "50%", transform: "translateX(-50%)", fontSize: "12px" },
    priceGold: { fontSize: "42px", fontWeight: "800", color: "#92400e" },
    startGold: { width: "100%", padding: "14px", background: "#d97706", color: "#fff", borderRadius: "12px", border: "none", cursor: "pointer", fontWeight: "600" },
    dividerGold: { height: "1px", background: "#fef3c7", margin: "24px 0" },
    benefitSection: { marginTop: "100px", padding: "60px 0" },
    benefitHeading: { fontSize: "32px", fontWeight: 800, marginBottom: "50px", color: "#111827" },
    benefitContainer: { display: "flex", justifyContent: "center", gap: "30px", flexWrap: "wrap" },
    benefitCard: { width: "280px", background: "#fff", padding: "30px 20px", borderRadius: "20px", border: "1px solid #f3f4f6", textAlign: "center", boxShadow: "0 4px 6px rgba(0,0,0,0.02)" },
    benefitIcon: { fontSize: "42px", marginBottom: "20px", background: "#f9fafb", width: "80px", height: "80px", lineHeight: "80px", borderRadius: "50%", margin: "0 auto 20px" },
    benefitTitle: { fontSize: "18px", fontWeight: 700, marginBottom: "10px" },
    benefitText: { fontSize: "15px", color: "#6b7280", lineHeight: "1.6" },

    copyright: { color: "black", fontSize: "12px", borderTop: "1px solid #f1f5f9", paddingTop: "24px" },
    modalOverlay: { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)" },
    modalCard: { background: "#ffffff", width: "90%", maxWidth: "400px", padding: "40px", borderRadius: "24px", textAlign: "center", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" },
    modalTitle: { fontSize: "24px", fontWeight: "700", margin: "15px 0 8px" },
    modalText: { color: "#6b7280", marginBottom: "24px" },
    continueBtn: { width: "100%", padding: "14px", background: "#10b981", color: "#fff", fontWeight: "600", border: "none", borderRadius: "10px", cursor: "pointer" },
    toast: { position: "fixed", top: "20px", right: "20px", background: "#fff", padding: "16px", borderRadius: "12px", display: "flex", gap: "12px", boxShadow: "0 10px 25px rgba(0,0,0,0.1)", zIndex: 9999, border: "1px solid #eee" },
    toastIcon: { width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "8px", background: "#fef3c7", color: "#d97706" },

    // ACTIVE BADGE STYLE
    activeBadge: {
      position: "absolute",
      top: "-16px",
      right: "-8px",
      background: "#10b981",
      color: "#fff",
      padding: "6px 12px",
      borderRadius: "999px",
      fontSize: "12px",
      fontWeight: "700",
      display: "flex",
      alignItems: "center",
      gap: "6px",
      boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
      zIndex: 5
    }
};