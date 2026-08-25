// NIRMAYA Property Inspection - Global Configuration
const CONFIG = {
  // Web3Forms Access Key - used to send lead emails to nirmayapropertyinspection@gmail.com
  // This key is safe to be public — it can ONLY send emails to your registered Gmail address.
  // Get/replace your key at: https://web3forms.com/
  WEB3FORMS_ACCESS_KEY: "a18dbda5-748d-4cea-a446-9ababf25c970",

  // Supabase Credentials
  // Paste your Supabase Project URL and Anon Key here to enable database storage
  SUPABASE_URL: "",
  SUPABASE_ANON_KEY: "",

  // Google Forms Credentials
  // If you want submissions to go to Google Forms, paste your Form Response URL and Entry IDs here
  // Example: "https://docs.google.com/forms/u/0/d/e/1FAIpQLSfXXXXXX/formResponse"
  GOOGLE_FORM_URL: "",

  // Map your HTML form input names to the Google Form "entry.XXXX" field IDs
  GOOGLE_FORM_ENTRY_IDS: {
    name: "entry.1000000",       // Replace with actual entry ID from your Google Form
    phone: "entry.2000000",
    email: "entry.3000000",
    address: "entry.4000000",
    state: "entry.1300000",      // New state selector entry mapping
    location: "entry.5000000",
    propertyType: "entry.6000000",
    propertySize: "entry.7000000",
    builderName: "entry.8000000",
    inspectionType: "entry.9000000",
    preferredDate: "entry.1100000",
    message: "entry.1200000"
  }
};
