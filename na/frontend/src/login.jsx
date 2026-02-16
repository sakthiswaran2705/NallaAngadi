import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@blueprintjs/core";
import Navbar from "./Navbar.jsx";
import Footer from "./footer.jsx"
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// ======================================================
//                 ANIMATION VARIANTS
// ======================================================

const toastVariants = {
  initial: { opacity: 0, x: 50, scale: 0.9 },
  animate: { opacity: 1, x: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 20 } },
  exit: { opacity: 0, x: 20, scale: 0.9, transition: { duration: 0.2 } }
};

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.2 } }
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 350, damping: 25, delay: 0.1 } },
  exit: { opacity: 0, scale: 0.95, y: 10, transition: { duration: 0.2 } }
};

const iconDrawVariants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: { pathLength: 1, opacity: 1, transition: { duration: 0.6, ease: "easeInOut", delay: 0.2 } }
};

// ======================================================
//                 SVG ICONS
// ======================================================

const Eye = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeClose = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10 10 0 0 1 12 20c-5.5 0-10-4-10-8a8 8 0 0 1 1.5-4.3M6.18 6.18A10 10 0 0 1 12 4c5.5 0 10 4 10 8a8 8 0 0 1-1.5 4.3" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

// ======================================================
//                  MAIN AUTH COMPONENT
// ======================================================
export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();

  // --- Auth Modes ---
  const [isLogin, setIsLogin] = useState(true);
  const [isForgot, setIsForgot] = useState(false);

  // --- Form States ---
  const [loginType, setLoginType] = useState("email"); // 'email' or 'phone'
  const [loginValue, setLoginValue] = useState("");

  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // --- Forgot Password States ---
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotValue, setForgotValue] = useState("");
  const [otp, setOtp] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmNewPass, setConfirmNewPass] = useState("");
  const [showNewPass, setShowNewPass] = useState(false);

  // --- UI States ---
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [loading, setLoading] = useState(false);

  // --- POPUP STATES ---
  const [toast, setToast] = useState(null);
  const [modalType, setModalType] = useState(null);

  // Helper to show small toasts
  const showToast = (type, message, title = "") => {
      setToast({ type, message, title });
      setTimeout(() => setToast(null), 4000);
  };

  // --- Security Validators ---
  const validateEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const validatePhone = (v) => /^\d{10,}$/.test(v);

  // Strong Password Regex: At least 8 chars, 1 number, 1 special char
  const validateStrongPassword = (v) => {
    // Production Grade Regex:
    // return /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/.test(v);
    return v.length >= 6; // Simple for testing
  };

  // ================= HANDLERS =================

  // 1. LOGIN
  const handleLogin = async () => {
    if (loading) return;
    if (!loginValue.trim() || !password.trim()) return showToast("warning", "Please enter all login details.", "Missing Fields");

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("username", loginValue);
      fd.append("password", password);

      const res = await fetch(`${BACKEND_URL}/login/`, {
          method: "POST",
          body: fd,
          // credentials: "include" // UNCOMMENT THIS if using HttpOnly Cookies
      });
      const data = await res.json();

      if (data?.status === true) {
        // SECURITY NOTE: Ideally use HttpOnly Cookies from backend.
        localStorage.setItem("USER_ID", data.data.user_id);
        localStorage.setItem("ACCESS_TOKEN", data.access_token);
        localStorage.setItem("REFRESH_TOKEN", data.refresh_token);
        localStorage.setItem("FIRST_NAME", data.data.firstname);
        localStorage.setItem("PROFILE_IMAGE", data.data.profile_image);

        showToast("success", "Login Successful!", "Welcome Back");
        const redirectPath = location.state?.from || "/dashboard";
        setTimeout(() => { navigate(redirectPath, { replace: true }); }, 1500);

      } else {
        // REMOVED ADMIN APPROVAL CHECK HERE
        showToast("error", "Invalid credentials or account not found.", "Login Failed");
      }
    } catch (err) {
      showToast("error", "A server connection error occurred.", "Network Error");
    } finally {
      setLoading(false);
    }
  };

  // 2. REGISTER
  const handleRegister = async () => {
    if (loading) return;
    if (!firstname.trim() || !lastname.trim()) return showToast("warning", "Please enter your full name.", "Validation");

    const hasEmail = regEmail.trim().length > 0;
    const hasPhone = regPhone.trim().length > 0;

    if (!hasEmail && !hasPhone) return showToast("warning", "Please enter either an Email OR a Phone number.", "Validation");
    if (hasEmail && !validateEmail(regEmail)) return showToast("warning", "Invalid email format.", "Validation");
    if (hasPhone && !validatePhone(regPhone)) return showToast("warning", "Phone number must be at least 10 digits.", "Validation");

    if (!validateStrongPassword(password)) return showToast("warning", "Password must be 6+ chars.", "Weak Password");
    if (password !== confirmPassword) return showToast("warning", "Passwords do not match.", "Validation");

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("firstname", firstname);
      fd.append("lastname", lastname);
      fd.append("password", password);
      if (hasEmail) fd.append("email", regEmail.trim());
      if (hasPhone) fd.append("phone", regPhone.trim());

      const res = await fetch(`${BACKEND_URL}/register/`, { method: "POST", body: fd });
      const data = await res.json();

      if (data?.status === true) {
        setModalType("success");
        setIsLogin(true); // Switch to login view immediately behind modal
        setPassword("");
        setConfirmPassword("");
        setRegEmail("");
        setRegPhone("");
        setFirstname("");
        setLastname("");
      } else {
        showToast("error", data.message || "Registration failed.", "Error");
      }
    } catch {
        showToast("error", "A server connection error occurred.", "Network Error");
    } finally {
      setLoading(false);
    }
  };

  // 3. FORGOT PASSWORD
  const handleSendOtp = async () => {
    if (!forgotValue.trim()) return showToast("warning", "Please enter your email or phone.", "Validation");
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("emailorphone", forgotValue);
      const res = await fetch(`${BACKEND_URL}/forgot-password/send-otp/`, { method: "POST", body: fd });
      const data = await res.json();
      if (data?.status === true || res.ok) {
        showToast("success", "OTP sent! Check your inbox/messages.", "Sent");
        setForgotStep(2);
      } else {
        showToast("error", "Failed to send OTP. Try again.", "Error");
      }
    } catch { showToast("error", "Server error sending OTP.", "Error"); } finally { setLoading(false); }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 4) return showToast("warning", "Please enter a valid OTP.", "Validation");
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("email", forgotValue);
      fd.append("otp", otp);
      const res = await fetch(`${BACKEND_URL}/forgot-password/verify-otp/`, { method: "POST", body: fd });
      const data = await res.json();
      if (data?.status === true || res.ok) {
        showToast("success", "OTP Verified. Set new password.", "Verified");
        setForgotStep(3);
      } else {
        showToast("error", "Invalid OTP.", "Error");
      }
    } catch { showToast("error", "Server error verifying OTP.", "Error"); } finally { setLoading(false); }
  };

  const handleResetPassword = async () => {
    if (!validateStrongPassword(newPass)) return showToast("warning", "Password requirements not met.", "Validation");
    if (newPass !== confirmNewPass) return showToast("warning", "Passwords do not match.", "Validation");
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("email", forgotValue);
      fd.append("new_password", newPass);
      const res = await fetch(`${BACKEND_URL}/forgot-password/reset/`, { method: "POST", body: fd });
      const data = await res.json();
      if (data?.status === true || res.ok) {
        showToast("success", "Password reset successful. Please login.", "Success");
        setTimeout(() => {
            setIsForgot(false);
            setForgotStep(1);
            setForgotValue("");
            setOtp("");
            setNewPass("");
            setConfirmNewPass("");
        }, 2000);
      } else {
        showToast("error", data.message || "Failed to reset password.", "Error");
      }
    } catch { showToast("error", "Server error resetting password.", "Error"); } finally { setLoading(false); }
  };

  const handleCancelForgot = () => {
    setIsForgot(false);
    setForgotStep(1);
    setForgotValue("");
  };

  // ================= UI RENDERING =================

  return (
    <div style={styles.mainWrapper}>
      <Navbar/>
        <style>
        {`
            :root {
                --success: #10b981;
                --error: #ef4444;
                --warning: #f59e0b;
                --primary: #1976D2;
            }
            /* Toast */
            .custom-popup-toast {
                position: fixed; top: 20px; right: 20px; z-index: 999999;
                min-width: 320px; max-width: 400px;
                background: rgba(255,255,255,0.95); backdrop-filter: blur(12px);
                border-radius: 16px; padding: 16px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.15); border: 1px solid rgba(255,255,255,0.8);
                display: flex; align-items: flex-start; gap: 12px;
            }
            .popup-icon-box {
                width: 40px; height: 40px; border-radius: 12px; display: flex;
                align-items: center; justify-content: center; flex-shrink: 0;
            }
            .popup-icon-box.success { background: rgba(16, 185, 129, 0.15); color: var(--success); }
            .popup-icon-box.error { background: rgba(239, 68, 68, 0.15); color: var(--error); }
            .popup-icon-box.warning { background: rgba(245, 158, 11, 0.15); color: var(--warning); }
            .popup-content h5 { margin: 0 0 2px 0; font-size: 16px; font-weight: 700; color: #111827; }
            .popup-content p { margin: 0; font-size: 13px; color: #6b7280; font-weight: 500; }

            /* Modal */
            .modal-overlay {
                position: fixed; inset: 0; z-index: 9999999;
                background: rgba(15, 23, 42, 0.7); backdrop-filter: blur(10px);
                display: flex; align-items: center; justify-content: center; padding: 20px;
            }
            .modal-card {
                background: #ffffff; width: 100%; max-width: 500px;
                padding: 48px 36px; border-radius: 24px; text-align: center;
                box-shadow: 0 25px 60px -12px rgba(0, 0, 0, 0.4);
                position: relative; overflow: hidden;
            }
            .modal-icon-circle {
                width: 84px; height: 84px; margin: 0 auto 28px; border-radius: 50%;
                display: flex; align-items: center; justify-content: center;
            }
            .modal-icon-circle.success { background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); }
            .modal-icon-circle.warning { background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.2); }

            .modal-title { font-size: 26px; font-weight: 800; color: #111827; margin: 0 0 6px 0; }
            .modal-title-ta { font-size: 18px; font-weight: 600; color: #374151; margin: 0 0 24px 0; font-family: 'Mukta Malar', sans-serif; }

            .modal-body { background: #f8fafc; border-radius: 12px; padding: 24px; margin-bottom: 32px; border: 1px solid #e2e8f0; }
            .body-en { font-size: 15px; color: #334155; font-weight: 600; margin: 0 0 12px 0; }
            .body-ta { font-size: 14px; color: #64748b; font-weight: 500; margin: 0; font-family: 'Mukta Malar', sans-serif; }

            .modal-btn {
                width: 100%; padding: 16px; border: none; border-radius: 14px;
                font-size: 16px; font-weight: 700; cursor: pointer; color: white;
                transition: transform 0.1s, opacity 0.2s;
            }
            .modal-btn.success { background: linear-gradient(135deg, #10b981, #059669); }
            .modal-btn.warning { background: linear-gradient(135deg, #f59e0b, #d97706); }
            .modal-btn:hover { opacity: 0.95; transform: translateY(-1px); }
        `}
        </style>

      {/* <Navbar /> */}

      <div style={styles.authContainer}>
        <div style={styles.card}>

            {/* ======================= */}
            {/* 1. FORGOT PASSWORD VIEW */}
            {/* ======================= */}
            {isForgot ? (
                <>
                   <h2 style={{ ...styles.heading, color: styles.primaryBlue }}>Reset Password</h2>

                   {forgotStep === 1 && (
                        <>
                            <p style={styles.stepText}>Step 1: Enter your registered Email or Phone</p>
                            <input style={styles.input} placeholder="Email or Phone Number" value={forgotValue} onChange={(e) => setForgotValue(e.target.value)} disabled={loading} />
                            <button style={{ ...styles.submitButton, backgroundColor: styles.primaryBlue }} onClick={handleSendOtp} disabled={loading}>{loading ? "Sending..." : "Send OTP"}</button>
                        </>
                    )}

                    {forgotStep === 2 && (
                        <>
                            <p style={styles.stepText}>Step 2: Enter OTP sent to {forgotValue}</p>
                            <input style={styles.input} placeholder="OTP" value={otp} maxLength={6} onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ""))} disabled={loading} />
                            <button style={{ ...styles.submitButton, backgroundColor: styles.primaryBlue }} onClick={handleVerifyOtp} disabled={loading}>{loading ? "Verifying..." : "Verify OTP"}</button>
                        </>
                    )}

                    {forgotStep === 3 && (
                        <>
                            <p style={styles.stepText}>Step 3: New Password</p>
                            <div style={styles.passBox}>
                                <input style={styles.passInput} type={showNewPass ? "text" : "password"} placeholder="New Password" value={newPass} onChange={(e) => setNewPass(e.target.value)} disabled={loading} />
                                <span onClick={() => setShowNewPass(!showNewPass)} style={styles.eyeIcon}>{showNewPass ? EyeClose : Eye}</span>
                            </div>
                            <div style={styles.passBox}>
                                <input style={styles.passInput} type="password" placeholder="Confirm New Password" value={confirmNewPass} onChange={(e) => setConfirmNewPass(e.target.value)} disabled={loading} />
                            </div>
                            <button style={{ ...styles.submitButton, backgroundColor: styles.primaryBlue }} onClick={handleResetPassword} disabled={loading}>{loading ? "Resetting..." : "Reset Password"}</button>
                        </>
                    )}
                   <p style={{ ...styles.link, color: styles.primaryBlue }} onClick={handleCancelForgot}>Back to Login</p>
                </>
            ) : (
                /* ======================= */
                /* 2. MAIN LOGIN / REGISTER */
                /* ======================= */
                <>
                    <h2 style={{ ...styles.heading, color: isLogin ? styles.primaryBlue : styles.primaryGreen }}>
                        {isLogin ? "Welcome Back" : "Create Account"}
                    </h2>

                    {/* Register: Names */}
                    {!isLogin && (
                        <div style={styles.nameGroup}>
                            <input style={styles.halfInput} placeholder="First Name" value={firstname} onChange={(e) => setFirstname(e.target.value)} />
                            <input style={styles.halfInput} placeholder="Last Name" value={lastname} onChange={(e) => setLastname(e.target.value)} />
                        </div>
                    )}

                    {/* --- TAB SWITCHER (UPDATED COLORS) --- */}
                    {isLogin ? (
                        <>
                            <div style={styles.tabContainer}>
                                <div
                                    style={{...styles.tabItem, ...(loginType === 'email' ? styles.activeTab : styles.inactiveTab)}}
                                    onClick={() => setLoginType('email')}
                                >
                                    Email
                                </div>
                                <div
                                    style={{...styles.tabItem, ...(loginType === 'phone' ? styles.activeTab : styles.inactiveTab)}}
                                    onClick={() => setLoginType('phone')}
                                >
                                    Phone
                                </div>
                            </div>

                            <motion.div
                                key={loginType}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                transition={{ duration: 0.2 }}
                            >
                                <input
                                    style={styles.input}
                                    type={loginType === 'phone' ? 'tel' : 'text'}
                                    // UPDATED PLACEHOLDERS
                                    placeholder={loginType === 'email' ? "Enter your Email" : "Enter your Phone"}
                                    value={loginValue}
                                    onChange={(e) => setLoginValue(e.target.value)}
                                />
                            </motion.div>
                        </>
                    ) : (
                        <>
                            <input style={styles.input} placeholder="Email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} />
                            <input style={styles.input} placeholder="Phone" value={regPhone} onChange={(e) => setRegPhone(e.target.value)} />
                        </>
                    )}

                    {/* Password */}
                    <div style={styles.passBox}>
                        <input style={styles.passInput} type={showPass ? "text" : "password"} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                        <span onClick={() => setShowPass(!showPass)} style={styles.eyeIcon}>{showPass ? EyeClose : Eye}</span>
                    </div>

                    {isLogin && (
                        <div style={styles.forgotContainer}>
                            <span style={styles.forgotLink} onClick={() => { setIsForgot(true); setForgotStep(1); setForgotValue(""); }}>Forgot Password?</span>
                        </div>
                    )}

                    {/* Confirm Pass */}
                    {!isLogin && (
                         <div style={styles.passBox}>
                            <input style={styles.passInput} type={showConfirmPass ? "text" : "password"} placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                            <span onClick={() => setShowConfirmPass(!showConfirmPass)} style={styles.eyeIcon}>{showConfirmPass ? EyeClose : Eye}</span>
                        </div>
                    )}

                    {/* Action Button */}
                    <button
                        style={{ ...styles.submitButton, backgroundColor: isLogin ? styles.primaryBlue : styles.primaryGreen }}
                        onClick={isLogin ? handleLogin : handleRegister}
                        disabled={loading}
                    >
                        {loading ? "Processing..." : (isLogin ? "Log In" : "Register")}
                    </button>

                    {/* Toggle Link */}
                    <p style={{ ...styles.link, color: isLogin ? styles.primaryBlue : styles.primaryGreen }} onClick={() => setIsLogin(!isLogin)}>
                        {isLogin ? "Need an account? Register Now" : "Already have an account? Log In"}
                    </p>
                </>
            )}
        </div>
      </div>

      {/* ======================================= */}
      {/* TOAST NOTIFICATIONS                   */}
      {/* ======================================= */}
      <AnimatePresence>
        {toast && (
            <motion.div className="custom-popup-toast" variants={toastVariants} initial="initial" animate="animate" exit="exit">
                <div className={`popup-icon-box ${toast.type}`}>
                    <Icon icon={toast.type === 'success' ? 'tick-circle' : toast.type === 'error' ? 'error' : 'warning-sign'} iconSize={24} />
                </div>
                <div className="popup-content">
                    {toast.title && <h5>{toast.title}</h5>}
                    <p>{toast.message}</p>
                </div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* ======================================= */}
      {/* MODALS SYSTEM                         */}
      {/* ======================================= */}
      <AnimatePresence>
        {modalType && (
            <motion.div className="modal-overlay" variants={overlayVariants} initial="hidden" animate="visible" exit="exit">
                {modalType === "success" && (
                    <motion.div className="modal-card" variants={modalVariants}>
                        <div className="modal-icon-circle success">
                            <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <motion.path d="M20 6L9 17l-5-5" variants={iconDrawVariants} initial="hidden" animate="visible" />
                            </svg>
                        </div>
                        <h2 className="modal-title">Account Created!</h2>
                        <h3 className="modal-title-ta">கணக்கு வெற்றிகரமாக உருவாக்கப்பட்டது!</h3>
                        <div className="modal-body">
                            <p className="body-en">Your registration was successful.<br/>You can now log in with your credentials.</p>
                            <p className="body-ta">உங்கள் பதிவு வெற்றிகரமாக முடிந்தது.<br/>இப்போது உங்கள் தகவல்களைப் பயன்படுத்தி உள்நுழையலாம்.</p>
                        </div>
                        <button className="modal-btn success" onClick={() => setModalType(null)}>OK, Login Now</button>
                    </motion.div>
                )}
            </motion.div>
        )}
      </AnimatePresence>
      <Footer/>
    </div>
  );
}

