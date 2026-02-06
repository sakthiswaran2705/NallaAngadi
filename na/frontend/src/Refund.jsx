import React from "react";
import Navbar from "./Navbar.jsx";

// ==========================================================
// 1. TRANSLATION TEXT (SAME FORMAT)
// ==========================================================
const TXT = {
  title: {
    en: "Cancellation & Refund Policy",
    ta: "ரத்து & பணத்தீர்ப்பு கொள்கை"
  },
  intro: {
    en: "This Cancellation & Refund Policy outlines the terms under which cancellations and refunds are processed by NallaAngadi.",
    ta: "இந்த ரத்து & பணத்தீர்ப்பு கொள்கை, NallaAngadi மூலம் ரத்து மற்றும் பணத்தீர்ப்பு கோரிக்கைகள் எவ்வாறு செயலாக்கப்படுகின்றன என்பதை விளக்குகிறது."
  },

  section1: { en: "1. Nature of Services", ta: "1. சேவைகளின் தன்மை" },
  s1Text: {
    en: "NallaAngadi provides digital services and subscription-based plans. Once a service is activated, it is considered delivered.",
    ta: "NallaAngadi டிஜிட்டல் சேவைகள் மற்றும் சந்தா அடிப்படையிலான திட்டங்களை வழங்குகிறது. சேவை செயல்படுத்தப்பட்டதும், அது வழங்கப்பட்டதாகக் கருதப்படும்."
  },

  section2: { en: "2. Cancellation Policy", ta: "2. ரத்து கொள்கை" },
  s2Text: {
    en: "Users may request cancellation before service activation. After activation, cancellation requests may not be accepted.",
    ta: "சேவை செயல்படுத்துவதற்கு முன் பயனர்கள் ரத்து கோரலாம். செயல்படுத்தப்பட்ட பிறகு, ரத்து கோரிக்கைகள் ஏற்கப்படாமல் இருக்கலாம்."
  },

  section3: { en: "3. Refund Policy", ta: "3. பணத்தீர்ப்பு கொள்கை" },
  s3Intro: {
    en: "Refunds are generally not provided once the service is activated. However, refunds may be considered in exceptional cases such as:",
    ta: "சேவை செயல்படுத்தப்பட்ட பிறகு பொதுவாக பணத்தீர்ப்பு வழங்கப்படாது. ஆனால், கீழ்க்கண்ட விசேஷமான சூழ்நிலைகளில் பணத்தீர்ப்பு பரிசீலிக்கப்படலாம்:"
  },
  refundPoints: {
    en: [
      "Duplicate payment",
      "Payment deducted but service not activated",
      "Technical errors caused by our system"
    ],
    ta: [
      "இரட்டை கட்டணம் செலுத்தப்பட்டிருத்தல்",
      "கட்டணம் பிடிக்கப்பட்டு சேவை செயல்படுத்தப்படாதிருத்தல்",
      "எங்கள் அமைப்பால் ஏற்பட்ட தொழில்நுட்பப் பிழைகள்"
    ]
  },

  section4: { en: "4. Refund Processing Time", ta: "4. பணத்தீர்ப்பு செயலாக்க நேரம்" },
  s4Text: {
    en: "Approved refunds will be processed within 5–7 business days to the original payment method.",
    ta: "ஒப்புதல் பெற்ற பணத்தீர்ப்புகள், முதன்மை கட்டண முறைக்கு 5–7 வேலை நாட்களுக்குள் செயலாக்கப்படும்."
  },

  section5: { en: "5. Non-Refundable Items", ta: "5. பணத்தீர்ப்பு வழங்கப்படாதவை" },
  s5Text: {
    en: "Fees paid for successfully delivered digital services or promotional listings are non-refundable.",
    ta: "வெற்றிகரமாக வழங்கப்பட்ட டிஜிட்டல் சேவைகள் அல்லது விளம்பர பட்டியல்களுக்கு செலுத்தப்பட்ட கட்டணங்கள் பணத்தீர்ப்புக்கு உட்பட்டவை அல்ல."
  },

  section6: { en: "6. Contact for Refunds", ta: "6. பணத்தீர்ப்பு தொடர்பு" },
  contactText: {
    en: "To request a cancellation or refund, please contact us with your payment details:",
    ta: "ரத்து அல்லது பணத்தீர்ப்பு கோர, உங்கள் கட்டண விவரங்களுடன் எங்களை தொடர்பு கொள்ளவும்:"
  },

  email: { en: "Email", ta: "மின்னஞ்சல்" },
  phone: { en: "Phone", ta: "தொலைபேசி" },
  location: { en: "Location", ta: "இடம்" }
};

// ==========================================================
// ⭐ REFUND COMPONENT
// ==========================================================
function Refund() {
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
        .policy-card p,
        .policy-card li {
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
        <p>{t("s3Intro")}</p>
        <ul>
          {TXT.refundPoints[lang].map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>

        <h3>{t("section4")}</h3>
        <p>{t("s4Text")}</p>

        <h3>{t("section5")}</h3>
        <p>{t("s5Text")}</p>

        <h3>{t("section6")}</h3>
        <p>{t("contactText")}</p>

        <p>
          <b>{t("email")}:</b> cholainfotech26@gmail.com  <br />
          <b>{t("phone")}:</b> +91 8870462434 <br />
          <b>{t("location")}:</b> Thanjavur, Tamil Nadu, India
        </p>
      </div>
    </>
  );
}

export default Refund;
