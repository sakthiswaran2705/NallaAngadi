import React from "react";
import Navbar from "./Navbar.jsx";

// ==========================================================
// 1. TRANSLATION TEXT (SAME FORMAT)
// ==========================================================
const TXT = {
  title: { en: "Shipping Policy", ta: "விநியோகக் கொள்கை" },
  intro: {
    en: "This Shipping Policy explains how NallaAngadi delivers its services to customers.",
    ta: "NallaAngadi தனது சேவைகளை வாடிக்கையாளர்களுக்கு எவ்வாறு வழங்குகிறது என்பதை இந்த விநியோகக் கொள்கை விளக்குகிறது."
  },

  section1: { en: "1. Nature of Services", ta: "1. சேவைகளின் தன்மை" },
  s1Text: {
    en: "NallaAngadi provides digital services, online business listings, and subscription-based plans. We do not ship any physical products.",
    ta: "NallaAngadi டிஜிட்டல் சேவைகள், ஆன்லைன் வணிக பட்டியல்கள் மற்றும் சந்தா அடிப்படையிலான திட்டங்களை வழங்குகிறது. எங்களால் எந்த உடைமைக் பொருட்களும் விநியோகிக்கப்படுவதில்லை."
  },

  section2: { en: "2. Service Delivery", ta: "2. சேவை வழங்கல்" },
  s2Text: {
    en: "All services are delivered electronically through our website, dashboard, or via email after successful payment confirmation.",
    ta: "அனைத்து சேவைகளும் கட்டணம் உறுதிப்படுத்தப்பட்ட பிறகு எங்கள் இணையதளம், டாஷ்போர்டு அல்லது மின்னஞ்சல் மூலம் மின்னணு வடிவில் வழங்கப்படுகின்றன."
  },

  section3: { en: "3. Delivery Timeline", ta: "3. சேவை வழங்கும் கால அளவு" },
  s3Text: {
    en: "Services are usually activated instantly or within 24 hours of payment. In rare cases, activation may take slightly longer due to technical reasons.",
    ta: "சேவைகள் பொதுவாக உடனடியாக அல்லது கட்டணம் செலுத்திய 24 மணி நேரத்திற்குள் செயல்படுத்தப்படும். அரிதான சில சந்தர்ப்பங்களில் தொழில்நுட்ப காரணங்களால் தாமதம் ஏற்படலாம்."
  },

  section4: { en: "4. Shipping Charges", ta: "4. விநியோகக் கட்டணங்கள்" },
  s4Text: {
    en: "Since no physical shipping is involved, no shipping charges are applicable.",
    ta: "உடைமைக் பொருட்கள் எதுவும் விநியோகிக்கப்படாததால், எந்தவித விநியோகக் கட்டணமும் இல்லை."
  },

  section5: { en: "5. Delays", ta: "5. தாமதங்கள்" },
  s5Text: {
    en: "If there is any delay in service activation, customers will be informed via email or phone.",
    ta: "சேவை செயல்படுத்துவதில் தாமதம் ஏற்பட்டால், வாடிக்கையாளர்களுக்கு மின்னஞ்சல் அல்லது தொலைபேசி மூலம் அறிவிக்கப்படும்."
  },

  section6: { en: "6. Contact Information", ta: "6. தொடர்பு விவரங்கள்" },
  contactText: {
    en: "If you have questions regarding this Shipping Policy, please contact us:",
    ta: "இந்த விநியோகக் கொள்கை தொடர்பாக உங்களுக்கு கேள்விகள் இருந்தால், எங்களை தொடர்பு கொள்ளவும்:"
  },

  email: { en: "Email", ta: "மின்னஞ்சல்" },
  phone: { en: "Phone", ta: "தொலைபேசி" },
  location: { en: "Location", ta: "இடம்" }
};

// ==========================================================
// ⭐ SHIPPING COMPONENT
// ==========================================================
function Shipping() {
  const lang = localStorage.getItem("LANG") || "en";
  const t = (key) => TXT[key]?.[lang] || TXT[key]?.en || key;

  return (
    <>
      <Navbar />

      <style>
        {`
        body {
          background: #f8fafc;
          font-family: 'Plus Jakarta Sans','Noto Sans Tamil',sans-serif;
        }
        .policy-card {
          max-width: 900px;
          margin: 80px auto;
          padding: 40px;
          background: #ffffff;
          border-radius: 20px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.08);
          border: 1px solid #e2e8f0;
        }
        .policy-card h1 {
          font-weight: 800;
          margin-bottom: 20px;
        }
        .policy-card h3 {
          font-weight: 700;
          margin-top: 30px;
          margin-bottom: 10px;
        }
        .policy-card p {
          color: #475569;
          line-height: 1.7;
          font-size: 15px;
        }
        `}
      </style>

      <div className="policy-card">
        <h1>{t("title")}</h1>

        <p>{t("intro")}</p>

        <h3>{t("section1")}</h3>
        <p>{t("s1Text")}</p>

        <h3>{t("section2")}</h3>
        <p>{t("s2Text")}</p>

        <h3>{t("section3")}</h3>
        <p>{t("s3Text")}</p>

        <h3>{t("section4")}</h3>
        <p>{t("s4Text")}</p>

        <h3>{t("section5")}</h3>
        <p>{t("s5Text")}</p>

        <h3>{t("section6")}</h3>
        <p>{t("contactText")}</p>

        <p>
          <b>{t("email")}:</b> cholainfotech26@gmail.com <br />
          <b>{t("phone")}:</b> +91 8870462434 <br />
          <b>{t("location")}:</b> Thanjavur, Tamil Nadu, India
        </p>
      </div>
    </>
  );
}

export default Shipping;
