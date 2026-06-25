export type SectionId = "plumbing" | "electric" | "building";

export type Section = {
  id: SectionId;
  name: string;
  headline: string;
  summary: string;
  icon: string;
  color: string;
  subcategories: string[];
};

export type Product = {
  id: string;
  name: string;
  sectionId: SectionId;
  subcategory: string;
  price: string;
  description: string;
  image: string;
  featured: boolean;
  updatedAt: string;
};

export type Agent = {
  id: string;
  province: string;
  name: string;
  phone: string;
  address: string;
  logo?: string;
};

export type Banner = {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  cta: string;
  link: string;
  expires: string;
};

export type Message = {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  read: boolean;
  createdAt: string;
};

export type Settings = {
  siteName: string;
  logoText: string;
  tagline: string;
  primaryColor: string;
  secondaryColor: string;
  contactPhone: string;
  whatsapp: string;
  email: string;
  address: string;
  facebook: string;
  instagram: string;
  youtube: string;
  mapEmbed: string;
  aboutVideo: string;
  founded: string;
  aboutStory: string;
  aboutVision: string;
  aboutMission: string;
};

export type AdminUser = {
  username: string;
  password: string;
  role: "admin";
};

export const STORAGE_KEYS = {
  settings: "royal-settings-v1",
  sections: "royal-sections-v1",
  products: "royal-products-v1",
  agents: "royal-agents-v1",
  banners: "royal-banners-v1",
  messages: "royal-messages-v1",
  auth: "royal-auth-v1",
} as const;

export const governorates = [
  "صنعاء",
  "عدن",
  "تعز",
  "حضرموت",
  "إب",
  "الضالع",
  "البيضاء",
  "مأرب",
  "الجوف",
  "صعدة",
  "عمران",
  "ذمار",
  "الحديدة",
  "لحج",
  "أبين",
  "شبوة",
  "المهرة",
  "ريمة",
  "المحويت",
  "حجة",
  "سقطرى",
] as const;

const photos = {
  warehouse: "imag/WhatsApp Image 2026-06-24 at 2.25.56 AM.jpeg",
  pipes: "imag/WhatsApp Image 2026-06-24 at 2.25.57 AM (3).jpeg",
  copper: "imag/WhatsApp Image 2026-06-24 at 1.50.45 AM (1).jpeg",
  electricalPanel: "imag/WhatsApp Image 2026-06-24 at 1.50.42 AM (2).jpeg",
  meter: "imag/WhatsApp Image 2026-06-24 at 2.25.56 AM.jpeg",
  bulbs: "imag/WhatsApp Image 2026-06-24 at 2.25.54 AM.jpeg",
  rebar: "imag/WhatsApp Image 2026-06-24 at 2.25.57 AM (3).jpeg",
  workers: "imag/WhatsApp Image 2026-06-24 at 1.50.47 AM.jpeg",
  blocks: "imag/WhatsApp Image 2026-06-24 at 1.50.45 AM.jpeg",
  lights: "imag/WhatsApp Image 2026-06-24 at 1.50.42 AM.jpeg",
} as const;

const withDate = (daysAgo: number) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
};

const buildId = (prefix: string, index: number) => `${prefix}-${index + 1}`;

export const defaultSections: Section[] = [
  {
    id: "plumbing",
    name: "السباكة",
    headline: "حلول سباكة موثوقة للمشاريع السكنية والتجارية",
    summary: "مواسير، محابس، خلاطات، تجهيزات صحية وخزانات مياه بجودة عالية وتوريد سريع.",
    icon: "droplet",
    color: "#1d4ed8",
    subcategories: ["PVC", "حديد", "بلاستيك", "نحاس", "محابس وخلاطات", "تنوات صحية", "خزانات مياه"],
  },
  {
    id: "electric",
    name: "الكهرباء",
    headline: "منتجات كهربائية تعتمد عليها فرق التنفيذ اليومية",
    summary: "أسلاك، قواطع، لوحات توزيع، إنارة وأدوات تركيب من علامات تجارية موثوقة.",
    icon: "bolt",
    color: "#2563eb",
    subcategories: ["معزولة", "مضفرة", "أرضي", "مفاتيح إضاءة", "كوابح حماية", "LED", "لوحات توزيع", "عدادات كهرباء", "أدوات تركيب"],
  },
  {
    id: "building",
    name: "مواد البناء",
    headline: "توريد مواد البناء الأساسية لمواقع العمل ومشاريع المقاولات",
    summary: "حديد تسليح، أسمنت، رمل وزلط، بلوك، عزل، دهانات وأدوات تنفيذ.",
    icon: "building",
    color: "#64748b",
    subcategories: ["حديد تسليح", "أسمنت", "رمل وزلط وبحص", "طابوق وبلوك", "مواد عازلة", "دهانات", "أدوات بناء"],
  },
];

