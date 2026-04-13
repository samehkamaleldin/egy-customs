const ar: Record<string, string> = {
  // App
  "app.title": "الجمارك المصرية",
  "app.subtitle": "جدول التعريفة الجمركية",

  // Navigation
  "nav.tariffSchedule": "جدول التعريفة",
  "nav.allTariffs": "جميع التعريفات",
  "nav.chapter": "باب",

  // Sidebar
  "sidebar.officialLabel": "الموقع الرسمي",
  "sidebar.officialName": "مصلحة الجمارك المصرية",

  // Search
  "search.placeholder": "ابحث برمز النظام المنسق أو كلمة…",

  // Filters
  "filter.tradeAgreements": "اتفاقيات تجارية",
  "filter.activeFilters": "التصفية النشطة:",
  "filter.ftaOnly": "اتفاقيات فقط",

  // Table
  "table.hsCode": "رمز النظام المنسق",
  "table.description": "الوصف",
  "table.category": "التصنيف",
  "table.importDuty": "ضريبة الوارد",
  "table.vat": "ض.ق.م",
  "table.fta": "اتفاقيات",
  "table.source": "المصدر",
  "table.noResults": "لا توجد نتائج",
  "table.noResultsHint": "حاول تعديل البحث أو التصفية",
  "table.free": "معفى",

  // Results
  "results.count": "نتيجة",
  "results.perPage": "لكل صفحة",
  "results.of": "من",
  "results.codes": "رمز",
  "results.chapters": "باب",
  "stats.taxEntries": "ضريبة",
  "stats.instructions": "تعليمة",

  // Detail dialog
  "detail.dutiesTaxes": "الرسوم والضرائب",
  "detail.type": "النوع",
  "detail.rate": "النسبة",
  "detail.tradeAgreements": "الاتفاقيات التجارية",
  "detail.regulations": "التعليمات الرقابية",
  "detail.viewOnGov": "عرض على موقع الجمارك",
  "detail.example": "مثال",
  "detail.estimatedTotal": "الإجمالي التقديري",
  "detail.disclaimer": "المبالغ تقديرية بناءً على قيمة جمركية — للاستخدام التوضيحي فقط",
  "detail.dialogDescription": "تفاصيل البند الجمركي",
  "detail.cascadingNote": "محسوبة على القيمة + الرسوم الجمركية",

  // Pagination
  "pagination.label": "التنقل بين الصفحات",
  "pagination.prev": "الصفحة السابقة",
  "pagination.next": "الصفحة التالية",
  "pagination.page": "صفحة",

  // Filter
  "filter.remove": "إزالة:",
  "filter.clearAll": "مسح التصفية",
  "filter.clearSearch": "مسح البحث",

  // Disclaimer
  "disclaimer.header": "غير رسمي — للاستخدام الاسترشادي فقط",
  "disclaimer.lastSync": "آخر تحديث",

  // Accessibility
  "a11y.skipToContent": "تخطي إلى المحتوى الرئيسي",

  // Sidebar sections
  "section.animalsAnimalProducts": "حيوانات ومنتجات حيوانية",
  "section.vegetableProducts": "منتجات نباتية",
  "section.fatsOils": "دهون وزيوت",
  "section.foodBeveragesTobacco": "أغذية ومشروبات وتبغ",
  "section.mineralProducts": "منتجات معدنية",
  "section.chemicals": "منتجات كيميائية",
  "section.plasticsRubber": "بلاستيك ومطاط",
  "section.hidesLeather": "جلود خام ومصنعة",
  "section.woodPaper": "خشب وورق",
  "section.textiles": "منسوجات",
  "section.footwearHeadgear": "أحذية وأغطية رأس",
  "section.stoneCeramicsGlass": "حجر وخزف وزجاج",
  "section.preciousMetals": "معادن ثمينة",
  "section.baseMetals": "معادن عادية",
  "section.machineryElectrical": "آلات ومعدات كهربائية",
  "section.transport": "معدات نقل",
  "section.instruments": "أجهزة وأدوات",
  "section.arms": "أسلحة وذخائر",
  "section.miscellaneous": "منوعات",
  "section.artAntiques": "تحف فنية وقطع أثرية",

  // Chapter names
  "ch.01": "حيوانات حية",
  "ch.02": "لحوم",
  "ch.03": "أسماك ومأكولات بحرية",
  "ch.04": "ألبان وبيض",
  "ch.05": "منتجات حيوانية",
  "ch.06": "نباتات حية",
  "ch.07": "خضروات",
  "ch.08": "فواكه ومكسرات",
  "ch.09": "بن وشاي",
  "ch.10": "حبوب",
  "ch.11": "منتجات مطاحن",
  "ch.12": "بذور زيتية",
  "ch.13": "صموغ وراتنجات",
  "ch.14": "مواد نباتية",
  "ch.15": "دهون وزيوت",
  "ch.16": "محضرات لحوم",
  "ch.17": "سكر",
  "ch.18": "كاكاو",
  "ch.19": "محضرات حبوب",
  "ch.20": "محضرات خضر",
  "ch.21": "محضرات غذائية",
  "ch.22": "مشروبات",
  "ch.23": "مخلفات ونفايات",
  "ch.24": "تبغ",
  "ch.25": "ملح ومعادن",
  "ch.26": "خامات ورماد",
  "ch.27": "وقود معدني",
  "ch.28": "كيماويات لا عضوية",
  "ch.29": "كيماويات عضوية",
  "ch.30": "أدوية",
  "ch.31": "أسمدة",
  "ch.32": "أصباغ",
  "ch.33": "مستحضرات تجميل",
  "ch.34": "صابون ومنظفات",
  "ch.35": "مواد زلالية",
  "ch.36": "متفجرات",
  "ch.37": "مواد تصوير",
  "ch.38": "منتجات كيميائية",
  "ch.39": "بلاستيك",
  "ch.40": "مطاط",
  "ch.41": "جلود خام",
  "ch.42": "مصنوعات جلدية",
  "ch.43": "فراء",
  "ch.44": "خشب",
  "ch.45": "فلين",
  "ch.46": "قش ومصنوعاته",
  "ch.47": "عجائن خشب",
  "ch.48": "ورق",
  "ch.49": "كتب مطبوعة",
  "ch.50": "حرير",
  "ch.51": "صوف",
  "ch.52": "قطن",
  "ch.53": "ألياف نباتية",
  "ch.54": "خيوط صناعية",
  "ch.55": "ألياف صناعية",
  "ch.56": "حشو ولباد",
  "ch.57": "سجاد",
  "ch.58": "أقمشة خاصة",
  "ch.59": "أقمشة مطلية",
  "ch.60": "أقمشة تريكو",
  "ch.61": "ملابس تريكو",
  "ch.62": "ملابس منسوجة",
  "ch.63": "مصنوعات نسيجية",
  "ch.64": "أحذية",
  "ch.65": "أغطية رأس",
  "ch.66": "مظلات",
  "ch.67": "ريش",
  "ch.68": "حجر وأسمنت",
  "ch.69": "خزف",
  "ch.70": "زجاج",
  "ch.71": "مجوهرات وأحجار كريمة",
  "ch.72": "حديد وصلب",
  "ch.73": "مصنوعات حديد وصلب",
  "ch.74": "نحاس",
  "ch.75": "نيكل",
  "ch.76": "ألومنيوم",
  "ch.78": "رصاص",
  "ch.79": "زنك",
  "ch.80": "قصدير",
  "ch.81": "معادن أخرى",
  "ch.82": "أدوات ومقصات",
  "ch.83": "مصنوعات معدنية متنوعة",
  "ch.84": "آلات ومعدات",
  "ch.85": "معدات كهربائية",
  "ch.86": "سكك حديدية",
  "ch.87": "مركبات",
  "ch.88": "طائرات",
  "ch.89": "سفن وقوارب",
  "ch.90": "أجهزة بصرية وطبية",
  "ch.91": "ساعات",
  "ch.92": "آلات موسيقية",
  "ch.93": "أسلحة وذخائر",
  "ch.94": "أثاث",
  "ch.95": "ألعاب",
  "ch.96": "منوعات مصنعة",
  "ch.97": "تحف فنية وآثار",
}

