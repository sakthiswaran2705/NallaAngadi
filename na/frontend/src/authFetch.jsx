const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

let isRefreshing = false;
let refreshPromise = null;
let isLoggingOut = false;

// --- 1. POPUP UI LOGIC (Pure JS) ---
const showSessionExpiredPopup = () => {
  // Prevent duplicate popups
  if (document.getElementById("session-expired-popup")) return;

  // Create the container
  const popup = document.createElement("div");
  popup.id = "session-expired-popup";

  // Styles (Matching your React Design)
  Object.assign(popup.style, {
    position: "fixed",
    top: "24px",
    left: "50%",
    transform: "translateX(-50%)",
    background: "#fff",
    padding: "16px 24px",
    borderRadius: "16px",
    display: "flex",
    gap: "16px",
    boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
    zIndex: "999999",
    border: "1px solid #fee2e2",
    alignItems: "center",
    minWidth: "320px",
    fontFamily: "'Inter', sans-serif",
    opacity: "0",
    transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
  });

  // Inner HTML (Icon + Text)
  popup.innerHTML = `
    <div style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 12px; background: #fee2e2; flex-shrink: 0;">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
    </div>
    <div>
      <h5 style="margin: 0 0 4px 0; font-size: 15px; font-weight: bold; color: #1f2937;">Session Expired</h5>
      <p style="margin: 0; font-size: 13px; color: #6b7280;">Please login again to continue.</p>
    </div>
  `;

  // Append to body
  document.body.appendChild(popup);

  // Trigger Animation (Slide Down)
  requestAnimationFrame(() => {
    popup.style.opacity = "1";
    popup.style.top = "30px";
  });

  // Redirect after 3 seconds
  setTimeout(() => {
    // Fade out
    popup.style.opacity = "0";
    popup.style.top = "10px";

    setTimeout(() => {
      if (popup.parentNode) popup.parentNode.removeChild(popup);
      window.location.href = "/login";
    }, 300); // Wait for fade out animation
  }, 3000);
};


// --- 2. REFRESH TOKEN LOGIC ---
async function refreshAccessToken() {
  if (isRefreshing) return refreshPromise;

  isRefreshing = true;

  refreshPromise = (async () => {
    const refreshToken = localStorage.getItem("REFRESH_TOKEN");
    if (!refreshToken) return null;

    try {
      const res = await fetch(`${BACKEND_URL}/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      const data = await res.json();

      if (res.ok && data?.status === true && data?.access_token) {
        localStorage.setItem("ACCESS_TOKEN", data.access_token);
        return data.access_token;
      }
      return null;
    } catch {
      return null;
    }
  })();

  const token = await refreshPromise;
  isRefreshing = false;
  refreshPromise = null;
  return token;
}

// --- 3. AUTHENTICATED FETCH ---
export const authenticatedFetch = async (endpoint, options = {}) => {
  let accessToken = localStorage.getItem("ACCESS_TOKEN");

  let res = await fetch(`${BACKEND_URL}${endpoint}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: accessToken ? `Bearer ${accessToken}` : "",
    },
  });

  // If Unauthorized (401)
  if (res.status === 401) {
    const newAccess = await refreshAccessToken();

    // If Refresh Failed
    if (!newAccess) {
      if (!isLoggingOut) {
        isLoggingOut = true;
        localStorage.clear();
        sessionStorage.clear();

        // CALL THE POPUP FUNCTION HERE
        showSessionExpiredPopup();
      }
      // Throw error to stop further execution, but UI handles the redirect
      throw new Error("Session expired");
    }

    // Retry Original Request
    res = await fetch(`${BACKEND_URL}${endpoint}`, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${newAccess}`,
      },
    });
  }

  return res;
};