const makeProduct = (
  index: number,
  overrides: Omit<Product, "id" | "updatedAt">,
): Product => ({
  id: buildId("product", index),
  updatedAt: withDate(index),
  ...overrides,
});

export const defaultProducts: Product[] = [
  makeProduct(0, {
    name: "مواسير PVC ضغط عالٍ 110 مم",
    sectionId: "plumbing",
    subcategory: "PVC",
    price: "",
    description: "مواسير مخصصة لمشاريع الصرف والتمديدات الرئيسية مع تحمل ممتاز للاستخدام الطويل.",
    image: photos.pipes,
    featured: true,
  }),
  makeProduct(1, {
    name: "مواسير حديد مجلفن 3/4",
    sectionId: "plumbing",
    subcategory: "حديد",
    price: "",
    description: "مواسير حديد مناسبة لخطوط المياه والتمديدات الصناعية مع طبقة حماية متينة.",
    image: photos.warehouse,
    featured: false,
  }),
  makeProduct(2, {
    name: "لفات نحاس للتوصيلات الصحية",
    sectionId: "plumbing",
    subcategory: "نحاس",
    price: "",
    description: "حل عملي للتوصيلات الدقيقة في الحمامات والمطابخ مع مقاومة عالية للتآكل.",
    image: photos.copper,
    featured: true,
  }),
  makeProduct(3, {
    name: "خلاط مطبخ كروم فاخر",
    sectionId: "plumbing",
    subcategory: "محابس وخلاطات",
    price: "",
    description: "خلاط مطبخ بتشطيب كروم أنيق وذراع حركة ناعمة للاستخدام اليومي.",
    image: photos.pipes,
    featured: false,
  }),
  makeProduct(4, {
    name: "سيفون أرضي وصرف صحي",
    sectionId: "plumbing",
    subcategory: "تنوات صحية",
    price: "7,500 ر.ي",
    description: "سيفون مناسب للأحواض وأعمال الصرف الداخلية مع تركيب سريع وصيانة سهلة.",
    image: photos.pipes,
    featured: false,
  }),
  makeProduct(5, {
    name: "خزان مياه بلاستيك 1000 لتر",
    sectionId: "plumbing",
    subcategory: "خزانات مياه",
    price: "",
    description: "خزان معزول للاستخدام المنزلي والمشاريع الصغيرة مع خامة غذائية آمنة.",
    image: photos.warehouse,
    featured: true,
  }),
  makeProduct(6, {
    name: "سلك نحاس معزول 2.5 مم",
    sectionId: "electric",
    subcategory: "معزولة",
    price: "",
    description: "سلك مخصص للتمديدات الداخلية مع كفاءة ممتازة في نقل التيار واستقرار التشغيل.",
    image: photos.electricalPanel,
    featured: true,
  }),
  makeProduct(7, {
    name: "كيبل أرضي مدرع 16 مم",
    sectionId: "electric",
    subcategory: "أرضي",
    price: "",
    description: "كيبل أرضي مناسب للمشاريع الثقيلة وشبكات التوزيع الخارجية.",
    image: photos.electricalPanel,
    featured: false,
  }),
  makeProduct(8, {
    name: "طقم مفاتيح ومخارج فاخر",
    sectionId: "electric",
    subcategory: "مفاتيح إضاءة",
    price: "",
    description: "تصميم أنيق مع أداء ثابت ومناسب للفلل والمكاتب الحديثة.",
    image: photos.lights,
    featured: false,
  }),
  makeProduct(9, {
    name: "قاطع حماية أوتوماتيك 32 أمبير",
    sectionId: "electric",
    subcategory: "كوابح حماية",
    price: "",
    description: "قاطع عالي الاعتمادية لحماية الدوائر الكهربائية والأحمال المتوسطة.",
    image: photos.electricalPanel,
    featured: true,
  }),
  makeProduct(10, {
    name: "لوحة توزيع 12 خط",
    sectionId: "electric",
    subcategory: "لوحات توزيع",
    price: "",
    description: "لوحة توزيع جاهزة للتركيب مع تنظيم داخلي آمن وسهل الصيانة.",
    image: photos.meter,
    featured: false,
  }),
  makeProduct(11, {
    name: "عداد كهرباء رقمي",
    sectionId: "electric",
    subcategory: "عدادات كهرباء",
    price: "",
    description: "عداد موثوق للمراقبة والقياس مع شاشة قراءة واضحة واستهلاك منخفض.",
    image: photos.meter,
    featured: false,
  }),
  makeProduct(12, {
    name: "مبة LED موفرة 18 واط",
    sectionId: "electric",
    subcategory: "LED",
    price: "",
    description: "إنارة اقتصادية بعمر تشغيلي طويل وتوزيع ضوئي مريح للمساحات الداخلية.",
    image: photos.bulbs,
    featured: true,
  }),
  makeProduct(13, {
    name: "حديد تسليح 12 مم",
    sectionId: "building",
    subcategory: "حديد تسليح",
    price: "",
    description: "حديد تسليح للمشاريع الإنشائية مع توازن جيد بين المتانة وسهولة الاستخدام.",
    image: photos.rebar,
    featured: true,
  }),
  makeProduct(14, {
    name: "أسمنت بورتلاندي 50 كجم",
    sectionId: "building",
    subcategory: "أسمنت",
    price: "",
    description: "أسمنت متعدد الاستخدامات مناسب للمباني والأعمال الخرسانية المختلفة.",
    image: photos.workers,
    featured: false,
  }),
  makeProduct(15, {
    name: "رمل مغسول للمشاريع",
    sectionId: "building",
    subcategory: "رمل وزلط وبحص",
    price: "000 ر.ي",
    description: "رمل نظيف ومناسب لأعمال الخرسانة واللياسة مع جاهزية للتوريد بالمواقع.",
    image: photos.blocks,
    featured: false,
  }),
  makeProduct(16, {
    name: "بلوك أسمنتي 20 سم",
    sectionId: "building",
    subcategory: "طابوق وبلوك",
    price: "10 ر.ي",
    description: "بلوك أسمنتي بجودة مناسبة للجدران الداخلية والخارجية في المشاريع المختلفة.",
    image: photos.blocks,
    featured: false,
  }),
  makeProduct(17, {
    name: "لفافة عزل مائي",
    sectionId: "building",
    subcategory: "مواد عازلة",
    price: "",
    description: "حل فعال للعزل من الماء والرطوبة في الأسطح والخزانات والأساسات.",
    image: photos.warehouse,
    featured: false,
  }),
  makeProduct(18, {
    name: "دهان أكريليك للجدران",
    sectionId: "building",
    subcategory: "دهانات",
    price: "",
    description: "دهان تشطيب سريع الجفاف بألوان ثابتة ومناسبة للمشاريع السكنية والتجارية.",
    image: photos.workers,
    featured: false,
  }),
  makeProduct(19, {
    name: "عربة بناء معدنية",
    sectionId: "building",
    subcategory: "أدوات بناء",
    price: "",
    description: "أداة مساعدة مثالية لنقل المواد داخل موقع العمل بسهولة وسرعة.",
    image: photos.blocks,
    featured: true,
  }),
];

