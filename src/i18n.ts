import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  ar: {
    translation: {
      "nav": {
        "home": "الرئيسية",
        "books": "الكتب",
        "notes": "الملخصات",
        "tutors": "المدرسين",
        "housing": "السكن",
        "tools": "الأدوات",
        "search_placeholder": "ابحث عن كتاب، مدرس، سكن...",
        "login": "دخول",
        "register": "تسجيل",
        "logout": "خروج",
        "admin": "لوحة التحكم",
        "profile": "الملف الشخصي",
        "notifications": "الإشعارات",
        "chat": "الدردشة"
      },
      "home": {
        "welcome": "أهلاً بك في سند",
        "subtitle": "رفيقك في رحلتك الجامعية. كل ما تحتاجه كطالب في مكان واحد.",
        "cta": "تصفح الخدمات",
        "hero_desc": "من الكتب والملخصات إلى السكن والمدرسين الخصوصيين، سند هنا ليحمل عنك عناء البحث."
      },
      "common": {
        "loading": "جاري التحميل...",
        "error": "حدث خطأ ما",
        "save": "حفظ",
        "delete": "حذف",
        "edit": "تعديل",
        "add": "إضافة",
        "search": "بحث",
        "price": "السعر",
        "currency": "جنيه",
        "university": "الجامعة",
        "faculty": "الكلية"
      }
    }
  },
  en: {
    translation: {
      "nav": {
        "home": "Home",
        "books": "Books",
        "notes": "Notes",
        "tutors": "Tutors",
        "housing": "Housing",
        "tools": "Tools",
        "search_placeholder": "Search for books, tutors, housing...",
        "login": "Login",
        "register": "Register",
        "logout": "Logout",
        "admin": "Admin",
        "profile": "Profile",
        "notifications": "Notifications",
        "chat": "Chat"
      },
      "home": {
        "welcome": "Welcome to Sanad",
        "subtitle": "Your companion in your university journey. Everything you need in one place.",
        "cta": "Browse Services",
        "hero_desc": "From books and notes to housing and tutors, Sanad is here to simplify your student life."
      },
      "common": {
        "loading": "Loading...",
        "error": "Something went wrong",
        "save": "Save",
        "delete": "Delete",
        "edit": "Edit",
        "add": "Add",
        "search": "Search",
        "price": "Price",
        "currency": "EGP",
        "university": "University",
        "faculty": "Faculty"
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'ar',
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['localStorage', 'cookie', 'htmlTag', 'path', 'subdomain'],
      caches: ['localStorage']
    }
  });

// Handle RTL/LTR
i18n.on('languageChanged', (lng) => {
  document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = lng;
});

export default i18n;
