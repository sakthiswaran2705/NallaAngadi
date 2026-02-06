import React, { useEffect, useRef, useState } from "react";
import { authenticatedFetch } from "./authFetch";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";

import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@blueprintjs/core";

// --- CONSTANTS ---
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_BYTES = 20 * 1024 * 1024; // 20MB

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const mediaUrl = (path) => (path ? `${BACKEND_URL}/${path}` : "");

// --- ANIMATIONS ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.15 } }
};

const popupVariants = {
  initial: { opacity: 0, y: -20, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 20 } },
  exit: { opacity: 0, y: -20, scale: 0.95, transition: { duration: 0.2 } }
};

// --- TRANSLATION MAP ---
const TXT = {
  dashboard: { en: "Shop Dashboard", ta: "கடை கட்டுப்பாட்டுப் பலகை" },
  addShop: { en: "Add Shop", ta: "கடையைச் சேர்" },
  addOffer: { en: "Add Offer", ta: "சலுகையைச் சேர்" },
  myJobs: { en: "My Jobs", ta: "எனது வேலைகள்" },
  noShops: { en: 'No shops found. Click "Add Shop" to get started.', ta: "கடைகள் எதுவும் இல்லை. தொடங்க 'கடையைச் சேர்' என்பதைக் கிளிக் செய்யவும்." },
  address: { en: "Address", ta: "முகவரி" },
  phone: { en: "Phone", ta: "தொலைபேசி" },
  email: { en: "Email", ta: "மின்னஞ்சல்" },
  keywords: { en: "Keywords", ta: "முக்கிய வார்த்தைகள்" },
  editShop: { en: "Edit Shop", ta: "கடையைத் திருத்து" },
  deleteShop: { en: "Delete Shop", ta: "கடையை நீக்கு" },
  deleting: { en: "Deleting...", ta: "நீக்கப்படுகிறது..." },
  media: { en: "Gallery", ta: "ஊடகம்" },
  more: { en: "more", ta: "கூடுதல்" },
  offers: { en: "Active Offers", ta: "சலுகைகள்" },
  off: { en: "OFF", ta: "தள்ளுபடி" },
  edit: { en: "Edit", ta: "திருத்து" },
  delete: { en: "Delete", ta: "நீக்கு" },
  updateShopDetails: { en: "Update Shop Details", ta: "கடை விவரங்களைப் புதுப்பி" },
  addNewShop: { en: "Create New Shop", ta: "புதிய கடையைச் சேர்" },
  shopName: { en: "Shop Name", ta: "கடையின் பெயர்" },
  description: { en: "Description", ta: "விளக்கம்" },
  landmark: { en: "Landmark", ta: "அடையாளம்" },
  categoryList: { en: "Category list (comma separated)", ta: "வகைப்பட்டியல் (கமா மூலம் பிரிக்கவும்)" },
  cityName: { en: "City Name", ta: "நகரத்தின் பெயர்" },
  district: { en: "District", ta: "மாவட்டம்" },
  pincode: { en: "Pincode", ta: "அஞ்சல் குறியீடு" },
  state: { en: "State", ta: "மாநிலம்" },
  keywordsPlaceholder: { en: "Keywords (comma separated)", ta: "முக்கிய வார்த்தைகள் (கமா மூலம் பிரிக்கவும்)" },
  uploadPhotosLabel: { en: "Upload Shop Gallery", ta: "கடை ஊடகத்தைப் பதிவேற்றவும்" },
  uploadHint: { en: "Images (5MB) or Videos (20MB)", ta: "படங்கள் (5MB) அல்லது வீடியோக்கள் (20MB)" },
  uploadHintAdd: { en: "Images Only (Max 5MB)", ta: "படங்கள் மட்டும் (அதிகபட்சம் 5MB)" },
  saving: { en: "Saving...", ta: "சேமிக்கப்படுகிறது..." },
  save: { en: "Save Changes", ta: "சேமி" },
  cancel: { en: "Cancel", ta: "ரத்து செய்" },
  confirm: { en: "Confirm", ta: "உறுதிப்படுத்து" },
  deleteConfirmTitle: { en: "Are you sure?", ta: "நீங்கள் உறுதியாக இருக்கிறீர்களா?" },
  deleteConfirmMsg: { en: "Do you really want to delete this? This process cannot be undone.", ta: "இதை நீக்க விரும்புகிறீர்களா? இச்செயலை மாற்ற இயலாது." },
  addNewOffer: { en: "Create New Offer", ta: "புதிய சலுகையைச் சேர்" },
  selectShop: { en: "-- Select Shop --", ta: "-- கடையைத் தேர்ந்தெடுக்கவும் --" },
  offerTitle: { en: "Offer Title", ta: "சலுகை தலைப்பு" },
  feeOptional: { en: "Fee (optional)", ta: "கட்டணம் (விருப்பமானது)" },
  percentageLimit: { en: "Percentage (0-100)", ta: "சதவீதம் (0-100)" },
  uploadOffer: { en: "Upload Offer", ta: "சலுகையைப் பதிவேற்று" },
  uploading: { en: "Uploading...", ta: "பதிவேற்றப்படுகிறது..." },
  mediaFileLabel: { en: "Media File (Image max 5MB, Video max 20MB)", ta: "ஊடகக் கோப்பு (படம் அதிகபட்சம் 5MB, வீடியோ அதிகபட்சம் 20MB)" },
  updateOffer: { en: "Update Offer", ta: "சலுகையைப் புதுப்பி" },
  replaceMedia: { en: "Replace Media (optional)", ta: "ஊடகத்தை மாற்றவும் (விருப்பமானது)" },
  enterTitle: { en: "Enter title", ta: "தலைப்பை உள்ளிடவும்" },
  selectShopErr: { en: "Select shop", ta: "கடையைத் தேர்ந்தெடுக்கவும்" },
  citySelectErr: { en: "Please select a city from the dropdown list.", ta: "பட்டியலிலிருந்து ஒரு நகரத்தைத் தேர்ந்தெடுக்கவும்." },
  back: { en: "Back", ta: "பின்செல்ல" },
  close: { en: "Close", ta: "மூடு" }
};

