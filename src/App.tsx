import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { IconType } from "react-icons";
import { supabase } from "./supabaseCLient"; // تأكد من وجود ملف الاتصال في نفس المجلد
import {
  FaBars,
  FaBolt,
  FaBuilding,
  FaChartBar,
  FaChevronLeft,
  FaChevronRight,
  FaComments,
  FaEdit,
  FaEnvelope,
  FaEye,
  FaEyeSlash,
  FaFacebookF,
  FaGlobe,
  FaImage,
  FaInstagram,
  FaLayerGroup,
  FaLink,
  FaLock,
  FaMapMarkerAlt,
  FaPaperPlane,
  FaPhone,
  FaPlus,
  FaSearch,
  FaSignOutAlt,
  FaTimes,
  FaTint,
  FaTrash,
  FaTruck,
  FaUserShield,
  FaWarehouse,
  FaWhatsapp,
  FaYoutube,
  FaBoxOpen,
  FaBoxes,
  FaCogs,
  FaUsers,
  FaStar,
} from "react-icons/fa";
import {
  Banner,
  Agent,
  Product,
  Section,
  SectionId,
  Settings,
  STORAGE_KEYS,
  defaultAdminUser,
  defaultAgents,
  defaultBanners,
  defaultMessages,
  defaultProducts,
  defaultSections,
  defaultSettings,
  governorates,
  loadFromStorage,
  saveToStorage,
  uid,
} from "./data";

type View = "home" | "products" | "agents" | "about" | "contact" | "admin";
type AdminTab = "dashboard" | "products" | "sections" | "agents" | "banners" | "messages" | "settings";

type ContactDraft = {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
};

type ProductDraft = Omit<Product, "id" | "updatedAt">;
type AgentDraft = Omit<Agent, "id">;
type BannerDraft = Omit<Banner, "id">;
type SectionDraft = Omit<Section, "id">;

const menuItems: Array<{ view: View; label: string }> = [
  { view: "home", label: "الرئيسية" },
  { view: "products", label: "المنتجات" },
  { view: "agents", label: "الوكلاء والعملاء" },
  { view: "about", label: "عن الشركة" },
  { view: "contact", label: "اتصل بنا" },
];

const sectionIcons: Record<string, IconType> = {
  droplet: FaTint,
  bolt: FaBolt,
  building: FaBuilding,
  warehouse: FaWarehouse,
  truck: FaTruck,
  boxes: FaBoxes,
};

const adminTabs: Array<{ id: AdminTab; label: string; icon: IconType }> = [
  { id: "dashboard", label: "لوحة البيانات", icon: FaChartBar },
  { id: "products", label: "المنتجات", icon: FaBoxOpen },
  { id: "sections", label: "الأقسام", icon: FaLayerGroup },
  { id: "agents", label: "الوكلاء", icon: FaUsers },
  { id: "banners", label: "العروض", icon: FaImage },
  { id: "messages", label: "رسائل الاتصال", icon: FaComments },
  { id: "settings", label: "الإعدادات", icon: FaCogs },
];

const productFormTemplate = (sectionId: SectionId = defaultSections[0].id): ProductDraft => ({
  name: "",
  sectionId,
  subcategory: defaultSections.find((section) => section.id === sectionId)?.subcategories[0] ?? "",
  price: "",
  description: "",
  image: "",
  featured: true,
});

const sectionFormTemplate = (): SectionDraft => ({
  name: "",
  headline: "",
  summary: "",
  icon: "droplet",
  color: "#1d4ed8",
  subcategories: [],
});

const agentFormTemplate = (): AgentDraft => ({
  province: governorates[0],
  name: "",
  phone: "",
  address: "",
  logo: "",
});

