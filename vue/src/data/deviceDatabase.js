export const DEVICE_CATEGORIES = {
  SMARTPHONE: "smartphone",
  TABLET: "tablet",
  WEARABLE: "wearable",
};

const supportedPhones = (brand, models) => models.map(model => ({
  brand, model, category: DEVICE_CATEGORIES.SMARTPHONE, supportsEsim: true,
}));

export const DEVICE_DATABASE = [
  { brand: "Apple", model: "iPhone 17 Pro Max", category: DEVICE_CATEGORIES.SMARTPHONE, supportsEsim: true },
  { brand: "Samsung", model: "Galaxy S26 Ultra", category: DEVICE_CATEGORIES.SMARTPHONE, supportsEsim: true },
  { brand: "Apple", model: "Watch Series 11", category: DEVICE_CATEGORIES.WEARABLE, supportsEsim: true },
  { brand: "Apple", model: "iPad Pro 13 (M5, 2025)", category: DEVICE_CATEGORIES.TABLET, supportsEsim: true },
  { brand: "Xiaomi", model: "17 Ultra", category: DEVICE_CATEGORIES.SMARTPHONE, supportsEsim: true },
  { brand: "Google", model: "Pixel 10 Pro XL", category: DEVICE_CATEGORIES.SMARTPHONE, supportsEsim: true },
  { brand: "Samsung", model: "Galaxy Z Fold 7", category: DEVICE_CATEGORIES.SMARTPHONE, supportsEsim: true },
  { brand: "Apple", model: "Watch Ultra 3", category: DEVICE_CATEGORIES.WEARABLE, supportsEsim: true },
  { brand: "Apple", model: "iPad Air 13 (M3, 2025)", category: DEVICE_CATEGORIES.TABLET, supportsEsim: true },
  { brand: "Samsung", model: "Galaxy Watch 8", category: DEVICE_CATEGORIES.WEARABLE, supportsEsim: true },
  { brand: "Samsung", model: "Galaxy A54", category: DEVICE_CATEGORIES.SMARTPHONE, supportsEsim: true },
  { brand: "Samsung", model: "Galaxy S23", category: DEVICE_CATEGORIES.SMARTPHONE, supportsEsim: true },
  { brand: "Samsung", model: "Galaxy S23+", category: DEVICE_CATEGORIES.SMARTPHONE, supportsEsim: true },
  { brand: "Samsung", model: "Galaxy S23 Ultra", category: DEVICE_CATEGORIES.SMARTPHONE, supportsEsim: true },
  { brand: "Samsung", model: "Galaxy S22 Ultra 5G", category: DEVICE_CATEGORIES.SMARTPHONE, supportsEsim: true },
  { brand: "Apple", model: "iPhone 16 Pro", category: DEVICE_CATEGORIES.SMARTPHONE, supportsEsim: true },
  { brand: "Apple", model: "iPhone 16 Pro Max", category: DEVICE_CATEGORIES.SMARTPHONE, supportsEsim: true },
  { brand: "Apple", model: "iPhone 15 Pro Max", category: DEVICE_CATEGORIES.SMARTPHONE, supportsEsim: true },
  { brand: "Apple", model: "iPhone 14", category: DEVICE_CATEGORIES.SMARTPHONE, supportsEsim: true },
  { brand: "Apple", model: "iPhone 13 mini", category: DEVICE_CATEGORIES.SMARTPHONE, supportsEsim: true },
  { brand: "Apple", model: "iPhone 8 Plus", category: DEVICE_CATEGORIES.SMARTPHONE, supportsEsim: false },
  { brand: "Apple", model: "iPhone X", category: DEVICE_CATEGORIES.SMARTPHONE, supportsEsim: false },
  { brand: "Samsung", model: "Galaxy S20 FE", category: DEVICE_CATEGORIES.SMARTPHONE, supportsEsim: false },
  { brand: "Google", model: "Pixel 4a", category: DEVICE_CATEGORIES.SMARTPHONE, supportsEsim: true },
  { brand: "Google", model: "Pixel 10 Pro", category: DEVICE_CATEGORIES.SMARTPHONE, supportsEsim: true },
  { brand: "Apple", model: "Watch Ultra 2", category: DEVICE_CATEGORIES.WEARABLE, supportsEsim: true },
  { brand: "Huawei", model: "Watch 4 Pro", category: DEVICE_CATEGORIES.WEARABLE, supportsEsim: true },
  { brand: "Huawei", model: "MatePad Pro 13.2", category: DEVICE_CATEGORIES.TABLET, supportsEsim: false },
  // Model support: https://support.apple.com/en-us/118669
  // Regional versions can differ; the checker retains its region/EID hints.
  ...supportedPhones("Apple", [
    "iPhone XS", "iPhone XS Max", "iPhone XR",
    "iPhone 11", "iPhone 11 Pro", "iPhone 11 Pro Max",
    "iPhone 12", "iPhone 12 mini", "iPhone 12 Pro", "iPhone 12 Pro Max",
    "iPhone 13", "iPhone 13 Pro", "iPhone 13 Pro Max",
    "iPhone 14 Plus", "iPhone 14 Pro", "iPhone 14 Pro Max",
    "iPhone 15", "iPhone 15 Plus", "iPhone 15 Pro",
    "iPhone 16", "iPhone 16 Plus", "iPhone 16e",
    "iPhone 17", "iPhone 17 Pro", "iPhone Air",
  ]),
  // https://www.samsung.com/de/support/mobile-devices/galaxy-esim-und-untersttzte-netzbetreiber/
  ...supportedPhones("Samsung", [
    "Galaxy S20", "Galaxy S20+", "Galaxy S20 Ultra",
    "Galaxy S21", "Galaxy S21+", "Galaxy S21 Ultra",
    "Galaxy S22", "Galaxy S22+",
    "Galaxy S23 FE",
    "Galaxy S24", "Galaxy S24+", "Galaxy S24 Ultra", "Galaxy S24 FE",
    "Galaxy S25", "Galaxy S25+", "Galaxy S25 Ultra", "Galaxy S25 Edge", "Galaxy S25 FE",
    "Galaxy S26", "Galaxy S26+",
    "Galaxy Z Fold 3", "Galaxy Z Fold 4", "Galaxy Z Fold 5", "Galaxy Z Fold 6",
    "Galaxy Z Flip 3", "Galaxy Z Flip 4", "Galaxy Z Flip 5", "Galaxy Z Flip 6", "Galaxy Z Flip 7",
  ]),
];

export const POPULAR_DEVICE_NAMES = [
  "iPhone 17 Pro Max",
  "Samsung Galaxy S26 Ultra",
  "Apple Watch Series 11",
  "iPad Pro 13 (M5, 2025)",
  "Xiaomi 17 Ultra",
  "Google Pixel 10 Pro XL",
  "Samsung Galaxy Z Fold 7",
  "Apple Watch Ultra 3",
  "iPad Air 13 (M3, 2025)",
  "Samsung Galaxy Watch 8",
];
