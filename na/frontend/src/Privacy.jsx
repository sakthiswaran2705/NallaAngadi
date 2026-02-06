import React from "react";
import Navbar from "./Navbar.jsx";

// ==========================================================
// 1. TRANSLATION TEXT (SAME FORMAT)
// ==========================================================
const TXT = {
  title: { en: "Privacy Policy", ta: "தனியுரிமைக் கொள்கை" },
  intro: {
    en: "At NallaAngadi, we respect your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, and safeguard your data.",
    ta: "NallaAngadi-யில், உங்கள் தனியுரிமையை மதித்து, உங்கள் தனிப்பட்ட தகவல்களை பாதுகாப்பதற்கு உறுதியாக இருக்கிறோம். இந்த தனியுரிமைக் கொள்கை, உங்கள் தகவல்கள் எவ்வாறு சேகரிக்கப்படுகின்றன, பயன்படுத்தப்படுகின்றன மற்றும் பாதுகாக்கப்படுகின்றன என்பதை விளக்குகிறது."
  },

  section1: { en: "1. Information We Collect", ta: "1. நாங்கள் சேகரிக்கும் தகவல்கள்" },
  s1Text: {
    en: "We may collect personal information such as your name, phone number, email address, location, and business details when you register, submit forms, or use our services.",
    ta: "நீங்கள் பதிவு செய்யும் போது, படிவங்களை சமர்ப்பிக்கும் போது அல்லது எங்கள் சேவைகளை பயன்படுத்தும் போது, உங்கள் பெயர், தொலைபேசி எண், மின்னஞ்சல், இருப்பிடம் மற்றும் வணிக விவரங்கள் போன்ற தகவல்களை நாங்கள் சேகரிக்கலாம்."
  },

  section2: { en: "2. How We Use Your Information", ta: "2. உங்கள் தகவல்களை எவ்வாறு பயன்படுத்துகிறோம்" },
  s2Intro: {
    en: "Your information is used to:",
    ta: "உங்கள் தகவல்கள் பின்வரும் நோக்கங்களுக்காக பயன்படுத்தப்படுகின்றன:"
  },
  s2Points: {
    en: [
      "Provide and improve our services",
      "Process payments and subscriptions",
      "Communicate important updates and support",
      "Improve user experience and security"
    ],
    ta: [
      "எங்கள் சேவைகளை வழங்கவும் மேம்படுத்தவும்",
      "கட்டணங்கள் மற்றும் சந்தாக்களை செயலாக்க",
      "முக்கிய அறிவிப்புகள் மற்றும் ஆதரவை வழங்க",
      "பயனர் அனுபவம் மற்றும் பாதுகாப்பை மேம்படுத்த"
    ]
  },

  section3: { en: "3. Data Security", ta: "3. தரவு பாதுகாப்பு" },
  s3Text: {
    en: "We implement reasonable security measures to protect your personal data from unauthorized access, misuse, or disclosure.",
    ta: "உங்கள் தனிப்பட்ட தரவுகளை அனுமதியில்லா அணுகல், தவறான பயன்பாடு அல்லது வெளியீட்டிலிருந்து பாதுகாப்பதற்காக நாங்கள் பொருத்தமான பாதுகாப்பு நடவடிக்கைகளை மேற்கொள்கிறோம்."
  },

  section4: { en: "4. Sharing of Information", ta: "4. தகவல் பகிர்வு" },
  s4Text: {
    en: "We do not sell, trade, or rent your personal information to third parties. Information may be shared only when required by law or for essential service operations.",
    ta: "உங்கள் தனிப்பட்ட தகவல்களை மூன்றாம் தரப்பினருக்கு விற்பனை, பரிமாற்றம் அல்லது வாடகைக்கு வழங்குவதில்லை. சட்டப்படி தேவைப்படும் போது அல்லது முக்கிய சேவை செயல்பாடுகளுக்காக மட்டுமே தகவல்கள் பகிரப்படலாம்."
  },

  section5: { en: "5. Cookies", ta: "5. குக்கீஸ்" },
  s5Text: {
    en: "Our website may use cookies to enhance user experience and analyze usage patterns. You can choose to disable cookies through your browser settings.",
    ta: "பயனர் அனுபவத்தை மேம்படுத்தவும் பயன்பாட்டு முறைகளை பகுப்பாய்வு செய்யவும் எங்கள் இணையதளம் குக்கீஸ்களை பயன்படுத்தலாம். உங்கள் உலாவி அமைப்புகள் மூலம் குக்கீஸ்களை முடக்கலாம்."
  },

  section6: { en: "6. Third-Party Services", ta: "6. மூன்றாம் தரப்பு சேவைகள்" },
  s6Text: {
    en: "We may use trusted third-party services (such as payment gateways) that have their own privacy policies. We are not responsible for their privacy practices.",
    ta: "கட்டண வாயில்கள் போன்ற நம்பகமான மூன்றாம் தரப்பு சேவைகளை நாங்கள் பயன்படுத்தலாம். அவர்களுடைய தனியுரிமை நடைமுறைகளுக்கு நாங்கள் பொறுப்பல்ல."
  },

  section7: { en: "7. Your Consent", ta: "7. உங்கள் ஒப்புதல்" },
  s7Text: {
    en: "By using our website and services, you consent to this Privacy Policy.",
    ta: "எங்கள் இணையதளத்தையும் சேவைகளையும் பயன்படுத்துவதன் மூலம், இந்த தனியுரிமைக் கொள்கைக்கு நீங்கள் ஒப்புதல் அளிக்கிறீர்கள்."
  },

  section8: { en: "8. Changes to This Policy", ta: "8. கொள்கையில் மாற்றங்கள்" },
  s8Text: {
    en: "We may update this Privacy Policy from time to time. Changes will be posted on this page.",
    ta: "இந்த தனியுரிமைக் கொள்கையை அவ்வப்போது புதுப்பிக்கலாம். மாற்றங்கள் இந்தப் பக்கத்தில் வெளியிடப்படும்."
  },

  section9: { en: "9. Contact Us", ta: "9. எங்களை தொடர்பு கொள்ள" },
  contactText: {
    en: "If you have any questions about this Privacy Policy, please contact us:",
    ta: "இந்த தனியுரிமைக் கொள்கை குறித்து கேள்விகள் இருந்தால், எங்களை தொடர்பு கொள்ளவும்:"
  },

  email: { en: "Email", ta: "மின்னஞ்சல்" },
  phone: { en: "Phone", ta: "தொலைபேசி" },
  location: { en: "Location", ta: "இடம்" }
};

// ==========================================================
// ⭐ PRIVACY COMPONENT
// ==========================================================
function Privacy() {
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
        <p>{t("s2Intro")}</p>
        <ul>
          {TXT.s2Points[lang].map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>

        <h3>{t("section3")}</h3>
        <p>{t("s3Text")}</p>

        <h3>{t("section4")}</h3>
        <p>{t("s4Text")}</p>

        <h3>{t("section5")}</h3>
        <p>{t("s5Text")}</p>

        <h3>{t("section6")}</h3>
        <p>{t("s6Text")}</p>

        <h3>{t("section7")}</h3>
        <p>{t("s7Text")}</p>

        <h3>{t("section8")}</h3>
        <p>{t("s8Text")}</p>

        <h3>{t("section9")}</h3>
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

export default Privacy;
