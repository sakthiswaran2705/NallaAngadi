import React, { useState } from "react";
import { Icon } from "@blueprintjs/core";
import { motion } from "framer-motion";

const API_BASE = import.meta.env.VITE_BACKEND_URL;

// ==========================================================
// 1. TRANSLATION TEXT (Manual Method)
// ==========================================================
const TXT = {
  loginReq: { en: "Please login to buy add-ons", ta: "கூடுதல் சலுகைகளை வாங்க உள்நுழையவும்" },
  rzpFail: { en: "Razorpay failed to load", ta: "ரேஸர்பேவை ஏற்ற முடியவில்லை" },
  orderFail: { en: "Order failed", ta: "ஆர்டர் தோல்வியடைந்தது" },
  packName: { en: "Extra Offer Pack", ta: "கூடுதல் சலுகை தொகுப்பு" },
  purchaseSuccess: { en: "Purchase Successful", ta: "கொள்முதல் வெற்றிகரமாக முடிந்தது" },
  verifyFail: { en: "Verification failed", ta: "சரிபார்ப்பு தோல்வியடைந்தது" },
  payVerifyErr: { en: "Payment verification error", ta: "கட்டண சரிபார்ப்பு பிழை" },
  initFail: { en: "Could not initiate payment", ta: "கட்டணத்தைத் தொடங்க முடியவில்லை" },
  error: { en: "Error", ta: "பிழை" },
  title: { en: "Need more offers?", ta: "மேலும் சலுகைகள் தேவையா?" },
  subtitle: { en: "Buy one-time extra limit. Valid forever.", ta: "கூடுதல் வரம்பை வாங்கவும். வாழ்நாள் முழுவதும் செல்லும்." },
  perOffer: { en: "/offer", ta: "/சலுகை" },
  processing: { en: "Processing...", ta: "செயலாக்குகிறது..." },
  buyPrefix: { en: "Buy for ₹", ta: "வாங்க ₹" },
  // Dynamic description parts
  buyDescPart1: { en: "Buy", ta: "வாங்க" },
  buyDescPart2: { en: "Extra Offers", ta: "கூடுதல் சலுகைகள்" }
};

export default function AddonCard({ activePlanName, showPopup }) {
  // ==========================================================
  // 2. HELPER: GET LANGUAGE
  // ==========================================================
  const lang = localStorage.getItem("LANG") || "en";
  const t = (key) => TXT[key]?.[lang] || TXT[key]?.en || key;

  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleBuy = async () => {
    const token = localStorage.getItem("ACCESS_TOKEN");
    if (!token) {
      showPopup("warning", t("loginReq"));
      return;
    }

    const loaded = await loadRazorpayScript();
    if (!loaded) {
      showPopup("error", t("rzpFail"));
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/payment/addon/create-order/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ quantity }),
      });

      const data = await res.json();
      if (!data.status) throw new Error(data.detail || t("orderFail"));

      // Dynamic Description based on Language
      const description = lang === 'ta'
        ? `${quantity} ${t("buyDescPart2")}`
        : `Buy ${quantity} Extra Offers`;

      const options = {
        key: data.key_id,
        amount: data.amount,
        currency: "INR",
        name: t("packName"),
        description: description,
        order_id: data.order_id,
        handler: async function (response) {
          try {
            const vRes = await fetch(`${API_BASE}/payment/addon/verify/`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(response),
            });

            const vData = await vRes.json();
            if (vData.status) {
              showPopup("success", vData.message, t("purchaseSuccess"));
              setQuantity(1);
            } else {
              showPopup("error", t("verifyFail"));
            }
          } catch {
            showPopup("error", t("payVerifyErr"));
          } finally {
            setLoading(false);
          }
        },
        theme: { color: "#F59E0B" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (err) {
      console.error(err);
      showPopup("error", err.message || t("initFail"), t("error"));
      setLoading(false);
    }
  };


  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      style={styles.container}
    >
      <div style={styles.left}>
        <div style={styles.iconBox}>
          <Icon icon="add" size={24} color="#B45309" />
        </div>
        <div style={{ textAlign: "left" }}>
          <h3 style={styles.title}>{t("title")}</h3>
          <p style={styles.sub}>{t("subtitle")}</p>
        </div>
      </div>

      <div style={styles.right}>
        <div style={styles.priceTag}>₹50 <span style={{ fontSize: 12, fontWeight: 400, color: "#92400E" }}>{t("perOffer")}</span></div>

        <div style={styles.counter}>
          <button style={styles.btnIcon} onClick={() => setQuantity(q => Math.max(1, q - 1))}>-</button>
          <span style={styles.countDisplay}>{quantity}</span>
          <button style={styles.btnIcon} onClick={() => setQuantity(q => q + 1)}>+</button>
        </div>

        <button
          style={{
            ...styles.buyBtn,
            opacity: loading ? 0.7 : 1,
            cursor: loading ? "wait" : "pointer"
          }}
          onClick={handleBuy}
          disabled={loading}
        >
          {loading ? t("processing") : `${t("buyPrefix")}${quantity * 50}`}
        </button>
      </div>
    </motion.div>
  );
}

const styles = {
  container: {
    background: "linear-gradient(to right, #FFFBEB, #FEF3C7)",
    border: "1px solid #F59E0B",
    borderRadius: "16px",
    fontFamily: "'Noto Sans Tamil', sans-serif", // Corrected Property Name
    padding: "20px 30px",
    marginTop: "50px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "20px",
    maxWidth: "800px",
    marginLeft: "auto",
    marginRight: "auto",
    boxShadow: "0 10px 15px -3px rgba(245, 158, 11, 0.1), 0 4px 6px -2px rgba(245, 158, 11, 0.05)"
  },
  left: { display: "flex", alignItems: "center", gap: "15px", flex: "1 1 300px" },
  iconBox: {
    width: "48px", height: "48px", borderRadius: "50%", background: "#FDE68A",
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
  },
  title: { margin: 0, color: "#92400E", fontSize: "18px", fontWeight: "800", marginBottom: "4px" },
  sub: { margin: 0, color: "#B45309", fontSize: "14px", fontWeight: "500" },
  right: { display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap", justifyContent: "flex-end", flex: "1 1 300px" },
  priceTag: { fontSize: "20px", fontWeight: "800", color: "#92400E" },
  counter: {
    display: "flex", alignItems: "center", background: "#fff",
    borderRadius: "10px", border: "2px solid #FCD34D", height: "40px"
  },
  btnIcon: {
    border: "none", background: "transparent", width: "35px", height: "100%",
    cursor: "pointer", fontWeight: "bold", color: "#B45309", fontSize: "16px"
  },
  countDisplay: { width: "30px", textAlign: "center", fontWeight: "700", color: "#78350F", fontSize: "16px" },
  buyBtn: {
    background: "#F59E0B", color: "white", border: "none", padding: "0 24px", height: "42px",
    borderRadius: "10px", fontWeight: "700", fontSize: "15px",
    fontFamily: "'Noto Sans Tamil', sans-serif", // Corrected Property Name
    boxShadow: "0 4px 6px -1px rgba(245, 158, 11, 0.4)",
    transition: "transform 0.1s"
  }
};