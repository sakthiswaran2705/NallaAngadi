import React, { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Navbar from "./Navbar.jsx";
import Footer from "./footer.jsx";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const LANG = localStorage.getItem("LANG") || "en";

// ======================================================
//                  HELPERS
// ======================================================

// Unicode-safe normalization
const normalizeText = (text) => {
  return text ? text.toString().normalize("NFC").toLowerCase() : "";
};

// Debounce Function (prevents too many API calls)
const debounce = (func, delay) => {
  let timer;
  return (...args) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      func(...args);
    }, delay);
  };
};

const TXT = {
  noCity: { en: "No City Selected", ta: "நகரம் தேர்ந்தெடுக்கப்படவில்லை" },
  goHome: { en: "Go Home", ta: "முகப்புக்கு செல்லவும்" },
  loadingOffers: { en: "Loading offers for", ta: "சலுகைகள் ஏற்றப்படுகிறது" },
  back: { en: "Back", ta: "பின்செல்ல" },
  exclusiveOffers: { en: "Exclusive Offers in", ta: "சிறப்பு சலுகைகள் -" },
  noOffers: { en: "No offers available", ta: "தற்போது சலுகைகள் இல்லை" },
  shopOffer: { en: "Shop Offer", ta: "கடை சலுகை" },
  searchPlaceholder: { en: "Change City...", ta: "நகரத்தை மாற்ற..." },
};

// ======================================================
//                  STYLES
// ======================================================
const styles = {
  pageContainer: {
    padding: "30px",
    maxWidth: "1200px",
    margin: "0 auto",
    fontFamily: "Noto Sans Tamil, Arial, sans-serif",
    backgroundColor: "#f9f9f9",
    minHeight: "100vh",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "30px",
    flexWrap: "wrap", // Ensures layout doesn't break on mobile
    gap: "15px",
  },
  title: {
    fontSize: "24px",
    fontWeight: "bold",
    color: "#333",
    borderBottom: "3px solid #1976D2",
    paddingBottom: "5px",
    margin: 0,
    flexGrow: 1, // Allows title to take available space
  },
  // --- SEARCH STYLES ---
  searchWrapper: {
    position: "relative",
    width: "100%",
    maxWidth: "350px", // Limits width on large screens
  },
  searchInput: {
    width: "100%",
    padding: "12px 20px",
    fontSize: "16px",
    borderRadius: "30px",
    border: "1px solid #ccc",
    outline: "none",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
    transition: "border 0.3s ease",
    backgroundColor: "#fff",
  },
  suggestionsList: {
    position: "absolute",
    top: "115%",
    left: 0,
    right: 0,
    backgroundColor: "white",
    borderRadius: "12px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
    zIndex: 1000,
    maxHeight: "250px",
    overflowY: "auto",
    listStyle: "none",
    padding: "5px 0",
    margin: 0,
    border: "1px solid #eee",
  },
  suggestionItem: {
    padding: "12px 20px",
    cursor: "pointer",
    fontSize: "15px",
    color: "#333",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    borderBottom: "1px solid #f9f9f9",
  },
  icon: {
    fontSize: "16px",
  },
  // --------------------
  backButton: {
    padding: "10px 20px",
    backgroundColor: "#1976D2",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "15px",
    fontWeight: 600,
    marginTop: "20px",
  },
  offersGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: "25px",
  },
  offerCard: {
    padding: "15px",
    borderRadius: "16px",
    backgroundColor: "white",
    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
    cursor: "pointer",
    transition: "transform 0.2s, box-shadow 0.2s",
    border: "1px solid #f0f0f0",
  },
  offerImage: {
    width: "100%",
    height: "180px",
    objectFit: "cover",
    borderRadius: "10px",
    marginBottom: "12px",
  },
  offerTitle: {
    fontWeight: "bold",
    fontSize: "17px",
    color: "#333",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    marginBottom: "5px",
  },
  shopName: {
    fontSize: "14px",
    color: "#666",
    marginBottom: "8px",
  },
  percentage: {
    display: "inline-block",
    backgroundColor: "#e8f5e9",
    color: "#2E7D32",
    fontWeight: "bold",
    fontSize: "13px",
    padding: "4px 8px",
    borderRadius: "6px",
  },
  loadingText: {
    textAlign: "center",
    padding: "50px",
    color: "#666",
    fontSize: "18px",
  },
  noCityContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "70vh",
    gap: "20px",
  },
};

