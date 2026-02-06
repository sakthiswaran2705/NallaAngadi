// config_includes.jsx
// UI-only plan includes (display purpose)

export const FEATURES = {
  free_registration: {
    en: "Free Registration",
    ta: "✔ இலவச பதிவு",
  },
  shop_1: {
    en: " 1 Shop Allowed",
    ta: " 1 கடை அனுமதி",
  },
  shop_2: {
    en: " 2 Shops Allowed",
    ta: " 2 கடைகள் அனுமதி",
  },
  shop_4: {
    en: " 4 Shops Allowed",
    ta: " 4 கடைகள் அனுமதி",
  },
  shop_8:{
    en: "8 Shops Allowed",
    ta:"8 கடைகள் அனுமதி"
  },
  unlimited_search: {
    en: " Unlimited Search Shops",
    ta: " வரம்பில்லா கடை தேடல்",
  },
  unlimited_jobs: {
    en: " Unlimited Job Posting",
    ta: " வரம்பில்லா வேலை பதிவு",
  },
  offer_1: {
    en: " 1 Offer Allowed",
    ta: " 1 சலுகை அனுமதி",
  },
  offer_2_month: {
    en: " 2 Offers /Per Month",
    ta: " மாதத்திற்கு 2 சலுகைகள்",
  },
  offer_3_month: {
    en: " 3 Offers /Per Month",
    ta: " மாதத்திற்கு 3 சலுகைகள்",
  },
  view_report: {
    en: " View Reports",
    ta: " அறிக்கைகள் பார்க்க",
  },
};
export const PLAN_INCLUDES = {
  starter: [
    "free_registration",
    "shop_1",
    "unlimited_search",
    "unlimited_jobs",
  ],

  silver: [
    "free_registration",
    "shop_2",
    "offer_1",
    "unlimited_jobs",
    "view_report",
  ],

  gold: [
    "free_registration",
    "shop_4",
    "offer_2_month",
    "unlimited_jobs",
    "view_report",
  ],

  platinum: [
    "free_registration",
    "shop_8",
    "offer_3_month",
    "unlimited_search",
    "unlimited_jobs",
    "view_report",
  ],
};
