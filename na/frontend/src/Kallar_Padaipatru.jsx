import React, { useState } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import {
  User, MapPin, Briefcase, Phone, Mail,
  Languages, CheckCircle2, ArrowRight, Home, HeartHandshake,
  GraduationCap, Users, Image as ImageIcon
} from "lucide-react";
import logo from "./Logo_for_kallarpadaipatru.jpg";

export default function Kallarpadaipatru() {
  const [lang, setLang] = useState("ta");
  const [formData, setFormData] = useState({
    name: "",
    pattapaiyar: "",
    native_place: "",
    marital_status: "",
    Educational_qualification: "",
    address: "",
    work: "",
    contact_number: "",
    email: "",
    children_count: "",
    photo: null,
  });

  const [photoPreview, setPhotoPreview] = useState(null);
  const [message, setMessage] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const API_BASE = import.meta.env.VITE_BACKEND_URL;
  // Translation Dictionary
  const translations = {
    ta: {
      titleMain: "தமிழ்நாடு கள்ளர் படைப்பற்று",
      titleSub: "நலச்சங்கம்",
      subtitle: "உறுப்பினர் சேர்க்கை",
      langBtn: "English",
      labels: {
        name: "முழு பெயர்",
        pattapaiyar: "பட்டப்பெயர்",
        native_place: "பூர்வீகம்",
        address: "முழு முகவரி",
        marital_status: "திருமண நிலை",
        Educational_qualification: "கல்வித் தகுதி",
        children_count: "குழந்தைகளின் எண்ணிக்கை",
        photo: "புகைப்படம் (5MB வரை)",
        work: "தொழில்",
        contact_number: "தொலைபேசி எண்",
        email: "மின்னஞ்சல்",
      },
      placeholders: {
        selectMarital: "-- நிலையைத் தேர்ந்தெடுக்கவும் --",
      },
      maritalOptions: [
        { label: "திருமணமாகாதவர்", value: "unmarried" },
        { label: "திருமணமானவர்", value: "married" },
        { label: "விதவை", value: "widowed" },
        { label: "விவாகரத்து", value: "divorced" },
        { label: "மீண்டும் திருமணம் தயாராக", value: "ready_for_next_marriage" },
      ],
      workOptions: [
        { label: "வியாபாரம்", value: "Business" },
        { label: "விவசாயம்", value: "vivasayam" },
        { label: "வேலை", value: "veylai" },
        { label: "மற்றவை", value: "ethara" },
      ],
      buttons: {
        submit: "சமர்ப்பிக்கவும்",
        submitting: "சமர்ப்பிக்கப்படுகிறது...",
        newReg: "புதிய பதிவு",
      },
      success: {
        title: "நன்றி!",
        message: "உங்கள் விவரங்கள் வெற்றிகரமாக சமர்ப்பிக்கப்பட்டன.",
      },
      errors: {
        submitFailed: "சமர்ப்பிப்பு தோல்வியடைந்தது. மீண்டும் முயற்சிக்கவும்.",
        photoSize: "புகைப்படம் 5MB க்கும் குறைவாக இருக்க வேண்டும்.",
        phoneInvalid: "சரியான 10 இலக்க தொலைபேசி எண்ணை உள்ளிடவும்.",
        emailInvalid: "சரியான மின்னஞ்சலை உள்ளிடவும்.",
        missingPhoto: "புகைப்படம் கட்டாயம் பதிவேற்ற வேண்டும்.",
        missingChildrenCount: "திருமணமானவர்கள் குழந்தைகளின் எண்ணிக்கையை கட்டாயம் உள்ளிட வேண்டும்."
      },
    },
    en: {
      titleMain: "தமிழ்நாடு கள்ளர் படைப்பற்று",
      titleSub: "நலச்சங்கம்",
      subtitle: "உறுப்பினர் சேர்க்கை",
      langBtn: "தமிழ்",
      labels: {
        name: "Full Name",
        pattapaiyar: "Pattapaiyar",
        native_place: "Native Place",
        address: "Full Address",
        marital_status: "Marital Status",
        Educational_qualification: "Educational Qualification",
        children_count: "Number of Children",
        photo: "Photo (Max 5MB)",
        work: "Work",
        contact_number: "Contact Number",
        email: "Email ID",
      },
      placeholders: {
        selectMarital: "-- Select Status --",
      },
      maritalOptions: [
        { label: "Unmarried", value: "unmarried" },
        { label: "Married", value: "married" },
        { label: "Widowed", value: "widowed" },
        { label: "Divorced", value: "divorced" },
        { label: "Ready for next marriage", value: "ready_for_next_marriage" },
      ],
      workOptions: [
        { label: "Business", value: "Business" },
        { label: "Agriculture", value: "vivasayam" },
        { label: "Employed", value: "veylai" },
        { label: "Others", value: "ethara" },
      ],
      buttons: {
        submit: "Submit Details",
        submitting: "Submitting...",
        newReg: "New Registration",
      },
      success: {
        title: "Thank You!",
        message: "Your details have been submitted successfully.",
      },
      errors: {
        submitFailed: "Submission Failed. Please try again.",
        photoSize: "Photo must be less than 5MB.",
        phoneInvalid: "Please enter a valid 10-digit phone number.",
        emailInvalid: "Please enter a valid email address.",
        missingPhoto: "Photo upload is mandatory.",
        missingChildrenCount: "Married members must provide children count."
      },
    },
  };

  const curT = translations[lang];

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    setMessage("");

    if (type === "file") {
      const file = files[0];
      if (file) {
        if (file.size > 5 * 1024 * 1024) {
          setMessage(curT.errors.photoSize);
          e.target.value = null;
          return;
        }
        setFormData({ ...formData, [name]: file });
        setPhotoPreview(URL.createObjectURL(file));
      } else {
        setFormData({ ...formData, [name]: null });
        setPhotoPreview(null);
      }
    } else {
      setFormData((prev) => {
        const newData = { ...prev, [name]: value };
        if (name === "marital_status" && value !== "married") {
          newData.children_count = "";
        }
        return newData;
      });
    }
  };

  const handleLangToggle = () => {
    setLang((prevLang) => (prevLang === "ta" ? "en" : "ta"));
    setMessage("");
  };

  const validateForm = () => {
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(formData.contact_number)) {
      setMessage(curT.errors.phoneInvalid);
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      setMessage(curT.errors.emailInvalid);
      return false;
    }

    if (!formData.photo) {
      setMessage(curT.errors.missingPhoto);
      return false;
    }

    if (formData.marital_status === "married" && !formData.children_count) {
      setMessage(curT.errors.missingChildrenCount);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      const data = new FormData();
      data.append("name", formData.name);
      data.append("pattapaiyar", formData.pattapaiyar);
      data.append("native_place", formData.native_place);
      data.append("marital_status", formData.marital_status);
      data.append("Educational_qualification", formData.Educational_qualification);
      data.append("address", formData.address);
      data.append("work", formData.work);
      data.append("contact_number", formData.contact_number);
      data.append("email", formData.email);

      if (formData.photo) {
        data.append("photo", formData.photo);
      }

      if (formData.marital_status === "married") {
        data.append("children_count", formData.children_count);
      }

      const res = await axios.post(
              `${API_BASE}/kallar-padaipatru/add/`,
              data,
              {
                params: { lang },
              }
            );

      setMessage(res.data.message || curT.success.message);
      setIsSubmitted(true);
    } catch (error) {
      setMessage(curT.errors.submitFailed);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setIsSubmitted(false);
    setMessage("");
    setPhotoPreview(null);
    setFormData({
      name: "",
      pattapaiyar: "",
      native_place: "",
      marital_status: "",
      Educational_qualification: "",
      address: "",
      work: "",
      contact_number: "",
      email: "",
      children_count: "",
      photo: null,
    });
  };

  if (isSubmitted) {
    return (
      <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light"
           style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif, Noto sans Tamil" }}>
        <div className="card shadow-lg border-0 rounded-4 text-center p-5" style={{ maxWidth: '500px' }}>
          <div className="mb-4 text-success"><CheckCircle2 size={80} className="mx-auto" /></div>
          <h2 className="fw-bold text-dark">{curT.success.title}</h2>
          <p className="text-muted mb-4">{message || curT.success.message}</p>
          <button className="btn btn-lg rounded-pill px-5 fw-bold text-white shadow-sm"
            style={{ background: 'linear-gradient(to right, #eab308, #16a34a)', border: 'none' }}
            onClick={resetForm}>
            {curT.buttons.newReg}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 d-flex justify-content-center align-items-center py-5"
          style={{
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif, Noto sans Tamil"
          }}>

      <style>
        {`
          .form-control:focus, .form-select:focus {
            border-color: #16a34a !important;
            box-shadow: 0 0 0 0.25rem rgba(22, 163, 74, 0.25) !important;
          }
          .form-check-input:checked {
            background-color: #16a34a !important;
            border-color: #16a34a !important;
          }
        `}
      </style>

      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-lg-8">
            <div className="card border-0 shadow-lg rounded-4 overflow-visible">

              <div className="card-header bg-white border-bottom-0 p-4 pb-2 d-flex justify-content-between align-items-center flex-wrap gap-3">
                <div className="d-flex align-items-center">
                  <div
                    className="d-flex align-items-center justify-content-center bg-white rounded-circle shadow-sm me-3"
                    style={{ width: "70px", height: "70px", overflow: "hidden", flexShrink: 0 }}
                  >
                    <img
                      src={logo}
                      alt="Logo"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>
                  <div>
                    <h2 className="fw-bolder mb-0"
                        style={{
                          letterSpacing: '-0.5px',
                          fontSize: '1.8rem',
                          lineHeight: '1.2',
                          background: 'linear-gradient(to right, #eab308, #16a34a)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text',
                          color: 'transparent'
                        }}>
                      {curT.titleMain} {curT.titleSub}
                    </h2>
                    <div className="d-flex align-items-center mt-1">
                       <div style={{ width: '40px', height: '3px', background: 'linear-gradient(to right, #eab308, #16a34a)', borderRadius: '2px' }} className="me-2"></div>
                       <p className="fw-bold mb-0 text-uppercase"
                          style={{
                            letterSpacing: '1px',
                            fontSize: '0.85rem',
                            background: 'linear-gradient(to right, #eab308, #16a34a)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            color: 'transparent'
                          }}>
                         {curT.subtitle}
                       </p>
                    </div>
                  </div>
                </div>

                <button type="button"
                  className="btn fw-bold rounded-pill shadow-sm d-flex align-items-center justify-content-center transition-all text-white"
                  onClick={handleLangToggle}
                  style={{
                    background: 'linear-gradient(to right, #eab308, #16a34a)',
                    border: 'none',
                    width: '130px',
                    height: '45px',
                    flexShrink: 0
                  }}>
                  <Languages size={18} className="me-2"/>
                  {curT.langBtn}
                </button>
              </div>

              <div className="card-body p-4 p-md-5 pt-3">

                {message && !isSubmitted && (
                    <div className="alert alert-danger rounded-3 d-flex align-items-center mb-4 border-0 shadow-sm bg-danger bg-opacity-10 text-danger fw-bold">
                        <span className="me-2">⚠️</span> {message}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="row g-3 mb-4">
                    <div className="col-12">
                      <BootstrapInput label={curT.labels.name} name="name" value={formData.name} onChange={handleChange} required icon={<User size={18}/>} />
                    </div>

                    <div className="col-md-6">
                      <BootstrapInput label={curT.labels.pattapaiyar} name="pattapaiyar" value={formData.pattapaiyar} onChange={handleChange} icon={<User size={18}/>} />
                    </div>

                    <div className="col-md-6">
                      <BootstrapInput label={curT.labels.native_place} name="native_place" value={formData.native_place} onChange={handleChange} icon={<MapPin size={18}/>} />
                    </div>

                    <div className="col-12">
                      <BootstrapInput label={curT.labels.Educational_qualification} name="Educational_qualification" value={formData.Educational_qualification} onChange={handleChange} required icon={<GraduationCap size={18}/>} />
                    </div>

                    <div className="col-12">
                      <BootstrapTextArea label={curT.labels.address} name="address" value={formData.address} onChange={handleChange} icon={<Home size={18}/>} />
                    </div>

                    <div className={formData.marital_status === "married" ? "col-md-6" : "col-12"}>
                        <BootstrapSelect
                            label={curT.labels.marital_status}
                            name="marital_status"
                            value={formData.marital_status}
                            onChange={handleChange}
                            required={true}
                            icon={<HeartHandshake size={18}/>}
                        >
                            <option value="" disabled>{curT.placeholders.selectMarital}</option>
                            {curT.maritalOptions.map(opt => (
                               <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </BootstrapSelect>
                    </div>

                    {formData.marital_status === "married" && (
                      <div className="col-md-6">
                        <BootstrapInput
                          label={curT.labels.children_count}
                          name="children_count"
                          value={formData.children_count}
                          onChange={handleChange}
                          type="number"
                          required
                          icon={<Users size={18}/>}
                        />
                      </div>
                    )}

                    <div className="col-12">
                       <div className="border rounded px-3 py-2 bg-light d-flex flex-column justify-content-center h-100" style={{ borderColor: '#dee2e6' }}>
                          <label className="form-label text-muted fw-bold d-flex align-items-center mb-2" style={{ fontSize: '14px' }}>
                            <ImageIcon size={18} className="me-2 text-secondary"/> {curT.labels.photo} <span className="text-danger ms-1">*</span>
                          </label>
                          <input
                            type="file"
                            className="form-control form-control-sm"
                            id="photo"
                            name="photo"
                            onChange={handleChange}
                            accept="image/*"
                            required
                          />
                          {photoPreview && (
                            <div className="mt-2 text-center">
                              <img src={photoPreview} alt="Preview" className="img-thumbnail rounded shadow-sm" style={{ maxHeight: '90px', objectFit: 'contain' }} />
                            </div>
                          )}
                       </div>
                    </div>

                    <div className="col-md-6">
                      <BootstrapInput label={curT.labels.contact_number} name="contact_number" value={formData.contact_number} onChange={handleChange} required type="tel" icon={<Phone size={18}/>} />
                    </div>

                    <div className="col-md-6">
                      <BootstrapInput label={curT.labels.email} name="email" value={formData.email} onChange={handleChange} type="email" icon={<Mail size={18}/>} />
                    </div>

                    <div className="col-12 mt-4">
                      <div className="border rounded p-3 bg-light">
                        <label className="form-label text-muted fw-bold d-flex align-items-center mb-3" style={{ fontSize: '15px' }}>
                          <Briefcase size={18} className="me-2 text-secondary" />
                          {curT.labels.work} <span className="text-danger ms-1">*</span>
                        </label>
                        <div className="d-flex flex-column flex-sm-row gap-3">
                          {curT.workOptions.map((opt) => (
                            <div key={opt.value} className="form-check">
                              <input
                                className="form-check-input"
                                type="radio"
                                name="work"
                                id={`work-${opt.value}`}
                                value={opt.value}
                                checked={formData.work === opt.value}
                                onChange={handleChange}
                                required
                                style={{ cursor: "pointer", width: "1.2em", height: "1.2em", accentColor: "#16a34a" }}
                              />
                              <label
                                className="form-check-label text-dark fw-medium"
                                htmlFor={`work-${opt.value}`}
                                style={{ cursor: "pointer", paddingTop: "2px", marginLeft: "5px" }}
                              >
                                {opt.label}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                  </div>

                  <div className="d-grid gap-2 mt-4">
                    <button type="submit" disabled={isLoading} className="btn btn-lg rounded-pill py-3 fw-bold shadow hover-lift text-white d-flex align-items-center justify-content-center"
                      style={{
                        background: 'linear-gradient(to right, #eab308, #16a34a)',
                        border: 'none',
                        transition: 'all 0.3s'
                      }}>
                      {isLoading ? (
                        <>
                          <div className="spinner-border spinner-border-sm me-2 text-white" role="status"></div>
                          <span>{curT.buttons.submitting}</span>
                        </>
                      ) : (
                        <span className="d-flex align-items-center justify-content-center text-uppercase spacing-1">
                          {curT.buttons.submit} <ArrowRight className="ms-2" size={20}/>
                        </span>
                      )}
                    </button>
                  </div>

                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const BootstrapInput = ({ label, name, value, onChange, icon, type = "text", required }) => {
  return (
    <div className="input-group" style={{ height: '58px' }}>
      {icon && <span className="input-group-text bg-light border-end-0 text-secondary" style={{backgroundColor: '#f8f9fa'}}>{icon}</span>}
      <div className="form-floating flex-grow-1">
        <input type={type} className={`form-control ${icon ? 'border-start-0' : ''}`} id={name} name={name} value={value} onChange={onChange} placeholder={label} required={required} style={{ boxShadow: 'none' }} />
        <label htmlFor={name} className="text-muted">{label} {required && <span className="text-danger">*</span>}</label>
      </div>
    </div>
  );
};

const BootstrapTextArea = ({ label, name, value, onChange, icon, required }) => {
  return (
    <div className="input-group">
      {icon && <span className="input-group-text bg-light border-end-0 text-secondary" style={{backgroundColor: '#f8f9fa'}}>{icon}</span>}
      <div className="form-floating flex-grow-1">
        <textarea
          className={`form-control ${icon ? 'border-start-0' : ''}`}
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={label}
          required={required}
          style={{ boxShadow: 'none', height: '80px', resize: 'vertical' }}
        />
        <label htmlFor={name} className="text-muted">{label} {required && <span className="text-danger">*</span>}</label>
      </div>
    </div>
  );
};

const BootstrapSelect = ({ label, name, value, onChange, icon, children, required }) => {
  return (
    <div className="input-group" style={{ height: '58px' }}>
      {icon && <span className="input-group-text bg-light border-end-0 text-secondary" style={{backgroundColor: '#f8f9fa'}}>{icon}</span>}
      <div className="form-floating flex-grow-1">
        <select
            className={`form-select ${icon ? 'border-start-0' : ''}`}
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            required={required}
            style={{ boxShadow: 'none' }}
        >
            {children}
        </select>
        <label htmlFor={name} className="text-muted">
          {label} {required && <span className="text-danger">*</span>}
        </label>
      </div>
    </div>
  );
};