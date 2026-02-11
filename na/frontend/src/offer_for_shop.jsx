import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "./Navbar.jsx";
import Footer from "./footer.jsx";

const BACKEND = import.meta.env.VITE_BACKEND_URL;

export default function OfferForShop() {
  const { shop_id } = useParams();
  const navigate = useNavigate();

  // Language State (Dynamic)
  const getLang = () => localStorage.getItem("LANG") || "en";
  const [lang, setLang] = useState(getLang());

  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Listen for language changes (Consistency with Jobs page)
  useEffect(() => {
    const handler = () => setLang(getLang());
    window.addEventListener("LANG_CHANGE", handler);
    return () => window.removeEventListener("LANG_CHANGE", handler);
  }, []);

  // TEXT DICTIONARY
  const TXT = {
    loading: { en: "Loading...", ta: "ஏற்றுகிறது..." },
    back: { en: "← Back", ta: "← பின்செல்ல" },
    pageTitle: { en: "Offers for this Shop", ta: "இந்த கடையின் சலுகைகள்" },
    noOffers: {
      en: "No offers available for this shop.",
      ta: "இந்த கடைக்கு தற்போது சலுகைகள் இல்லை."
    },
    offer: { en: "Offer", ta: "சலுகை" },
    percentage: { en: "Discount", ta: "தள்ளுபடி" },
    fee: { en: "Price", ta: "விலை" },
    valid: { en: "Valid", ta: "காலம்" },
    noDescription: { en: "No description", ta: "விளக்கம் இல்லை" }
  };

  // FETCH OFFERS
  useEffect(() => {
    if (!shop_id) return;
    setLoading(true);

    fetch(`${BACKEND}/offers/shop/${shop_id}/`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status) setOffers(data.offers || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [shop_id]);

  return (
    <div style={styles.page}>
      <Navbar />

      <div style={styles.container}>
        {/* HEADER SECTION */}
        <div style={styles.header}>
          <button
            style={styles.backBtn}
            onClick={() => navigate(-1)}
          >
            {TXT.back[lang]}
          </button>
          <h1 style={styles.title}>{TXT.pageTitle[lang]}</h1>
        </div>

        {/* LOADING STATE */}
        {loading && (
          <div style={styles.centerBox}>
            <div style={styles.spinner}></div>
            <p>{TXT.loading[lang]}</p>
          </div>
        )}

        {/* NO OFFERS STATE */}
        {!loading && offers.length === 0 && (
          <div style={styles.centerBox}>
            <span style={{ fontSize: "40px" }}>🏷️</span>
            <p style={styles.emptyText}>{TXT.noOffers[lang]}</p>
          </div>
        )}

        {/* OFFERS GRID */}
        {!loading && offers.length > 0 && (
          <div style={styles.grid}>
            {offers.map((o) => (
              <div
                key={o.offer_id}
                style={styles.card}
                onClick={() => navigate(`/offer/details/${o.offer_id}`)}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-5px)";
                    e.currentTarget.style.boxShadow = "0 10px 20px rgba(0,0,0,0.1)";
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)";
                }}
              >
                {/* IMAGE / VIDEO SECTION */}
                <div style={styles.mediaWrapper}>
                  {o.media_type === "video" ? (
                    <video
                      src={`${BACKEND}/${o.media_path}`}
                      style={styles.media}
                      muted
                    />
                  ) : (
                    <img
                      src={`${BACKEND}/${o.media_path}`}
                      alt="offer"
                      style={styles.media}
                      onError={(e) => e.target.style.display = 'none'}
                    />
                  )}
                  {o.percentage && (
                    <span style={styles.badge}>{o.percentage}% OFF</span>
                  )}
                </div>

                {/* CONTENT SECTION */}
                <div style={styles.cardBody}>
                  <h3 style={styles.offerTitle}>{o.title || TXT.offer[lang]}</h3>

                  <div style={styles.metaRow}>
                    <span style={styles.metaLabel}>{TXT.fee[lang]}:</span>
                    <span style={styles.metaValue}>₹{o.fee || "Free"}</span>
                  </div>

                  <div style={styles.metaRow}>
                    <span style={styles.metaLabel}>{TXT.valid[lang]}:</span>
                    <span style={styles.metaValue}>
                       {o.end_date ? new Date(o.end_date).toLocaleDateString() : "N/A"}
                    </span>
                  </div>

                  <p style={styles.description}>
                    {(o.description || TXT.noDescription[lang]).substring(0, 70)}...
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

/* ================= STYLES (Perfect UI) ================= */
const styles = {
  page: {
    background: "#f8f9fa",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    fontFamily: "'Segoe UI', sans-serif, Noto Sans Tamil",
  },
  container: {
    flex: 1, // This Pushes Footer to bottom
    maxWidth: "1100px",
    width: "100%",
    margin: "0 auto",
    padding: "20px",
  },
  header: {
    marginBottom: "25px",
    borderBottom: "1px solid #eee",
    paddingBottom: "15px",
  },
  backBtn: {
    background: "none",
    border: "none",
    color: "#666",
    fontSize: "15px",
    cursor: "pointer",
    marginBottom: "10px",
    padding: 0,
    fontWeight: "600",
  },
  title: {
    fontSize: "24px",
    fontWeight: "800",
    color: "#333",
    margin: 0,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", // Responsive Grid
    gap: "20px",
  },
  card: {
    background: "#fff",
    borderRadius: "16px",
    overflow: "hidden",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    cursor: "pointer",
    transition: "all 0.3s ease",
    display: "flex",
    flexDirection: "column",
  },
  mediaWrapper: {
    height: "180px",
    width: "100%",
    position: "relative",
    background: "#eee",
  },
  media: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  badge: {
    position: "absolute",
    top: "10px",
    right: "10px",
    background: "rgba(220, 53, 69, 0.9)",
    color: "#fff",
    padding: "4px 10px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "bold",
  },
  cardBody: {
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    flex: 1,
  },
  offerTitle: {
    fontSize: "17px",
    fontWeight: "700",
    marginBottom: "10px",
    color: "#222",
  },
  metaRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "6px",
    fontSize: "14px",
  },
  metaLabel: {
    color: "#888",
  },
  metaValue: {
    fontWeight: "600",
    color: "#444",
  },
  description: {
    marginTop: "10px",
    fontSize: "13px",
    color: "#666",
    lineHeight: "1.5",
  },
  centerBox: {
    textAlign: "center",
    padding: "60px 20px",
    color: "#999",
  },
  spinner: {
    margin: "0 auto 15px auto",
    width: "30px",
    height: "30px",
    border: "3px solid #eee",
    borderTop: "3px solid #007bff",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  emptyText: {
    fontSize: "16px",
    color: "#666",
    marginTop: "10px",
  },
};