export default function Dashboard() {
  const navigate = useNavigate();

  // --- STATE ---
  const [shops, setShops] = useState([]);
  const [lang, setLang] = useState(localStorage.getItem("LANG") || "en");

  // Subscription Plan State
  const [planInfo, setPlanInfo] = useState(null);
  const [showSubAlert, setShowSubAlert] = useState(false);

  // Deletion States
  const [deletingId, setDeletingId] = useState(null);

  // Confirmation Dialog State
  const [confirmDialog, setConfirmDialog] = useState(null);

  // Suggestions
  const [categorySug, setCategorySug] = useState([]);
  const [citySug, setCitySug] = useState([]);
  const typingRef = useRef(null);

  // --- POPUP STATE ---
  const [popup, setPopup] = useState(null);

  // Helper to show Popup
  const showPopup = (type, message, title = "") => {
    setPopup({ type, message, title });
    setTimeout(() => setPopup(null), 3500);
  };

  // --- FORMS STATE ---
  const [showForm, setShowForm] = useState(false);
  const [editingShop, setEditingShop] = useState(null);
  const [saving, setSaving] = useState(false);
  const [citySelected, setCitySelected] = useState(false);
  const fileInputRef = useRef(null);
  const mainImageInputRef = useRef(null);

  const [form, setForm] = useState({
    shop_name: "", description: "", address: "", phone_number: "", email: "", landmark: "",
    category_list: "", city_id: "", city_name: "", district: "", pincode: "", state: "",
    keywords: "", shop_media: []
  });

  // Media State
  const [previewImg, setPreviewImg] = useState([]);
  const [existingPhotos, setExistingPhotos] = useState([]);

  // Main Image State
  const [mainImageFile, setMainImageFile] = useState(null);
  const [mainImagePreview, setMainImagePreview] = useState(null);
  const [existingMainImage, setExistingMainImage] = useState(null);

  // Offer Form (Add)
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [offerUploading, setOfferUploading] = useState(false);
  const [offerPreview, setOfferPreview] = useState(null);
  const [offerForm, setOfferForm] = useState({
    shop_id: "", title: "", fee: "", start_date: "", end_date: "",
    percentage: "", description: "", file: null
  });

  // Offer Form (Update)
  const [showUpdateOfferForm, setShowUpdateOfferForm] = useState(false);
  const [updateOfferSaving, setUpdateOfferSaving] = useState(false);
  const [updateOfferPreview, setUpdateOfferPreview] = useState(null);
  const [updateOfferForm, setUpdateOfferForm] = useState({
    offer_id: "", shop_id: "", title: "", fee: "", start_date: "", end_date: "",
    percentage: "", description: "", file: null
  });

  // --- GALLERY STATE ---
  const [gallery, setGallery] = useState({
    isOpen: false,
    mediaList: [],
    currentIndex: 0,
    shopName: ""
  });

  // --- EFFECTS ---
  useEffect(() => {
    const handleLangUpdate = () => setLang(localStorage.getItem("LANG") || "en");
    window.addEventListener("languageChange", handleLangUpdate);
    return () => window.removeEventListener("languageChange", handleLangUpdate);
  }, []);

  useEffect(() => {
    loadShops();
    fetchPlanStatus();
  }, [lang]);

  useEffect(() => {
    return () => {
      previewImg.forEach(p => URL.revokeObjectURL(p.url));
      if (offerPreview) URL.revokeObjectURL(offerPreview);
      if (updateOfferPreview) URL.revokeObjectURL(updateOfferPreview);
      if (mainImagePreview) URL.revokeObjectURL(mainImagePreview);
    };
  }, [previewImg, offerPreview, updateOfferPreview, mainImagePreview]);

  // --- API ---
  async function loadShops() {
    try {
      const res = await authenticatedFetch(`/myshop/?lang=${lang}`, {
        method: "GET",
        headers: { Accept: "application/json" }
      });
      const json = await res.json();
      if (json?.data) setShops(json.data);
      else showPopup("error", json?.message || "Failed to load shops", "Error");
    } catch (err) {
      console.warn("Load error:", err);
    }
  }

  async function fetchPlanStatus() {
    try {
      const res = await authenticatedFetch("/my-plan/", { method: "GET" });
      const json = await res.json();
      if (json?.status) setPlanInfo(json);
    } catch (e) { console.warn("Plan check failed", e); }
  }

  const checkLimit = (type) => {
    if (!planInfo) return false;
    if (!planInfo.subscribed) {
      setShowSubAlert(true);
      return false;
    }
    if (type === "shop") {
      if (planInfo.usage.shops_left <= 0) {
        showPopup("warning", `You have reached the shop limit for the ${planInfo.plan} plan.`, "Limit Reached");
        return false;
      }
    }
    if (type === "offer") {
      if (planInfo.usage.offers_left <= 0) {
        showPopup("warning", `You have reached the offer limit for the ${planInfo.plan} plan.`, "Limit Reached");
        return false;
      }
    }
    return true;
  };

  const fetchCategory = async (text) => {
    if (!text?.trim()) return setCategorySug([]);
    try {
      const res = await fetch(`${BACKEND_URL}/category/search/?category=${encodeURIComponent(text)}&lang=${lang}`);
      const json = await res.json();
      if (json?.status === "success") setCategorySug(json.data || []);
    } catch (e) {}
  };

  const fetchCity = async (text) => {
    if (!text?.trim()) return setCitySug([]);
    try {
      const res = await fetch(`${BACKEND_URL}/city/search/?city_name=${encodeURIComponent(text)}&lang=${lang}`);
      const json = await res.json();
      if (json?.status === "success") setCitySug(json.data || []);
    } catch (e) {}
  };

  // --- HANDLERS ---
  const handleInputChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const onCategoryTyping = (value) => {
    const last = value.split(",").pop().trim();
    handleInputChange("category_list", value);
    if (typingRef.current) clearTimeout(typingRef.current);
    typingRef.current = setTimeout(() => fetchCategory(last), 300);
  };

  const onCityTyping = (value) => {
    handleInputChange("city_name", value);
    handleInputChange("city_id", "");
    setCitySelected(false);
    if (typingRef.current) clearTimeout(typingRef.current);
    typingRef.current = setTimeout(() => fetchCity(value), 300);
  };

  const handleAddOpen = () => {
    if (!checkLimit("shop")) return;
    setEditingShop(null);
    setCitySelected(false);
    setForm({
      shop_name: "", description: "", address: "", phone_number: "", email: "", landmark: "",
      category_list: "", city_name: "", district: "", pincode: "", state: "", keywords: "", shop_media: []
    });
    setPreviewImg([]);
    setExistingPhotos([]);
    setMainImageFile(null);
    setMainImagePreview(null);
    setExistingMainImage(null);
    setShowForm(true);
  };

  const handleUpdateOpen = (item) => {
    setEditingShop(item.shop._id);
    setCitySelected(true);
    setForm({
      shop_name: item.shop.shop_name || "",
      description: item.shop.description || "",
      address: item.shop.address || "",
      phone_number: item.shop.phone_number || "",
      email: item.shop.email || "",
      landmark: item.shop.landmark || "",
      category_list: item.categories ? item.categories.map(c => c.name).join(", ") : "",
      city_name: item.city?.city_name || "",
      district: item.city?.district || "",
      pincode: item.city?.pincode || "",
      state: item.city?.state || "",
      keywords: Array.isArray(item.shop.keywords) ? item.shop.keywords.join(", ") : item.shop.keywords || "",
      shop_media: [],
    });
    setPreviewImg([]);
    setExistingPhotos(item.shop.media || []);
    setMainImageFile(null);
    setMainImagePreview(null);
    setExistingMainImage(item.shop.main_image || null);
    setShowForm(true);
  };

  const handleMainImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showPopup("warning", "Main Image must be a valid image file.", "Invalid File");
      if (mainImageInputRef.current) mainImageInputRef.current.value = "";
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      showPopup("warning", `Main Image too large: ${file.name} (Max 5MB)`, "File Size Error");
      if (mainImageInputRef.current) mainImageInputRef.current.value = "";
      return;
    }
    setMainImageFile(file);
    if (mainImagePreview) URL.revokeObjectURL(mainImagePreview);
    setMainImagePreview(URL.createObjectURL(file));
  };

  const removeMainImage = () => {
    setMainImageFile(null);
    if (mainImagePreview) URL.revokeObjectURL(mainImagePreview);
    setMainImagePreview(null);
    if (mainImageInputRef.current) mainImageInputRef.current.value = "";
  };

  const handleShopFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const newMedia = [];
    const newPreviews = [];

    for (const file of files) {
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");

      if (isImage) {
        if (file.size > MAX_IMAGE_BYTES) {
          showPopup("warning", `File too large: ${file.name} (Max 5MB)`, "Size Error");
          continue;
        }
        newMedia.push(file);
        newPreviews.push({ type: "image", url: URL.createObjectURL(file) });
      }
      else if (isVideo) {
        if (file.size > MAX_VIDEO_BYTES) {
          showPopup("warning", `File too large: ${file.name} (Max 20MB)`, "Size Error");
          continue;
        }
        newMedia.push(file);
        newPreviews.push({ type: "video", url: URL.createObjectURL(file) });
      }
      else {
        showPopup("error", `Invalid type: ${file.name}`, "Format Error");
      }
    }

    setForm(prev => ({ ...prev, shop_media: [...prev.shop_media, ...newMedia] }));
    setPreviewImg(prev => [...prev, ...newPreviews]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeNewPreview = (index) => {
    setForm(prev => {
      const m = [...prev.shop_media];
      m.splice(index, 1);
      return { ...prev, shop_media: m };
    });
    setPreviewImg(prev => {
      URL.revokeObjectURL(prev[index].url);
      const p = [...prev];
      p.splice(index, 1);
      return p;
    });
  };

  const submitShopForm = async () => {
    if (!form.city_id && !citySelected) return showPopup("error", TXT.citySelectErr[lang], "City Required");

    setSaving(true);
    const fd = new FormData();

    Object.keys(form).forEach(k => {
      if (k !== "shop_media") fd.append(k, form[k] || "");
    });

    if (mainImageFile) fd.append("main_image", mainImageFile);
    form.shop_media.forEach(f => fd.append("media", f));

    const url = editingShop
      ? `/shop/update/${editingShop}/?lang=${lang}`
      : `/shop/add/?lang=${lang}`;

    try {
      const res = await authenticatedFetch(url, { method: "POST", body: fd });
      const json = await res.json();
      if (json?.status === "success") {
        setShowForm(false);
        showPopup("success", editingShop ? "Shop updated successfully" : "Shop added successfully", "Success");
        await loadShops();
        await fetchPlanStatus();
      } else {
        showPopup("error", json?.message || "Operation failed", "Error");
      }
    } catch (e) {
      showPopup("error", "Server Error", "Network");
    } finally {
      setSaving(false);
    }
  };

  const initiateDelete = (type, id, extra = null) => {
      setConfirmDialog({ type, id, extra });
  };

  const deleteShop = async (id) => {
    setDeletingId(id);
    try {
      const res = await authenticatedFetch(`/shop/delete/${id}/?lang=${lang}`, { method: "DELETE" });
      const json = await res.json();
      if (json?.status === "success") {
         showPopup("success", "Shop deleted successfully", "Deleted");
         await loadShops();
         await fetchPlanStatus();
      } else showPopup("error", "Delete failed", "Error");
    } catch (e) { showPopup("error", "Server Error", "Network"); }
    finally { setDeletingId(null); }
  };

  const deleteExistingPhoto = async (path) => {
    const fd = new FormData();
    fd.append("delete_media", path);
    try {
      const res = await authenticatedFetch(`/shop/update/${editingShop}/?lang=${lang}`, { method: "POST", body: fd });
      const json = await res.json();
      if (json?.status === "success") {
        setExistingPhotos(prev => prev.filter(p => p.path !== path));
        showPopup("success", "Photo deleted", "Success");
        loadShops();
      } else {
        showPopup("error", json?.message || "Delete failed", "Error");
      }
    } catch (e) { showPopup("error", "Server Error", "Network"); }
  };

  const handleOfferFile = (file, isUpdate = false) => {
    if (!file) return;
    let valid = false;
    if (file.type.startsWith("image/") && file.size <= MAX_IMAGE_BYTES) valid = true;
    else if (file.type.startsWith("video/") && file.size <= MAX_VIDEO_BYTES) valid = true;

    if (!valid) return showPopup("warning", TXT.mediaFileLabel[lang], "Invalid File");

    const url = URL.createObjectURL(file);
    if (isUpdate) {
      if (updateOfferPreview) URL.revokeObjectURL(updateOfferPreview);
      setUpdateOfferForm(p => ({ ...p, file }));
      setUpdateOfferPreview(url);
    } else {
      if (offerPreview) URL.revokeObjectURL(offerPreview);
      setOfferForm(p => ({ ...p, file }));
      setOfferPreview(url);
    }
  };

  const submitOffer = async (isUpdate) => {
    const f = isUpdate ? updateOfferForm : offerForm;
    if (!f.shop_id && !isUpdate) return showPopup("warning", TXT.selectShopErr[lang], "Missing Field");
    if (!f.title || !f.start_date || !f.end_date) return showPopup("warning", TXT.enterTitle[lang], "Missing Field");
    if (!isUpdate && !f.file) return showPopup("warning", "File required", "Missing File");

    const fd = new FormData();
    if (isUpdate) {
      fd.append("offer_id", f.offer_id);
      fd.append("shop_id", f.shop_id);
      if (f.file) fd.append("file", f.file);
    } else {
      fd.append("target_shop_id", f.shop_id);
      fd.append("file", f.file);
    }

    fd.append("title", f.title);
    fd.append("fee", f.fee);
    fd.append("start_date", f.start_date);
    fd.append("end_date", f.end_date);
    fd.append("percentage", f.percentage);
    fd.append("description", f.description);

    const setter = isUpdate ? setUpdateOfferSaving : setOfferUploading;
    const url = isUpdate ? `/offer/update/?lang=${lang}` : `/offer/add/?lang=${lang}`;

    setter(true);
    try {
      const res = await authenticatedFetch(url, { method: "POST", body: fd });
      const json = await res.json();
      if (json?.status) {
        if (isUpdate) setShowUpdateOfferForm(false);
        else setShowOfferForm(false);
        showPopup("success", isUpdate ? "Offer updated!" : "Offer added!", "Success");
        await loadShops();
        await fetchPlanStatus();
      } else showPopup("error", json?.message || "Failed", "Error");
    } catch (e) { showPopup("error", "Server Error", "Network"); }
    finally { setter(false); }
  };

  const deleteOffer = async (id) => {
    try {
      const res = await authenticatedFetch(`/delete/offer/?offer_id=${id}&lang=${lang}`, { method: "DELETE" });
      const json = await res.json();
      if (json?.status === "success") {
          showPopup("success", "Offer deleted", "Deleted");
          await loadShops();
          await fetchPlanStatus();
      }
    } catch (e) { showPopup("error", "Server Error", "Network"); }
  };

  const openGallery = (mediaSource, index = 0) => {
    let mediaList = [];
    let shopName = "";
    if (mediaSource.shop_name && Array.isArray(mediaSource.media)) {
        mediaList = mediaSource.media;
        shopName = mediaSource.shop_name;
    } else if (mediaSource.media && Array.isArray(mediaSource.media)) {
         mediaList = mediaSource.media;
         shopName = mediaSource.shop_name || "Offer Media";
    }
    setGallery({ isOpen: true, mediaList: mediaList, currentIndex: index, shopName: shopName });
  };

  const nextSlide = (e) => {
    e.stopPropagation();
    setGallery(p => ({ ...p, currentIndex: (p.currentIndex + 1) % p.mediaList.length }));
  };

  const prevSlide = (e) => {
    e.stopPropagation();
    setGallery(p => ({ ...p, currentIndex: (p.currentIndex - 1 + p.mediaList.length) % p.mediaList.length }));
  };

  // --- MODERN STYLES ---
  const colors = {
    primary: "#4F46E5", // Indigo 600
    primaryDark: "#4338CA", // Indigo 700
    primaryLight: "#EEF2FF", // Indigo 50
    success: "#10B981", // Emerald 500
    danger: "#EF4444", // Red 500
    bg: "#F8FAFC", // Slate 50
    card: "#FFFFFF",
    text: "#0F172A", // Slate 900
    subtext: "#64748B", // Slate 500
    border: "#E2E8F0", // Slate 200
  };

  const s = {
    page: {
        backgroundColor: colors.bg,
        minHeight: "100vh",
        fontFamily: "'Inter', 'Noto Sans Tamil', sans-serif",
        color: colors.text,
        display: "flex",
        flexDirection: "column"
    },

    // NEW: Container specifically for the dashboard content, separate from navbar
    container: {
        width: "100%",
        maxWidth: "1280px", // Limits width on very large screens
        margin: "0 auto", // Centers content
        padding: "2rem",
        flex: 1
    },

    // Header Section
    headerContainer: {
        marginBottom: "2rem",
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem"
    },
    navRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
    },
    titleGroup: { display: "flex", alignItems: "center", gap: "10px" },
    title: {
        margin: 0,
        fontSize: "1.85rem",

        fontWeight: "800",
        color: "#1E293B",
        letterSpacing: "-0.5px"
    },

    // Stats / Plan Box
    planBox: {
        background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
        color: "white",
        padding: "1rem 1.5rem",
        borderRadius: "16px",
        display: "inline-flex",
        fontFamily: "'Inter', sans-serif,Noto Tamil",
        alignItems: "center",
        gap: "24px",
        boxShadow: "0 10px 15px -3px rgba(79, 70, 229, 0.3)",
        fontSize: "0.95rem"
    },
    statItem: { display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1.2 },
    statVal: { fontWeight: "700", fontSize: "1.2rem" },
    statLabel: { fontSize: "0.75rem", opacity: 0.9, textTransform: "uppercase", letterSpacing: "1px" },

    // Buttons
    btnGroup: { display: "flex", gap: "12px", fontFamily: "'Inter', 'Noto Sans Tamil', sans-serif", },
    btn: (variant = "primary", disabled = false) => ({
        padding: "0.75rem 1.25rem",
        backgroundColor: disabled ? "#CBD5E1" : variant === "primary" ? colors.primary : variant === "success" ? colors.success : variant === "danger" ? colors.danger : "white",
        color: variant === "outline" ? colors.text : "white",
        border: variant === "outline" ? `1px solid ${colors.border}` : "none",
        borderRadius: "10px",
        cursor: disabled ? "not-allowed" : "pointer",
        fontWeight: "600",
        fontFamily: "'Inter', 'Noto Sans Tamil', sans-serif",
        fontSize: "0.9rem",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        transition: "all 0.2s ease",
        boxShadow: variant !== "outline" ? "0 4px 6px -1px rgba(0,0,0,0.1)" : "none",
        opacity: disabled ? 0.7 : 1
    }),

    // Cards
    card: {
        backgroundColor: colors.card,
        borderRadius: "20px",
        padding: "0",
        marginBottom: "2rem",
        fontFamily: "'Inter', 'Noto Sans Tamil', sans-serif",
        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025)",
        border: `1px solid ${colors.border}`,
        overflow: "hidden",
        display: "grid",
        gridTemplateColumns: "350px 1fr",
        alignItems: "stretch"
    },
    cardLeft: {
        padding: "2rem",
        borderRight: `1px solid ${colors.border}`,
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem",
        backgroundColor: "#fff"
    },
    cardRight: {
        padding: "2rem",
        backgroundColor: "#FAFAFA",
        display: "flex",
        flexDirection: "column",
        gap: "2rem"
    },

    // Card Details
    shopTitle: { margin: 0, fontSize: "1.5rem", fontWeight: "700", color: "#1E293B", lineHeight: 1.2 },
    shopDesc: { color: colors.subtext, fontSize: "0.95rem", lineHeight: "1.6", margin: 0 },
    infoGrid: { display: "flex", flexDirection: "column", gap: "10px" },
    infoRow: { display: "flex", gap: "10px", fontSize: "0.9rem", alignItems: "baseline" },
    infoLabel: { fontWeight: "600", color: "#64748B", minWidth: "80px", textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "0.5px" },
    infoVal: { color: "#334155", fontWeight: "500", flex: 1 },

    tagContainer: { display: "flex", flexWrap: "wrap", gap: "6px" },
    tag: { backgroundColor: colors.primaryLight, color: colors.primary, padding: "4px 10px", borderRadius: "20px", fontSize: "0.8rem", fontWeight: "600" },

    // Main Image
    heroImgContainer: {
        width: "100%",
        height: "220px",
        borderRadius: "16px",
        overflow: "hidden",
        border: `1px solid ${colors.border}`,
        position: "relative",
        boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)"
    },
    heroImg: { width: "100%", height: "100%", objectFit: "cover" },

    // Gallery Grid
    gallerySection: { },
    sectionTitle: { fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "1px", color: "#94A3B8", fontWeight: "700", marginBottom: "12px" },
    mediaGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(70px, 1fr))", gap: "12px" },
    thumbBox: { aspectRatio: "1/1", borderRadius: "10px", overflow: "hidden", cursor: "pointer", position: "relative", border: "1px solid #E2E8F0", transition: "transform 0.2s" },
    moreThumb: { width: "100%", height: "100%", backgroundColor: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748B", fontWeight: "700", fontSize: "0.9rem" },

    // Offers
    offersRow: { display: "flex", gap: "16px", overflowX: "auto", paddingBottom: "10px" },
    offerCard: {
        minWidth: "160px",
        backgroundColor: "white",
        fontFamily: "'Inter', 'Noto Sans Tamil', sans-serif",
        borderRadius: "12px",
        border: `1px solid ${colors.border}`,
        padding: "10px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
    },
    offerMedia: { height: "90px", borderRadius: "8px", overflow: "hidden", marginBottom: "10px", position: "relative" },
    offerTitle: { fontWeight: "700", fontSize: "0.9rem", color: "#1E293B", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: "4px" },
    offerBadge: { display: "inline-block", backgroundColor: "#ECFDF5", color: "#059669", padding: "2px 8px", borderRadius: "4px", fontSize: "0.75rem", fontWeight: "700" },

    // Modal
    overlay: { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" },
    modal: { backgroundColor: "white", borderRadius: "24px", width: "100%", maxWidth: "700px", maxHeight: "85vh", overflowY: "auto", padding: "2.5rem", position: "relative", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" },
    modalTitle: { margin: "0 0 1.5rem 0", fontSize: "1.5rem", fontWeight: "700", color: "#1E293B" },

    // Inputs
    inputGroup: { marginBottom: "1.25rem" },
    inputLabel: { display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#475569", marginBottom: "6px",fontFamily: "'Inter', 'Noto Sans Tamil', sans-serif", },
    input: {
        width: "100%", padding: "0.85rem 1rem", borderRadius: "10px", border: `1px solid ${colors.border}`,
        fontSize: "0.95rem", backgroundColor: "#F8FAFC", color: "#1E293B", transition: "border-color 0.2s", outline: "none"
    },

    // Popup
    popupToast: (type) => ({
        position: "fixed", top: "24px", right: "24px", zIndex: 100000,
        backgroundColor: "white", borderRadius: "16px", padding: "16px 20px",
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
        display: "flex", alignItems: "center", gap: "16px", borderLeft: `6px solid ${type === 'success' ? colors.success : type === 'error' ? colors.danger : "#F59E0B"}`,
        minWidth: "300px"
    }),

    // Full Screen Gallery
    galleryOverlay: { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "#000", zIndex: 10000, display: "flex", flexDirection: "column" },
    galleryMain: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" },
    galleryImg: { maxHeight: "85vh", maxWidth: "90vw", objectFit: "contain", boxShadow: "0 0 50px rgba(0,0,0,0.5)" },
    galleryStrip: { height: "80px", display: "flex", gap: "10px", padding: "10px", justifyContent: "center", background: "#111" }
  };

  const shopsLeft = planInfo?.usage?.shops_left ?? 0;
  const offersLeft = planInfo?.usage?.offers_left ?? 0;
  const isShopLimitReached = shopsLeft <= 0;
  const isOfferLimitReached = offersLeft <= 0;

  return (
    <div style={s.page}>
        <style>{`
            ::placeholder { color: #94A3B8; }
            input:focus, textarea:focus, select:focus { border-color: ${colors.primary} !important; background-color: white !important; box-shadow: 0 0 0 3px ${colors.primaryLight} !important; }
            ::-webkit-scrollbar { width: 8px; height: 8px; }
            ::-webkit-scrollbar-thumb { background: #CBD5E1; borderRadius: 4px; }
            ::-webkit-scrollbar-track { background: transparent; }
        `}</style>

      {/* NAVBAR: Moved outside the padded container to stay full width */}
      <Navbar />

      <div style={s.container}>
        <div style={s.headerContainer}>
            {/* TOP ROW: Title & Buttons */}
            <div style={s.navRow}>
                <div style={s.titleGroup}>
                    <Icon icon="shop" size={32} color={colors.primary} />
                    <h2 style={s.title}>{TXT.dashboard[lang]}</h2>
                </div>

                <div style={s.btnGroup}>
                    {planInfo && planInfo.subscribed && (
                        <div style={s.planBox}>
                            <div style={s.statItem}>
                                <span style={s.statVal}>{shopsLeft}</span>
                                <span style={s.statLabel}>Shops LEFT</span>
                            </div>
                            <div style={{width: 1, height: 20, background: "rgba(255,255,255,0.2)"}}></div>
                            <div style={s.statItem}>
                                <span style={s.statVal}>{offersLeft}</span>
                                <span style={s.statLabel}>Offers LEFT</span>
                            </div>
                            <div style={{background: "rgba(255,255,255,0.2)", padding: "4px 8px", borderRadius: "6px", fontSize: "0.75rem", textTransform: "uppercase"}}>
                                {planInfo.plan} Plan
                            </div>
                        </div>
                    )}
                    <button style={s.btn("outline")} onClick={() => navigate(-1)}>
                    <Icon icon="arrow-left" /> {TXT.back[lang]}
                    </button>
                    <button style={s.btn("primary",)} onClick={() => navigate("/my-jobs")}>
                        <Icon icon="briefcase" /> {TXT.myJobs ? TXT.myJobs[lang] : "My Jobs"}
                    </button>
                    <button
                        style={s.btn("success", isShopLimitReached)}
                        onClick={() => handleAddOpen()}
                        title={isShopLimitReached ? "Plan limit reached" : ""}
                    >
                        <Icon icon="plus" color="white" /> {TXT.addShop[lang]}
                    </button>
                    <button
                        style={s.btn("primary", isOfferLimitReached)}
                        onClick={() => { if (checkLimit("offer")) { setOfferForm({ shop_id: "", file: null }); setShowOfferForm(true); } }}
                        title={isOfferLimitReached ? "Plan limit reached" : ""}
                    >
                        <Icon icon="tag" color="white" /> {TXT.addOffer[lang]}
                    </button>
                </div>
            </div>
        </div>

        <motion.div variants={containerVariants} initial="hidden" animate="visible">
            {shops.length === 0 ? (
            <div style={{textAlign: "center", color: colors.subtext, padding: "5rem", background: "white", borderRadius: "20px", border: "1px dashed #CBD5E1"}}>
                <Icon icon="shop" size={48} color="#CBD5E1" style={{marginBottom: "1rem"}}/>
                <h3>{TXT.noShops[lang]}</h3>
            </div>
            ) : (
            shops.map((item, idx) => (
                <motion.div key={idx} variants={itemVariants} style={s.card}>

                {/* LEFT SIDE: DETAILS */}
                <div style={s.cardLeft}>
                    <div>
                        <div style={{display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "1rem"}}>
                            <h3 style={s.shopTitle}>{item.shop.shop_name}</h3>
                            <div style={{display: "flex", gap: "8px"}}>
                                <button onClick={() => handleUpdateOpen(item)} style={{...s.btn("outline"), padding: "6px 10px", fontSize: "0.8rem"}}>
                                    <Icon icon="edit" />
                                </button>
                                <button onClick={() => initiateDelete('shop', item.shop._id)} disabled={deletingId === item.shop._id} style={{...s.btn("danger"), padding: "6px 10px", fontSize: "0.8rem"}}>
                                    <Icon icon="trash" color="white" />
                                </button>
                            </div>
                        </div>
                        <p style={s.shopDesc}>{item.shop.description || "No description provided."}</p>
                    </div>

                    <div style={{width: "100%", height: "1px", backgroundColor: colors.border}}></div>

                    <div style={s.infoGrid}>
                        <div style={s.infoRow}><span style={s.infoLabel}>{TXT.address[lang]}</span><span style={s.infoVal}>{item.shop.address}</span></div>
                        <div style={s.infoRow}><span style={s.infoLabel}>{TXT.phone[lang]}</span><span style={s.infoVal}>{item.shop.phone_number}</span></div>
                        <div style={s.infoRow}><span style={s.infoLabel}>{TXT.email[lang]}</span><span style={s.infoVal}>{item.shop.email}</span></div>
                        <div style={{...s.infoRow, alignItems: "center"}}>
                            <span style={s.infoLabel}>{TXT.keywords[lang]}</span>
                            <div style={s.tagContainer}>
                                {Array.isArray(item.shop.keywords)
                                    ? item.shop.keywords.map((k, i) => k && <span key={i} style={s.tag}>{k}</span>)
                                    : item.shop.keywords && <span style={s.tag}>{item.shop.keywords}</span>
                                }
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT SIDE: VISUALS */}
                <div style={s.cardRight}>

                    {/* Hero Image */}
                    {item.shop.main_image && (
                    <div style={s.heroImgContainer}>
                        <img src={mediaUrl(item.shop.main_image)} style={s.heroImg} alt="Main" />
                    </div>
                    )}

                    {/* Media Gallery */}
                    {item.shop.media?.length > 0 && (
                        <div style={s.gallerySection}>
                            <div style={s.sectionTitle}>{TXT.media[lang]}</div>
                            <div style={s.mediaGrid}>
                                {item.shop.media.slice(0, 4).map((m, i) => (
                                    <div key={i} onClick={() => openGallery(item.shop, i)} style={s.thumbBox}>
                                        {m.type === "video" ? (
                                            <video src={mediaUrl(m.path)} style={{width: "100%", height: "100%", objectFit: "cover"}} muted />
                                        ) : (
                                            <img src={mediaUrl(m.path)} style={{width: "100%", height: "100%", objectFit: "cover"}} alt="Thumb" />
                                        )}
                                        {m.type === "video" && <div style={{position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.3)"}}><Icon icon="play" color="white" /></div>}
                                    </div>
                                ))}
                                {item.shop.media.length > 4 && (
                                    <div style={s.thumbBox} onClick={() => openGallery(item.shop, 4)}>
                                        <div style={s.moreThumb}>+{item.shop.media.length - 4}</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Offers */}
                    {item.offers?.length > 0 && (
                        <div style={s.gallerySection}>
                            <div style={s.sectionTitle}>{TXT.offers[lang]}</div>
                            <div style={s.offersRow}>
                                {item.offers.map((off, i) => (
                                    <div key={i} style={s.offerCard}>
                                        <div onClick={() => openGallery({ shop_name: off.title, media: [{type: off.media_type, path: off.media_path}] }, 0)} style={{cursor: "pointer"}}>
                                            <div style={s.offerMedia}>
                                                {off.media_type === "video" ? (
                                                    <video src={mediaUrl(off.media_path)} style={{width: "100%", height: "100%", objectFit: "cover"}} muted />
                                                ) : (
                                                    <img src={mediaUrl(off.media_path)} style={{width: "100%", height: "100%", objectFit: "cover"}} alt="Offer" />
                                                )}
                                            </div>
                                        </div>
                                        <div style={s.offerTitle} title={off.title}>{off.title}</div>
                                        <div style={s.offerBadge}>{off.percentage}% {TXT.off[lang]}</div>
                                        <div style={{display: "flex", gap: "6px", marginTop: "10px"}}>
                                            <button style={{...s.btn("primary"), padding: "4px", flex: 1, justifyContent: "center", fontSize: "0.75rem"}} onClick={() => {
                                                setUpdateOfferForm({
                                                    offer_id: off.offer_id, shop_id: item.shop._id,
                                                    title: off.title, fee: off.fee, start_date: off.start_date,
                                                    end_date: off.end_date, percentage: off.percentage, description: off.description, file: null
                                                });
                                                setUpdateOfferPreview(mediaUrl(off.media_path));
                                                setShowUpdateOfferForm(true);
                                            }}>{TXT.edit[lang]}</button>
                                            <button style={{...s.btn("danger"), padding: "4px 8px"}} onClick={() => initiateDelete('offer', off.offer_id)}>
                                                <Icon icon="cross" color="white" size={12}/>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </div>
                </motion.div>
            ))
            )}
        </motion.div>
      </div>

      {/* --- ADD/EDIT SHOP MODAL --- */}
      <AnimatePresence>
        {showForm && (
            <div style={s.overlay}>
            <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit" style={s.modal}>
                <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem"}}>
                    <h3 style={s.modalTitle}>{editingShop ? TXT.updateShopDetails[lang] : TXT.addNewShop[lang]}</h3>
                    <button style={{background: "none", border: "none", cursor: "pointer"}} onClick={() => setShowForm(false)}><Icon icon="cross" size={20} /></button>
                </div>

                <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem"}}>
                    <div style={s.inputGroup}>
                        <label style={s.inputLabel}>{TXT.shopName[lang]}</label>
                        <input style={s.input} value={form.shop_name} onChange={e => handleInputChange("shop_name", e.target.value)} />
                    </div>
                    <div style={{...s.inputGroup, position: "relative"}}>
                        <label style={s.inputLabel}>{TXT.cityName[lang]}</label>
                        <input style={{...s.input, borderColor: (!citySelected && form.city_name) ? colors.danger : colors.border}} value={form.city_name} onChange={e => onCityTyping(e.target.value)} />
                        {citySug.length > 0 && (
                            <div style={{position: "absolute", top: "100%", width: "100%", background: "white", borderRadius: "10px", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", zIndex: 50, maxHeight: "150px", overflowY: "auto", border: "1px solid #E2E8F0"}}>
                                {citySug.map(c => (
                                <div key={c._id} style={{padding: "10px", cursor: "pointer", borderBottom: "1px solid #eee", fontSize: "0.9rem"}} onClick={() => {
                                    handleInputChange("city_id", c._id); handleInputChange("city_name", c.city_name);
                                    handleInputChange("district", c.district); handleInputChange("pincode", c.pincode);
                                    handleInputChange("state", c.state); setCitySelected(true); setCitySug([]);
                                }}>
                                    <strong>{c.city_name}</strong> - {c.pincode} <span style={{color: colors.subtext}}>({c.district})</span>
                                </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem"}}>
                    <div style={s.inputGroup}><label style={s.inputLabel}>{TXT.district[lang]}</label><input style={s.input} value={form.district} onChange={e => handleInputChange("district", e.target.value)} /></div>
                    <div style={s.inputGroup}><label style={s.inputLabel}>{TXT.pincode[lang]}</label><input style={s.input} value={form.pincode} onChange={e => handleInputChange("pincode", e.target.value)} /></div>
                </div>
                <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem"}}>
                    <div style={s.inputGroup}><label style={s.inputLabel}>{TXT.state[lang]}</label><input style={s.input} value={form.state} onChange={e => handleInputChange("state", e.target.value)} /></div>
                    <div style={s.inputGroup}><label style={s.inputLabel}>{TXT.landmark[lang]}</label><input style={s.input} value={form.landmark} onChange={e => handleInputChange("landmark", e.target.value)} /></div>
                </div>
                <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem"}}>
                    <div style={s.inputGroup}><label style={s.inputLabel}>{TXT.phone[lang]}</label><input style={s.input} value={form.phone_number} onChange={e => handleInputChange("phone_number", e.target.value)} /></div>
                    <div style={s.inputGroup}><label style={s.inputLabel}>{TXT.email[lang]}</label><input style={s.input} value={form.email} onChange={e => handleInputChange("email", e.target.value)} /></div>
                </div>

                <div style={s.inputGroup}><label style={s.inputLabel}>{TXT.address[lang]}</label><input style={s.input} value={form.address} onChange={e => handleInputChange("address", e.target.value)} /></div>
                <div style={s.inputGroup}><label style={s.inputLabel}>{TXT.description[lang]}</label><textarea style={{...s.input, minHeight: "80px", fontFamily: "inherit"}} value={form.description} onChange={e => handleInputChange("description", e.target.value)} /></div>

                <div style={{...s.inputGroup, position: "relative"}}>
                     <label style={s.inputLabel}>{TXT.categoryList[lang]}</label>
                     <input style={s.input} value={form.category_list} onChange={e => onCategoryTyping(e.target.value)} />
                     {categorySug.length > 0 && (
                        <div style={{position: "absolute", top: "100%", width: "100%", background: "white", borderRadius: "10px", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", zIndex: 50, maxHeight: "150px", overflowY: "auto", border: "1px solid #E2E8F0"}}>
                            {categorySug.map(c => (
                            <div key={c._id} style={{padding: "10px", cursor: "pointer", borderBottom: "1px solid #eee", fontSize: "0.9rem"}} onClick={() => {
                                const parts = form.category_list.split(","); parts[parts.length - 1] = c.name;
                                handleInputChange("category_list", parts.join(",") + ", "); setCategorySug([]);
                            }}>{c.name}</div>
                            ))}
                        </div>
                    )}
                </div>

                <div style={s.inputGroup}><label style={s.inputLabel}>{TXT.keywordsPlaceholder[lang]}</label><input style={s.input} value={form.keywords} onChange={e => handleInputChange("keywords", e.target.value)} /></div>

                {/* IMAGES SECTION */}
                <div style={{background: "#F1F5F9", padding: "1.5rem", borderRadius: "12px", marginTop: "1rem"}}>
                    <div style={{marginBottom: "1.5rem"}}>
                        <label style={s.inputLabel}>Main Image <span style={{fontWeight: 400, opacity: 0.7}}>({TXT.uploadHintAdd[lang]})</span></label>
                        <input type="file" ref={mainImageInputRef} accept="image/*" onChange={handleMainImageSelect} style={{fontSize: "0.9rem"}} />
                        {(mainImagePreview || existingMainImage) && (
                            <div style={{marginTop: "10px", width: "120px", height: "120px", position: "relative"}}>
                                <img src={mainImagePreview || mediaUrl(existingMainImage)} style={{width: "100%", height: "100%", objectFit: "cover", borderRadius: "8px", border: "2px solid white", boxShadow: "0 4px 6px rgba(0,0,0,0.1)"}} alt="" />
                                {mainImagePreview && <button onClick={removeMainImage} style={{position: "absolute", top: -8, right: -8, background: colors.danger, color: "white", border: "2px solid white", borderRadius: "50%", width: "24px", height: "24px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"}}>×</button>}
                            </div>
                        )}
                    </div>

                    <div>
                        <label style={s.inputLabel}>{TXT.uploadPhotosLabel[lang]} <span style={{fontWeight: 400, opacity: 0.7}}>({TXT.uploadHint[lang]})</span></label>
                        <input type="file" ref={fileInputRef} accept="image/*,video/*" multiple onChange={handleShopFileSelect} style={{fontSize: "0.9rem"}} />

                        <div style={{display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "15px"}}>
                            {existingPhotos.map((p, i) => (
                                <div key={`exist-${i}`} style={{position: "relative", width: 80, height: 80}}>
                                    {p.type === "video" ? <video src={mediaUrl(p.path)} style={{width: "100%", height: "100%", objectFit: "cover", borderRadius: 8}} /> : <img src={mediaUrl(p.path)} style={{width: "100%", height: "100%", objectFit: "cover", borderRadius: 8}} alt="" />}
                                    <button onClick={() => initiateDelete('photo', null, p.path)} style={{position: "absolute", top: -6, right: -6, background: colors.danger, color: "white", borderRadius: "50%", width: 20, height: 20, border: "2px solid white", cursor: "pointer", fontSize: "12px", display: "flex", alignItems: "center", justifyContent: "center"}}>×</button>
                                </div>
                            ))}
                            {previewImg.map((p, i) => (
                                <div key={`new-${i}`} style={{position: "relative", width: 80, height: 80}}>
                                    {p.type === "video" ? <video src={p.url} style={{width: "100%", height: "100%", objectFit: "cover", borderRadius: 8, border: `2px solid ${colors.primary}`}} /> : <img src={p.url} style={{width: "100%", height: "100%", objectFit: "cover", borderRadius: 8, border: `2px solid ${colors.primary}`}} alt="" />}
                                    <button onClick={() => removeNewPreview(i)} style={{position: "absolute", top: -6, right: -6, background: colors.danger, color: "white", borderRadius: "50%", width: 20, height: 20, border: "2px solid white", cursor: "pointer", fontSize: "12px", display: "flex", alignItems: "center", justifyContent: "center"}}>×</button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div style={{display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "2rem", paddingTop: "1rem", borderTop: `1px solid ${colors.border}`}}>
                    <button style={s.btn("outline")} onClick={() => setShowForm(false)}>{TXT.cancel[lang]}</button>
                    <button style={s.btn("success")} onClick={submitShopForm} disabled={saving}>{saving ? TXT.saving[lang] : TXT.save[lang]}</button>
                </div>
            </motion.div>
            </div>
        )}
      </AnimatePresence>

      {/* --- ADD/UPDATE OFFER MODAL --- */}
      <AnimatePresence>
        {(showOfferForm || showUpdateOfferForm) && (
            <div style={s.overlay}>
                <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit" style={{...s.modal, maxWidth: "500px"}}>
                     <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem"}}>
                        <h3 style={s.modalTitle}>{showUpdateOfferForm ? TXT.updateOffer[lang] : TXT.addNewOffer[lang]}</h3>
                        <button style={{background: "none", border: "none", cursor: "pointer"}} onClick={() => showUpdateOfferForm ? setShowUpdateOfferForm(false) : setShowOfferForm(false)}><Icon icon="cross" size={20} /></button>
                    </div>

                    {showOfferForm && (
                        <div style={s.inputGroup}>
                            <label style={s.inputLabel}>{TXT.selectShop[lang]}</label>
                            <select style={s.input} value={offerForm.shop_id} onChange={e => setOfferForm(prev => ({...prev, shop_id: e.target.value}))}>
                                <option value="">Select...</option>
                                {shops.map(s => <option key={s.shop._id} value={s.shop._id}>{s.shop.shop_name}</option>)}
                            </select>
                        </div>
                    )}

                    <div style={s.inputGroup}>
                        <label style={s.inputLabel}>{TXT.offerTitle[lang]}</label>
                        <input style={s.input} value={showUpdateOfferForm ? updateOfferForm.title : offerForm.title} onChange={e => showUpdateOfferForm ? setUpdateOfferForm(p => ({...p, title: e.target.value})) : setOfferForm(p => ({...p, title: e.target.value}))} />
                    </div>

                    <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem"}}>
                        <div style={s.inputGroup}>
                            <label style={s.inputLabel}>{TXT.feeOptional[lang]}</label>
                            <input style={s.input} value={showUpdateOfferForm ? updateOfferForm.fee : offerForm.fee} onChange={e => showUpdateOfferForm ? setUpdateOfferForm(p => ({...p, fee: e.target.value})) : setOfferForm(p => ({...p, fee: e.target.value}))} />
                        </div>
                        <div style={s.inputGroup}>
                            <label style={s.inputLabel}>{TXT.percentageLimit[lang]}</label>
                            <input style={s.input} value={showUpdateOfferForm ? updateOfferForm.percentage : offerForm.percentage} onChange={e => showUpdateOfferForm ? setUpdateOfferForm(p => ({...p, percentage: e.target.value})) : setOfferForm(p => ({...p, percentage: e.target.value}))} />
                        </div>
                    </div>

                    <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem"}}>
                         <div style={s.inputGroup}>
                            <label style={s.inputLabel}>Start Date</label>
                            <input type="date" style={s.input} value={showUpdateOfferForm ? updateOfferForm.start_date : offerForm.start_date} onChange={e => showUpdateOfferForm ? setUpdateOfferForm(p => ({...p, start_date: e.target.value})) : setOfferForm(p => ({...p, start_date: e.target.value}))} />
                        </div>
                         <div style={s.inputGroup}>
                            <label style={s.inputLabel}>End Date</label>
                            <input type="date" style={s.input} value={showUpdateOfferForm ? updateOfferForm.end_date : offerForm.end_date} onChange={e => showUpdateOfferForm ? setUpdateOfferForm(p => ({...p, end_date: e.target.value})) : setOfferForm(p => ({...p, end_date: e.target.value}))} />
                        </div>
                    </div>

                    <div style={s.inputGroup}>
                         <label style={s.inputLabel}>{TXT.description[lang]}</label>
                         <textarea style={{...s.input, minHeight: "80px"}} value={showUpdateOfferForm ? updateOfferForm.description : offerForm.description} onChange={e => showUpdateOfferForm ? setUpdateOfferForm(p => ({...p, description: e.target.value})) : setOfferForm(p => ({...p, description: e.target.value}))} />
                    </div>

                    <div style={{background: "#F1F5F9", padding: "1rem", borderRadius: "10px", marginBottom: "1.5rem"}}>
                         <label style={s.inputLabel}>{TXT.mediaFileLabel[lang]}</label>
                         <input type="file" accept="image/*,video/*" onChange={e => handleOfferFile(e.target.files[0], showUpdateOfferForm)} style={{fontSize: "0.9rem"}} />
                         {(showUpdateOfferForm ? updateOfferPreview : offerPreview) && (
                            <div style={{marginTop: "10px", height: "100px", borderRadius: "8px", overflow: "hidden", border: "1px solid #ddd", display: "inline-block"}}>
                                {(showUpdateOfferForm ? updateOfferPreview : offerPreview)?.endsWith(".mp4") || (showUpdateOfferForm ? updateOfferForm.file : offerForm.file)?.type?.startsWith("video/") ? (
                                    <video src={showUpdateOfferForm ? updateOfferPreview : offerPreview} style={{height: "100%"}} autoPlay loop muted />
                                ) : (
                                    <img src={showUpdateOfferForm ? updateOfferPreview : offerPreview} style={{height: "100%"}} alt="" />
                                )}
                            </div>
                         )}
                    </div>

                    <button style={{...s.btn("primary"), width: "100%", justifyContent: "center", padding: "1rem"}} onClick={() => submitOffer(showUpdateOfferForm)} disabled={showUpdateOfferForm ? updateOfferSaving : offerUploading}>
                        {showUpdateOfferForm ? (updateOfferSaving ? TXT.saving[lang] : TXT.updateOffer[lang]) : (offerUploading ? TXT.uploading[lang] : TXT.uploadOffer[lang])}
                    </button>

                </motion.div>
            </div>
        )}
      </AnimatePresence>

      {/* --- CONFIRM DIALOG --- */}
      <AnimatePresence>
      {confirmDialog && (
          <div style={s.overlay}>
              <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit" style={{...s.modal, maxWidth: "400px", textAlign: "center", padding: "2.5rem"}}>
                  <div style={{color: colors.danger, marginBottom: "1.5rem", background: "#FEF2F2", padding: "1rem", borderRadius: "50%", display: "inline-flex"}}>
                      <Icon icon="trash" size={36} />
                  </div>
                  <h3 style={{marginTop: 0, marginBottom: "10px", color: "#1E293B"}}>{TXT.deleteConfirmTitle[lang]}</h3>
                  <p style={{color: colors.subtext, marginBottom: "2rem", lineHeight: "1.6"}}>
                     {TXT.deleteConfirmMsg[lang]}
                  </p>

                  <div style={{display: "flex", gap: "10px", justifyContent: "center"}}>
                      <button style={s.btn("outline")} onClick={() => setConfirmDialog(null)}>
                         {TXT.cancel[lang]}
                      </button>
                      <button style={s.btn("danger")} onClick={() => {
                             if (confirmDialog.type === 'shop') deleteShop(confirmDialog.id);
                             if (confirmDialog.type === 'offer') deleteOffer(confirmDialog.id);
                             if (confirmDialog.type === 'photo') deleteExistingPhoto(confirmDialog.extra);
                             setConfirmDialog(null);
                        }}>
                        {TXT.delete[lang]}
                      </button>
                  </div>
              </motion.div>
          </div>
      )}
      </AnimatePresence>

       {/* --- SUBSCRIPTION ALERT MODAL --- */}
       {showSubAlert && (
        <div style={s.overlay}>
            <div style={{...s.modal, maxWidth: "400px", textAlign: "center", padding: "2rem"}}>
            <div style={{marginBottom: "1rem", color: colors.primary}}>
                <Icon icon="diamond" size={48} />
            </div>
            <h3 style={{margin: "0 0 10px 0", color: "#111827"}}>Upgrade Required</h3>
            <p style={{color: colors.subtext, marginBottom: "2rem", lineHeight: "1.5"}}>
                {lang === "ta" ? "தொடர உங்களுக்கு செயலில் உள்ள சந்தா தேவை." : "You need an active subscription to continue."}
            </p>
            <div style={{display: "flex", gap: "10px", justifyContent: "center"}}>
                <button style={s.btn("outline")} onClick={() => setShowSubAlert(false)}>{TXT.cancel[lang]}</button>
                <button style={s.btn("primary")} onClick={() => { setShowSubAlert(false); navigate("/plan"); }}>{lang === "ta" ? "திட்டங்களைப் பார்" : "View Plans"}</button>
            </div>
            </div>
        </div>
        )}

      {/* --- FULL SCREEN GALLERY --- */}
      {gallery.isOpen && (
        <div style={s.galleryOverlay} onClick={() => setGallery({ ...gallery, isOpen: false })}>
           <div style={{padding: "1.5rem", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center", background: "linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)"}}>
             <h3 style={{margin:0, fontSize: "1.2rem"}}>{gallery.shopName}</h3>
             <button style={{background: "none", border: "none", color: "white", cursor: "pointer"}} onClick={() => setGallery({ ...gallery, isOpen: false })}><Icon icon="cross" size={30}/></button>
           </div>

           <div style={s.galleryMain} onClick={e => e.stopPropagation()}>
             {gallery.mediaList.length > 0 && (
               <>
                 <button style={{position: "absolute", left: "20px", background: "rgba(255,255,255,0.1)", color: "white", border: "none", padding: "1rem", borderRadius: "50%", cursor: "pointer", backdropFilter: "blur(4px)"}} onClick={prevSlide}><Icon icon="chevron-left" size={30}/></button>
                 {gallery.mediaList[gallery.currentIndex].type === "video" ? (
                   <video controls autoPlay src={mediaUrl(gallery.mediaList[gallery.currentIndex].path)} style={s.galleryImg} />
                 ) : (
                   <img src={mediaUrl(gallery.mediaList[gallery.currentIndex].path)} style={s.galleryImg} alt="" />
                 )}
                 <button style={{position: "absolute", right: "20px", background: "rgba(255,255,255,0.1)", color: "white", border: "none", padding: "1rem", borderRadius: "50%", cursor: "pointer", backdropFilter: "blur(4px)"}} onClick={nextSlide}><Icon icon="chevron-right" size={30}/></button>
               </>
             )}
           </div>

           <div style={s.galleryStrip} onClick={e => e.stopPropagation()}>
             {gallery.mediaList.map((m, i) => (
                 <div key={i} onClick={() => setGallery(p => ({...p, currentIndex: i}))} style={{height: "100%", opacity: i === gallery.currentIndex ? 1 : 0.4, transition: "opacity 0.2s", cursor: "pointer", border: i === gallery.currentIndex ? `2px solid ${colors.primary}` : "none"}}>
                    {m.type === "video" ? <video src={mediaUrl(m.path)} style={{height: "100%"}} muted /> : <img src={mediaUrl(m.path)} style={{height: "100%"}} alt="" />}
                 </div>
             ))}
           </div>
        </div>
      )}

      {/* --- POPUP TOAST --- */}
      <AnimatePresence>
        {popup && (
            <motion.div variants={popupVariants} initial="initial" animate="animate" exit="exit" style={s.popupToast(popup.type)}>
                <div style={{color: popup.type === 'success' ? colors.success : popup.type === 'error' ? colors.danger : "#F59E0B"}}>
                    <Icon icon={popup.type === 'success' ? 'tick-circle' : popup.type === 'error' ? 'error' : 'warning-sign'} iconSize={28} />
                </div>
                <div>
                    {popup.title && <h5 style={{margin: "0 0 4px 0", fontSize: "1rem", color: "#1E293B"}}>{popup.title}</h5>}
                    <p style={{margin: 0, fontSize: "0.9rem", color: "#64748B"}}>{popup.message}</p>
                </div>
                <div onClick={() => setPopup(null)} style={{cursor: "pointer", marginLeft: "auto", color: "#94A3B8"}}><Icon icon="cross" size={16} /></div>
            </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}