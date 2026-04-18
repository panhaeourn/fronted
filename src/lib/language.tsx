import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type AppLanguage = "en" | "km";

type LanguageContextValue = {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  t: (key: TranslationKey, replacements?: Record<string, string | number>) => string;
};

type TranslationValue = string;

const translations = {
  en: {
    "app.dashboard": "Dashboard",
    "app.courses": "Courses",
    "app.login": "Login",
    "app.register": "Register",
    "app.claimReceptionist": "Claim Receptionist",
    "app.admin": "ADMIN",
    "app.reception": "RECEPTION",
    "app.manageCourse": "Manage Course",
    "app.manageReceptionist": "Manage Receptionist",
    "app.paymentHistory": "Payment History",
    "app.allReceipts": "All Receipts",
    "app.newReceipt": "New CITO Receipt",
    "app.receiptList": "Receipt List",
    "app.studentMoneySummary": "Student Money Summary",
    "app.settings": "Settings",
    "app.logout": "Logout",
    "app.role": "Role",
    "app.expandSidebar": "Expand sidebar",
    "app.collapseSidebar": "Collapse sidebar",
    "app.confirmLogoutTitle": "Log out?",
    "app.confirmLogoutMessage":
      "You are about to sign out of your account. You can log back in anytime.",
    "app.signedInAs": "Signed in as",

    "settings.title": "Account Settings",
    "settings.subtitle":
      "Manage your profile, security preferences, notification choices, and overall experience in one place.",
    "settings.titleShort": "Settings",
    "settings.currentSection": "Current Section",
    "settings.signInPrompt":
      "Sign in to manage your profile, notifications, appearance, and account preferences.",
    "settings.needSignIn": "You need to sign in first",
    "settings.needSignInDesc": "Settings are only available for authenticated users.",
    "settings.profile": "Profile",
    "settings.profileDesc": "Name, email, username, and role",
    "settings.security": "Security",
    "settings.securityDesc": "Account safety and sign-in guidance",
    "settings.notifications": "Notifications",
    "settings.notificationsDesc": "Choose what updates you want to see",
    "settings.appearance": "Appearance",
    "settings.appearanceDesc": "Control dark mode and display feel",
    "settings.help": "Help",
    "settings.helpDesc": "Support, guides, and contact info",
    "settings.fullName": "Full Name",
    "settings.username": "Username",
    "settings.emailAddress": "Email Address",
    "settings.signInMethod": "Sign-in Method",
    "settings.primaryIdentity": "Primary Identity",
    "settings.accessLevel": "Access Level",
    "settings.recommendation": "Recommendation",
    "settings.protectedSession": "Protected account session",
    "settings.strongPassword": "Use a strong password and trusted device",
    "settings.securityGuidance": "Security guidance",
    "settings.securityGuide1": "Sign out when using a shared computer.",
    "settings.securityGuide2":
      "Do not share receptionist or admin access with other people.",
    "settings.securityGuide3":
      "Review your email account security regularly if it is used for login or recovery.",
    "settings.paymentAlerts": "Payment alerts",
    "settings.paymentAlertsDesc":
      "Get notified when new payment receipts are created or updated.",
    "settings.courseUpdates": "Course updates",
    "settings.courseUpdatesDesc":
      "See reminders and changes related to course catalog or purchased classes.",
    "settings.systemAnnouncements": "System announcements",
    "settings.systemAnnouncementsDesc":
      "Receive general notices about the platform and office operations.",
    "settings.language": "Language",
    "settings.languageDesc":
      "Choose the interface language you want to use. Khmer is ready to select here.",
    "settings.english": "English",
    "settings.englishDesc": "Default interface language.",
    "settings.khmer": "Khmer",
    "settings.khmerDesc": "Use Khmer as your preferred language selection.",
    "settings.darkMode": "Dark Mode",
    "settings.darkModeDesc": "Best for focus and low-light work.",
    "settings.lightMode": "Light Mode",
    "settings.lightModeDesc": "Bright and clean for daytime work.",
    "settings.currentAppearance": "Current appearance",
    "settings.currentAppearanceText":
      "Your interface is using <mode>. This preference is saved on this device.",
    "settings.selectedLanguage": "Selected language: <language>.",
    "settings.supportContact": "Support Contact",
    "settings.phoneNumber": "Phone Number",
    "settings.telegram": "Telegram",
    "settings.telegramValue": "Telegram support: 070458142",
    "settings.facebook": "Facebook",
    "settings.openFacebook": "Open Facebook Contact",
    "settings.needHelp": "Need help with something specific?",
    "settings.help1": "Profile: review your displayed name, username, and email.",
    "settings.help2": "Security: protect your account and work only on trusted devices.",
    "settings.help3": "Notifications: keep the alerts you actually need.",
    "settings.help4": "Appearance: switch between dark and light mode anytime.",
    "settings.help5":
      "Support: contact Eourn Panha by phone, Telegram, or Facebook for assistance.",

    "auth.welcomeBack": "Welcome Back",
    "auth.joinPlatform": "Join The Platform",
    "auth.loginTitle": "Login",
    "auth.registerTitle": "Register",
    "auth.loginSubtitle":
      "Continue with your email and password or use Google authentication.",
    "auth.registerSubtitle":
      "Create your account with username, email, phone number, and password.",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.username": "Username",
    "auth.phone": "Phone Number",
    "auth.emailPlaceholder": "you@example.com",
    "auth.passwordPlaceholder": "Enter password",
    "auth.usernamePlaceholder": "Enter username",
    "auth.phonePlaceholder": "Enter phone number",
    "auth.createPassword": "Create password",
    "auth.needAccount": "Need an account?",
    "auth.haveAccount": "Already have an account?",
    "auth.or": "OR",
    "auth.loginSuccess": "Login success. Token saved.",
    "auth.loginFailed": "Login failed",
    "auth.loading": "Loading...",
    "auth.registerSuccess": "Registered successfully",
    "auth.registerFailed": "Register failed",

    "home.loading": "Loading dashboard...",
    "home.retry": "Retry",
    "home.pleaseLogIn": "Please log in.",
    "home.welcome": "Welcome",
    "home.guestAccess": "Guest Access",
    "home.registerPrompt": "Register to See Courses",
    "home.registerPromptDesc":
      "Create a student account to browse available courses, unlock learning content, and access your personal dashboard. If you already have an account, sign in to continue.",
    "home.viewCoursePage": "View Course Page",
    "home.refreshing": "Refreshing...",
    "home.refreshDashboard": "Refresh Dashboard",
    "home.quickStats": "Quick Stats",
    "home.quickActions": "Quick Actions",
    "home.noRecentActivity": "No recent activity found.",
    "home.noStatusData": "No status data available.",
    "home.noRecords": "No records available.",
  },
  km: {
    "app.dashboard": "ផ្ទាំងគ្រប់គ្រង",
    "app.courses": "វគ្គសិក្សា",
    "app.login": "ចូលគណនី",
    "app.register": "បង្កើតគណនី",
    "app.claimReceptionist": "ស្នើសុំជាអ្នកទទួលភ្ញៀវ",
    "app.admin": "អ្នកគ្រប់គ្រង",
    "app.reception": "ទទួលភ្ញៀវ",
    "app.manageCourse": "គ្រប់គ្រងវគ្គសិក្សា",
    "app.manageReceptionist": "គ្រប់គ្រងអ្នកទទួលភ្ញៀវ",
    "app.paymentHistory": "ប្រវត្តិបង់ប្រាក់",
    "app.allReceipts": "បង្កាន់ដៃទាំងអស់",
    "app.newReceipt": "បង្កើតបង្កាន់ដៃ CITO ថ្មី",
    "app.receiptList": "បញ្ជីបង្កាន់ដៃ",
    "app.studentMoneySummary": "Student Money Summary",
    "app.settings": "ការកំណត់",
    "app.logout": "ចេញពីគណនី",
    "app.role": "តួនាទី",
    "app.expandSidebar": "បង្ហាញម៉ឺនុយ",
    "app.collapseSidebar": "បង្រួមម៉ឺនុយ",
    "app.confirmLogoutTitle": "ចង់ចេញពីគណនី?",
    "app.confirmLogoutMessage":
      "អ្នកកំពុងតែចាកចេញពីគណនីនេះ។ អ្នកអាចចូលម្ដងទៀតបានគ្រប់ពេល។",
    "app.signedInAs": "បានចូលជា",

    "settings.title": "ការកំណត់គណនី",
    "settings.subtitle":
      "គ្រប់គ្រងប្រវត្តិរូប សុវត្ថិភាព ការជូនដំណឹង និងបទពិសោធន៍ប្រើប្រាស់របស់អ្នកនៅកន្លែងតែមួយ។",
    "settings.titleShort": "ការកំណត់",
    "settings.currentSection": "ផ្នែកបច្ចុប្បន្ន",
    "settings.signInPrompt":
      "សូមចូលគណនីជាមុន ដើម្បីគ្រប់គ្រងប្រវត្តិរូប ការជូនដំណឹង រូបរាង និងចំណូលចិត្តគណនី។",
    "settings.needSignIn": "ត្រូវចូលគណនីជាមុន",
    "settings.needSignInDesc": "ការកំណត់អាចប្រើបានសម្រាប់អ្នកដែលបានចូលគណនីប៉ុណ្ណោះ។",
    "settings.profile": "ប្រវត្តិរូប",
    "settings.profileDesc": "ឈ្មោះ អ៊ីមែល ឈ្មោះអ្នកប្រើ និងតួនាទី",
    "settings.security": "សុវត្ថិភាព",
    "settings.securityDesc": "សុវត្ថិភាពគណនី និងការណែនាំពេលចូលប្រើ",
    "settings.notifications": "ការជូនដំណឹង",
    "settings.notificationsDesc": "ជ្រើសរើសព័ត៌មានដែលអ្នកចង់ទទួល",
    "settings.appearance": "រូបរាង",
    "settings.appearanceDesc": "គ្រប់គ្រងរបៀបងងឹត និងរូបរាងអេក្រង់",
    "settings.help": "ជំនួយ",
    "settings.helpDesc": "ការគាំទ្រ មគ្គុទ្ទេសក៍ និងព័ត៌មានទំនាក់ទំនង",
    "settings.fullName": "ឈ្មោះពេញ",
    "settings.username": "ឈ្មោះអ្នកប្រើ",
    "settings.emailAddress": "អាសយដ្ឋានអ៊ីមែល",
    "settings.signInMethod": "វិធីចូលប្រើ",
    "settings.primaryIdentity": "អត្តសញ្ញាណចម្បង",
    "settings.accessLevel": "កម្រិតសិទ្ធិ",
    "settings.recommendation": "អនុសាសន៍",
    "settings.protectedSession": "សម័យចូលប្រើដែលមានការការពារ",
    "settings.strongPassword": "ប្រើពាក្យសម្ងាត់ខ្លាំង និងឧបករណ៍ដែលទុកចិត្ត",
    "settings.securityGuidance": "ការណែនាំសុវត្ថិភាព",
    "settings.securityGuide1": "សូមចេញពីគណនីនៅពេលប្រើកុំព្យូទ័ររួម។",
    "settings.securityGuide2": "កុំចែករំលែកសិទ្ធិអ្នកទទួលភ្ញៀវ ឬអ្នកគ្រប់គ្រងឲ្យអ្នកផ្សេង។",
    "settings.securityGuide3": "ពិនិត្យសុវត្ថិភាពអ៊ីមែលរបស់អ្នកជាប្រចាំ ប្រសិនបើវាត្រូវបានប្រើសម្រាប់ចូល ឬស្តារគណនី។",
    "settings.paymentAlerts": "ការជូនដំណឹងបង់ប្រាក់",
    "settings.paymentAlertsDesc": "ទទួលព័ត៌មាននៅពេលបង្កើត ឬកែប្រែបង្កាន់ដៃបង់ប្រាក់ថ្មី។",
    "settings.courseUpdates": "បច្ចុប្បន្នភាពវគ្គសិក្សា",
    "settings.courseUpdatesDesc": "ទទួលការរំលឹក និងការផ្លាស់ប្តូរពាក់ព័ន្ធនឹងកាតាឡុកវគ្គសិក្សា ឬថ្នាក់ដែលបានទិញ។",
    "settings.systemAnnouncements": "សេចក្តីជូនដំណឹងប្រព័ន្ធ",
    "settings.systemAnnouncementsDesc": "ទទួលព័ត៌មានទូទៅអំពីប្រព័ន្ធ និងការិយាល័យ។",
    "settings.language": "ភាសា",
    "settings.languageDesc": "ជ្រើសរើសភាសាដែលអ្នកចង់ប្រើសម្រាប់ផ្ទាំងកម្មវិធី។",
    "settings.english": "អង់គ្លេស",
    "settings.englishDesc": "ភាសាលំនាំដើមសម្រាប់ផ្ទាំងកម្មវិធី។",
    "settings.khmer": "ខ្មែរ",
    "settings.khmerDesc": "ប្រើភាសាខ្មែរសម្រាប់ផ្ទាំងកម្មវិធី។",
    "settings.darkMode": "របៀបងងឹត",
    "settings.darkModeDesc": "សមស្របសម្រាប់ការផ្តោតអារម្មណ៍ និងការប្រើប្រាស់ពន្លឺតិច។",
    "settings.lightMode": "របៀបភ្លឺ",
    "settings.lightModeDesc": "ភ្លឺ ស្អាត និងសមស្របសម្រាប់ការងារពេលថ្ងៃ។",
    "settings.currentAppearance": "រូបរាងបច្ចុប្បន្ន",
    "settings.currentAppearanceText":
      "ផ្ទាំងកម្មវិធីរបស់អ្នកកំពុងប្រើ <mode>។ ការកំណត់នេះត្រូវបានរក្សាទុកលើឧបករណ៍នេះ។",
    "settings.selectedLanguage": "ភាសាដែលបានជ្រើសរើស៖ <language>។",
    "settings.supportContact": "អ្នកផ្តល់ជំនួយ",
    "settings.phoneNumber": "លេខទូរស័ព្ទ",
    "settings.telegram": "តេលេក្រាម",
    "settings.telegramValue": "ជំនួយតាម Telegram៖ 070458142",
    "settings.facebook": "ហ្វេសប៊ុក",
    "settings.openFacebook": "បើកទំនាក់ទំនង Facebook",
    "settings.needHelp": "ត្រូវការជំនួយលម្អិត?",
    "settings.help1": "ប្រវត្តិរូប៖ ពិនិត្យឈ្មោះ ឈ្មោះអ្នកប្រើ និងអ៊ីមែលដែលបានបង្ហាញ។",
    "settings.help2": "សុវត្ថិភាព៖ ការពារគណនីរបស់អ្នក និងប្រើតែឧបករណ៍ដែលទុកចិត្ត។",
    "settings.help3": "ការជូនដំណឹង៖ រក្សាទុកតែការជូនដំណឹងដែលអ្នកពិតជាត្រូវការ។",
    "settings.help4": "រូបរាង៖ ប្តូររវាងរបៀបងងឹត និងភ្លឺបានគ្រប់ពេល។",
    "settings.help5": "ជំនួយ៖ ទាក់ទង Eourn Panha តាមទូរស័ព្ទ Telegram ឬ Facebook សម្រាប់ជំនួយ។",

    "auth.welcomeBack": "សូមស្វាគមន៍ត្រឡប់មកវិញ",
    "auth.joinPlatform": "ចូលរួមជាមួយប្រព័ន្ធ",
    "auth.loginTitle": "ចូលគណនី",
    "auth.registerTitle": "បង្កើតគណនី",
    "auth.loginSubtitle":
      "បន្តដោយប្រើអ៊ីមែល និងពាក្យសម្ងាត់របស់អ្នក ឬប្រើការផ្ទៀងផ្ទាត់ Google។",
    "auth.registerSubtitle":
      "បង្កើតគណនីរបស់អ្នកដោយប្រើឈ្មោះអ្នកប្រើ អ៊ីមែល លេខទូរស័ព្ទ និងពាក្យសម្ងាត់។",
    "auth.email": "អ៊ីមែល",
    "auth.password": "ពាក្យសម្ងាត់",
    "auth.username": "ឈ្មោះអ្នកប្រើ",
    "auth.phone": "លេខទូរស័ព្ទ",
    "auth.emailPlaceholder": "អ្នក@example.com",
    "auth.passwordPlaceholder": "បញ្ចូលពាក្យសម្ងាត់",
    "auth.usernamePlaceholder": "បញ្ចូលឈ្មោះអ្នកប្រើ",
    "auth.phonePlaceholder": "បញ្ចូលលេខទូរស័ព្ទ",
    "auth.createPassword": "បង្កើតពាក្យសម្ងាត់",
    "auth.needAccount": "មិនទាន់មានគណនី?",
    "auth.haveAccount": "មានគណនីរួចហើយ?",
    "auth.or": "ឬ",
    "auth.loginSuccess": "ចូលគណនីជោគជ័យ។ Token ត្រូវបានរក្សាទុក។",
    "auth.loginFailed": "ចូលគណនីបរាជ័យ",
    "auth.loading": "កំពុងដំណើរការ...",
    "auth.registerSuccess": "បង្កើតគណនីជោគជ័យ",
    "auth.registerFailed": "បង្កើតគណនីបរាជ័យ",

    "home.loading": "កំពុងផ្ទុកផ្ទាំងគ្រប់គ្រង...",
    "home.retry": "ព្យាយាមម្ដងទៀត",
    "home.pleaseLogIn": "សូមចូលគណនី។",
    "home.welcome": "សូមស្វាគមន៍",
    "home.guestAccess": "សិទ្ធិភ្ញៀវ",
    "home.registerPrompt": "ចុះឈ្មោះដើម្បីមើលវគ្គសិក្សា",
    "home.registerPromptDesc":
      "បង្កើតគណនីសិស្ស ដើម្បីមើលវគ្គសិក្សា បើកមាតិកាសិក្សា និងប្រើផ្ទាំងផ្ទាល់ខ្លួនរបស់អ្នក។ បើមានគណនីរួចហើយ សូមចូលប្រើបន្ត។",
    "home.viewCoursePage": "មើលទំព័រវគ្គសិក្សា",
    "home.refreshing": "កំពុងផ្ទុកឡើងវិញ...",
    "home.refreshDashboard": "ផ្ទុកផ្ទាំងឡើងវិញ",
    "home.quickStats": "ស្ថិតិរហ័ស",
    "home.quickActions": "សកម្មភាពរហ័ស",
    "home.noRecentActivity": "មិនមានសកម្មភាពថ្មីៗទេ។",
    "home.noStatusData": "មិនមានទិន្នន័យស្ថានភាពទេ។",
    "home.noRecords": "មិនមានទិន្នន័យទេ។",
  },
} satisfies Record<AppLanguage, Record<string, TranslationValue>>;

type TranslationKey = keyof typeof translations.en;

const LanguageContext = createContext<LanguageContextValue | null>(null);

function interpolate(template: string, replacements?: Record<string, string | number>) {
  if (!replacements) return template;
  return Object.entries(replacements).reduce(
    (result, [key, value]) => result.replaceAll(`<${key}>`, String(value)),
    template
  );
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<AppLanguage>(() => {
    const saved = localStorage.getItem("settings-language");
    return saved === "km" ? "km" : "en";
  });

  useEffect(() => {
    localStorage.setItem("settings-language", language);
    document.documentElement.setAttribute("lang", language === "km" ? "km" : "en");
  }, [language]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage,
      t: (key, replacements) => {
        const template = translations[language][key] || translations.en[key] || key;
        return interpolate(template, replacements);
      },
    }),
    [language]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }
  return context;
}
