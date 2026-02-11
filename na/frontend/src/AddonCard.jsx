import React, { useState } from "react";
import { Icon } from "@blueprintjs/core";
import { motion } from "framer-motion";

const API_BASE = import.meta.env.VITE_BACKEND_URL;

// ==========================================================
// 1. CONFIG & TRANSLATIONS
// ==========================================================
const LANG = localStorage.getItem("LANG") || "en";

const TXT = {
  // General
  loginReq: { en: "Please login to buy add-ons", ta: "கூடுதல் சலுகைகளை வாங்க உள்நுழையவும்" },
  rzpFail: { en: "Razorpay failed to load", ta: "ரேஸர்பேவை ஏற்ற முடியவில்லை" },
  orderFail: { en: "Order failed", ta: "ஆர்டர் தோல்வியடைந்தது" },
  verifyFail: { en: "Verification failed", ta: "சரிபார்ப்பு தோல்வியடைந்தது" },
  payVerifyErr: { en: "Payment verification error", ta: "கட்டண சரிபார்ப்பு பிழை" },
  initFail: { en: "Could not initiate payment", ta: "கட்டணத்தைத் தொடங்க முடியவில்லை" },
  error: { en: "Error", ta: "பிழை" },
  processing: { en: "Processing...", ta: "செயலாக்குகிறது..." },
  buyPrefix: { en: "Buy for ₹", ta: "வாங்க ₹" },
  purchaseSuccess: { en: "Purchase Successful", ta: "கொள்முதல் வெற்றிகரமாக முடிந்தது" },

  // Offer Addon
  offerTitle: { en: "Add more offers?", ta: "மேலும் சலுகைகள் தேவையா?" },
  offerSubtitle: { en: "Buy one-time extra limit. ", ta: "கூடுதல் வரம்பை வாங்கவும்." },
  offerPack: { en: "Extra Offer Pack", ta: "கூடுதல் சலுகை தொகுப்பு" },
  unitOffer: { en: "/offer", ta: "/சலுகை" },

  // Shop Addon
  shopTitle: { en: "Add more shops?", ta: "மேலும் கடைகள் தேவையா?" },
  shopSubtitle: { en: "Add more branches or shop profiles.", ta: "கூடுதல் கிளைகள் அல்லது கடைகளைச் சேர்க்கவும்." },
  shopPack: { en: "Extra Shop Pack", ta: "கூடுதல் கடை தொகுப்பு" },
  unitShop: { en: "/shop", ta: "/கடை" }
};

// Helper to get text
const t = (key) => TXT[key]?.[LANG] || TXT[key]?.en || key;