// ================= JSS STYLES (New & Improved) =================
const styles = {
  primaryBlue: "#1976D2",
  primaryGreen: "#2E7D32",

  mainWrapper: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    minHeight: "100vh",
    background: "linear-gradient(135deg, #eef2f7, #f9fbfd)",
  },

  authContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "calc(100vh - 64px)",
    padding: "20px",
    fontFamily: '"Inter", "Roboto", sans-serif'
  },

  card: {
    width: "100%", maxWidth: "420px", padding: "36px",
    borderRadius: "20px", background: "#ffffff",
    boxShadow: "0 20px 50px -12px rgba(0,0,0,0.1)",
    border: "1px solid #f1f5f9"
  },
  heading: {
    textAlign: "center", marginBottom: "28px", fontWeight: 700, fontSize: "26px", letterSpacing: "-0.5px"
  },

  /* --- NEW TAB SWITCHER STYLES --- */
  tabContainer: {
    display: 'flex', background: '#f1f5f9', borderRadius: '12px', padding: '4px',
    marginBottom: '20px', position: 'relative'
  },
  tabItem: {
    flex: 1, textAlign: 'center', padding: '10px', fontSize: '14px', fontWeight: 600,
    borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s ease', userSelect: 'none'
  },
  // UPDATED: Blue background, White text
  activeTab: {
    background: '#1976D2', color: '#ffffff', boxShadow: '0 2px 5px rgba(0,0,0,0.15)',
    transform: 'scale(1)'
  },
  inactiveTab: {
    background: 'transparent', color: '#64748b'
  },

  nameGroup: { display: "flex", gap: "12px", marginBottom: "16px" },
  halfInput: {
    flex: 1, padding: "14px", borderRadius: "10px",
    border: "1px solid #e2e8f0", fontSize: "15px",
    background: "#f8fafc", outline: "none", width: "100%", color: "#334155"
  },
  input: {
    width: "100%", padding: "14px", marginBottom: "16px",
    borderRadius: "10px", border: "1px solid #e2e8f0",
    fontSize: "15px", background: "#f8fafc", outline: "none", color: "#334155"
  },
  passBox: { position: "relative", marginBottom: "16px" },
  passInput: {
    width: "100%", padding: "14px 46px 14px 14px",
    borderRadius: "10px", border: "1px solid #e2e8f0",
    fontSize: "15px", background: "#f8fafc", outline: "none", color: "#334155"
  },
  eyeIcon: {
    position: "absolute", right: "14px", top: "50%",
    transform: "translateY(-50%)", cursor: "pointer", opacity: 0.6
  },
  forgotContainer: { display: "flex", justifyContent: "flex-end", marginBottom: "18px", marginTop: "-8px" },
  forgotLink: { fontSize: "13px", color: "#1976D2", cursor: "pointer", fontWeight: 600 },
  submitButton: {
    width: "100%", padding: "14px", borderRadius: "12px",
    border: "none", fontSize: "16px", fontWeight: 700,
    color: "#ffffff", cursor: "pointer", transition: "all 0.2s ease-in-out",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
  },
  link: { textAlign: "center", marginTop: "24px", fontWeight: 600, cursor: "pointer", fontSize: "14px", color: "#1976D2" },
  stepText: { marginBottom: "12px", fontSize: "14px", color: "#64748b", textAlign: "left", fontWeight: 500 },
};