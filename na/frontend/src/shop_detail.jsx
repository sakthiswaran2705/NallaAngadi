import React, { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@blueprintjs/core";
import Navbar from "./Navbar.jsx";
import Footer from "./footer.jsx";

const API_BASE = import.meta.env.VITE_BACKEND_URL;

// ==========================================================
// 1. TRANSLATION TEXT
// ==========================================================
const TXT = {
  back: { en: "Back", ta: "பின் செல்ல" },
  noShopData: { en: "No Shop Data Found", ta: "கடை விவரங்கள் கிடைக்கவில்லை" },
  reviews: { en: "Customer Reviews", ta: "வாடிக்கையாளர் மதிப்புரைகள்" },
  addReview: { en: "Add Your Review", ta: "உங்கள் மதிப்பீட்டை சேர்க்கவும்" },
  submitReview: { en: "Submit Review", ta: "மதிப்பீட்டை சமர்ப்பிக்க" },
  loginToReview: { en: "Login to Review", ta: "மதிப்பீடு செய்ய உள்நுழையவும்" },
  noReviews: { en: "Be the first one to leave a review!", ta: "முதல் மதிப்பீட்டை சேருங்கள்!" },
  moreShops: { en: "Top Rated Nearby", ta: "அருகிலுள்ள சிறந்த கடைகள்" },
  offers: { en: "View Exclusive Offers", ta: "சிறப்பு சலுகைகளை பார்க்க" },
  reviewPlaceholder: { en: "Share your experience...", ta: "உங்கள் அனுபவத்தை பகிரவும்..." },
  contactInfo: { en: "Contact Information", ta: "தொடர்பு விவரங்கள்" },
  viewsText: { en: "views this month", ta: "பார்வைகள் (இந்த மாதம்)" },
  deleteTitle: { en: "Delete Review?", ta: "மதிப்பீட்டை நீக்கவா?" },
  deleteMsg: { en: "Are you sure you want to delete this review? This action cannot be undone.", ta: "நிச்சயமாக இந்த மதிப்பீட்டை நீக்க விரும்புகிறீர்களா?" },
  cancel: { en: "Cancel", ta: "ரத்து" },
  delete: { en: "Delete", ta: "நீக்கு" },
  loginReq: { en: "Login Required", ta: "உள்நுழைவு தேவை" },
  loginMsg: { en: "Please login to perform this action.", ta: "தயவுசெய்து உள்நுழையவும்." },
  about: { en: "About this Shop", ta: "கடை பற்றி" },
  noDesc: { en: "No description available.", ta: "விளக்கம் இல்லை." }
};

// ==========================================================
// 2. HELPER: REFRESH TOKEN
// ==========================================================
async function refreshAccessToken() {
  const refresh = localStorage.getItem("REFRESH_TOKEN");
  if (!refresh) return null;
  try {
    const res = await fetch(`${API_BASE}/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refresh })
    });
    const json = await res.json();
    if (json.status === true) {
      localStorage.setItem("ACCESS_TOKEN", json.access_token);
      return json.access_token;
    }
  } catch (e) { console.log("Refresh failed:", e); }
  return null;
}

// ==========================================================
// 3. ANIMATION VARIANTS
// ==========================================================
const popupVariants = {
    initial: { opacity: 0, y: -50, scale: 0.9 },
    animate: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 20 } },
    exit: { opacity: 0, y: -20, scale: 0.9, transition: { duration: 0.2 } }
};

const modalVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 300, damping: 25 } },
    exit: { opacity: 0, scale: 0.8 }
};

// ==========================================================
// ⭐ MAIN SHOP DETAILS COMPONENT
// ==========================================================
function ShopDetails() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const lang = localStorage.getItem("LANG") || "en";
  const t = (key) => TXT[key]?.[lang] || TXT[key]?.en || key;

  const [ready, setReady] = useState(false);
  const loggedInUserId = localStorage.getItem("USER_ID") || "";

  // --------------------------------------------------------
  // A. RESTORE STATE LOGIC
  // --------------------------------------------------------
  let restoredState = state;
  if (!restoredState) {
    const savedLogin = sessionStorage.getItem("REDIRECT_AFTER_LOGIN");
    if (savedLogin) {
      restoredState = JSON.parse(savedLogin);
      sessionStorage.removeItem("REDIRECT_AFTER_LOGIN");
    } else {
      const saved = sessionStorage.getItem("SELECTED_SHOP");
      if (saved) restoredState = JSON.parse(saved);
    }
  }

  // NO DATA HANDLER
  if (!restoredState?.shop) {
    return (
      <>
        <Navbar />
        <div className="container mt-5 text-center">
            <div className="alert alert-warning d-inline-block p-4">
                <h4>{t("noShopData")}</h4>
                <button className="btn btn-dark mt-3" onClick={() => navigate("/")}>Home</button>
            </div>
        </div>
      </>
    );
  }

  // Normalize Data
  const normalizeShop = (data) => {
      if (!data) return {};
      const id = data._id || data.shop_id;
      return { ...data, _id: id, shop_id: id };
  };

  // Initial Data
  const initialShopDoc = normalizeShop(restoredState.shop);
  const shopId = initialShopDoc.shop_id;

  // Derive city name safely (Avoid creating new objects on every render)
  const initialCityName = restoredState.city?.city_name || (typeof initialShopDoc.city === 'string' ? initialShopDoc.city : initialShopDoc.city?.city_name || "");

  // --------------------------------------------------------
  // B. LOCAL STATE
  // --------------------------------------------------------
  const [shopDetails, setShopDetails] = useState(initialShopDoc);

  const [mediaList, setMediaList] = useState([]);
  const [mainMedia, setMainMedia] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(null);
  const [visibleReviewCount, setVisibleReviewCount] = useState(3);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");

  const [topRatedShops, setTopRatedShops] = useState([]);
  const [loadingTopRated, setLoadingTopRated] = useState(true);
  const [views, setViews] = useState(0);

  // POPUP & MODAL STATE
  const [popup, setPopup] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  // Helper to safely get fields
  const getField = (key) => {
      let value = shopDetails[key] || initialShopDoc[key] || "N/A";
      if (typeof value === "string") {
        value = value.replace(/(\r\n|\n|\r)/gm, "");
        value = value.replace(/,/g, ", ");
        value = value.replace(/\s+/g, " ").trim();
      }
      return value;
  };

  // ⭐ CRITICAL FIX: Calculate current city name as a variable
  // This ensures we have a stable string for the useEffect dependency
  const currentCityName = shopDetails.city && typeof shopDetails.city === 'string'
      ? shopDetails.city
      : initialCityName;

  // --------------------------------------------------------
  // C. EFFECTS
  // --------------------------------------------------------

  // 1. Fetch Latest Details
  useEffect(() => {
    if (shopId) {
        setReady(true);
        window.scrollTo(0, 0);

        fetch(`${API_BASE}/shop/${shopId}?lang=${lang}`)
            .then(res => res.json())
            .then(json => {
                if(json.status && json.data) {
                    setShopDetails(prev => ({ ...prev, ...json.data }));
                }
            })
            .catch(err => console.error("Error fetching details:", err));
    }
  }, [shopId, lang]);

  // 2. Load Media
  useEffect(() => {
      if (!shopId) return;

      fetch(`${API_BASE}/shop/${shopId}/media/`)
        .then((res) => res.json())
        .then((json) => {
          let formattedMedia = [];
          if (json.status && json.media && json.media.length > 0) {
            formattedMedia = json.media.map((item) => ({
              type: item.type || "image",
              url: item.path.startsWith("http") ? item.path : `${API_BASE}/${item.path}`
            }));
            setMediaList(formattedMedia);
            setMainMedia(formattedMedia[0]);
            setCurrentIndex(0);
          } else {
            const rawImage = restoredState?.shop?.main_image || initialShopDoc?.main_image;
            if (rawImage) {
              const finalUrl = rawImage.startsWith("http") ? rawImage : `${API_BASE}/${rawImage}`;
              const fallbackMedia = [{ type: "image", url: finalUrl }];
              setMediaList(fallbackMedia);
              setMainMedia(fallbackMedia[0]);
              setCurrentIndex(0);
            } else {
              setMainMedia(null);
              setMediaList([]);
            }
          }
        })
        .catch(err => console.error("Media load error:", err));
    }, [shopId]);

  // 3. Load Reviews
  useEffect(() => {
    if (!shopId) return;
    fetch(`${API_BASE}/shop/${shopId}/reviews/`)
      .then((res) => res.json())
      .then((json) => {
        if (json.status) {
          setReviews(json.reviews || []);
          recalculateAvgRating(json.reviews || []);
        }
      });
  }, [shopId]);

  // 4. Load Top Rated (STRICTLY BY CITY - FIXED LOOP)
  useEffect(() => {
      // If we don't have a valid city name string, don't fetch
      if (!shopId || !currentCityName) {
          setLoadingTopRated(false);
          return;
      }

      setLoadingTopRated(true);

      const queryParams = `lang=${lang}&limit=10&city=${encodeURIComponent(currentCityName)}`;

      fetch(`${API_BASE}/shops/top-rated/?${queryParams}`)
          .then(res => res.json())
          .then(json => {
              if (json.status && json.data) {
                  let filtered = json.data
                      .filter(item => String(item.shop_id) !== String(shopId))
                      .sort((a, b) => {
                          if (b.average_rating === a.average_rating) {
                              return (b.review_count || 0) - (a.review_count || 0);
                          }
                          return (b.average_rating || 0) - (a.average_rating || 0);
                      });

                  if (filtered.some(s => s.average_rating > 0)) {
                      filtered = filtered.filter(s => s.average_rating > 0);
                  }

                  setTopRatedShops(filtered.slice(0, 5));
              } else {
                  setTopRatedShops([]);
              }
              setLoadingTopRated(false);
          })
          .catch(e => {
              console.error("Top rated error", e);
              setLoadingTopRated(false);
          });

  }, [shopId, lang, currentCityName]);
  // FIX: Dependency is now a STRING variable (currentCityName), not an object.
  // This prevents infinite loops.

  // 5. Update Views
  useEffect(() => {
      if (!ready || !shopId) return;
      const viewedKey = `VIEWED_SHOP_${shopId}`;
      const isViewed = sessionStorage.getItem(viewedKey);
      const endpoint = isViewed ? `${API_BASE}/shop/views/${shopId}/` : `${API_BASE}/shop/view/${shopId}/`;
      const method = isViewed ? "GET" : "POST";

      fetch(endpoint, { method: method }).then(res => res.json()).then(json => {
          if (json.status) { setViews(json.total_views); if (!isViewed) sessionStorage.setItem(viewedKey, "1"); }
      }).catch(err => console.error(err));
    }, [ready, shopId]);


  // --------------------------------------------------------
  // E. ACTION HANDLERS
  // --------------------------------------------------------

  const handleBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/');
  };

  const showPopup = (type, message, title = "") => {
      setPopup({ type, message, title });
      setTimeout(() => setPopup(null), 3000);
  };

  const recalculateAvgRating = (currentReviews) => {
    if (currentReviews?.length > 0) {
      const sum = currentReviews.reduce((a, b) => a + b.rating, 0);
      setAvgRating((sum / currentReviews.length).toFixed(1));
    } else {
      setAvgRating(null);
    }
  };

  const loadAllReviews = () => setVisibleReviewCount(reviews.length);

  const submitReview = async () => {
    if (loggedInUserId === "") {
      sessionStorage.setItem("REDIRECT_AFTER_LOGIN", JSON.stringify({ shop: restoredState.shop, city: restoredState.city }));
      return showPopup("error", t("loginMsg"), t("loginReq"));
    }
    if (!rating) return showPopup("warning", "Please select a star rating", "Rating Required");
    if (!reviewText.trim()) return showPopup("warning", "Please write a few words", "Review Empty");

    let token = localStorage.getItem("ACCESS_TOKEN");
    const formData = new FormData();
    formData.append("shop_id", shopId);
    formData.append("rating", rating);
    formData.append("review", reviewText);

    const performFetch = async (currentToken) => {
        return await fetch(`${API_BASE}/review/add/`, {
             method: "POST", headers: { Authorization: `Bearer ${currentToken}` }, body: formData
        });
    };

    let res = await performFetch(token);
    if (res.status === 401) {
      token = await refreshAccessToken();
      if (!token) return navigate("/login");
      res = await performFetch(token);
    }

    const json = await res.json();
    if (json.status) {
      const arr = [json.data, ...reviews];
      setReviews(arr);
      recalculateAvgRating(arr);
      setVisibleReviewCount(arr.length);
      setReviewText("");
      setRating(0);
      showPopup("success", "Review posted successfully!", "Thank You");
    } else {
      showPopup("error", json.message || "Failed to post review");
    }
  };

  const confirmDeleteReview = async () => {
    if (!deleteId) return;
    let token = localStorage.getItem("ACCESS_TOKEN");
    const formData = new FormData();
    formData.append("review_id", deleteId);

    const performFetch = async (currentToken) => {
        return await fetch(`${API_BASE}/review/delete/`, {
             method: "DELETE", headers: { Authorization: `Bearer ${currentToken}` }, body: formData
        });
    };

    let res = await performFetch(token);
    if (res.status === 401) {
      token = await refreshAccessToken();
      if (!token) return navigate("/login");
      res = await performFetch(token);
    }

    const json = await res.json();
    if (json.status) {
      const updatedReviews = reviews.filter((r) => r._id !== deleteId);
      setReviews(updatedReviews);
      recalculateAvgRating(updatedReviews);
      showPopup("success", "Review deleted successfully.");
      setDeleteId(null);
    } else {
      showPopup("error", json.message || "Failed to delete.");
      setDeleteId(null);
    }
  };

  const nextMedia = () => { if (mediaList.length > 1) { const idx = (currentIndex + 1) % mediaList.length; setMainMedia(mediaList[idx]); setCurrentIndex(idx); }};
  const prevMedia = () => { if (mediaList.length > 1) { const idx = (currentIndex - 1 + mediaList.length) % mediaList.length; setMainMedia(mediaList[idx]); setCurrentIndex(idx); }};

  // --------------------------------------------------------
  // F. RENDER UI
  // --------------------------------------------------------
  return (
    <div key={shopId}>
      <style>
        {`
            body { background-color: #f8fafc; font-family: 'Plus Jakarta Sans', sans-serif, 'Noto Sans Tamil', sans-serif; }
            .detail-container { max-width: 1200px; margin: 0 auto; padding-bottom: 60px; }
            .content-card {
                background: white; border-radius: 20px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
                border: 1px solid #e2e8f0; overflow: hidden; margin-bottom: 24px;
            }
            .sticky-info-card {
                position: sticky;
                top: 90px;
                background: white;
                border-radius: 20px;
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
                border: 1px solid #e2e8f0;
                padding: 24px;
                min-width: 0;
            }
            .back-btn {
                background: white; border: 1px solid #cbd5e1; padding: 10px 20px; border-radius: 50px;
                font-weight: 700; color: #475569; transition: all 0.2s; display: inline-flex; align-items: center;
                gap: 8px; margin-bottom: 24px; cursor: pointer;
            }
            .back-btn:hover { background: #f1f5f9; transform: translateX(-3px); color: #0f172a; border-color: #94a3b8; }
            .main-view-box {
                width: 100%; aspect-ratio: 16/9; background: #000; position: relative;
                display: flex; align-items: center; justify-content: center;
            }
            .nav-arrow {
                position: absolute; top: 50%; transform: translateY(-50%);
                background: rgba(255,255,255,0.2); backdrop-filter: blur(5px); color: white;
                width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center;
                justify-content: center; cursor: pointer; transition: all 0.2s; z-index: 10; font-size: 20px;
            }
            .nav-arrow:hover { background: white; color: black; }
            .nav-arrow.left { left: 15px; } .nav-arrow.right { right: 15px; }
            .thumb-strip { display: flex; gap: 10px; padding: 15px; overflow-x: auto; background: #fdfdfd; border-top: 1px solid #eee; }
            .thumb-item {
                width: 80px; height: 60px; border-radius: 8px; cursor: pointer; overflow: hidden; flex-shrink: 0;
                border: 2px solid transparent; transition: all 0.2s; position: relative;
            }
            .thumb-item.active { border-color: #00c6ff; transform: scale(1.05); }
            .thumb-item img, .thumb-item video { width: 100%; height: 100%; object-fit: cover; }
            .shop-title {
                font-size: 2.2rem;
                font-weight: 800;
                color: #1e293b;
                margin-bottom: 5px;
                line-height: 1.3;
                word-break: keep-all;
                overflow-wrap: normal;
                white-space: normal;
            }
            .address-text {
                word-break: break-word;
                overflow-wrap: anywhere;
                white-space: normal;
                flex: 1;
                min-width: 0;
            }
            .rating-badge {
                background: #fffbeb; color: #b45309; padding: 6px 12px; border-radius: 8px;
                font-weight: 700; display: inline-flex; align-items: center; gap: 5px; font-size: 15px; margin-bottom: 15px;
            }
            .offer-btn {
                background: linear-gradient(135deg, #FFD700 0%, #FDB931 100%); border: none; width: 100%;
                padding: 14px; border-radius: 12px; font-weight: 800; color: #422006; font-size: 16px;
                box-shadow: 0 4px 15px rgba(253, 185, 49, 0.4); transition: transform 0.2s;
            }
            .offer-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(253, 185, 49, 0.5); }
            .contact-row {
                display: flex;
                align-items: flex-start;
                gap: 12px;
                margin-bottom: 18px;
                font-size: 15px;
                color: #475569;
            }
            .contact-icon { color: #3b82f6; width: 24px; height: 24px; flex-shrink: 0; }
            .star-input { font-size: 32px; cursor: pointer; transition: transform 0.1s; color: #e2e8f0; }
            .star-input.active { color: #f59e0b; }
            .star-input:hover { transform: scale(1.2); }
            .related-card {
                display: flex; gap: 15px; padding: 12px; border-radius: 16px; transition: all 0.2s;
                cursor: pointer; border: 1px solid transparent; background: #f8fafc;
            }
            .related-card:hover { background: white; border-color: #3b82f6; box-shadow: 0 10px 20px -5px rgba(0,0,0,0.1); transform: translateY(-2px); }
            .related-img { width: 80px; height: 80px; border-radius: 12px; object-fit: cover; background: #e2e8f0; }

            /* POPUP TOAST */
            .custom-popup-toast {
                position: fixed; top: 20px; right: 20px; z-index: 999999;
                min-width: 300px; background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(12px); border-radius: 16px; padding: 16px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.15); border: 1px solid rgba(255,255,255,0.8);
                display: flex; align-items: flex-start; gap: 12px;
            }
            .popup-icon-box { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
            .popup-icon-box.success { background: #dcfce7; color: #16a34a; }
            .popup-icon-box.error { background: #fee2e2; color: #dc2626; }
            .popup-icon-box.warning { background: #fef3c7; color: #d97706; }
            .popup-content h5 { margin: 0; font-size: 15px; font-weight: 700; color: #1e293b; }
            .popup-content p { margin: 0; font-size: 13px; color: #64748b; line-height: 1.4; }

            /* CONFIRM MODAL */
            .modal-overlay {
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0,0,0,0.5); backdrop-filter: blur(5px);
                z-index: 999999; display: flex; align-items: center; justify-content: center;
            }
            .delete-modal {
                background: white; width: 90%; max-width: 400px; border-radius: 20px;
                padding: 24px; text-align: center; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            }
            .modal-actions { display: flex; gap: 10px; justify-content: center; margin-top: 20px; }
            .btn-cancel { background: #f1f5f9; color: #475569; border: none; padding: 10px 20px; border-radius: 10px; font-weight: 600; }
            .btn-delete { background: #fee2e2; color: #dc2626; border: none; padding: 10px 20px; border-radius: 10px; font-weight: 600; }
            .btn-delete:hover { background: #dc2626; color: white; }
        `}
      </style>
      <Navbar />

      <div className="container detail-container mt-4">
        {/* BACK BUTTON */}
        <div className="back-btn" onClick={handleBack}>
            <Icon icon="arrow-left" size={16} /> {t("back")}
        </div>

        <div className="row">
            {/* LEFT COLUMN */}
            <div className="col-lg-8">
                {/* MEDIA */}
                <div className="content-card">
                    {mainMedia ? (
                        <>
                            <div className="main-view-box">
                                {mediaList.length > 1 && <div className="nav-arrow left" onClick={prevMedia}>❮</div>}
                                {mainMedia.type === "video" ? (
                                    <video src={mainMedia.url} controls autoPlay style={{width: '100%', height: '100%', objectFit: 'contain'}} />
                                ) : (
                                    <img src={mainMedia.url} alt="Shop Main" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                                )}
                                {mediaList.length > 1 && <div className="nav-arrow right" onClick={nextMedia}>❯</div>}
                            </div>
                            {mediaList.length > 1 && (
                                <div className="thumb-strip">
                                    {mediaList.map((media, i) => (
                                        <div key={i} className={`thumb-item ${currentIndex === i ? 'active' : ''}`} onClick={() => { setMainMedia(media); setCurrentIndex(i); }}>
                                            {media.type === "video" ? <span style={{fontSize:20, display:'flex', height:'100%', alignItems:'center', justifyContent:'center'}}>▶</span> : <img src={media.url} alt="thumb" />}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    ) : <div className="p-5 text-center text-muted">No Images Available</div>}
                </div>

                {/* DESCRIPTION CARD */}
                <div className="content-card p-4">
                    <h5 className="fw-bold text-dark mb-3">{t("about")}</h5>
                    <p className="text-secondary mb-0" style={{ whiteSpace: 'pre-line', lineHeight: '1.6' }}>
                        {getField("description") && getField("description") !== "N/A"
                            ? getField("description")
                            : t("noDesc")}
                    </p>
                </div>

                {/* REVIEWS */}
                <div className="content-card p-4">
                    <h3 style={{fontWeight:800, color:'#1e293b', marginBottom:20}}>{t("reviews")} <span className="text-muted" style={{fontSize:'0.6em', verticalAlign:'middle'}}>({reviews.length})</span></h3>

                    {/* ADD REVIEW BOX */}
                    {loggedInUserId ? (
                        <div className="bg-light p-4 rounded-4 mb-4 border border-light">
                            <h6 className="mb-3 fw-bold text-dark">{t("addReview")}</h6>
                            <div className="mb-3">
                                {[1, 2, 3, 4, 5].map((num) => (
                                    <span key={num} className={`star-input ${num <= rating ? 'active' : ''}`} onClick={() => setRating(num)}>★</span>
                                ))}
                            </div>
                            <textarea className="form-control mb-3 border-0 shadow-sm" style={{borderRadius:12, padding:15}} rows="3" placeholder={t("reviewPlaceholder")} value={reviewText} onChange={(e) => setReviewText(e.target.value)}></textarea>
                            <button className="btn btn-primary px-4 py-2 fw-bold rounded-pill" onClick={submitReview}>{t("submitReview")}</button>
                        </div>
                    ) : (
                        <div className="alert alert-light border d-flex justify-content-between align-items-center rounded-4">
                            <span className="text-muted fw-bold small">Log in to write a review</span>
                            <button className="btn btn-sm btn-dark rounded-pill fw-bold px-3" onClick={() => {
                                sessionStorage.setItem("REDIRECT_AFTER_LOGIN", JSON.stringify({ shop: restoredState.shop, city: restoredState.city }));
                                navigate("/login");
                            }}>{t("loginToReview")}</button>
                        </div>
                    )}

                    {/* REVIEW LIST */}
                    {reviews.length === 0 ? (
                        <div className="text-center text-muted py-4 small">{t("noReviews")}</div>
                    ) : (
                        <div className="review-list">
                            {reviews.slice(0, visibleReviewCount).map((r, i) => (
                                <div key={i} className="py-3 border-bottom">
                                    <div className="d-flex justify-content-between">
                                        <div className="d-flex gap-3">
                                            <div style={{width:40, height:40, background:'#e2e8f0', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold'}}>{r.username?.[0]?.toUpperCase()}</div>
                                            <div>
                                                <div className="fw-bold text-dark" style={{fontSize:14}}>{r.username || "User"}</div>
                                                <div className="text-warning" style={{fontSize:12}}>{"★".repeat(r.rating) + "☆".repeat(5 - r.rating)}</div>
                                            </div>
                                        </div>
                                        <div className="text-muted" style={{fontSize:11}}>
                                            {r.date || "Recent"}
                                            {loggedInUserId === r.user_id && <span onClick={() => setDeleteId(r._id)} className="text-danger ms-2" style={{cursor:'pointer', textDecoration:'underline'}}>Delete</span>}
                                        </div>
                                    </div>
                                    <p className="mt-2 mb-0 text-secondary small">{r.review}</p>
                                </div>
                            ))}
                        </div>
                    )}
                    {reviews.length > visibleReviewCount && (
                        <button className="btn btn-light w-100 mt-3 fw-bold rounded-pill" onClick={loadAllReviews}>Show all reviews</button>
                    )}
                </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="col-lg-4">
                <div className="sticky-info-card">
                    <h1 className="shop-title">
                          {getField("shop_name")?.replace(/\s+/g, " ").trim()}
                    </h1>

                    <div className="rating-badge">
                        <Icon icon="star" color="#b45309" style={{marginBottom:2}}/> {avgRating || "New"}
                        {reviews.length > 0 && <span className="ms-1 fw-normal text-muted">({reviews.length})</span>}
                    </div>
                    <div className="mb-3 text-muted fw-bold small d-flex align-items-center gap-2">
                        <Icon icon="eye-open" color="#94a3b8"/> {views} {t("viewsText")}
                    </div>
                    <hr className="my-4 border-light" />
                    <h5 className="fw-bold text-dark mb-4">{t("contactInfo")}</h5>

                    {/* FETCHED DATA */}
                    <div className="contact-row"><Icon icon="phone" className="contact-icon"/> <a href={`tel:${getField("phone_number")}`} className="text-decoration-none text-dark fw-bold">{getField("phone_number") === "N/A" ? "No Phone" : getField("phone_number")}</a></div>
                    <div className="contact-row">
                        <Icon icon="envelope" className="contact-icon"/>
                        <span className="address-text">
                            {getField("email") === "N/A" ? "No Email" : getField("email")}
                        </span>
                    </div>

                    <div className="contact-row">
                        <Icon icon="geolocation" className="contact-icon"/>
                        <span className="address-text">
                            {getField("address")}
                        </span>
                    </div>

                    {getField("landmark") && getField("landmark") !== "N/A" && (
                        <div className="contact-row">
                            <Icon icon="flag" className="contact-icon"/>
                            <span className="address-text">
                                <strong>Landmark:</strong> {getField("landmark")}
                            </span>
                        </div>
                    )}

                    <button className="offer-btn mt-4" onClick={() => navigate(`/offers/shop/${shopId}/`, { state: { shop: restoredState.shop, city: restoredState.city } })}>🎉 {t("offers")}</button>

                    <hr className="my-4 border-light" />

                    {/* TOP RATED SHOPS (FETCHED BY CITY) */}
                    <h5 className="fw-bold text-dark mb-3" style={{fontSize:'1rem'}}>{t("moreShops")}</h5>
                    <div className="d-flex flex-column gap-2">
                        {loadingTopRated ? (
                            <div className="text-center text-muted py-3"><div className="spinner-border spinner-border-sm"></div></div>
                        ) : topRatedShops.length > 0 ? (
                            topRatedShops.map((item, idx) => <TopRatedShopCard key={idx} data={item} navigate={navigate} />)
                        ) : <div className="text-muted small text-center py-2">No similar shops found.</div>}
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* POPUP TOAST */}
      <AnimatePresence>
        {popup && (
            <motion.div className="custom-popup-toast" variants={popupVariants} initial="initial" animate="animate" exit="exit">
                <div className={`popup-icon-box ${popup.type}`}><Icon icon={popup.type === 'success' ? 'tick' : popup.type === 'error' ? 'error' : 'warning-sign'} size={18} /></div>
                <div className="popup-content">{popup.title && <h5>{popup.title}</h5>}<p>{popup.message}</p></div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {deleteId && (
            <motion.div className="modal-overlay" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                <motion.div className="delete-modal" variants={modalVariants} initial="hidden" animate="visible" exit="exit">
                    <div style={{background:'#fee2e2', width:60, height:60, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px auto', color:'#dc2626'}}>
                        <Icon icon="trash" size={30} />
                    </div>
                    <h4 className="fw-bold text-dark mb-2">{t("deleteTitle")}</h4>
                    <p className="text-secondary mb-4">{t("deleteMsg")}</p>
                    <div className="modal-actions">
                        <button className="btn-cancel" onClick={() => setDeleteId(null)}>{t("cancel")}</button>
                        <button className="btn-delete" onClick={confirmDeleteReview}>{t("delete")}</button>
                    </div>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>
        <Footer/>
    </div>
  );
}

// ==========================================================
// ⭐ TOP RATED CARD
// ==========================================================
const TopRatedShopCard = ({ data, navigate }) => {
  const imagePath =
    data.image && data.image.startsWith("http")
      ? data.image
      : data.image
      ? `${API_BASE}/${data.image}`
      : null;

  const handleClick = () => {
    const newShopState = {
      shop: {
        _id: data.shop_id,
        shop_id: data.shop_id,
        shop_name: data.shop_name,
        main_image: data.image,
        average_rating: data.average_rating,
        review_count: data.review_count,
        phone_number: data.phone_number || "",
        email: data.email || "",
        address: data.address || "",
        landmark: data.landmark || "",
        description: data.description || "",
        city: data.city
      },
      city: { city_name: data.city }
    };

    sessionStorage.setItem("SELECTED_SHOP", JSON.stringify(newShopState));
    navigate("/shop", { state: newShopState });
  };

  return (
    <div className="related-card" onClick={handleClick}>
      {imagePath ? (
        <img
          src={imagePath}
          className="related-img"
          alt={data.shop_name}
          onError={(e) => (e.target.style.display = "none")}
        />
      ) : (
        <div className="related-img d-flex align-items-center justify-content-center text-muted small">
          <Icon icon="shop" color="#cbd5e1" />
        </div>
      )}

      <div className="flex-grow-1">
        <div className="fw-bold text-dark" style={{ fontSize: "0.95rem" }}>
          {data.shop_name}
        </div>
        <div className="text-muted small">{data.city}</div>

        {data.average_rating > 0 && (
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#b45309",
              background: "#fffbeb",
              padding: "2px 6px",
              borderRadius: 4,
              display: "inline-block"
            }}
          >
            ★ {Math.round(data.average_rating)}
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopDetails;