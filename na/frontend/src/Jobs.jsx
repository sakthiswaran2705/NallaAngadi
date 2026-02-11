import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar.jsx";
import Footer from "./footer.jsx";
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
  // ==========================================
  useEffect(() => {
    if (cityInput || searchInput) setLoading(true);

    const delayDebounceFn = setTimeout(() => {
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
      params.append("page", pageNum);
      params.append("limit", 10);

      const res = await fetch(`${API_BASE}/jobs/?${params.toString()}`);
      const data = await res.json();

      if (data.status && data.jobs.length > 0) {
        if (isNewSearch) {
          setJobs(data.jobs);
        } else {
          setJobs((prev) => [...prev, ...data.jobs]);
        }
        setHasMore(data.jobs.length === 10);
      } else {
        if (isNewSearch) setJobs([]);
        setHasMore(false);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <div style={styles.page}>
      <Navbar />

      <div style={styles.container}>

        {/* HEADER SECTION (Title & Search) */}
        <div style={styles.headerSection}>
          <h1 style={styles.pageTitle}>
            {lang === "en" ? "Search Jobs" : "வேலை தேடல்"}
          </h1>
          <p style={styles.subTitle}>
            {lang === "en"
              ? "Find the perfect job for you"
              : "உங்களுக்கான சரியான வேலையைக் கண்டறியவும்"}
          </p>

          {/* FILTERS CONTAINER */}
          <div style={styles.filterContainer}>
            {/* CITY INPUT */}
            <div style={styles.inputWrapper}>
              <span style={styles.iconLabel}>📍</span>
              <input
                style={styles.input}
                placeholder={lang === "en" ? "City (e.g. Chennai)" : "ஊர் பெயர்"}
                value={cityInput}
                onChange={(e) => setCityInput(e.target.value)}
              />
            </div>

            {/* DIVIDER (Visual only for desktop) */}
            <div style={styles.verticalDivider}></div>

            {/* JOB SEARCH INPUT */}
            <div style={styles.inputWrapper}>
              <span style={styles.iconLabel}>🔍</span>
              <input
                style={styles.input}
                placeholder={lang === "en" ? "Job Title (e.g. Driver)" : "வேலை (எ.கா ஓட்டுநர்)"}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* RESULTS INFO */}
        <div style={styles.resultsInfo}>
          {loading && page === 1 ? (
            <span style={{ color: "#0d6efd", fontWeight: "600" }}>
              {lang === "en" ? "Searching..." : "தேடிக்கொண்டிருக்கிறது..."}
            </span>
          ) : (
            <span>
              {jobs.length > 0 ? (
                <>Found {jobs.length} jobs</>
              ) : (
                <>{!loading && ""}</>
              )}
            </span>
          )}
        </div>

        {/* JOB LIST GRID */}
        {loading && page === 1 && jobs.length === 0 ? (
          <div style={styles.centerBox}>
            <div style={styles.spinner}></div>
          </div>
        ) : jobs.length === 0 && !loading ? (
          <div style={styles.centerBox}>
            <div style={{ fontSize: "50px", marginBottom: "10px" }}>📄</div>
            <p style={styles.empty}>
              {lang === "en"
                ? "No jobs found matching your search."
                : "உங்கள் தேடலுக்கு ஏற்ற வேலைகள் இல்லை."}
            </p>
          </div>
        ) : (
          <div style={styles.grid}>
            {jobs.map((job) => (
              <div
                key={job._id}
                style={styles.card}
                onClick={() => navigate(`/job/${job._id}?lang=${lang}`)}
                onMouseEnter={(e) => {
                   e.currentTarget.style.transform = "translateY(-3px)";
                   e.currentTarget.style.boxShadow = "0 8px 15px rgba(0,0,0,0.1)";
                }}
                onMouseLeave={(e) => {
                   e.currentTarget.style.transform = "translateY(0)";
                   e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.03)";
                }}
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

            {/* LOADING SPINNER AT BOTTOM */}
            {loading && page > 1 && (
              <div style={{ ...styles.centerBox, padding: "20px" }}>
                <div
                  style={{ ...styles.spinner, width: "20px", height: "20px" }}
                ></div>
              </div>
            )}

            {/* END OF LIST MESSAGE */}
            {!hasMore && jobs.length > 0 && (
              <div
                style={{
                  textAlign: "center",
                  padding: "20px",
                  color: "#999",
                  fontSize: "13px",
                }}
              >
                {lang === "en" ? "End of results" : "வேலைகள் முடிந்தது"}
              </div>
            )}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

/* ================= STYLES ================= */
const styles = {
  page: {
    background: "#f0f2f5",
    minHeight: "100vh",
    fontFamily: "'Segoe UI', sans-serif, Noto Sans Tamil",
    display: "flex",
    flexDirection: "column",
  },
  container: {
    padding: "20px",
    width: "100%",
    maxWidth: "800px", // Reduced width for better center focus
    margin: "0 auto",
    flex: 1,
  },

  // Header & Search Styles
  headerSection: {
    textAlign: "center",
    marginBottom: "30px",
    paddingTop: "20px",
  },
  pageTitle: {
    fontSize: "28px",
    fontWeight: "800",
    color: "#1a1a1a",
    marginBottom: "5px",
  },
  subTitle: {
    fontSize: "14px",
    color: "#666",
    marginBottom: "25px",
  },
  filterContainer: {
    display: "flex",
    flexWrap: "wrap", // Allows stacking on mobile
    alignItems: "center",
    background: "#fff",
    padding: "8px",
    borderRadius: "50px", // Rounded pill shape
    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
    border: "1px solid #eee",
  },
  inputWrapper: {
    flex: "1 1 200px", // Grow and shrink, min-width 200px
    display: "flex",
    alignItems: "center",
    padding: "5px 15px",
  },
  verticalDivider: {
    width: "1px",
    height: "30px",
    background: "#eee",
    display: "block", // Hidden on mobile via media query ideally, but keeping simple
  },
  iconLabel: {
    fontSize: "18px",
    marginRight: "10px",
    opacity: "0.7",
  },
  input: {
    width: "100%",
    padding: "10px 5px",
    border: "none",
    background: "transparent",
    outline: "none",
    fontSize: "15px",
    color: "#333",
  },

  // Results & Grid
  resultsInfo: {
    marginBottom: "15px",
    fontSize: "14px",
    color: "#666",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 5px",
  },
  grid: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },

  // Card Styles
  card: {
    background: "#fff",
    borderRadius: "16px",
    padding: "20px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.03)",
    cursor: "pointer",
    transition: "all 0.3s ease",
    border: "1px solid transparent",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "12px",
  },
  jobTitle: {
    margin: "0 0 6px 0",
    fontSize: "18px",
    fontWeight: "700",
    color: "#222",
  },
  company: {
    margin: 0,
    fontSize: "14px",
    color: "#666",
    fontWeight: "500",
  },
  salaryBadge: {
    background: "#e8f5e9",
    color: "#2e7d32",
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "13px",
    fontWeight: "700",
    whiteSpace: "nowrap",
  },
  divider: {
    height: "1px",
    background: "#f0f0f0",
    margin: "12px 0",
  },
  cardFooter: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "13px",
    color: "#555",
  },
  metaItem: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    background: "#f8f9fa",
    padding: "4px 8px",
    borderRadius: "6px",
  },

  // Utils
  centerBox: {
    textAlign: "center",
    padding: "60px 0",
    color: "#999",
  },
  spinner: {
    margin: "0 auto",
    width: "30px",
    height: "30px",
    border: "3px solid #eee",
    borderTop: "3px solid #0d6efd",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  empty: {
    fontSize: "16px",
    color: "#555",
  },
};