// Section key mapping
const SECTION_KEYS: Record<string, string> = {
  "Animals & Animal Products": "section.animalsAnimalProducts",
  "Vegetable Products": "section.vegetableProducts",
  "Fats & Oils": "section.fatsOils",
  "Food, Beverages, Tobacco": "section.foodBeveragesTobacco",
  "Mineral Products": "section.mineralProducts",
  "Chemicals": "section.chemicals",
  "Plastics & Rubber": "section.plasticsRubber",
  "Hides & Leather": "section.hidesLeather",
  "Wood & Paper": "section.woodPaper",
  "Textiles": "section.textiles",
  "Footwear & Headgear": "section.footwearHeadgear",
  "Stone, Ceramics, Glass": "section.stoneCeramicsGlass",
  "Precious Metals": "section.preciousMetals",
  "Base Metals": "section.baseMetals",
  "Machinery & Electrical": "section.machineryElectrical",
  "Transport": "section.transport",
  "Instruments": "section.instruments",
  "Arms": "section.arms",
  "Miscellaneous": "section.miscellaneous",
  "Art & Antiques": "section.artAntiques",
}

/** Translate a UI key to Arabic */
export function t(key: string): string {
  return ar[key] ?? key
}

/** Translate a section name (English → Arabic) */
export function tSection(name: string): string {
  const key = SECTION_KEYS[name]
  return key ? ar[key] ?? name : name
}

/** Translate a chapter number to Arabic name */
export function tChapter(ch: string): string {
  return ar[`ch.${ch}`] ?? ch
}

/** Format a number consistently: Western digits, comma thousands separator, no ٬ */
export function fmt(n: number): string {
  return n.toLocaleString("en-US")
}

/** Format currency (EGP) for the example bill */
export function fmtEGP(n: number): string {
  return fmt(n) + " ج.م"
}

/** Format a date string (YYYY-MM-DD) as Arabic textual date (١٣ أبريل ٢٠٢٦) */
export function fmtDateAr(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00")
  return d.toLocaleDateString("ar-EG", { day: "numeric", month: "long", year: "numeric" })
}
