export type EgyptBroilerVaccineOption = {
  id: string;
  label: string;
  diseaseTarget: string;
  category: "core" | "additional";
  note: string;
};

/**
 * Reference targets for Egypt-market broiler programs. This is intentionally
 * a configurable catalog, not an automatic schedule or registration list.
 */
export const EGYPT_BROILER_VACCINE_OPTIONS: EgyptBroilerVaccineOption[] = [
  { id: "marek", label: "مارك (Marek’s disease)", diseaseTarget: "مرض مارك", category: "core", note: "خيار اليوم الأول يُحدده الطبيب البيطري وبرنامج المفرخ." },
  { id: "newcastle", label: "نيوكاسل (ND)", diseaseTarget: "مرض النيوكاسل", category: "core", note: "مرجع أساسي لبرامج التسمين المحلية؛ يحدد الطبيب السلالة والطريقة." },
  { id: "infectious-bronchitis", label: "التهاب الشعب المعدي (IB)", diseaseTarget: "التهاب الشعب المعدي", category: "core", note: "يحدد الطبيب العترة المناسبة للحالة والمنتج المعتمد." },
  { id: "gumboro", label: "الجمبورو / التهاب جراب فابريشيا (IBD)", diseaseTarget: "التهاب جراب فابريشيا", category: "core", note: "يحدد الطبيب البرنامج وفق المناعة الأمية والمخاطر المحلية." },
  { id: "nd-ib", label: "مركب نيوكاسل + التهاب شعب (ND + IB)", diseaseTarget: "نيوكاسل والتهاب الشعب المعدي", category: "core", note: "تحقق من المنتج والطريقة حسب البرنامج البيطري." },
  { id: "nd-ib-ibd", label: "مركب نيوكاسل + التهاب شعب + جمبورو (ND + IB + IBD)", diseaseTarget: "نيوكاسل والتهاب الشعب والجمبورو", category: "core", note: "مرجع لمنتجات مشتركة متاحة محلياً؛ لا يحدد توقيتاً تلقائياً." },
  { id: "avian-influenza-h5", label: "إنفلونزا الطيور H5", diseaseTarget: "إنفلونزا الطيور H5", category: "additional", note: "يُسجل فقط وفق متطلبات الجهات المختصة وخطة الطبيب البيطري." },
  { id: "avian-influenza-h9", label: "إنفلونزا الطيور H9", diseaseTarget: "إنفلونزا الطيور H9", category: "additional", note: "يُسجل فقط وفق متطلبات الجهات المختصة وخطة الطبيب البيطري." },
  { id: "ilt", label: "التهاب الحنجرة والقصبة المعدي (ILT)", diseaseTarget: "التهاب الحنجرة والقصبة", category: "additional", note: "برنامج اختياري بحسب تاريخ المزرعة وتقييم الطبيب." },
  { id: "reovirus", label: "ريو / التهاب الأوتار الفيروسي", diseaseTarget: "فيروس الريو", category: "additional", note: "برنامج اختياري بحسب تاريخ المزرعة وتقييم الطبيب." },
  { id: "coccidiosis", label: "كوكسيديا (لقاح حي)", diseaseTarget: "الكوكسيديا", category: "additional", note: "برنامج اختياري بحسب نظام الإنتاج وتقييم الطبيب." },
  { id: "other", label: "لقاح أو منتج آخر يحدده الطبيب البيطري", diseaseTarget: "اختيار مخصص", category: "additional", note: "أدخل اسم المنتج أو الهدف المرضي كما ورد في خطة الطبيب." },
];

export const CORE_EGYPT_BROILER_VACCINES = EGYPT_BROILER_VACCINE_OPTIONS.filter((item) => item.category === "core");
export const ADDITIONAL_EGYPT_BROILER_VACCINES = EGYPT_BROILER_VACCINE_OPTIONS.filter((item) => item.category === "additional");
