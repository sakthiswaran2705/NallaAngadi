import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar.jsx";
const API_BASE = import.meta.env.VITE_BACKEND_URL;

export default function Jobs() {
  const navigate = useNavigate();

  // Data States
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);

  // Pagination States
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Language State
  const getLang = () => localStorage.getItem("LANG") || "en";
  const [lang, setLang] = useState(getLang());

  // Search States
  const [cityInput, setCityInput] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // Listen for language changes
  useEffect(() => {
      const handler = () => setLang(getLang());
      window.addEventListener("LANG_CHANGE", handler);
      return () => window.removeEventListener("LANG_CHANGE", handler);
    }, []);

  // ==========================================
  // 1. FILTER CHANGE (Reset & Debounce)
  // When inputs change, we reset to Page 1 and clear jobs
  // ==========================================
  useEffect(() => {
    // Immediate visual feedback if typing
    if (cityInput || searchInput) setLoading(true);

    const delayDebounceFn = setTimeout(() => {
      // Reset logic: New search means page 1, clear old data
      setPage(1);
      setHasMore(true);
      fetchJobs(1, true);
    }, 800);

    return () => clearTimeout(delayDebounceFn);
  }, [cityInput, searchInput, lang]);


  // ==========================================
  // 2. SCROLL LISTENER (Infinite Scroll)
  // ==========================================
  const handleScroll = useCallback(() => {
    // Check if user has scrolled to the bottom
    if (
      window.innerHeight + document.documentElement.scrollTop + 100 >=
      document.documentElement.offsetHeight
    ) {
      if (!loading && hasMore) {
        setPage((prevPage) => {
          const nextPage = prevPage + 1;
          fetchJobs(nextPage, false);
          return nextPage;
        });
      }
    }
  }, [loading, hasMore]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);


  // ==========================================
  // 3. FETCH DATA FUNCTION
  // ==========================================
  const fetchJobs = async (pageNum, isNewSearch = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (cityInput) params.append("city_name", cityInput);
      if (searchInput) params.append("job_title", searchInput);
      params.append("lang", lang);

      // Pagination Params
      params.append("page", pageNum);
      params.append("limit", 10);

      const res = await fetch(`${API_BASE}/jobs/?${params.toString()}`);
      const data = await res.json();

      if (data.status && data.jobs.length > 0) {
        if (isNewSearch) {
          setJobs(data.jobs); // Replace all jobs
        } else {
          setJobs((prev) => [...prev, ...data.jobs]); // Append new jobs
        }
        // If we got fewer than 10 jobs, we reached the end
        setHasMore(data.jobs.length === 10);
      } else {
        if (isNewSearch) setJobs([]); // No results found
        setHasMore(false); // Stop trying to load more
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };


  return (
    <div style={styles.page}>
        <Navbar />
      {/* HEADER */}
      <div style={styles.navBar}>
        <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
            <button onClick={() => navigate(-1)} style={styles.backBtn}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            </button>
            <h2 style={styles.navTitle}>
                {lang === "en" ? "NallaAngadi Find Jobs" : "வேலை தேடல்"}
            </h2>
        </div>
      </div>

      <div style={styles.container}>

        {/* FILTERS SECTION */}
        <div style={styles.filterContainer}>
          {/* CITY INPUT */}
          <div style={styles.inputWrapper}>
             <span style={styles.iconLabel}>📍</span>
             <input
              style={styles.input}
              placeholder={lang === "en" ? "Enter City " : "ஊர் பெயர்"}
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
            />
          </div>

          {/* JOB SEARCH INPUT */}
          <div style={styles.inputWrapper}>
             <span style={styles.iconLabel}>🔍</span>
             <input
              style={styles.input}
              placeholder={lang === "en" ? "Job Title " : "வேலை "}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
        </div>

        {/* RESULTS INFO */}
        <div style={styles.resultsInfo}>
            {loading && page === 1 ? (
                <span style={{color: '#0d6efd'}}>
                    {lang === "en" ? "Searching..." : "தேடிக்கொண்டிருக்கிறது..."}
                </span>
            ) : (
                <span>
                     {jobs.length > 0 ? (
                        <>Showing {jobs.length} jobs</>
                     ) : (
                        <>{!loading && "No jobs found"}</>
                     )}
                </span>
            )}
        </div>

        {/* JOB LIST */}
        {loading && page === 1 && jobs.length === 0 ? (
          <div style={styles.centerBox}>
            <div style={styles.spinner}></div>
          </div>
        ) : jobs.length === 0 && !loading ? (
          <div style={styles.centerBox}>
            <p style={styles.empty}>
                {lang === "en" ? "No jobs found matching your search." : "உங்கள் தேடலுக்கு ஏற்ற வேலைகள் இல்லை."}
            </p>
          </div>
        ) : (
          <div style={styles.grid}>
            {jobs.map((job) => (
              <div
                key={job._id}
                style={styles.card}
                onClick={() => navigate(`/job/${job._id}?lang=${lang}`)}
              >
                <div style={styles.cardHeader}>
                  <div>
                    <h3 style={styles.jobTitle}>{job.job_title}</h3>
                    <p style={styles.company}>{job.shop_name}</p>
                  </div>
                  <span style={styles.salaryBadge}>₹{job.salary}</span>
                </div>
                <div style={styles.divider}></div>
                <div style={styles.cardFooter}>
                  <div style={styles.metaItem}>
                    <span>🕒 {job.work_start_time} - {job.work_end_time}</span>
                  </div>
                  <div style={styles.metaItem}>
                    <span>📍 {job.city_name}</span>
                  </div>
                </div>
              </div>
            ))}

            {/* LOADING SPINNER AT BOTTOM FOR INFINITE SCROLL */}
            {loading && page > 1 && (
               <div style={{...styles.centerBox, padding: '20px'}}>
                  <div style={{...styles.spinner, width: '20px', height: '20px'}}></div>
               </div>
            )}

            {/* END OF LIST MESSAGE */}
            {!hasMore && jobs.length > 0 && (
                <div style={{textAlign: 'center', padding: '20px', color: '#999', fontSize: '13px'}}>
                    {lang === "en" ? "No more jobs" : "வேலைகள் முடிந்தது"}
                </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ================= STYLES ================= */
const styles = {
  page: { background: "#f0f2f5", minHeight: "100vh", fontFamily: "'Segoe UI', sans-serif,Noto Sans Tamil", paddingBottom: "40px" },
  navBar: { position: "sticky", top: 0, zIndex: 100, background: "#fff", padding: "15px 20px", display: "flex", justifyContent: "space-between", boxShadow: "0 2px 5px rgba(0,0,0,0.05)" },
  backBtn: { background: "transparent", border: "none", cursor: "pointer", fontSize: "16px",fontFamily: " sans-serif,Noto Sans Tamil" },
  navTitle: {
      position: "absolute",
      left: "50%",
      transform: "translateX(-50%)",
      fontFamily: "Noto Sans Tamil",
      margin: 0,
      fontSize: "18px",
      fontWeight: "700",
      color: "#333",
    },
  container: { padding: "20px", maxWidth: "600px", margin: "0 auto" },
  filterContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginBottom: "15px",
    background: "#fff",
    padding: "15px",
    borderRadius: "12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
  },
  inputWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    background: "#f8f9fa",
    borderRadius: "8px",
    border: "1px solid #ddd",
  },
  iconLabel: {
    paddingLeft: "12px",
    fontSize: "18px",
  },
  input: {
    width: "100%",
    padding: "12px 10px",
    border: "none",
    background: "transparent",
    outline: "none",
    fontSize: "15px",
  },
  resultsInfo: {
    marginBottom: "15px",
    fontSize: "14px",
    color: "#666",
    textAlign: "right"
  },
  grid: { display: "flex", flexDirection: "column", gap: "15px" },
  card: { background: "#fff", borderRadius: "12px", padding: "18px", boxShadow: "0 2px 4px rgba(0,0,0,0.03)", cursor: "pointer", transition: "0.2s" },
  cardHeader: { display: "flex", justifyContent: "space-between", marginBottom: "10px" },
  jobTitle: { margin: "0 0 5px 0", fontSize: "16px", fontWeight: "700", color: "#222" },
  company: { margin: 0, fontSize: "13px", color: "#666" },
  salaryBadge: { background: "#e6f4ea", color: "#1e7e34", padding: "4px 8px", borderRadius: "4px", fontSize: "13px", fontWeight: "600", height: "fit-content" },
  divider: { height: "1px", background: "#eee", margin: "10px 0" },
  cardFooter: { display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#555" },
  metaItem: { display: "flex", alignItems: "center", gap: "5px" },
  centerBox: { textAlign: "center", padding: "40px 0", color: "#999" },
  spinner: { margin: "0 auto", width: "24px", height: "24px", border: "3px solid #eee", borderTop: "3px solid #0d6efd", borderRadius: "50%", animation: "spin 1s linear infinite" },
  empty: { fontSize: "15px" },
};