// ==========================================================
// 2. REUSABLE ROW COMPONENT
// ==========================================================
const AddonRow = ({ type, price, titleKey, subKey, packNameKey, unitKey, showPopup }) => {
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);

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
      // 1. Create Order
      const res = await fetch(`${API_BASE}/payment/addon/create-order/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ quantity, type }), // Pass type explicitly
      });

      const data = await res.json();
      if (!data.status) throw new Error(data.detail || t("orderFail"));

      const packName = t(packNameKey);

      // 2. Open Razorpay
      const options = {
        key: data.key_id,
        amount: data.amount,
        currency: "INR",
        name: packName,
        description: `${packName} (x${quantity})`,
        order_id: data.order_id,
        handler: async function (response) {
          try {
            // 3. Verify Payment
            const vRes = await fetch(`${API_BASE}/payment/addon/verify/`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
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
        theme: { color: type === 'extra_shop' ? "#3B82F6" : "#F59E0B" }, // Blue for Shop, Gold for Offer
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (err) {
      console.error(err);
      showPopup("error", err.message || t("initFail"), t("error"));
      setLoading(false);
    }
  };

  // Styles dynamic based on type
  const isShop = type === 'extra_shop';
  const themeColor = isShop ? "#2563EB" : "#92400E"; // Blue vs Brown
  const bgColor = isShop ? "linear-gradient(to right, #EFF6FF, #DBEAFE)" : "linear-gradient(to right, #FFFBEB, #FEF3C7)";
  const borderColor = isShop ? "#3B82F6" : "#F59E0B";
  const btnColor = isShop ? "#2563EB" : "#F59E0B";

  return (
    <div style={{ ...styles.rowContainer, background: bgColor, borderColor: borderColor }}>
      <div style={styles.left}>
        <div style={{ ...styles.iconBox, background: isShop ? "#BFDBFE" : "#FDE68A" }}>
          <Icon icon={isShop ? "shop" : "tag"} size={24} color={themeColor} />
        </div>
        <div style={{ textAlign: "left" }}>
          <h3 style={{ ...styles.title, color: themeColor }}>{t(titleKey)}</h3>
          <p style={{ ...styles.sub, color: themeColor, opacity: 0.8 }}>{t(subKey)}</p>
        </div>
      </div>

      <div style={styles.right}>
        <div style={{ ...styles.priceTag, color: themeColor }}>
          ₹{price} <span style={{ fontSize: 12, fontWeight: 400 }}>{t(unitKey)}</span>
        </div>

        <div style={{ ...styles.counter, borderColor: borderColor }}>
          <button style={{ ...styles.btnIcon, color: themeColor }} onClick={() => setQuantity(q => Math.max(1, q - 1))}>-</button>
          <span style={{ ...styles.countDisplay, color: themeColor }}>{quantity}</span>
          <button style={{ ...styles.btnIcon, color: themeColor }} onClick={() => setQuantity(q => q + 1)}>+</button>
        </div>

        <button
          style={{
            ...styles.buyBtn,
            background: btnColor,
            opacity: loading ? 0.7 : 1,
            cursor: loading ? "wait" : "pointer"
          }}
          onClick={handleBuy}
          disabled={loading}
        >
          {loading ? t("processing") : `${t("buyPrefix")}${quantity * price}`}
        </button>
      </div>
    </div>
  );
};

// ==========================================================
// 3. MAIN COMPONENT
// ==========================================================
export default function AddonCard({ activePlanName, showPopup }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      style={{ maxWidth: "800px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px" }}
    >
        <AddonRow
        type="extra_shop"
        price={100} // Assuming same price as backend
        titleKey="shopTitle"
        subKey="shopSubtitle"
        packNameKey="shopPack"
        unitKey="unitShop"
        showPopup={showPopup}
      />
      {/* 1. EXTRA OFFERS */}
      <AddonRow
        type="extra_offer"
        price={50}
        titleKey="offerTitle"
        subKey="offerSubtitle"
        packNameKey="offerPack"
        unitKey="unitOffer"
        showPopup={showPopup}
      />

    </motion.div>
  );
}

// ==========================================================
// 4. STYLES
// ==========================================================
const styles = {
  rowContainer: {
    border: "1px solid",
    borderRadius: "16px",
    padding: "20px 30px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "20px",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
    transition: "transform 0.2s ease"
  },
  left: { display: "flex", alignItems: "center", gap: "15px", flex: "1 1 300px" },
  iconBox: {
    width: "48px", height: "48px", borderRadius: "50%",
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
  },
  title: { margin: 0, fontSize: "18px", fontWeight: "800", marginBottom: "4px" },
  sub: { margin: 0, fontSize: "14px", fontWeight: "500" },
  right: { display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap", justifyContent: "flex-end", flex: "1 1 300px" },
  priceTag: { fontSize: "20px", fontWeight: "800" },
  counter: {
    display: "flex", alignItems: "center", background: "#fff",
    borderRadius: "10px", borderWidth: "2px", borderStyle: "solid", height: "40px"
  },
  btnIcon: {
    border: "none", background: "transparent", width: "35px", height: "100%",
    cursor: "pointer", fontWeight: "bold", fontSize: "16px"
  },
  countDisplay: { width: "30px", textAlign: "center", fontWeight: "700", fontSize: "16px" },
  buyBtn: {
    color: "white", border: "none", padding: "0 24px", height: "42px",
    borderRadius: "10px", fontWeight: "700", fontSize: "15px",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    transition: "transform 0.1s"
  }
};