const bannerFormTemplate = (): BannerDraft => ({
  title: "",
  subtitle: "",
  image: "",
  cta: "",
  link: "#products",
  expires: "",
});

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ar-YE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function isBannerActive(banner: Banner) {
  if (!banner.expires) return true;
  const expiry = new Date(banner.expires).getTime();
  return Number.isNaN(expiry) ? true : expiry > Date.now();
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

function notifyText(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function App() {
  const [view, setView] = useState<View>("home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<SectionId>(defaultSections[0].id);
  const [selectedProvince, setSelectedProvince] = useState<string>(governorates[0]);
  const [searchTerm, setSearchTerm] = useState("");
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [slideIndex, setSlideIndex] = useState(0);
  const [contactDraft, setContactDraft] = useState<ContactDraft>({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [contactNote, setContactNote] = useState("");
  const [adminTab, setAdminTab] = useState<AdminTab>("dashboard");
  const [loginForm, setLoginForm] = useState({ username: "", password: "", reveal: false });

  // تعيين البيانات الابتدائية من Local Storage كمرحلة مؤقتة لحين اكتمال التحميل السحابي
  const [settings, setSettings] = useState<Settings>(() => loadFromStorage(STORAGE_KEYS.settings, defaultSettings));
  const [sections, setSections] = useState<Section[]>(() => loadFromStorage(STORAGE_KEYS.sections, defaultSections));
  const [products, setProducts] = useState<Product[]>(() => loadFromStorage(STORAGE_KEYS.products, defaultProducts));
  const [agents, setAgents] = useState<Agent[]>(() => loadFromStorage(STORAGE_KEYS.agents, defaultAgents));
  const [banners, setBanners] = useState<Banner[]>(() => loadFromStorage(STORAGE_KEYS.banners, defaultBanners));
  const [messages, setMessages] = useState(() => loadFromStorage(STORAGE_KEYS.messages, defaultMessages));
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => Boolean(loadFromStorage(STORAGE_KEYS.auth, "")));

  const [sectionDraft, setSectionDraft] = useState<SectionDraft>(sectionFormTemplate());
  const [productDraft, setProductDraft] = useState<ProductDraft>(productFormTemplate(defaultSections[0].id));
  const [agentDraft, setAgentDraft] = useState<AgentDraft>(agentFormTemplate());
  const [bannerDraft, setBannerDraft] = useState<BannerDraft>(bannerFormTemplate());

  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editingAgentId, setEditingAgentId] = useState<string | null>(null);
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);
  const [subcategoryDrafts, setSubcategoryDrafts] = useState<Record<string, string>>({});
  const [authToken, setAuthToken] = useState(() => loadFromStorage<string>(STORAGE_KEYS.auth, ""));

  const toastTimer = useRef<number | null>(null);

  const brandVars = {
    "--brand-primary": settings.primaryColor,
    "--brand-secondary": settings.secondaryColor,
  } as CSSProperties;

  const heroSlides = useMemo(() => banners.filter(isBannerActive), [banners]);
  const activeSlide = heroSlides[slideIndex % Math.max(heroSlides.length, 1)];

  const latestProducts = useMemo(
    () => [...products].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)).slice(0, 6),
    [products],
  );

  const selectedProvinceAgents = agents.filter((agent) => agent.province === selectedProvince);
  const filteredProducts = products.filter((product) => {
    const sectionMatches = product.sectionId === selectedSection;
    const searchMatches = `${product.name} ${product.description} ${product.subcategory}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    return sectionMatches && searchMatches;
  });

  // 🌐 [تأثير جلب البيانات بالكامل من Supabase بمجرد فتح الموقع]
  useEffect(() => {
    const loadAllCloudData = async () => {
      try {
        // 1. جلب المنتجات
        const { data: cloudProducts } = await supabase.from("products").select("*").order("id", { ascending: false });
        if (cloudProducts) {
          setProducts(cloudProducts.map((p: any) => ({
            id: String(p.id),
            name: p.name,
            sectionId: p.section_id,
            subcategory: p.subcategory,
            price: p.price,
            description: p.description || "",
            image: p.image || "",
            featured: Boolean(p.featured),
            updatedAt: p.updated_at || new Date().toISOString(),
          })));
        }

        // 2. جلب الأقسام
        const { data: cloudSections } = await supabase.from("sections").select("*");
        if (cloudSections) {
          setSections(cloudSections.map((s: any) => ({
            id: s.id,
            name: s.name,
            headline: s.headline,
            summary: s.summary,
            icon: s.icon,
            color: s.color,
            subcategories: Array.isArray(s.subcategories) ? s.subcategories : JSON.parse(s.subcategories || "[]"),
          })));
        }

        // 3. جلب الوكلاء
        const { data: cloudAgents } = await supabase.from("agents").select("*");
        if (cloudAgents) {
          setAgents(cloudAgents.map((a: any) => ({
            id: String(a.id),
            province: a.province,
            name: a.name,
            phone: a.phone,
            address: a.address,
            logo: a.logo_url || "",
          })));
        }

        // 4. جلب الإعلانات/العروض
        const { data: cloudBanners } = await supabase.from("banners").select("*");
        if (cloudBanners) {
          setBanners(cloudBanners.map((b: any) => ({
            id: String(b.id),
            title: b.title,
            subtitle: b.subtitle,
            image: b.image_url,
            cta: b.cta_label,
            link: b.link_url,
            expires: b.expires_at || "",
          })));
        }

        // 5. جلب الرسائل الواردة
        const { data: cloudMessages } = await supabase.from("contact_messages").select("*").order("id", { ascending: false });
        if (cloudMessages) {
          setMessages(cloudMessages.map((m: any) => ({
            id: String(m.id),
            name: m.name,
            email: m.email,
            phone: m.phone,
            subject: m.subject,
            message: m.message,
            read: Boolean(m.is_read),
            createdAt: m.created_at,
          })));
        }
      } catch (err: any) {
        console.error("خطأ أثناء الاتصال بجلب البيانات السحابية:", err.message);
      }
    };

    loadAllCloudData();
  }, [authToken]);
  const notify = (message: string) => setToast(message);
  const goTo = (nextView: View) => setView(nextView);

  const requestProduct = (product: Product) => {
    setContactDraft({
      name: "",
      email: "",
      phone: "",
      subject: `استفسار عن ${product.name}`,
      message: `مرحباً، أود معرفة المزيد عن ${product.name} ضمن قسم ${sections.find((section) => section.id === product.sectionId)?.name ?? "المنتجات"}.`,
    });
    setView("contact");
    notify("تم تجهيز رسالة الاستفسار.");
  };

  const preview = (product: Product) => setPreviewProduct(product);

  const applyLink = (link: string) => {
    if (!link) return;
    if (link.startsWith("#")) {
      const target = link.replace("#", "") as View;
      if (["home", "products", "agents", "about", "contact", "admin"].includes(target)) {
        setView(target);
      }
      return;
    }
    window.open(link, "_blank", "noopener,noreferrer");
  };

  // ✉️ [حفظ رسائل اتصل بنا في قاعدة البيانات السحابية تلقائياً]
  const handleContactSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const msgPayload = {
        name: contactDraft.name,
        email: contactDraft.email,
        phone: contactDraft.phone,
        subject: contactDraft.subject,
        message: contactDraft.message,
        is_read: false,
      };

      const { data, error } = await supabase.from("contact_messages").insert([msgPayload]).select();
      if (error) throw error;

      if (data && data[0]) {
        setMessages((current) => [
          {
            id: String(data[0].id),
            ...contactDraft,
            read: false,
            createdAt: data[0].created_at,
          },
          ...current,
        ]);
      }
      setContactDraft({ name: "", email: "", phone: "", subject: "", message: "" });
      setContactNote("تم إرسال رسالتك بنجاح وسيتم الرد عليك في أقرب وقت.");
      notify("تم إرسال وحفظ الرسالة سحابياً بنجاح! 📨");
    } catch (err: any) {
      notify("فشل الإرسال السحابي: " + err.message);
    }
  };

  const handleAdminLogin = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const success = loginForm.username === defaultAdminUser.username && loginForm.password === defaultAdminUser.password;
    if (!success) {
      notify("بيانات الدخول غير صحيحة.");
      return;
    }
    setAuthToken(defaultAdminUser.username);
    setIsAdminLoggedIn(true);
    setAdminTab("dashboard");
    notify("تم تسجيل الدخول بنجاح.");
  };

  const handleLogout = () => {
    setAuthToken("");
    setIsAdminLoggedIn(false);
    setLoginForm({ username: "", password: "", reveal: false });
    notify("تم تسجيل الخروج.");
    setView("home");
  };

  // 📂 [إدارة الأقسام سحابياً]
  const handleSectionSave = async () => {
    if (!sectionDraft.name.trim()) return notify("اكتب اسم القسم أولاً.");

    try {
      const sectionPayload = {
        name: sectionDraft.name,
        headline: sectionDraft.headline,
        summary: sectionDraft.summary,
        icon: sectionDraft.icon,
        color: sectionDraft.color,
        subcategories: JSON.stringify(sectionDraft.subcategories),
      };

      if (editingSectionId) {
        const { error } = await supabase.from("sections").update(sectionPayload).eq("id", editingSectionId);
        if (error) throw error;

        setSections((current) =>
          current.map((section) =>
            section.id === editingSectionId ? { ...section, ...sectionDraft } : section,
          ),
        );
        notify("تم تحديث القسم سحابياً! 💾");
      } else {
        const generatedId = `${sectionDraft.name.trim().toLowerCase().replace(/\s+/g, "-")}-${Date.now()}` as SectionId;
        const { error } = await supabase.from("sections").insert([{ id: generatedId, ...sectionPayload }]);
        if (error) throw error;

        setSections((current) => [...current, { ...sectionDraft, id: generatedId }]);
        notify("تمت إضافة القسم الجديد سحابياً! 🚀");
      }
      setSectionDraft(sectionFormTemplate());
      setEditingSectionId(null);
    } catch (err: any) {
      notify("حدث خطأ في حفظ القسم: " + err.message);
    }
  };

  // 📦 [إدارة المنتجات سحابياً - مطورة بالكامل]
  const handleProductSave = async () => {
    if (!productDraft.name.trim()) return notify("اكتب اسم المنتج أولاً.");

    try {
      const productPayload = {
        name: productDraft.name,
        section_id: productDraft.sectionId,
        subcategory: productDraft.subcategory,
        price: productDraft.price,
        description: productDraft.description,
        image: productDraft.image,
        featured: productDraft.featured,
        updated_at: new Date().toISOString(),
      };

      if (editingProductId) {
        const { error } = await supabase.from("products").update(productPayload).eq("id", editingProductId);
        if (error) throw error;

        setProducts((current) =>
          current.map((product) =>
            product.id === editingProductId ? { ...productDraft, id: editingProductId, updatedAt: new Date().toISOString() } : product,
          ),
        );
        notify("تم تحديث المنتج بنجاح ونشره سحابياً! 🌐");
      } else {
        const { data, error } = await supabase.from("products").insert([productPayload]).select();
        if (error) throw error;

        if (data && data[0]) {
          setProducts((current) => [
            {
              ...productDraft,
              id: String(data[0].id),
              updatedAt: data[0].updated_at || new Date().toISOString(),
            },
            ...current,
          ]);
        }
        notify("تمت إضافة المنتج الجديد بنجاح على السحابة! 🎉");
      }
      setProductDraft(productFormTemplate(productDraft.sectionId));
      setEditingProductId(null);
    } catch (err: any) {
      notify("خطأ في الحفظ السحابي للمنتج: " + err.message);
    }
  };

  // 👥 [إدارة الوكلاء سحابياً]
  const handleAgentSave = async () => {
    if (!agentDraft.name.trim()) return notify("اكتب اسم الوكيل أولاً.");

    try {
      const agentPayload = {
        province: agentDraft.province,
        name: agentDraft.name,
        phone: agentDraft.phone,
        address: agentDraft.address,
        logo_url: agentDraft.logo,
      };

      if (editingAgentId) {
        const { error } = await supabase.from("agents").update(agentPayload).eq("id", editingAgentId);
        if (error) throw error;

        setAgents((current) => current.map((agent) => (agent.id === editingAgentId ? { ...agentDraft, id: editingAgentId } : agent)));
        notify("تم تحديث بيانات الوكيل سحابياً.");
      } else {
        const { data, error } = await supabase.from("agents").insert([agentPayload]).select();
        if (error) throw error;

        if (data && data[0]) {
          setAgents((current) => [{ ...agentDraft, id: String(data[0].id) }, ...current]);
        }
        notify("تمت إضافة الوكيل الجديد سحابياً.");
      }
      setAgentDraft(agentFormTemplate());
      setEditingAgentId(null);
    } catch (err: any) {
      notify("خطأ في حفظ الوكيل: " + err.message);
    }
  };

  // 🖼️ [إدارة العروض والبنرات سحابياً]
  const handleBannerSave = async () => {
    if (!bannerDraft.title.trim()) return notify("اكتب عنوان العرض أولاً.");

    try {
      const bannerPayload = {
        title: bannerDraft.title,
        subtitle: bannerDraft.subtitle,
        image_url: bannerDraft.image,
        cta_label: bannerDraft.cta,
        link_url: bannerDraft.link,
        expires_at: bannerDraft.expires || null,
      };

      if (editingBannerId) {
        const { error } = await supabase.from("banners").update(bannerPayload).eq("id", editingBannerId);
        if (error) throw error;

        setBanners((current) => current.map((banner) => (banner.id === editingBannerId ? { ...bannerDraft, id: editingBannerId } : banner)));
        notify("تم تحديث العرض بنجاح على السحابة.");
      } else {
        const { data, error } = await supabase.from("banners").insert([bannerPayload]).select();
        if (error) throw error;

        if (data && data[0]) {
          setBanners((current) => [{ ...bannerDraft, id: String(data[0].id) }, ...current]);
        }
        notify("تمت إضافة العرض الجديد بنجاح على السحابة.");
      }
      setBannerDraft(bannerFormTemplate());
      setEditingBannerId(null);
    } catch (err: any) {
      notify("خطأ في حفظ العرض: " + err.message);
    }
  };

  const sectionCounts = sections.map((section) => ({
    ...section,
    productCount: products.filter((product) => product.sectionId === section.id).length,
  }));

  const stats = [
    { label: "المنتجات", value: products.length, icon: FaBoxOpen },
    { label: "الأقسام", value: sections.length, icon: FaLayerGroup },
    { label: "الوكلاء", value: agents.length, icon: FaUsers },
    { label: "الرسائل", value: messages.length, icon: FaComments },
  ];

  const wrapperStyle = brandVars;

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 text-slate-900" style={wrapperStyle}>
      <Header
        settings={settings}
        view={view}
        setView={setView}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        isAdminLoggedIn={isAdminLoggedIn}
      />

      <main className="pt-24">
        <AnimatePresence mode="wait">
          {view === "home" && (
            <motion.div key="home" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
              <HomePage
                settings={settings}
                slides={heroSlides}
                activeSlide={activeSlide}
                slideIndex={slideIndex}
                setSlideIndex={setSlideIndex}
                sections={sections}
                sectionCounts={sectionCounts}
                latestProducts={latestProducts}
                setSelectedSection={setSelectedSection}
                selectedProvince={selectedProvince}
                setSelectedProvince={setSelectedProvince}
                selectedProvinceAgents={selectedProvinceAgents}
                goTo={goTo}
                requestProduct={requestProduct}
                preview={preview}
                applyLink={applyLink}
              />
            </motion.div>
          )}

         

          {view === "products" && (
            <motion.div key="products" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
             <ProductsPage 
                settings={settings}
                sections={sections}
                selectedSection={selectedSection}
                setSelectedSection={setSelectedSection}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                products={filteredProducts}
                requestProduct={requestProduct}
                preview={preview}
              />
            </motion.div>
          )}

          {view === "agents" && (
            <motion.div key="agents" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
              <AgentsPage
                governorates={governorates}
                selectedProvince={selectedProvince}
                setSelectedProvince={setSelectedProvince}
                selectedProvinceAgents={selectedProvinceAgents}
                agents={agents}
              />
            </motion.div>
          )}

          {view === "about" && (
            <motion.div key="about" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
              <AboutPage settings={settings} />
            </motion.div>
          )}

          {view === "contact" && (
            <motion.div key="contact" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
              <ContactPage
                settings={settings}
                draft={contactDraft}
                setDraft={setContactDraft}
                note={contactNote}
                onSubmit={handleContactSubmit}
              />
            </motion.div>
          )}

          {view === "admin" && (
            <motion.div key="admin" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
              <AdminPage
                settings={settings}
                isLoggedIn={isAdminLoggedIn}
                loginForm={loginForm}
                setLoginForm={setLoginForm}
                onLogin={handleAdminLogin}
                onLogout={handleLogout}
                adminTab={adminTab}
                setAdminTab={setAdminTab}
                stats={stats}
                sections={sections}
                setSections={setSections}
                sectionDraft={sectionDraft}
                setSectionDraft={setSectionDraft}
                editingSectionId={editingSectionId}
                setEditingSectionId={setEditingSectionId}
                subcategoryDrafts={subcategoryDrafts}
                setSubcategoryDrafts={setSubcategoryDrafts}
                products={products}
                setProducts={setProducts}
                productDraft={productDraft}
                setProductDraft={setProductDraft}
                editingProductId={editingProductId}
                setEditingProductId={setEditingProductId}
                agents={agents}
                setAgents={setAgents}
                agentDraft={agentDraft}
                setAgentDraft={setAgentDraft}
                editingAgentId={editingAgentId}
                setEditingAgentId={setEditingAgentId}
                banners={banners}
                setBanners={setBanners}
                bannerDraft={bannerDraft}
                setBannerDraft={setBannerDraft}
                editingBannerId={editingBannerId}
                setEditingBannerId={setEditingBannerId}
                messages={messages}
                setMessages={setMessages}
                setSettings={setSettings}
                handleSectionSave={handleSectionSave}
                handleProductSave={handleProductSave}
                handleAgentSave={handleAgentSave}
                handleBannerSave={handleBannerSave}
                notify={notify}
                requestProduct={requestProduct}
                formatDate={formatDate}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Footer settings={settings} setView={setView} />

      <AnimatePresence>
        {previewProduct && (
          <motion.div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/70 px-4 py-10 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewProduct(null)}
          >
            <motion.div
              className="w-full max-w-4xl overflow-hidden rounded-[2rem] bg-white shadow-2xl"
              initial={{ scale: 0.96, y: 18 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 18 }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
                <img src={previewProduct.image} alt={previewProduct.name} className="h-72 w-full object-cover lg:h-full" />
                <div className="space-y-6 p-6 sm:p-8">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">معاينة سريعة</p>
                      <h3 className="mt-2 text-2xl font-extrabold text-slate-900">{previewProduct.name}</h3>
                    </div>
                    <button onClick={() => setPreviewProduct(null)} className="rounded-full border border-slate-200 p-3 text-slate-500 transition hover:bg-slate-100">
                      <FaTimes />
                    </button>
                  </div>
                  <p className="text-sm text-slate-500">
                    {sections.find((section) => section.id === previewProduct.sectionId)?.name ?? "المنتجات"} - {previewProduct.subcategory}
                  </p>
                  <p className="leading-8 text-slate-600">{previewProduct.description}</p>
                  <div className="flex items-center justify-between gap-3 rounded-3xl bg-slate-50 p-4">
                    <div>
                      <div className="text-sm text-slate-400">السعر</div>
                      <div className="text-2xl font-bold text-brand">{previewProduct.price}</div>
                    </div>
                    <div className="text-sm text-slate-500">جاهز للطلب أو الاستفسار</div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => {
                        requestProduct(previewProduct);
                        setPreviewProduct(null);
                      }}
                      className="inline-flex items-center gap-2 rounded-2xl bg-brand px-5 py-3 font-semibold text-white transition hover:opacity-90"
                    >
                      <FaPaperPlane />
                      اطلب الآن
                    </button>
                    <button onClick={() => setPreviewProduct(null)} className="rounded-2xl border border-slate-200 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50">
                      إغلاق
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div
            className="fixed bottom-5 left-5 z-[80] rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-2xl"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 18 }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Header({
  settings,
  view,
  setView,
  mobileMenuOpen,
  setMobileMenuOpen,
  isAdminLoggedIn,
}: {
  settings: Settings;
  view: View;
  setView: (view: View) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  isAdminLoggedIn: boolean;
}) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <button
          onClick={() => setView("home")}
          className="flex items-center gap-3 text-right transition hover:opacity-90"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand text-lg font-extrabold text-white shadow-lg shadow-blue-500/30">
            {settings.logoText.slice(0, 1)}
          </span>
          <span className="hidden text-right sm:block">
            <span className="block text-sm font-semibold text-white/70">{settings.logoText}</span>
            <span className="block text-xs text-white/40">{settings.tagline}</span>
          </span>
        </button>

        <nav className="hidden items-center gap-2 lg:flex">
          {menuItems.map((item) => (
            <NavButton key={item.view} active={view === item.view} onClick={() => setView(item.view)}>
              {item.label}
            </NavButton>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setView("admin")}
            className="hidden items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10 md:inline-flex"
          >
            <FaUserShield />
            {isAdminLoggedIn ? "لوحة التحكم" : "دخول المدير"}
          </button>

          <button
            className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white transition hover:bg-white/10 lg:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="border-t border-white/10 bg-slate-950/95 px-4 py-4 lg:hidden"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
          >
            <div className="mx-auto flex max-w-7xl flex-col gap-2">
              {menuItems.map((item) => (
                <NavButton key={item.view} active={view === item.view} onClick={() => setView(item.view)} block>
                  {item.label}
                </NavButton>
              ))}
              <NavButton active={view === "admin"} onClick={() => setView("admin")} block>
                لوحة التحكم
              </NavButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function NavButton({
  active,
  onClick,
  children,
  block = false,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  block?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
        block ? "w-full text-right" : ""
      } ${active ? "bg-white text-slate-950 shadow-lg shadow-blue-500/20" : "text-white/80 hover:bg-white/5 hover:text-white"}`}
    >
      {children}
    </button>
  );
}

