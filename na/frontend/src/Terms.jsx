import React from "react";
import Navbar from "./Navbar.jsx";
import Footer from "./footer.jsx";

// ==========================================================
// 1. TRANSLATION TEXT (SAME FORMAT)
// ==========================================================
const TXT = {
  title: { en: "Terms & Conditions", ta: "விதிமுறைகள் & நிபந்தனைகள்" },
  intro: {
    en: "These Terms & Conditions govern your use of the NallaAngadi website and services. By accessing or using our platform, you agree to comply with these terms.",
    ta: "இந்த விதிமுறைகள் மற்றும் நிபந்தனைகள் NallaAngadi இணையதளம் மற்றும் சேவைகளை நீங்கள் பயன்படுத்துவதைக் கட்டுப்படுத்துகின்றன. எங்கள் தளத்தை பயன்படுத்துவதன் மூலம், இந்த விதிமுறைகளை நீங்கள் ஏற்கிறீர்கள்."
  },

  section1: { en: "1. Use of Services", ta: "1. சேவைகளின் பயன்பாடு" },
  s1Text: {
    en: "NallaAngadi provides digital business listings, advertisements, and subscription-based services. You agree to use our services only for lawful purposes.",
    ta: "NallaAngadi டிஜிட்டல் வணிக பட்டியல்கள், விளம்பரங்கள் மற்றும் சந்தா அடிப்படையிலான சேவைகளை வழங்குகிறது. எங்கள் சேவைகளை சட்டபூர்வமான நோக்கங்களுக்காக மட்டுமே பயன்படுத்த நீங்கள் ஒப்புக்கொள்கிறீர்கள்."
  },

  section2: { en: "2. User Responsibilities", ta: "2. பயனர் பொறுப்புகள்" },
  s2Text: {
    en: "You are responsible for ensuring that the information you provide is accurate, complete, and up to date. Any misuse of the platform may result in suspension or termination of services.",
    ta: "நீங்கள் வழங்கும் தகவல்கள் சரியானதும், முழுமையானதும், புதுப்பிக்கப்பட்டதுமானவை என்பதை உறுதி செய்வது உங்கள் பொறுப்பு. தளத்தின் தவறான பயன்பாடு சேவைகள் இடைநிறுத்தப்படுவதற்கோ நிறுத்தப்படுவதற்கோ காரணமாகலாம்."
  },

  section3: { en: "3. Payments", ta: "3. கட்டணங்கள்" },
  s3Text: {
    en: "Payments made on NallaAngadi are processed through secure payment gateways. By making a payment, you agree to the pricing, billing cycle, and applicable taxes.",
    ta: "NallaAngadi-யில் செய்யப்படும் கட்டணங்கள் பாதுகாப்பான கட்டண வாயில்கள் மூலம் செயலாக்கப்படுகின்றன. கட்டணம் செலுத்துவதன் மூலம், விலை, பில்லிங் கால அளவு மற்றும் பொருந்தும் வரிகளை நீங்கள் ஒப்புக்கொள்கிறீர்கள்."
  },

  section4: { en: "4. Subscription & Services", ta: "4. சந்தா & சேவைகள்" },
  s4Text: {
    en: "Subscription services are activated after successful payment. Service features may vary based on the selected plan.",
    ta: "வெற்றிகரமான கட்டணத்திற்குப் பிறகு சந்தா சேவைகள் செயல்படுத்தப்படும். தேர்ந்தெடுக்கப்பட்ட திட்டத்தைப் பொறுத்து சேவை அம்சங்கள் மாறுபடலாம்."
  },

  section5: { en: "5. Cancellation & Refund", ta: "5. ரத்து & பணத்தீர்ப்பு" },
  s5Text: {
    en: "Cancellation and refund requests are subject to our Cancellation & Refund Policy. Please review the policy before making a purchase.",
    ta: "ரத்து மற்றும் பணத்தீர்ப்பு கோரிக்கைகள் எங்கள் ரத்து & பணத்தீர்ப்பு கொள்கைக்கு உட்பட்டவை. வாங்குவதற்கு முன் அந்த கொள்கையை தயவுசெய்து படிக்கவும்."
  },

  section6: { en: "6. Intellectual Property", ta: "6. அறிவுசார் சொத்துரிமை" },
  s6Text: {
    en: "All content, logos, and materials on NallaAngadi are the property of NallaAngadi and may not be copied, reproduced, or distributed without prior written consent.",
    ta: "NallaAngadi-யில் உள்ள அனைத்து உள்ளடக்கங்கள், லோகோக்கள் மற்றும் பொருட்கள் NallaAngadi-க்கு சொந்தமானவை. முன் எழுத்து அனுமதி இல்லாமல் அவற்றை நகலெடுக்கவோ, மீளுருவாக்கவோ அல்லது பகிரவோ முடியாது."
  },

  section7: { en: "7. Limitation of Liability", ta: "7. பொறுப்பு வரம்பு" },
  s7Text: {
    en: "NallaAngadi shall not be liable for any direct, indirect, or incidental damages arising from the use of our services.",
    ta: "எங்கள் சேவைகளை பயன்படுத்துவதால் ஏற்படும் நேரடி, மறைமுக அல்லது தற்செயலான சேதங்களுக்கு NallaAngadi பொறுப்பல்ல."
  },

  section8: { en: "8. Changes to Terms", ta: "8. விதிமுறைகளில் மாற்றங்கள்" },
  s8Text: {
    en: "We reserve the right to update or modify these Terms & Conditions at any time. Changes will be effective immediately upon posting.",
    ta: "இந்த விதிமுறைகளை எப்போது வேண்டுமானாலும் புதுப்பிக்க அல்லது மாற்ற எங்களுக்கு உரிமை உள்ளது. மாற்றங்கள் வெளியிடப்பட்ட உடனே அமலுக்கு வரும்."
  },

  section9: { en: "9. Governing Law", ta: "9. பொருந்தும் சட்டம்" },
  s9Text: {
    en: "These terms are governed by the laws of India. Any disputes shall be subject to the jurisdiction of Tamil Nadu.",
    ta: "இந்த விதிமுறைகள் இந்திய சட்டங்களுக்கு உட்பட்டவை. எந்தவொரு சர்ச்சையும் தமிழ்நாடு நீதித்துறையின் அதிகாரத்திற்கு உட்பட்டதாக இருக்கும்."
  },

  section10: { en: "10. Contact Information", ta: "10. தொடர்பு விவரங்கள்" },
  contactText: {
    en: "If you have any questions about these Terms & Conditions, please contact us:",
    ta: "இந்த விதிமுறைகள் குறித்து கேள்விகள் இருந்தால், எங்களை தொடர்பு கொள்ளவும்:"
  },

  email: { en: "Email", ta: "மின்னஞ்சல்" },
  phone: { en: "Phone", ta: "தொலைபேசி" },
  location: { en: "Location", ta: "இடம்" }
};

// ==========================================================
// ⭐ TERMS COMPONENT
// ==========================================================
function Terms() {
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
        <p>{t("s6Text")}</p>

        <h3>{t("section7")}</h3>
        <p>{t("s7Text")}</p>

        <h3>{t("section8")}</h3>
        <p>{t("s8Text")}</p>

        <h3>{t("section9")}</h3>
        <p>{t("s9Text")}</p>

        <h3>{t("section10")}</h3>
        <p>{t("contactText")}</p>

        <p>
          <b>{t("email")}:</b> cholainfotech26@gmail.com <br />
          <b>{t("location")}:</b> Thanjavur, Tamil Nadu, India
        </p>
      </div>
      <Footer/>
    </>
  );
}

export default Terms;
