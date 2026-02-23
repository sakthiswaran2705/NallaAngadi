import React, { useEffect, useState, useMemo } from "react";
import { Button, Spinner, InputGroup, Icon } from "@blueprintjs/core";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "./Navbar";
import Footer from "./footer.jsx";

const AllCategories = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  // Fetch Logic
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const res = await fetch(
          `${BACKEND_URL}/category/list/?lang=${i18n.language}`
        );
        const json = await res.json();
        setCategories(json.data || []);
      } catch (err) {
        console.error("Category fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [i18n.language, BACKEND_URL]);

  // Filter Logic
  const filteredCategories = useMemo(() => {
    if (!searchTerm) return categories;
    return categories.filter((cat) =>
      cat.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [categories, searchTerm]);

  const handleCategoryClick = (cat) => {
    const city = sessionStorage.getItem("CITY_NAME") || "";
    navigate(
      `/results?category=${encodeURIComponent(cat.name)}&city=${encodeURIComponent(city)}`
    );
  };

  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.03 },
    },
  };

  const itemVariants = {
    hidden: { y: 15, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 120, damping: 12 },
    },
  };

  return (
    <div
      style={{
        background: "#f8fafc", // Slate-50 background
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Inter', sans-serif,Noto sans Tamil",
      }}
    >
      <Navbar />

      <div className="container py-5" style={{ flex: 1 }}>
        {/* Header Section */}
        <div className="row mb-5 align-items-center">
          <div className="col-lg-6 mb-3 mb-lg-0">
            <div className="d-flex align-items-center">
              <Button
                icon="arrow-left"
                minimal
                onClick={() => navigate(-1)}
                style={{
                  marginRight: 16,
                  color: "#64748b",
                  background: "#fff",
                  borderRadius: "50%",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
                }}
              />
              <div>
                <h2
                  style={{
                    fontWeight: 800,
                    color: "#0f172a",
                    margin: 0,
                    fontSize: "1.75rem",
                    letterSpacing: "-0.025em",
                  }}
                >
                  {t("All Categories")}
                </h2>
                <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "0.95rem" }}>
                  {t("Browse our full collection of services")}
                </p>
              </div>
            </div>
          </div>

          {/* Search Bar Section */}
          <div className="col-lg-6">
            <InputGroup
              large
              leftIcon={<Icon icon="search" color="#94a3b8" />}
              placeholder={t("Search categories...")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              rightElement={
                searchTerm && (
                  <Button
                    minimal
                    icon="cross"
                    onClick={() => setSearchTerm("")}
                    style={{ color: "#ef4444" }}
                  />
                )
              }
              style={{
                boxShadow: "0 4px 12px -2px rgba(0, 0, 0, 0.05)",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                background: "white",
                height: "48px",
                fontSize: "1rem",
              }}
              className="hover:shadow-md transition-shadow"
            />
          </div>
        </div>

        {/* Content Section */}
        {loading ? (
          <div
            className="d-flex justify-content-center align-items-center"
            style={{ height: "40vh" }}
          >
            <Spinner intent="primary" size={50} />
          </div>
        ) : (
          <>
            {filteredCategories.length === 0 ? (
              // Empty State
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-5"
              >
                <div
                  style={{
                    background: "#f1f5f9",
                    width: 80,
                    height: 80,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 20px",
                  }}
                >
                  <Icon icon="search" size={24} color="#94a3b8" />
                </div>
                <h4 style={{ color: "#475569", fontWeight: 600 }}>
                  {t("No categories found")}
                </h4>
                <p style={{ color: "#94a3b8" }}>
                  {t("We couldn't find what you were looking for.")}
                </p>
              </motion.div>
            ) : (
              // Grid Layout
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                style={{
                  display: "grid",
                  // Adjusted grid for better spacing
                  gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                  gap: "20px",
                }}
              >
                <AnimatePresence>
                  {filteredCategories.map((cat) => (
                    <motion.div
                      key={cat._id || cat.id}
                      layout
                      variants={itemVariants}
                      whileHover={{
                        y: -5,
                        boxShadow: "0 12px 20px -5px rgba(0, 0, 0, 0.08)",
                        borderColor: "#3b82f6", // Blue border on hover
                      }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleCategoryClick(cat)}
                      style={{
                        background: "white",
                        border: "1px solid #f1f5f9",
                        borderRadius: "16px",
                        padding: "20px 12px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        boxShadow: "0 2px 4px -1px rgba(0, 0, 0, 0.03)",
                        height: "100%",
                        position: "relative",
                        overflow: "hidden",
                        transition: "border-color 0.2s ease",
                      }}
                    >
                      {/* Image Container */}
                      <div
                        style={{
                          width: "48px", // Reduced Size
                          height: "48px", // Reduced Size
                          borderRadius: "12px", // Squircle shape
                          background: cat.category_image
                            ? "transparent"
                            : "linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)",
                          marginBottom: 14,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          overflow: "hidden",
                        }}
                      >
                        {cat.category_image ? (
                          <img
                            src={`${BACKEND_URL}/${cat.category_image}`}
                            alt={cat.name}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "contain",
                            }}
                          />
                        ) : (
                          <span
                            style={{
                              fontSize: "18px",
                              fontWeight: "700",
                              color: "#0284c7",
                            }}
                          >
                            {cat.name?.charAt(0).toUpperCase() || "C"}
                          </span>
                        )}
                      </div>

                      {/* Text */}
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "#334155",
                          textAlign: "center",
                          lineHeight: "1.3",
                          width: "100%",
                          // Truncate text if too long
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                        title={cat.name} // Show full name on hover
                      >
                        {cat.name}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default AllCategories;