function HomePage({
  settings,
  slides,
  activeSlide,
  slideIndex,
  setSlideIndex,
  sections,
  sectionCounts,
  latestProducts,
  setSelectedSection,
  selectedProvince,
  setSelectedProvince,
  selectedProvinceAgents,
  goTo,
  requestProduct,
  preview,
  applyLink,
}: {
  settings: Settings;
  slides: Banner[];
  activeSlide: Banner | undefined;
  slideIndex: number;
  setSlideIndex: (value: number) => void;
  sections: Section[];
  sectionCounts: Array<Section & { productCount: number }>;
  latestProducts: Product[];
  setSelectedSection: (value: SectionId) => void;
  selectedProvince: string;
  setSelectedProvince: (value: string) => void;
  selectedProvinceAgents: Agent[];
  goTo: (view: View) => void;
  requestProduct: (product: Product) => void;
  preview: (product: Product) => void;
  applyLink: (link: string) => void;
}) {
  return (
    <>
      <section className="relative min-h-[calc(100vh-6rem)] overflow-hidden">
        <div className="absolute inset-0">
          <AnimatePresence mode="wait">
            <motion.img
              key={activeSlide?.id ?? "slide"}
              src={activeSlide?.image}
              alt={activeSlide?.title ?? settings.siteName}
              className="h-full w-full object-cover"
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.8 }}
            />
          </AnimatePresence>
          <div className="absolute inset-0 bg-gradient-to-l from-slate-950/95 via-slate-950/70 to-slate-950/45" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(29,78,216,0.26),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.14),transparent_34%)]" />
        </div>

        <div className="relative z-10 mx-auto flex min-h-[calc(100vh-6rem)] max-w-7xl flex-col justify-between px-4 py-10 sm:px-6 lg:px-8">
          <div className="max-w-3xl pt-14 sm:pt-20">
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }} className="space-y-8">
              <div className="flex items-center gap-3 text-white/80">
                <span className="h-px w-10 bg-white/40" />
                <span className="text-sm font-semibold tracking-[0.28em] uppercase">{settings.logoText}</span>
              </div>

              <div className="space-y-4 text-white">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/60">{activeSlide?.title ?? settings.siteName}</p>
                <h1 className="max-w-4xl text-5xl font-black leading-tight sm:text-6xl lg:text-7xl">
                  Royal
                  <span className="mt-2 block text-white/92">للمواسير وأدوات السباكة والكهرباء ومواد البناء</span>
                </h1>
                <p className="max-w-2xl text-lg leading-9 text-white/70 sm:text-xl">
                  {activeSlide?.subtitle ?? settings.tagline} نخدم المقاولين والتجار والمشاريع بخيارات جاهزة للتوريد، شبكة وكلاء منظمة، وتجربة شراء سريعة وواضحة.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button onClick={() => goTo("products")} className="inline-flex items-center gap-2 rounded-2xl bg-brand px-6 py-3.5 font-semibold text-white shadow-xl shadow-blue-500/30 transition hover:opacity-95">
                  <FaBoxes />
                  استعرض المنتجات
                </button>
                <button onClick={() => goTo("contact")} className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/5 px-6 py-3.5 font-semibold text-white transition hover:bg-white/10">
                  <FaPhone />
                  تواصل معنا
                </button>
              </div>
            </motion.div>
          </div>

          <div className="mt-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-center gap-2 text-white/70">
              <button onClick={() => setSlideIndex((slideIndex - 1 + Math.max(slides.length, 1)) % Math.max(slides.length, 1))} className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/5 transition hover:bg-white/10">
                <FaChevronRight />
              </button>
              <button onClick={() => setSlideIndex((slideIndex + 1) % Math.max(slides.length, 1))} className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/5 transition hover:bg-white/10">
                <FaChevronLeft />
              </button>
              <div className="mr-4 flex items-center gap-2">
                {slides.map((slide, index) => (
                  <button
                    key={slide.id}
                    onClick={() => setSlideIndex(index)}
                    className={`h-2 rounded-full transition-all ${index === slideIndex ? "w-10 bg-white" : "w-2 bg-white/35"}`}
                    aria-label={`انتقل إلى الشريحة ${index + 1}`}
                  />
                ))}
              </div>
            </div>

            <button
              onClick={() => activeSlide && applyLink(activeSlide.link)}
              className="inline-flex items-center gap-2 self-start rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              <FaLink />
              {activeSlide?.cta ?? "عرض تفاصيل الشريحة"}
            </button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="الأقسام الرئيسية"
          title="ثلاثة مسارات واضحة للشراء والتوريد"
          description="اختر القسم المناسب وابدأ تصفح المنتجات والمواد المتوافرة لكل فئة من فئات رويال."
        />

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {sectionCounts.map((section) => {
            const Icon = sectionIcons[section.icon] ?? FaLayerGroup;
            return (
              <button
                key={section.id}
                onClick={() => {
                  setSelectedSection(section.id);
                  goTo("products");
                }}
                className="group rounded-[2rem] border border-slate-200 bg-white p-6 text-right shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl text-white" style={{ backgroundColor: section.color }}>
                      <Icon size={22} />
                    </div>
                    <h3 className="mt-5 text-2xl font-extrabold text-slate-900">{section.name}</h3>
                    <p className="mt-3 leading-8 text-slate-600">{section.summary}</p>
                  </div>
                  <div className="text-left text-sm text-slate-400">{notifyText(section.productCount, "منتج", "منتجاً")}</div>
                </div>
                <div className="mt-6 flex flex-wrap gap-2">
                  {section.subcategories.slice(0, 4).map((subcategory) => (
                    <span key={subcategory} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      {subcategory}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8" id="products">
        <SectionHeader
          eyebrow="أحدث المنتجات"
          title="مختارات سريعة من المخزون"
          description="معاينة مباشرة لأحدث الأصناف مع سعر ووصف موجز وخيار الطلب السريع."
        />

        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {latestProducts.map((product) => (
            <motion.article
              key={product.id}
              whileHover={{ y: -6 }}
              className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm"
            >
              <button onClick={() => preview(product)} className="block w-full">
                <img src={product.image} alt={product.name} className="h-56 w-full object-cover" />
              </button>
              <div className="space-y-4 p-5 text-right">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-brand">{sections.find((section) => section.id === product.sectionId)?.name}</p>
                    <h3 className="mt-1 text-xl font-extrabold text-slate-900">{product.name}</h3>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">{product.subcategory}</span>
                </div>
                <p className="line-clamp-2 leading-8 text-slate-600">{product.description}</p>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-medium text-slate-400">السعر</div>
                    <div className="text-lg font-bold text-slate-900">{product.price}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => preview(product)} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                      معاينة سريعة
                    </button>
                    <button onClick={() => requestProduct(product)} className="rounded-2xl bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:opacity-95">
                      طلب
                    </button>
                  </div>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8" id="agents">
        <SectionHeader
          eyebrow="الوكلاء والموزعون"
          title="تغطية واسعة للمحافظات اليمنية"
          description="اختر المحافظة لعرض الوكلاء أو الموزعين المعتمدين مع الهاتف والعنوان والشعار عند توفره."
        />

        <div className="mt-8 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {governorates.map((province) => (
                <button
                  key={province}
                  onClick={() => setSelectedProvince(province)}
                  className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    selectedProvince === province ? "bg-brand text-white shadow-lg shadow-blue-500/20" : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {province}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">{selectedProvince}</p>
                <h3 className="mt-2 text-2xl font-extrabold text-slate-900">وكلاء رويال في المحافظة</h3>
              </div>
              <div className="rounded-2xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600">{selectedProvinceAgents.length} وكيل</div>
            </div>

            <div className="mt-6 space-y-4">
              {selectedProvinceAgents.map((agent) => (
                <div key={agent.id} className="flex flex-col gap-4 rounded-3xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    {agent.logo ? (
                      <img src={agent.logo} alt={agent.name} className="h-16 w-16 rounded-2xl object-cover" />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand text-xl font-bold text-white">
                        {agent.name.slice(0, 1)}
                      </div>
                    )}
                    <div>
                      <h4 className="text-lg font-bold text-slate-900">{agent.name}</h4>
                      <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                        <FaMapMarkerAlt className="text-brand" />
                        {agent.address}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <FaPhone className="text-brand" />
                    <span dir="ltr">{agent.phone}</span>
                  </div>
                </div>
              ))}

              {!selectedProvinceAgents.length && (
                <div className="rounded-3xl border border-dashed border-slate-200 p-8 text-center text-slate-500">
                  لا توجد بيانات للوكلاء حالياً في هذه المحافظة.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] bg-brand px-6 py-10 text-white shadow-2xl shadow-blue-500/30 sm:px-10">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/70">خدمة سريعة</p>
              <h3 className="mt-2 text-3xl font-extrabold">أرسل طلبك الآن واحصل على عرض مناسب لمشروعك</h3>
              <p className="mt-3 max-w-2xl leading-8 text-white/80">فريق رويال جاهز لتجهيز الاستفسارات وتوجيهك لأقرب وكيل أو أفضل منتج بحسب الاحتياج.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => goTo("contact")} className="rounded-2xl bg-white px-5 py-3 font-semibold text-slate-950 transition hover:opacity-95">
                تواصل مع المبيعات
              </button>
              <button onClick={() => goTo("admin")} className="rounded-2xl border border-white/25 bg-white/10 px-5 py-3 font-semibold text-white transition hover:bg-white/15">
                لوحة التحكم
              </button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function ProductsPage({
  settings,
  sections,
  selectedSection,
  setSelectedSection,
  searchTerm,
  setSearchTerm,
  products,
  requestProduct,
  preview,
}: {
  settings: Settings;
  sections: Section[];
  selectedSection: SectionId;
  setSelectedSection: (value: SectionId) => void;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  products: Product[];
  requestProduct: (product: Product) => void;
  preview: (product: Product) => void;
}) {
  const section = sections.find((item) => item.id === selectedSection) ?? sections[0];

  return (
    <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
      <SectionHeader
        eyebrow="المنتجات"
        title="كتالوج متجدد بتصنيفات دقيقة"
        description="استعرض منتجات السباكة والكهرباء ومواد البناء مع التصفية بحسب القسم والتصنيف الفرعي."
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="rounded-2xl bg-slate-50 p-4">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-500">
              <FaSearch />
              بحث سريع
            </label>
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="ابحث عن منتج أو تصنيف أو وصف"
              className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="space-y-2">
            <div className="text-sm font-semibold text-slate-500">الأقسام</div>
            {sections.map((entry) => (
              <button
                key={entry.id}
                onClick={() => setSelectedSection(entry.id)}
                className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-right transition ${
                  selectedSection === entry.id ? "bg-brand text-white shadow-lg shadow-blue-500/20" : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <span>{entry.name}</span>
                <span className="text-xs opacity-80">{products.filter((product) => product.sectionId === entry.id).length} منتج</span>
              </button>
            ))}
          </div>

          <div className="rounded-3xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand text-white">
                {(() => {
                  const Icon = sectionIcons[section.icon] ?? FaLayerGroup;
                  return <Icon size={20} />;
                })()}
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-400">التصنيفات الفرعية</div>
                <div className="text-lg font-bold text-slate-900">{section.name}</div>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {section.subcategories.map((subcategory) => (
                <span key={subcategory} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {subcategory}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 rounded-[2rem] border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">{settings.logoText}</p>
              <h2 className="mt-1 text-2xl font-extrabold text-slate-900">{section.name}</h2>
            </div>
            <div className="rounded-2xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600">{products.length} نتيجة</div>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-2">
            {products.map((product) => (
              <motion.article key={product.id} whileHover={{ y: -4 }} className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
                <button onClick={() => preview(product)} className="block w-full">
                  <img src={product.image} alt={product.name} className="h-52 w-full object-cover" />
                </button>
                <div className="space-y-4 p-5">
                  <div className="flex items-start justify-between gap-3 text-right">
                    <div>
                      <h3 className="text-xl font-extrabold text-slate-900">{product.name}</h3>
                      <p className="mt-1 text-sm font-medium text-brand">{product.subcategory}</p>
                    </div>
                    {product.featured && <FaStar className="mt-1 text-amber-400" />}
                  </div>
                  <p className="line-clamp-2 leading-8 text-slate-600">{product.description}</p>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-semibold text-slate-400">السعر</div>
                      <div className="text-lg font-bold text-slate-900">{product.price}</div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => preview(product)} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                        معاينة
                      </button>
                      <button onClick={() => requestProduct(product)} className="rounded-2xl bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:opacity-95">
                        طلب / استفسار
                      </button>
                    </div>
                  </div>
                </div>
              </motion.article>
            ))}

            {!products.length && (
              <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500 md:col-span-2">
                لا توجد منتجات مطابقة للبحث أو الفلتر الحالي.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function AgentsPage({
  governorates,
  selectedProvince,
  setSelectedProvince,
  selectedProvinceAgents,
  agents,
}: {
  governorates: readonly string[];
  selectedProvince: string;
  setSelectedProvince: (value: string) => void;
  selectedProvinceAgents: Agent[];
  agents: Agent[];
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
      <SectionHeader
        eyebrow="الوكلاء والعملاء"
        title="شبكة المحافظات اليمنية"
        description="اختر المحافظة لرؤية الوكلاء المعتمدين. بإمكان المدير إضافة وكلاء جدد مباشرة من لوحة التحكم."
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">محافظات اليمن</p>
              <h3 className="mt-1 text-2xl font-extrabold text-slate-900">{notifyText(agents.length, "وكيل", "وكيلاً")}</h3>
            </div>
            <div className="rounded-2xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600">{selectedProvince}</div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {governorates.map((province) => (
              <button
                key={province}
                onClick={() => setSelectedProvince(province)}
                className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  selectedProvince === province ? "bg-brand text-white shadow-lg shadow-blue-500/20" : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                }`}
              >
                {province}
              </button>
            ))}
          </div>

          <div className="mt-5 rounded-3xl bg-slate-50 p-4 text-sm leading-8 text-slate-600">
            تعتمد رويال نظام توزيع مرن يربط بين مصانع التوريد والوكلاء المحليين لضمان سرعة الوصول إلى المشاريع والمتاجر في مختلف المحافظات.
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">{selectedProvince}</p>
              <h3 className="mt-1 text-2xl font-extrabold text-slate-900">الوكلاء المعتمدون</h3>
            </div>
            <div className="rounded-2xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600">{selectedProvinceAgents.length} نتيجة</div>
          </div>

          <div className="mt-6 space-y-4">
            {selectedProvinceAgents.map((agent) => (
              <div key={agent.id} className="flex flex-col gap-4 rounded-3xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  {agent.logo ? (
                    <img src={agent.logo} alt={agent.name} className="h-16 w-16 rounded-2xl object-cover" />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand text-xl font-extrabold text-white">{agent.name.slice(0, 1)}</div>
                  )}
                  <div>
                    <h4 className="text-lg font-bold text-slate-900">{agent.name}</h4>
                    <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                      <FaMapMarkerAlt className="text-brand" />
                      {agent.address}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700" dir="ltr">
                  <FaPhone className="text-brand" />
                  {agent.phone}
                </div>
              </div>
            ))}

            {!selectedProvinceAgents.length && <div className="rounded-3xl border border-dashed border-slate-200 p-8 text-center text-slate-500">لا توجد بيانات حالياً في هذه المحافظة.</div>}
          </div>
        </div>
      </div>
    </section>
  );
}

function AboutPage({ settings }: { settings: Settings }) {
  const highlights = [
    { title: "نبذة", text: settings.aboutStory, icon: FaBoxOpen },
    { title: "الرؤية", text: settings.aboutVision, icon: FaGlobe },
    { title: "الرسالة", text: settings.aboutMission, icon: FaPaperPlane },
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
      <SectionHeader
        eyebrow="عن الشركة"
        title="هوية تجارية واضحة وتجربة توريد موثوقة"
        description="لمحة عن رويال، تاريخها، واستعدادها لخدمة المقاولين والمتاجر والمشاريع الكبيرة والصغيرة."
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.95fr]">
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {highlights.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand text-white">
                    <Icon />
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-slate-900">{item.title}</h3>
                  <p className="mt-3 leading-8 text-slate-600">{item.text}</p>
                </div>
              );
            })}
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">تاريخ التأسيس</p>
                <h3 className="mt-1 text-3xl font-extrabold text-slate-900">{settings.founded}</h3>
              </div>
              <div className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">خبرة تشغيلية وشبكة توزيع</div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {[
                "انطلاق أول مستودع رئيسي في صنعاء",
                "توسيع التغطية إلى المحافظات الرئيسية",
                "بناء منظومة وكلاء ومخزون متجدد",
              ].map((item, index) => (
                <div key={item} className="rounded-3xl bg-slate-50 p-4">
                  <div className="text-sm font-semibold text-brand">0{index + 1}</div>
                  <p className="mt-2 leading-8 text-slate-700">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <img src="imag/WhatsApp Image 2026-06-24 at 1.50.44 AM (2).jpeg" alt="مستودع" className="h-64 w-full rounded-3xl object-cover" />
            <img src="imag/WhatsApp Image 2026-06-24 at 1.50.46 AM.jpeg" alt="إنشاءات" className="h-64 w-full rounded-3xl object-cover" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <img src="imag/WhatsApp Image 2026-06-24 at 2.25.58 AM (1).jpeg" alt="مواسير" className="h-64 w-full rounded-3xl object-cover" />
            <img src="imag/WhatsApp Image 2026-06-24 at 1.50.47 AM.jpeg" alt="كهرباء" className="h-64 w-full rounded-3xl object-cover" />
          </div>
          <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">فيديو تعريفي</p>
            {settings.aboutVideo ? (
              <div className="mt-4 overflow-hidden rounded-3xl border border-slate-200">
                <iframe src={settings.aboutVideo} title="فيديو تعريفي" className="h-72 w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
              </div>
            ) : (
              <div className="mt-4 rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
                ضع رابط الفيديو التعريفي من لوحة التحكم ليظهر هنا.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function ContactPage({
  settings,
  draft,
  setDraft,
  note,
  onSubmit,
}: {
  settings: Settings;
  draft: ContactDraft;
  setDraft: (draft: ContactDraft) => void;
  note: string;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
      <SectionHeader
        eyebrow="اتصل بنا"
        title="نموذج سريع ومعلومات تواصل واضحة"
        description="أرسل رسالة مباشرة أو استخدم الوسائل التالية للوصول إلى فريق رويال."
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.95fr]">
        <form onSubmit={onSubmit} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="الاسم الكامل">
              <input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} className="input-field" />
            </Field>
            <Field label="البريد الإلكتروني">
              <input dir="ltr" type="email" value={draft.email} onChange={(event) => setDraft({ ...draft, email: event.target.value })} className="input-field" />
            </Field>
            <Field label="رقم الجوال">
              <input dir="ltr" type="tel" value={draft.phone} onChange={(event) => setDraft({ ...draft, phone: event.target.value })} className="input-field" />
            </Field>
            <Field label="الموضوع">
              <input value={draft.subject} onChange={(event) => setDraft({ ...draft, subject: event.target.value })} className="input-field" />
            </Field>
          </div>
          <Field label="الرسالة" className="mt-4">
            <textarea rows={7} value={draft.message} onChange={(event) => setDraft({ ...draft, message: event.target.value })} className="input-field resize-none" />
          </Field>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button type="submit" className="inline-flex items-center gap-2 rounded-2xl bg-brand px-5 py-3 font-semibold text-white transition hover:opacity-95">
              <FaPaperPlane />
              إرسال الرسالة
            </button>
            {note && <span className="text-sm font-semibold text-emerald-600">{note}</span>}
          </div>
        </form>

        <div className="space-y-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="rounded-3xl overflow-hidden border border-slate-200">
            <iframe src={settings.mapEmbed} title="موقع الشركة على الخريطة" className="h-72 w-full" loading="lazy" />
          </div>

          <div className="space-y-4">
            {[
              { icon: FaPhone, label: "الجوال", value: settings.contactPhone, href: `tel:${settings.contactPhone}` },
              { icon: FaWhatsapp, label: "واتساب", value: settings.whatsapp, href: `https://wa.me/${settings.whatsapp.replace(/[^0-9]/g, "")}` },
              { icon: FaEnvelope, label: "البريد الإلكتروني", value: settings.email, href: `mailto:${settings.email}` },
              { icon: FaMapMarkerAlt, label: "العنوان", value: settings.address, href: settings.mapEmbed },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <a key={item.label} href={item.href} target={item.label === "العنوان" ? "_blank" : undefined} rel="noreferrer" className="flex items-center justify-between gap-4 rounded-3xl border border-slate-200 p-4 transition hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand text-white">
                      <Icon />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-400">{item.label}</div>
                      <div className="font-semibold text-slate-900">{item.value}</div>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>

          <div className="flex items-center gap-3 text-brand">
            <a href={settings.facebook} target="_blank" rel="noreferrer" className="rounded-2xl border border-slate-200 p-3 transition hover:bg-slate-50">
              <FaFacebookF />
            </a>
            <a href={settings.instagram} target="_blank" rel="noreferrer" className="rounded-2xl border border-slate-200 p-3 transition hover:bg-slate-50">
              <FaInstagram />
            </a>
            <a href={settings.youtube} target="_blank" rel="noreferrer" className="rounded-2xl border border-slate-200 p-3 transition hover:bg-slate-50">
              <FaYoutube />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function AdminPage({
  settings,
  isLoggedIn,
  loginForm,
  setLoginForm,
  onLogin,
  onLogout,
  adminTab,
  setAdminTab,
  stats,
  sections,
  setSections,
  sectionDraft,
  setSectionDraft,
  editingSectionId,
  setEditingSectionId,
  subcategoryDrafts,
  setSubcategoryDrafts,
  products,
  setProducts,
  productDraft,
  setProductDraft,
  editingProductId,
  setEditingProductId,
  agents,
  setAgents,
  agentDraft,
  setAgentDraft,
  editingAgentId,
  setEditingAgentId,
  banners,
  setBanners,
  bannerDraft,
  setBannerDraft,
  editingBannerId,
  setEditingBannerId,
  messages,
  setMessages,
  setSettings,
  handleSectionSave,
  handleProductSave,
  handleAgentSave,
  handleBannerSave,
  notify,
  requestProduct,
  formatDate,
}: {
  settings: Settings;
  isLoggedIn: boolean;
  loginForm: { username: string; password: string; reveal: boolean };
  setLoginForm: (value: { username: string; password: string; reveal: boolean }) => void;
  onLogin: (event: React.FormEvent<HTMLFormElement>) => void;
  onLogout: () => void;
  adminTab: AdminTab;
  setAdminTab: (tab: AdminTab) => void;
  stats: Array<{ label: string; value: number; icon: IconType }>;
  sections: Section[];
  setSections: React.Dispatch<React.SetStateAction<Section[]>>;
  sectionDraft: SectionDraft;
  setSectionDraft: React.Dispatch<React.SetStateAction<SectionDraft>>;
  editingSectionId: string | null;
  setEditingSectionId: React.Dispatch<React.SetStateAction<string | null>>;
  subcategoryDrafts: Record<string, string>;
  setSubcategoryDrafts: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  productDraft: ProductDraft;
  setProductDraft: React.Dispatch<React.SetStateAction<ProductDraft>>;
  editingProductId: string | null;
  setEditingProductId: React.Dispatch<React.SetStateAction<string | null>>;
  agents: Agent[];
  setAgents: React.Dispatch<React.SetStateAction<Agent[]>>;
  agentDraft: AgentDraft;
  setAgentDraft: React.Dispatch<React.SetStateAction<AgentDraft>>;
  editingAgentId: string | null;
  setEditingAgentId: React.Dispatch<React.SetStateAction<string | null>>;
  banners: Banner[];
  setBanners: React.Dispatch<React.SetStateAction<Banner[]>>;
  bannerDraft: BannerDraft;
  setBannerDraft: React.Dispatch<React.SetStateAction<BannerDraft>>;
  editingBannerId: string | null;
  setEditingBannerId: React.Dispatch<React.SetStateAction<string | null>>;
  messages: Array<{
    id: string;
    name: string;
    email: string;
    phone: string;
    subject: string;
    message: string;
    read: boolean;
    createdAt: string;
  }>;
  setMessages: React.Dispatch<React.SetStateAction<any[]>>;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  handleSectionSave: () => void;
  handleProductSave: () => void;
  handleAgentSave: () => void;
  handleBannerSave: () => void;
  notify: (message: string) => void;
  requestProduct: (product: Product) => void;
  formatDate: (value: string) => string;
}) {
  if (!isLoggedIn) {
    return (
      <section className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-3xl items-center justify-center px-4 pb-20 sm:px-6 lg:px-8">
        <form onSubmit={onLogin} className="w-full rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl">
          <div className="mb-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-brand text-2xl font-extrabold text-white shadow-lg shadow-blue-500/20">
              <FaUserShield />
            </div>
            <h2 className="mt-4 text-3xl font-extrabold text-slate-900">تسجيل دخول المدير</h2>
            <p className="mt-2 text-slate-500">استخدم بيانات الدخول الافتراضية لإدارة المحتوى.</p>
            <div className="mt-3 inline-flex rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">admin / royal123</div>
          </div>

          <div className="space-y-4">
            <Field label="اسم المستخدم">
              <input value={loginForm.username} onChange={(event) => setLoginForm({ ...loginForm, username: event.target.value })} className="input-field" />
            </Field>
            <Field label="كلمة المرور">
              <div className="flex gap-2">
                <input
                  type={loginForm.reveal ? "text" : "password"}
                  value={loginForm.password}
                  onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })}
                  className="input-field"
                />
                <button type="button" onClick={() => setLoginForm({ ...loginForm, reveal: !loginForm.reveal })} className="rounded-2xl border border-slate-200 px-4 text-slate-600 transition hover:bg-slate-50">
                  {loginForm.reveal ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </Field>
            <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-brand px-5 py-3.5 font-semibold text-white transition hover:opacity-95">
              <FaLock />
              دخول آمن
            </button>
          </div>
        </form>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">لوحة تحكم رويال</p>
          <h2 className="mt-1 text-3xl font-extrabold text-slate-900">إدارة المنتجات والوكلاء والعروض والرسائل</h2>
        </div>
        <button onClick={onLogout} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-50">
          <FaSignOutAlt />
          تسجيل الخروج
        </button>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="space-y-2">
            {adminTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setAdminTab(tab.id)}
                  className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-right font-semibold transition ${
                    adminTab === tab.id ? "bg-brand text-white shadow-lg shadow-blue-500/20" : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <Icon />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="mt-5 rounded-3xl bg-slate-50 p-4 text-sm leading-8 text-slate-600">
            يعدل المدير البيانات محلياً داخل المتصفح، ويمكن نقل هذه البنية إلى PHP وMySQL بسهولة عبر الملف المرفق لقاعدة البيانات.
          </div>
        </aside>

        <div className="space-y-6">
          {adminTab === "dashboard" && (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold text-slate-400">{stat.label}</div>
                        <div className="mt-2 text-3xl font-extrabold text-slate-900">{stat.value}</div>
                      </div>
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-white">
                        <Icon />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {adminTab === "products" && (
            <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
              <EditorShell title={editingProductId ? "تعديل منتج" : "إضافة منتج"} subtitle="أدخل اسم المنتج والسعر والتصنيف ثم ارفع صورة أو ضع رابطاً مباشراً.">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="اسم المنتج">
                    <input value={productDraft.name} onChange={(event) => setProductDraft({ ...productDraft, name: event.target.value })} className="input-field" />
                  </Field>
                  <Field label="القسم">
                    <select
                      value={productDraft.sectionId}
                      onChange={(event) =>
                        setProductDraft({
                          ...productDraft,
                          sectionId: event.target.value as SectionId,
                          subcategory: sections.find((section) => section.id === (event.target.value as SectionId))?.subcategories[0] ?? productDraft.subcategory,
                        })
                      }
                      className="input-field"
                    >
                      {sections.map((section) => (
                        <option key={section.id} value={section.id}>
                          {section.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="التصنيف الفرعي">
                    <select value={productDraft.subcategory} onChange={(event) => setProductDraft({ ...productDraft, subcategory: event.target.value })} className="input-field">
                      {sections.find((section) => section.id === productDraft.sectionId)?.subcategories.map((subcategory) => (
                        <option key={subcategory} value={subcategory}>
                          {subcategory}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="السعر">
                    <input value={productDraft.price} onChange={(event) => setProductDraft({ ...productDraft, price: event.target.value })} className="input-field" />
                  </Field>
                </div>
                <Field label="الوصف" className="mt-4">
                  <textarea rows={4} value={productDraft.description} onChange={(event) => setProductDraft({ ...productDraft, description: event.target.value })} className="input-field resize-none" />
                </Field>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Field label="رابط الصورة">
                    <input value={productDraft.image} onChange={(event) => setProductDraft({ ...productDraft, image: event.target.value })} className="input-field" />
                  </Field>
                  <Field label="رفع صورة">
                    <input
                      type="file"
                      accept="image/*"
                      className="input-field py-2"
                      onChange={async (event) => {
                        const file = event.target.files?.[0];
                        if (!file) return;
                        const dataUrl = await fileToDataUrl(file);
                        setProductDraft({ ...productDraft, image: dataUrl });
                      }}
                    />
                  </Field>
                </div>
                <label className="mt-4 flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                  <input type="checkbox" checked={productDraft.featured} onChange={(event) => setProductDraft({ ...productDraft, featured: event.target.checked })} />
                  منتج مميز في الواجهة
                </label>
                <div className="mt-5 flex flex-wrap gap-3">
                  <button onClick={handleProductSave} type="button" className="inline-flex items-center gap-2 rounded-2xl bg-brand px-5 py-3 font-semibold text-white transition hover:opacity-95">
                    <FaPlus />
                    حفظ المنتج
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setProductDraft(productFormTemplate(sections[0]?.id ?? defaultSections[0].id));
                      setEditingProductId(null);
                    }}
                    className="rounded-2xl border border-slate-200 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    إعادة تعيين
                  </button>
                </div>
              </EditorShell>

              <div className="space-y-4">
                {products.map((product) => (
                  <div key={product.id} className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-col gap-4 sm:flex-row">
                      <img src={product.image} alt={product.name} className="h-28 w-full rounded-2xl object-cover sm:w-36" />
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-brand">{sections.find((section) => section.id === product.sectionId)?.name}</div>
                            <h4 className="text-lg font-bold text-slate-900">{product.name}</h4>
                          </div>
                          <div className="text-sm font-semibold text-slate-500">{product.price}</div>
                        </div>
                        <p className="mt-2 line-clamp-2 text-sm leading-7 text-slate-600">{product.description}</p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            onClick={() => {
                              setEditingProductId(product.id);
                              setProductDraft({ ...product });
                            }}
                            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                          >
                            <FaEdit />
                            تعديل
                          </button>
                          <button
                            onClick={() => {
                              setProducts((current) => current.filter((entry) => entry.id !== product.id));
                              notify("تم حذف المنتج.");
                            }}
                            className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                          >
                            <FaTrash />
                            حذف
                          </button>
                          <button onClick={() => requestProduct(product)} className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-95">
                            <FaPaperPlane />
                            طلب من الصفحة
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {adminTab === "sections" && (
            <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
              <EditorShell title={editingSectionId ? "تعديل قسم" : "إضافة قسم"} subtitle="يمكنك إدارة القسم ومحتواه الفرعي مباشرة من هنا.">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="اسم القسم">
                    <input value={sectionDraft.name} onChange={(event) => setSectionDraft({ ...sectionDraft, name: event.target.value })} className="input-field" />
                  </Field>
                  <Field label="الأيقونة">
                    <select value={sectionDraft.icon} onChange={(event) => setSectionDraft({ ...sectionDraft, icon: event.target.value })} className="input-field">
                      <option value="droplet">droplet</option>
                      <option value="bolt">bolt</option>
                      <option value="building">building</option>
                      <option value="warehouse">warehouse</option>
                      <option value="truck">truck</option>
                      <option value="boxes">boxes</option>
                    </select>
                  </Field>
                  <Field label="اللون">
                    <input type="color" value={sectionDraft.color} onChange={(event) => setSectionDraft({ ...sectionDraft, color: event.target.value })} className="input-field h-12 p-1" />
                  </Field>
                  <Field label="العنوان المختصر">
                    <input value={sectionDraft.headline} onChange={(event) => setSectionDraft({ ...sectionDraft, headline: event.target.value })} className="input-field" />
                  </Field>
                </div>
                <Field label="الوصف" className="mt-4">
                  <textarea rows={4} value={sectionDraft.summary} onChange={(event) => setSectionDraft({ ...sectionDraft, summary: event.target.value })} className="input-field resize-none" />
                </Field>
                <div className="mt-4 space-y-3">
                  <div className="text-sm font-semibold text-slate-500">التصنيفات الفرعية</div>
                  <div className="flex flex-wrap gap-2">
                    {sectionDraft.subcategories.map((subcategory) => (
                      <span key={subcategory} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        {subcategory}
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={subcategoryDrafts[sectionDraft.name] ?? ""}
                      onChange={(event) => setSubcategoryDrafts((current) => ({ ...current, [sectionDraft.name]: event.target.value }))}
                      placeholder="إضافة تصنيف فرعي"
                      className="input-field"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const value = (subcategoryDrafts[sectionDraft.name] ?? "").trim();
                        if (!value) return;
                        setSectionDraft({ ...sectionDraft, subcategories: [...sectionDraft.subcategories, value] });
                        setSubcategoryDrafts((current) => ({ ...current, [sectionDraft.name]: "" }));
                      }}
                      className="rounded-2xl bg-brand px-4 text-white transition hover:opacity-95"
                    >
                      إضافة
                    </button>
                  </div>
                </div>
                <div className="mt-5 flex gap-3">
                  <button onClick={handleSectionSave} type="button" className="inline-flex items-center gap-2 rounded-2xl bg-brand px-5 py-3 font-semibold text-white transition hover:opacity-95">
                    <FaPlus />
                    حفظ القسم
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSectionDraft(sectionFormTemplate());
                      setEditingSectionId(null);
                    }}
                    className="rounded-2xl border border-slate-200 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    إعادة تعيين
                  </button>
                </div>
              </EditorShell>

              <div className="space-y-4">
                {sections.map((section) => (
                  <div key={section.id} className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="text-xl font-bold text-slate-900">{section.name}</h4>
                        <p className="mt-2 leading-8 text-slate-600">{section.summary}</p>
                      </div>
                      <div className="h-12 w-12 rounded-2xl" style={{ backgroundColor: section.color }} />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {section.subcategories.map((subcategory) => (
                        <span key={subcategory} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                          {subcategory}
                        </span>
                      ))}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          setEditingSectionId(section.id);
                          setSectionDraft({ ...section });
                        }}
                        className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        تعديل
                      </button>
                      <button
                        onClick={() => {
                          setSections((current) => current.filter((entry) => entry.id !== section.id));
                          setProducts((current) => current.filter((product) => product.sectionId !== section.id));
                          notify("تم حذف القسم مع المنتجات التابعة له.");
                        }}
                        className="rounded-2xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                      >
                        حذف
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {adminTab === "agents" && (
            <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
              <EditorShell title={editingAgentId ? "تعديل وكيل" : "إضافة وكيل"} subtitle="أدخل اسم الوكيل وموقعه والمحافظة المرتبطة به.">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="اسم الوكيل">
                    <input value={agentDraft.name} onChange={(event) => setAgentDraft({ ...agentDraft, name: event.target.value })} className="input-field" />
                  </Field>
                  <Field label="المحافظة">
                    <select value={agentDraft.province} onChange={(event) => setAgentDraft({ ...agentDraft, province: event.target.value })} className="input-field">
                      {governorates.map((province) => (
                        <option key={province} value={province}>
                          {province}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="رقم الهاتف">
                    <input dir="ltr" value={agentDraft.phone} onChange={(event) => setAgentDraft({ ...agentDraft, phone: event.target.value })} className="input-field" />
                  </Field>
                  <Field label="الشعار أو الصورة">
                    <input value={agentDraft.logo ?? ""} onChange={(event) => setAgentDraft({ ...agentDraft, logo: event.target.value })} className="input-field" />
                  </Field>
                </div>
                <Field label="العنوان" className="mt-4">
                  <textarea rows={4} value={agentDraft.address} onChange={(event) => setAgentDraft({ ...agentDraft, address: event.target.value })} className="input-field resize-none" />
                </Field>
                <div className="mt-5 flex gap-3">
                  <button onClick={handleAgentSave} type="button" className="inline-flex items-center gap-2 rounded-2xl bg-brand px-5 py-3 font-semibold text-white transition hover:opacity-95">
                    <FaPlus />
                    حفظ الوكيل
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAgentDraft(agentFormTemplate());
                      setEditingAgentId(null);
                    }}
                    className="rounded-2xl border border-slate-200 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    إعادة تعيين
                  </button>
                </div>
              </EditorShell>

              <div className="space-y-4">
                {agents.map((agent) => (
                  <div key={agent.id} className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-4">
                      {agent.logo ? (
                        <img src={agent.logo} alt={agent.name} className="h-16 w-16 rounded-2xl object-cover" />
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand text-xl font-extrabold text-white">{agent.name.slice(0, 1)}</div>
                      )}
                      <div className="flex-1">
                        <h4 className="text-lg font-bold text-slate-900">{agent.name}</h4>
                        <p className="text-sm text-slate-500">{agent.province}</p>
                        <p className="mt-2 text-sm leading-7 text-slate-600">{agent.address}</p>
                        <p className="mt-2 text-sm font-semibold text-slate-700" dir="ltr">
                          {agent.phone}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          setEditingAgentId(agent.id);
                          setAgentDraft({ ...agent });
                        }}
                        className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        تعديل
                      </button>
                      <button
                        onClick={() => {
                          setAgents((current) => current.filter((entry) => entry.id !== agent.id));
                          notify("تم حذف الوكيل.");
                        }}
                        className="rounded-2xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                      >
                        حذف
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {adminTab === "banners" && (
            <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
              <EditorShell title={editingBannerId ? "تعديل العرض" : "إضافة عرض"} subtitle="يمكن استخدام العرض في السلايدر العلوي مع تاريخ انتهاء اختياري.">
                <Field label="عنوان العرض">
                  <input value={bannerDraft.title} onChange={(event) => setBannerDraft({ ...bannerDraft, title: event.target.value })} className="input-field" />
                </Field>
                <Field label="الوصف" className="mt-4">
                  <textarea rows={4} value={bannerDraft.subtitle} onChange={(event) => setBannerDraft({ ...bannerDraft, subtitle: event.target.value })} className="input-field resize-none" />
                </Field>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Field label="رابط الصورة">
                    <input value={bannerDraft.image} onChange={(event) => setBannerDraft({ ...bannerDraft, image: event.target.value })} className="input-field" />
                  </Field>
                  <Field label="رابط الزر">
                    <input value={bannerDraft.link} onChange={(event) => setBannerDraft({ ...bannerDraft, link: event.target.value })} className="input-field" />
                  </Field>
                  <Field label="نص الزر">
                    <input value={bannerDraft.cta} onChange={(event) => setBannerDraft({ ...bannerDraft, cta: event.target.value })} className="input-field" />
                  </Field>
                  <Field label="تاريخ الانتهاء">
                    <input type="date" value={bannerDraft.expires} onChange={(event) => setBannerDraft({ ...bannerDraft, expires: event.target.value })} className="input-field" />
                  </Field>
                </div>
                <Field label="رفع صورة" className="mt-4">
                  <input
                    type="file"
                    accept="image/*"
                    className="input-field py-2"
                    onChange={async (event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      const dataUrl = await fileToDataUrl(file);
                      setBannerDraft({ ...bannerDraft, image: dataUrl });
                    }}
                  />
                </Field>
                <div className="mt-5 flex gap-3">
                  <button onClick={handleBannerSave} type="button" className="inline-flex items-center gap-2 rounded-2xl bg-brand px-5 py-3 font-semibold text-white transition hover:opacity-95">
                    <FaPlus />
                    حفظ العرض
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBannerDraft(bannerFormTemplate());
                      setEditingBannerId(null);
                    }}
                    className="rounded-2xl border border-slate-200 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    إعادة تعيين
                  </button>
                </div>
              </EditorShell>

              <div className="space-y-4">
                {banners.map((banner) => (
                  <div key={banner.id} className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
                    <img src={banner.image} alt={banner.title} className="h-48 w-full object-cover" />
                    <div className="space-y-4 p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="text-xl font-bold text-slate-900">{banner.title}</h4>
                          <p className="mt-2 leading-8 text-slate-600">{banner.subtitle}</p>
                        </div>
                        <div className="rounded-2xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-500">
                          {banner.expires ? `ينتهي: ${banner.expires}` : "بدون انتهاء"}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => {
                            setEditingBannerId(banner.id);
                            setBannerDraft({ ...banner });
                          }}
                          className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          تعديل
                        </button>
                        <button
                          onClick={() => {
                            setBanners((current) => current.filter((entry) => entry.id !== banner.id));
                            notify("تم حذف العرض.");
                          }}
                          className="rounded-2xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                        >
                          حذف
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {adminTab === "messages" && (
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message.id} className={`rounded-[2rem] border p-5 shadow-sm ${message.read ? "border-slate-200 bg-white" : "border-brand/30 bg-blue-50/70"}`}>
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-xl font-bold text-slate-900">{message.subject || "رسالة بدون موضوع"}</h4>
                        {!message.read && <span className="rounded-full bg-brand px-3 py-1 text-xs font-semibold text-white">غير مقروءة</span>}
                      </div>
                      <p className="mt-2 text-sm text-slate-500">
                        {message.name} - {message.email}
                      </p>
                      <p className="mt-2 text-sm text-slate-500" dir="ltr">
                        {message.phone}
                      </p>
                      <p className="mt-4 leading-8 text-slate-600">{message.message}</p>
                      <p className="mt-4 text-xs text-slate-400">{formatDate(message.createdAt)}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          setMessages((current) => current.map((entry) => (entry.id === message.id ? { ...entry, read: true } : entry)));
                          notify("تم تعليم الرسالة كمقروءة.");
                        }}
                        className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        مقروءة
                      </button>
                      <button
                        onClick={() => {
                          setMessages((current) => current.filter((entry) => entry.id !== message.id));
                          notify("تم حذف الرسالة.");
                        }}
                        className="rounded-2xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                      >
                        حذف
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {!messages.length && <div className="rounded-[2rem] border border-dashed border-slate-200 bg-white p-10 text-center text-slate-500">لا توجد رسائل واردة حالياً.</div>}
            </div>
          )}

          {adminTab === "settings" && (
            <EditorShell title="إعدادات الموقع" subtitle="تحديث الاسم، الألوان، معلومات التواصل، والرابط التعريفي بصورة مباشرة.">
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  ["siteName", "اسم الموقع"],
                  ["logoText", "نص الشعار"],
                  ["tagline", "الشعار النصي"],
                  ["primaryColor", "اللون الأساسي"],
                  ["secondaryColor", "اللون الثانوي"],
                  ["contactPhone", "رقم الهاتف"],
                  ["whatsapp", "واتساب"],
                  ["email", "البريد الإلكتروني"],
                  ["address", "العنوان"],
                  ["facebook", "فيسبوك"],
                  ["instagram", "انستغرام"],
                  ["youtube", "يوتيوب"],
                  ["mapEmbed", "رابط الخريطة"],
                  ["aboutVideo", "رابط الفيديو التعريفي"],
                  ["founded", "سنة التأسيس"],
                ].map(([key, label]) => (
                  <Field key={String(key)} label={label}>
                    <input
                      value={(settings as Record<string, string>)[key] ?? ""}
                      onChange={(event) => setSettings({ ...settings, [key]: event.target.value } as Settings)}
                      className="input-field"
                      dir={String(key).includes("phone") || String(key).includes("whatsapp") || String(key).includes("email") || String(key).includes("link") || String(key).includes("map") || String(key).includes("youtube") || String(key).includes("instagram") || String(key).includes("facebook") ? "ltr" : undefined}
                    />
                  </Field>
                ))}
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="قصة الشركة">
                  <textarea rows={4} value={settings.aboutStory} onChange={(event) => setSettings({ ...settings, aboutStory: event.target.value })} className="input-field resize-none" />
                </Field>
                <Field label="الرؤية">
                  <textarea rows={4} value={settings.aboutVision} onChange={(event) => setSettings({ ...settings, aboutVision: event.target.value })} className="input-field resize-none" />
                </Field>
                <Field label="الرسالة">
                  <textarea rows={4} value={settings.aboutMission} onChange={(event) => setSettings({ ...settings, aboutMission: event.target.value })} className="input-field resize-none" />
                </Field>
              </div>
              <div className="mt-4 rounded-3xl bg-slate-50 p-4 text-sm leading-8 text-slate-600">
                هذه الحقول تغيّر هوية الموقع بشكل مباشر عبر المتصفح، وهي مهيأة للتحويل لاحقاً إلى جدول إعدادات داخل MySQL.
              </div>
            </EditorShell>
          )}
        </div>
      </div>
    </section>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block text-right ${className}`}>
      <span className="text-sm font-semibold text-slate-500">{label}</span>
      {children}
    </label>
  );
}

function EditorShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h3 className="text-2xl font-extrabold text-slate-900">{title}</h3>
        <p className="mt-2 leading-8 text-slate-500">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function Footer({ settings, setView }: { settings: Settings; setView: (view: View) => void }) {
  return (
    <footer className="border-t border-slate-200 bg-slate-950 text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-3 lg:px-8">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand text-lg font-extrabold text-white">{settings.logoText.slice(0, 1)}</div>
            <div>
              <div className="text-lg font-bold">{settings.siteName}</div>
              <div className="text-sm text-white/60">{settings.tagline}</div>
            </div>
          </div>
          <p className="mt-4 max-w-md leading-8 text-white/65">شركة متخصصة في المواسير وأدوات السباكة والكهرباء ومواد البناء مع تجربة عرض وطلب منظمة وسريعة.</p>
        </div>

        <div>
          <div className="text-sm font-semibold uppercase tracking-[0.25em] text-white/40">روابط سريعة</div>
          <div className="mt-4 space-y-2 text-white/75">
            {menuItems.map((item) => (
              <button key={item.view} onClick={() => setView(item.view)} className="block transition hover:text-white">
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="text-sm font-semibold uppercase tracking-[0.25em] text-white/40">معلومات التواصل</div>
          <div className="mt-4 space-y-3 text-white/75">
            <p className="flex items-center gap-2">
              <FaPhone className="text-brand" />
              <span dir="ltr">{settings.contactPhone}</span>
            </p>
            <p className="flex items-center gap-2">
              <FaWhatsapp className="text-brand" />
              <span dir="ltr">{settings.whatsapp}</span>
            </p>
            <p className="flex items-center gap-2">
              <FaEnvelope className="text-brand" />
              {settings.email}
            </p>
            <p className="flex items-start gap-2">
              <FaMapMarkerAlt className="mt-1 text-brand" />
              {settings.address}
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 px-4 py-4 text-center text-sm text-white/45 sm:px-6 lg:px-8">© {new Date().getFullYear()} {settings.siteName}. جميع الحقوق محفوظة.</div>
    </footer>
  );
}

function SectionHeader({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="max-w-3xl text-right">
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">{title}</h2>
      <p className="mt-4 max-w-2xl leading-8 text-slate-600">{description}</p>
    </div>
  );
}

export default App;
