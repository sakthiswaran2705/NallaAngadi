import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "./Navbar.jsx";
import Footer from "./footer.jsx";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export default function OfferDetails() {
  const { offer_id } = useParams();
  const navigate = useNavigate();

  // Language State
  const getLang = () => localStorage.getItem("LANG") || "en";
  const [lang, setLang] = useState(getLang());

  // Data States
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Listen for language changes
  useEffect(() => {
    const handler = () => setLang(getLang());
    window.addEventListener("LANG_CHANGE", handler);
    return () => window.removeEventListener("LANG_CHANGE", handler);
  }, []);

  // Fetch Data
  useEffect(() => {
    if (!offer_id) return;
    setLoading(true);

    fetch(`${BACKEND_URL}/offer/details/${offer_id}/?lang=${lang}`)
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [offer_id, lang]);

  // ==========================================
  // ⭐ FIXED: VISIT SHOP FUNCTION
  // ==========================================
  const handleGoToShop = () => {
    if (!data?.shop || !data?.city) return;

    // 1. Keep the structure exactly as your Shop Page expects it
    const shopState = {
        shop: data.shop,
        city: data.city
    };

    // 2. Save to Storage (Backup in case user refreshes)
    sessionStorage.setItem("SELECTED_SHOP", JSON.stringify(shopState));

    // 3. Navigate to "/shop" (Reverted to your original route)
    navigate("/shop", { state: shopState });
  };

  // Text Dictionary
  const TXT = {
    loading: { en: "Loading details...", ta: "விவரங்கள் ஏற்றப்படுகிறது..." },
    error: { en: "Offer not found.", ta: "சலுகை கிடைக்கவில்லை." },
    back: { en: "← Back", ta: "← பின்செல்ல" },
    discount: { en: "Discount", ta: "தள்ளுபடி" },
    price: { en: "Price", ta: "விலை" },
    valid: { en: "Valid Until", ta: "முடிவு தேதி" },
    visitShop: { en: "Visit Shop Profile", ta: "கடைப் பக்கத்தை பார்க்க" },
    description: { en: "Description", ta: "விளக்கம்" },
    moreOffers: { en: "More offers from", ta: "மேலும் சலுகைகள்" },
    noMoreOffers: { en: "No other offers currently in", ta: "வேறு சலுகைகள் இல்லை" },
  };

  if (loading)
    return (
      <div style={styles.centerBox}>
        <div style={styles.spinner}></div>
        <p>{TXT.loading[lang]}</p>
      </div>
    );

  if (!data?.status || !data?.main_offer)
    return (
      <div style={styles.centerBox}>
        <h3>{TXT.error[lang]}</h3>
        <button style={styles.backBtn} onClick={() => navigate(-1)}>
          {TXT.back[lang]}
        </button>
      </div>
    );

  const main = data.main_offer;
  const others = data.other_offers || [];

  return (
    <div style={styles.page}>
      <Navbar />

      <div style={styles.container}>
        {/* BACK BUTTON */}
        <button style={styles.backBtn} onClick={() => navigate(-1)}>
          {TXT.back[lang]}
        </button>

        {/* MAIN OFFER CARD */}
        <div style={styles.mainCard}>
          <div style={styles.contentGrid}>

            {/* LEFT: MEDIA */}
            <div style={styles.mediaSection}>
              {main.media_type === "video" ? (
                <video
                  src={`${BACKEND_URL}/${main.media_path}`}
                  controls
                  muted
                  style={styles.mediaElement}
                />
              ) : (
                <img
                  src={`${BACKEND_URL}/${main.media_path}`}
                  alt="offer"
                  style={styles.mediaElement}
                />
              )}
            </div>

            {/* RIGHT: DETAILS */}
            <div style={styles.infoSection}>
              <div>
                <h1 style={styles.title}>{main.title}</h1>
                <p style={styles.shopName}>
                  📍 {data.shop?.shop_name}, {data.city?.city_name}
                </p>

                <div style={styles.tagsRow}>
                  {main.percentage && (
                    <span style={{ ...styles.badge, background: "#ffebee", color: "#c62828" }}>
                      {TXT.discount[lang]}: {main.percentage}%
                    </span>
                  )}
                  {main.fee && (
                    <span style={{ ...styles.badge, background: "#e8f5e9", color: "#2e7d32" }}>
                      {TXT.price[lang]}: ₹{main.fee}
                    </span>
                  )}
                </div>

                <div style={styles.divider}></div>

                <h3 style={styles.subHeader}>{TXT.description[lang]}</h3>
                <p style={styles.descText}>{main.description || "No description provided."}</p>

                <p style={styles.dateText}>
                  📅 <b>{TXT.valid[lang]}:</b> {new Date(main.end_date).toLocaleDateString()}
                </p>
              </div>

              {/* VISIT SHOP BUTTON */}
              <button style={styles.shopButton} onClick={handleGoToShop}>
                {TXT.visitShop[lang]}
              </button>
            </div>
          </div>
        </div>

        {/* MORE OFFERS SECTION */}
        <div style={styles.moreSection}>
          <h2 style={styles.sectionTitle}>
            {TXT.moreOffers[lang]} {data.shop?.shop_name}
          </h2>

          {others.length === 0 ? (
            <p style={{ color: "#777" }}>{TXT.noMoreOffers[lang]} {data.shop?.shop_name}</p>
          ) : (
            <div style={styles.grid}>
              {others.map((off) => (
                <div
                  key={off.offer_id}
                  style={styles.miniCard}
                  onClick={() => navigate(`/offer/details/${off.offer_id}`)}
                >
                  {off.media_type === "video" ? (
                    <video
                      src={`${BACKEND_URL}/${off.media_path}`}
                      style={styles.miniMedia}
                      muted
                    />
                  ) : (
                    <img
                      src={`${BACKEND_URL}/${off.media_path}`}
                      style={styles.miniMedia}
                      alt="offer"
                    />
                  )}
                  <div style={styles.miniContent}>
                    <p style={styles.miniTitle}>{off.title}</p>
                    <span style={styles.miniBadge}>{off.percentage}% OFF</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}

/* ================= STYLES ================= */
const styles = {
  page: {
    background: "#f4f6f8",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    fontFamily: "'Segoe UI', sans-serif, Noto Sans Tamil",
  },
  container: {
    flex: 1,
    maxWidth: "1000px",
    width: "100%",
    margin: "0 auto",
    padding: "20px",
  },
  backBtn: {
    background: "transparent",
    border: "none",
    fontSize: "16px",
    color: "#555",
    cursor: "pointer",
    marginBottom: "15px",
    fontWeight: "600",
  },

  // Main Card
  mainCard: {
    background: "#fff",
    borderRadius: "16px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
    overflow: "hidden",
    padding: "20px",
  },
  contentGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: "30px",
  },
  mediaSection: {
    flex: "1 1 400px",
  },
  mediaElement: {
    width: "100%",
    borderRadius: "12px",
    objectFit: "cover",
    maxHeight: "400px",
    border: "1px solid #eee",
  },
  infoSection: {
    flex: "1 1 300px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  title: {
    fontSize: "26px",
    fontWeight: "800",
    color: "#222",
    marginBottom: "5px",
  },
  shopName: {
    fontSize: "15px",
    color: "#666",
    marginBottom: "15px",
  },
  tagsRow: {
    display: "flex",
    gap: "10px",
    marginBottom: "20px",
  },
  badge: {
    padding: "6px 12px",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "700",
  },
  divider: {
    height: "1px",
    background: "#eee",
    margin: "20px 0",
  },
  subHeader: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#444",
    marginBottom: "8px",
  },
  descText: {
    fontSize: "15px",
    color: "#555",
    lineHeight: "1.6",
    marginBottom: "20px",
  },
  dateText: {
    fontSize: "14px",
    color: "#777",
    marginBottom: "30px",
  },
  shopButton: {
    width: "100%",
    padding: "14px",
    background: "#0d6efd",
    color: "white",
    border: "none",
    borderRadius: "10px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "background 0.2s",
  },
  moreSection: {
    marginTop: "40px",
  },
  sectionTitle: {
    fontSize: "20px",
    fontWeight: "700",
    marginBottom: "20px",
    color: "#333",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
    gap: "15px",
  },
  miniCard: {
    background: "#fff",
    borderRadius: "12px",
    overflow: "hidden",
    boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
    cursor: "pointer",
    transition: "transform 0.2s",
  },
  miniMedia: {
    width: "100%",
    height: "120px",
    objectFit: "cover",
  },
  miniContent: {
    padding: "10px",
  },
  miniTitle: {
    fontSize: "14px",
    fontWeight: "600",
    marginBottom: "5px",
    color: "#333",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  miniBadge: {
    fontSize: "12px",
    color: "#d32f2f",
    fontWeight: "700",
  },
  centerBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    color: "#666",
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "4px solid #eee",
    borderTop: "4px solid #0d6efd",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    marginBottom: "15px",
  },
};