// ======================================================
//                  COMPONENT
// ======================================================
export default function OffersList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // URL & Session State
  const urlCity = searchParams.get("city");
  const city = urlCity || sessionStorage.getItem("CITY_NAME");

  // Display State
  const [displayCity, setDisplayCity] = useState(city || "");
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search State
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef(null);

  // Helper to build image URL
  const mediaUrl = (path) => (path ? `${BACKEND_URL}/${path}` : "");

  // 1. Sync URL to Session
  useEffect(() => {
    if (urlCity) {
      sessionStorage.setItem("CITY_NAME", urlCity);
      setDisplayCity(urlCity);
    }
  }, [urlCity]);

  // 2. Fetch Offers when 'city' changes
  useEffect(() => {
    if (!city) {
      setLoading(false);
      return;
    }
    setLoading(true);

    fetch(`${BACKEND_URL}/offers/${encodeURIComponent(city)}/?lang=${LANG}`)
      .then((res) => res.json())
      .then((json) => {
        setOffers(json.slides || []);
        if (
          json.slides &&
          json.slides.length > 0 &&
          json.slides[0].city?.city_name
        ) {
          setDisplayCity(json.slides[0].city.city_name);
        } else {
          setDisplayCity(city);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Offer fetch error:", err);
        setLoading(false);
      });
  }, [city]);

  // 3. Search API Call (Debounced)
  const fetchCitySuggestions = useCallback(
    debounce((value) => {
      if (value.trim().length < 2) {
        setSuggestions([]);
        return;
      }

      fetch(
        `${BACKEND_URL}/city/search/?city_name=${encodeURIComponent(
          value
        )}&lang=${LANG}`
      )
        .then((res) => res.json())
        .then((json) => {
          const list = (json.data || []).map((c) => c.city_name);
          // Filter locally to ensure match
          const filtered = list.filter((name) =>
            normalizeText(name).includes(normalizeText(value))
          );
          setSuggestions([...new Set(filtered)].slice(0, 8));
        })
        .catch((err) => {
          console.error(err);
          setSuggestions([]);
        });
    }, 300),
    []
  );

  // 4. Input Handler
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowDropdown(true);
    fetchCitySuggestions(value);
  };

  // 5. Select City Handler
  const handleCitySelect = (selectedCity) => {
    setSearchTerm(""); // Clear Input
    setShowDropdown(false);
    setDisplayCity(selectedCity);
    sessionStorage.setItem("CITY_NAME", selectedCity);
    setSearchParams({ city: selectedCity }); // Triggers re-fetch
  };

  // 6. Close Dropdown on Outside Click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const goBack = () => navigate("/");

  // ======================================================
  //                  RENDER
  // ======================================================

  return (
    <>
      <Navbar />
      <div style={styles.pageContainer}>
        <div style={styles.header}>
          {/* Title */}
          <h2 style={styles.title}>
            {city ? (
              <>
                {TXT.exclusiveOffers[LANG]} <span style={{color: '#1976D2'}}>{displayCity}</span>
              </>
            ) : (
              TXT.noCity[LANG]
            )}
          </h2>

          {/* Search Bar (Now directly in render to fix typing issue) */}
          <div style={styles.searchWrapper} ref={searchRef}>
            <input
              type="text"
              placeholder={TXT.searchPlaceholder[LANG]}
              style={styles.searchInput}
              value={searchTerm}
              onChange={handleSearchChange}
              onFocus={() => setShowDropdown(true)}
            />

            {showDropdown && suggestions.length > 0 && (
              <ul style={styles.suggestionsList}>
                {suggestions.map((item, idx) => (
                  <li
                    key={idx}
                    style={styles.suggestionItem}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = "#f0f9ff")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = "white")
                    }
                    onClick={() => handleCitySelect(item)}
                  >
                    <span style={styles.icon}>📍</span> {item}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Content Area */}
        {!city ? (
          <div style={styles.noCityContainer}>
             {/* If no city, show simplified view */}
             <div style={{opacity: 0.5, fontSize: 60}}>🏙️</div>
             <h3>Select a city above to view offers</h3>
             <button onClick={goBack} style={styles.backButton}>
              {TXT.goHome[LANG]}
             </button>
          </div>
        ) : loading ? (
          <p style={styles.loadingText}>
            🌀 {TXT.loadingOffers[LANG]} <b>{displayCity}</b>...
          </p>
        ) : offers.length === 0 ? (
          <div style={styles.noCityContainer}>
             <p style={{fontSize: 20, color: '#666'}}>{TXT.noOffers[LANG]}</p>
          </div>
        ) : (
          <div style={styles.offersGrid}>
            {offers.map((off) => (
              <div
                key={off.offer_id}
                style={styles.offerCard}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-5px)";
                  e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.08)";
                }}
                onClick={() =>
                  navigate(`/offer/details/${off.offer_id}`, {
                    state: { city: { city_name: city } },
                  })
                }
              >
                {/* MEDIA */}
                {off.type === "video" ? (
                  <video
                    src={mediaUrl(off.path)}
                    style={styles.offerImage}
                    muted
                    loop
                    autoPlay
                  />
                ) : (
                  <img
                    src={mediaUrl(off.path)}
                    alt="Offer"
                    style={styles.offerImage}
                  />
                )}

                <p style={styles.offerTitle}>
                  {off.title || "Special Offer"}
                </p>

                <p style={styles.shopName}>
                  🛒 {off.shop?.shop_name || TXT.shopOffer[LANG]}
                </p>

                {off.percentage && (
                  <span style={styles.percentage}>{off.percentage}% OFF</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}