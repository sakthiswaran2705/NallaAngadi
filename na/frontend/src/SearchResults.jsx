import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { Button, Spinner, Icon, NonIdealState, OverlayToaster, Position } from "@blueprintjs/core";
import { motion, AnimatePresence } from "framer-motion";
import "bootstrap/dist/css/bootstrap.min.css";
import Navbar from "./Navbar.jsx";

/* ---------------- "FLOATING PILL" DESIGN SYSTEM ---------------- */
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap');
  :root { --primary: #2563eb; --primary-hover: #1d4ed8; --accent: #f59e0b; --bg-page: #f8fafc; --text-main: #0f172a; --text-sub: #64748b; --shadow-soft: 0 10px 40px -10px rgba(0,0,0,0.08); --shadow-hover: 0 20px 40px -10px rgba(0,0,0,0.15); }
  body { background-color: var(--bg-page); font-family: 'DM Sans', sans-serif; color: var(--text-main); margin: 0; }
  .search-header { background: #ffffff; padding: 20px 0; position: sticky; top: 0; z-index: 50; border-bottom: 1px solid #e2e8f0; }
  .floating-search-bar { display: flex; align-items: center; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 50px; padding: 6px; box-shadow: var(--shadow-soft); max-width: 750px; margin: 0 auto; transition: all 0.3s ease; position: relative; }
  .floating-search-bar:focus-within { box-shadow: var(--shadow-hover); border-color: var(--primary); transform: translateY(-2px); }
  .search-section { flex: 1; position: relative; padding: 0 20px; display: flex; flex-direction: column; justify-content: center; }
  .search-section:first-child { padding-left: 25px; }
  .search-label { font-size: 10px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; color: var(--text-sub); margin-bottom: 2px; }
  .search-input { border: none; outline: none; width: 100%; font-size: 15px; font-weight: 600; color: var(--text-main); padding: 0; background: transparent; }
  .search-input::placeholder { color: #cbd5e1; font-weight: 500; }
  .search-divider { width: 1px; height: 30px; background-color: #e2e8f0; }
  .search-btn-round { background: var(--primary); color: white; border: none; width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; margin-left: 10px; flex-shrink: 0; }
  .search-btn-round:hover { background: var(--primary-hover); transform: scale(1.05); }
  .suggestions-dropdown { position: absolute; top: 120%; left: 0; width: 100%; background: white; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.12); padding: 10px 0; z-index: 1000; border: 1px solid #f1f5f9; max-height: 250px; overflow-y: auto; min-width: 250px; }
  .suggestion-item { padding: 10px 20px; cursor: pointer; font-size: 14px; color: var(--text-main); font-weight: 500; display: flex; align-items: center; gap: 10px; transition: background 0.2s; }
  .suggestion-item:hover { background: #eff6ff; color: var(--primary); }
  .suggestion-item i { color: #94a3b8; font-size: 12px; }
  .results-container { padding: 40px 20px; max-width: 1200px; margin: 0 auto; }
  .results-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 30px; }
  .clean-card { background: white; border-radius: 16px; overflow: hidden; transition: all 0.3s ease; cursor: pointer; position: relative; border: 1px solid transparent; display: flex; flex-direction: column; }
  .clean-card:hover { transform: translateY(-5px); box-shadow: var(--shadow-hover); }
  .card-image-box { height: 200px; width: 100%; position: relative; overflow: hidden; background: #f1f5f9; border-radius: 16px; }
  .card-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s ease; }
  .clean-card:hover .card-img { transform: scale(1.08); }
  .rating-pill { position: absolute; top: 10px; right: 10px; background: rgba(255, 255, 255, 0.95); padding: 4px 8px; border-radius: 8px; font-size: 12px; font-weight: 700; display: flex; align-items: center; gap: 4px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
  .card-info { padding: 15px 5px; flex-grow: 1; display: flex; flex-direction: column; }
  .card-title { font-size: 17px; font-weight: 700; color: var(--text-main); margin-bottom: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .card-sub { font-size: 14px; color: var(--text-sub); display: flex; align-items: center; gap: 5px; margin-bottom: 15px; }
  .card-actions-row { display: flex; gap: 10px; margin-top: auto; }
  .action-chip { flex: 1; border: 1px solid #e2e8f0; background: white; color: var(--text-sub); padding: 8px; border-radius: 8px; font-size: 12px; font-weight: 600; text-align: center; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 5px; }
  .action-chip:hover { border-color: var(--primary); color: var(--primary); background: #eff6ff; }
  @media (max-width: 768px) {
    .floating-search-bar { flex-direction: column; border-radius: 20px; padding: 15px; gap: 10px; }
    .search-divider { width: 100%; height: 1px; }
    .search-section { width: 100%; padding: 0 !important; }
    .search-btn-round { width: 100%; border-radius: 12px; height: 45px; margin-left: 0; }
    .suggestions-dropdown { top: 100%; width: 100%; }
  }
`;

// Simple Debounce
const useDebounce = (callback, delay) => {
  const timer = useRef(null);
  return useCallback((...args) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => callback(...args), delay);
  }, [callback, delay]);
};

const AppToaster = await OverlayToaster.create({ position: Position.TOP });
const API_BASE = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000"; // Fallback added

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  // eslint-disable-next-line
  const location = useLocation();

  const initialCat = searchParams.get("category") || "";
  const initialCity = searchParams.get("city") || "";
  const lang = localStorage.getItem("LANG") || "en";

  // State
  const [catInput, setCatInput] = useState(initialCat);
  const [cityInput, setCityInput] = useState(initialCity);

  // Suggestion Data
  const [allCategories, setAllCategories] = useState([]);
  const [catSuggestions, setCatSuggestions] = useState([]);
  const [citySuggestions, setCitySuggestions] = useState([]);

  // Dropdown Visibility
  const [showCatDrop, setShowCatDrop] = useState(false);
  const [showCityDrop, setShowCityDrop] = useState(false);

  // Results State
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Ref to track if we just restored from cache
  const isRestored = useRef(false);

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await fetch(`${API_BASE}/category/list/?lang=${lang}`);
        const json = await res.json();
        setAllCategories(json.data || []);
      } catch (e) { console.error("Failed to load categories", e); }
    };
    fetchCats();
  }, [lang]);

  // --- SUGGESTION LOGIC ---
  const fetchCatSuggestions = async (val) => {
    if (!val.trim()) { setCatSuggestions([]); return; }
    const lower = val.toLowerCase();
    let combinedList = [];
    if (allCategories.length > 0) {
      allCategories.forEach(cat => {
        if (cat.name.toLowerCase().includes(lower)) combinedList.push(cat.name);
      });
    }
    try {
      const res = await fetch(`${API_BASE}/shop/search/?name=${encodeURIComponent(val)}&lang=${lang}`);
      const json = await res.json();
      const apiData = json.data || [];
      apiData.forEach((item) => {
        const shopName = item.shop?.shop_name || item.shop_name;
        if (shopName && !combinedList.includes(shopName)) combinedList.push(shopName);
      });
    } catch (e) { console.error(e); }
    setCatSuggestions([...new Set(combinedList)].slice(0, 8));
  };

  const fetchCitySuggestions = async (val) => {
    if (val.length < 2) { setCitySuggestions([]); return; }
    try {
      const res = await fetch(`${API_BASE}/city/search/?city_name=${encodeURIComponent(val)}&lang=${lang}`);
      const json = await res.json();
      const list = (json.data || []).map(c => c.city_name).slice(0, 6);
      setCitySuggestions([...new Set(list)]);
    } catch (e) { console.error(e); }
  };

  const debouncedCat = useDebounce(fetchCatSuggestions, 300);
  const debouncedCity = useDebounce(fetchCitySuggestions, 300);

  // --- RESULTS FETCHING ---
  const fetchResults = async (pageNum, isInitial = false) => {
    if (isInitial) setLoading(true); else setLoadingMore(true);
    try {
      const res = await fetch(
        `${API_BASE}/shop/search/?name=${encodeURIComponent(isInitial ? initialCat : catInput)}&place=${encodeURIComponent(isInitial ? initialCity : cityInput)}&lang=${lang}&page=${pageNum}`
      );
      const json = await res.json();
      const newData = json.data || [];

      if (isInitial) setResults(newData);
      else setResults(prev => [...prev, ...newData]);

      setHasMore(json.has_more || false);
    } catch (error) { console.error(error); }
    finally { if (isInitial) setLoading(false); else setLoadingMore(false); }
  };

  // --- INITIAL LOAD & PAGINATION ---
  useEffect(() => {
    const savedState = sessionStorage.getItem("shopSearchResults");
    if (savedState) {
        const parsed = JSON.parse(savedState);
        if (parsed.cat === initialCat && parsed.city === initialCity) {
            setResults(parsed.results);
            setPage(parsed.page);
            setHasMore(parsed.hasMore);
            setCatInput(parsed.catInput);
            setCityInput(parsed.cityInput);
            isRestored.current = true;
            setTimeout(() => {
                window.scrollTo(0, parsed.scrollPos);
                isRestored.current = false;
                sessionStorage.removeItem("shopSearchResults");
            }, 100);
            return;
        }
    }
    setCatInput(initialCat);
    setCityInput(initialCity);
    setPage(1);
    fetchResults(1, true);
    // eslint-disable-next-line
  }, [initialCat, initialCity, lang]);

  useEffect(() => {
      if (page > 1 && !isRestored.current) fetchResults(page, false);
      // eslint-disable-next-line
  }, [page]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 100) {
        if (!loading && !loadingMore && hasMore) setPage(p => p + 1);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loading, loadingMore, hasMore]);

  // --- HANDLERS ---
  const handleSearch = (c = catInput, ct = cityInput) => {
    setShowCatDrop(false);
    setShowCityDrop(false);
    sessionStorage.removeItem("shopSearchResults");
    if (c) {
      // Allow searching without city, defaulting empty
      const cityParam = ct || "";
      navigate(`/results?category=${encodeURIComponent(c)}&city=${encodeURIComponent(cityParam)}`);
    } else {
      AppToaster.show({ message: "Please enter a category or shop name!", intent: "warning" });
    }
  };

  const handleCardClick = (s) => {
      const stateToSave = {
          results, page, hasMore, catInput, cityInput,
          cat: initialCat, city: initialCity,
          scrollPos: window.scrollY
      };
      sessionStorage.setItem("shopSearchResults", JSON.stringify(stateToSave));
      navigate("/shop", { state: { shop: s } });
  };

  const handleAction = (e, type, value) => {
    e.stopPropagation();
    e.preventDefault();
    if (!value) { AppToaster.show({ message: "Info not available.", intent: "warning" }); return; }
    try {
      if (type === 'call') {
        window.location.href = `tel:${value}`;
      }
      else if (type === 'chat') {
        const cleanNum = value.toString().replace(/\D/g,'');
        const finalNum = cleanNum.length === 10 ? `91${cleanNum}` : cleanNum;
        window.open(`https://wa.me/${finalNum}`, '_blank');
      }
      else if (type === 'map') {
        // FIXED: Use standard Google Maps Search Query
        window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(value)}`, '_blank');
      }
    } catch(err) { console.error("Action failed", err); }
  };

  return (
    <>
      <style>{styles}</style>
      <Navbar />

      <div className="search-header">
        <div className="container">
          <div className="floating-search-bar">
            {/* Find */}
            <div className="search-section">
              <label className="search-label">Find</label>
              <input
                className="search-input"
                placeholder="Plumber, Hotel, Gym..."
                value={catInput}
                autoComplete="off"
                onChange={(e) => { setCatInput(e.target.value); debouncedCat(e.target.value); setShowCatDrop(true); }}
                onFocus={() => { setShowCatDrop(true); if(catInput) debouncedCat(catInput); }}
                onBlur={() => setTimeout(() => setShowCatDrop(false), 200)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <AnimatePresence>
                {showCatDrop && catSuggestions.length > 0 && (
                  <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="suggestions-dropdown">
                    {catSuggestions.map((item, i) => (
                      <div key={i} className="suggestion-item" onMouseDown={() => { setCatInput(item); handleSearch(item, cityInput); }}>
                        <Icon icon="search" /> {item}
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="search-divider"></div>

            {/* Where */}
            <div className="search-section">
              <label className="search-label">Where</label>
              <input
                className="search-input"
                placeholder="City or Zip code"
                value={cityInput}
                autoComplete="off"
                onChange={(e) => { setCityInput(e.target.value); debouncedCity(e.target.value); setShowCityDrop(true); }}
                onFocus={() => { setShowCityDrop(true); if(cityInput) debouncedCity(cityInput); }}
                onBlur={() => setTimeout(() => setShowCityDrop(false), 200)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <AnimatePresence>
                {showCityDrop && citySuggestions.length > 0 && (
                  <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="suggestions-dropdown">
                    {citySuggestions.map((item, i) => (
                      <div key={i} className="suggestion-item" onMouseDown={() => { setCityInput(item); handleSearch(catInput, item); }}>
                        <Icon icon="map-marker" style={{color:'#10b981'}} /> {item}
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button className="search-btn-round" onClick={() => handleSearch()}>
              <Icon icon="search" size={20} color="white" />
            </button>
          </div>
        </div>
      </div>

      <div className="results-container">
        {loading ? (
          <div className="results-grid">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="clean-card" style={{height:300, background:'#fff', border:'1px solid #f1f5f9'}}>
                <div style={{height:200, background:'#f1f5f9'}} />
              </div>
            ))}
          </div>
        ) : (
            <>
                {results.length === 0 ? (
                <NonIdealState icon="search" title="No Results Found" description="We couldn't find anything matching your search." action={<Button intent="primary" onClick={() => navigate('/')}>Go Home</Button>} />
                ) : (
                <div className="results-grid">
                    <AnimatePresence>
                    {results.map((item, idx) => {
                        const s = item.shop || {};
                        const contactNum = s.mobile || s.phone_number;
                        const locationText = s.address || (s.city ? s.city.city_name : cityInput);

                        // --- FIXED IMAGE LOGIC ---
                        // 1. Trust Backend Resolution first (it's inside 'shop' object)
                        let rawImage = s.main_image;

                        // 2. Fallback to Media array if backend resolver failed
                        if (!rawImage && s.media && s.media.length > 0) {
                            rawImage = s.media[0].path;
                        }

                        let finalImgSrc = "";
                        if (!rawImage || rawImage.toString().trim() === "") {
                             finalImgSrc = "https://placehold.co/400x300?text=No+Image";
                        } else if (rawImage.startsWith("http") || rawImage.startsWith("//")) {
                             finalImgSrc = rawImage;
                        } else {
                             // Handle API_BASE having a trailing slash or path starting with slash
                             const base = API_BASE.replace(/\/$/, "");
                             const path = rawImage.startsWith("/") ? rawImage : `/${rawImage}`;
                             finalImgSrc = `${base}${path}?v=${s.updated_at || s._id}`;

                        }

                        return (
                        <motion.div
                            key={s._id || idx}
                            className="clean-card"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            onClick={() => handleCardClick(s)}
                        >
                            <div className="card-image-box">
                                <img
                                    src={finalImgSrc}
                                    alt={s.shop_name || "Shop"}
                                    className="card-img"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = "https://placehold.co/400x300?text=Image+Not+Found";
                                    }}
                                />
                                <div className="rating-pill">
                                    <Icon icon="star" color="#f59e0b" size={12} style={{marginBottom:2}} />
                                    {item.avg_rating ? parseFloat(item.avg_rating).toFixed(1) : "N/A"}
                                </div>
                            </div>

                            <div className="card-info">
                                <div className="card-title">{s.shop_name}</div>
                                <div className="card-sub">
                                    <Icon icon="map-marker" color="#94a3b8" size={12} />
                                    {locationText}
                                </div>

                                <div className="card-actions-row">
                                    <div className="action-chip" onClick={(e) => handleAction(e, 'call', contactNum)}>
                                        <Icon icon="phone" size={12} /> Call
                                    </div>
                                    <div className="action-chip" onClick={(e) => handleAction(e, 'chat', contactNum)}>
                                        <Icon icon="chat" size={12} /> Chat
                                    </div>
                                    <div className="action-chip" onClick={(e) => handleAction(e, 'map', `${s.shop_name} ${locationText}`)}>
                                        <Icon icon="map" size={12} /> Map
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                        );
                    })}
                    </AnimatePresence>
                </div>
                )}
            </>
        )}
        {loadingMore && <div className="text-center p-4"><Spinner size={30} intent="primary" /></div>}
      </div>
    </>
  );
}