const buildAgent = (index: number, province: string, name: string, address: string, logo?: string): Agent => ({
  id: buildId("agent", index),
  province,
  name,
  phone: ["+967 784414445", "+967 784414445", "+967 784414445", "+967 784414445", "+967 784414445"][
    index % 5
  ],
  address,
  logo,
});

export const defaultAgents: Agent[] = governorates.flatMap((province, index) => {
  const names = [
    "مؤسسة رويال للتوزيع",
    "شركة الريادة للمستلزمات",
    "مؤسسة الصفوة التجارية",
    "النجمة الذهبية للمواد",
    "المنارة للتجارة والتوريد",
  ];

  const base = buildAgent(
    index,
    province,
    `${names[index % names.length]} - ${province}`,
    `حي السوق الرئيسي، ${province}`,
    index % 4 === 0 ? photos.warehouse : undefined,
  );

  if (!["صنعاء", "عدن", "تعز", "حضرموت"].includes(province)) {
    return [base];
  }

  const second = buildAgent(
    100 + index,
    province,
    `مؤسسة المدى الحديثة - ${province}`,
    `منطقة التوزيع الصناعي، ${province}`,
    index % 2 === 0 ? photos.pipes : undefined,
  );

  return [base, second];
});

export const defaultBanners: Banner[] = [
  {
    id: "banner-1",
    title: "Royal for Pipes & Building Materials",
    subtitle: "حلول متكاملة للمواسير وأدوات السباكة والكهرباء ومواد البناء مع توريد سريع للمشاريع.",
    image: photos.warehouse,
    cta: "استعرض المنتجات",
    link: "#products",
    expires: "",
  },
  {
    id: "banner-2",
    title: "منتجات سباكة معتمدة للمنازل والمشاريع",
    subtitle: "مواسير، محابس، خلاطات، خزانات وأكسسوارات تنفيذ بجودة موثوقة وسعر منافس.",
    image: photos.copper,
    cta: "تواصل مع فريق المبيعات",
    link: "#contact",
    expires: "",
  },
  {
    id: "banner-3",
    title: "مواد بناء وكهرباء جاهزة للتوريد",
    subtitle: "من مواد الأساس حتى التشطيبات النهائية مع شبكة وكلاء تغطي المحافظات اليمنية.",
    image: photos.blocks,
    cta: "اعرف أقرب وكيل",
    link: "#agents",
    expires: "",
  },
];

export const defaultSettings: Settings = {
  siteName: "Royal for Pipes & Building Materials",
  logoText: "Royal",
  tagline: "حلول موثوقة للمواسير والسباكة والكهرباء ومواد البناء",
  primaryColor: "#1d4ed8",
  secondaryColor: "#cbd5e1",
  contactPhone: "+967 784414445",
  whatsapp: "+967 784414445",
  email: "info@royal-yemen.com",
  address: "شارع الستين، صنعاء - الجمهورية اليمنية",
  facebook: "https://facebook.com",
  instagram: "https://instagram.com",
  youtube: "https://youtube.com",
  mapEmbed: "https://www.google.com/maps?q=%D8%B5%D9%86%D8%B9%D8%A7%D8%A1%20%D8%A7%D9%84%D9%8A%D9%85%D9%86&output=embed",
  aboutVideo: "",
  founded: "2008",
  aboutStory: "تأسست رويال لتوفير مواد البناء والتمديدات الأساسية بجودة موثوقة وسلاسل توريد مرنة تخدم المقاولين وتجار الجملة والمشاريع الخاصة.",
  aboutVision: "أن تكون رويال الاسم الأول في السوق اليمني للحلول المتكاملة للمواسير والسباكة والكهرباء ومواد البناء.",
  aboutMission: "تقديم منتجات أصلية وخدمة سريعة وشبكة وكلاء منظمة مع دعم مستمر لفرق التنفيذ والعملاء.",
};

export const defaultAdminUser: AdminUser = {
  username: "admin",
  password: "royal123",
  role: "admin",
};

export const defaultMessages: Message[] = [];

export function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveToStorage<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}
