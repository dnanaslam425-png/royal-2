-- Royal for Pipes & Building Materials
-- MySQL schema starter for PHP integration

CREATE DATABASE IF NOT EXISTS royal_store CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE royal_store;

DROP TABLE IF EXISTS contact_messages;
DROP TABLE IF EXISTS banners;
DROP TABLE IF EXISTS agents;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS sections;
DROP TABLE IF EXISTS site_settings;
DROP TABLE IF EXISTS admin_users;

CREATE TABLE admin_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE site_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  site_name VARCHAR(255) NOT NULL,
  logo_text VARCHAR(100) NOT NULL,
  tagline VARCHAR(255) NOT NULL,
  primary_color VARCHAR(20) NOT NULL,
  secondary_color VARCHAR(20) NOT NULL,
  contact_phone VARCHAR(50) NOT NULL,
  whatsapp VARCHAR(50) NOT NULL,
  email VARCHAR(150) NOT NULL,
  address VARCHAR(255) NOT NULL,
  facebook VARCHAR(255) DEFAULT NULL,
  instagram VARCHAR(255) DEFAULT NULL,
  youtube VARCHAR(255) DEFAULT NULL,
  map_embed TEXT,
  about_video TEXT,
  founded_year VARCHAR(10) NOT NULL,
  about_story TEXT,
  about_vision TEXT,
  about_mission TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE sections (
  id INT AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(80) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  headline VARCHAR(255) NOT NULL,
  summary TEXT NOT NULL,
  icon_key VARCHAR(50) NOT NULL,
  color VARCHAR(20) NOT NULL,
  subcategories_json JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  section_slug VARCHAR(80) NOT NULL,
  name VARCHAR(255) NOT NULL,
  subcategory VARCHAR(120) NOT NULL,
  price_label VARCHAR(120) NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT NOT NULL,
  featured TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_section_slug (section_slug),
  CONSTRAINT fk_products_section_slug FOREIGN KEY (section_slug) REFERENCES sections(slug) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE agents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  province VARCHAR(120) NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  address VARCHAR(255) NOT NULL,
  logo_url TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_agents_province (province)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE banners (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  subtitle TEXT NOT NULL,
  image_url TEXT NOT NULL,
  cta_label VARCHAR(120) NOT NULL,
  link_url TEXT NOT NULL,
  expires_at DATE DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE contact_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(150) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_messages_read (is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO admin_users (username, password_hash, role) VALUES
('admin', '$2y$10$2mU1v7A8p3A0xZ3M2mLk9eV2g1cS5F8r9r9m9b0M1sJ5XK2r2zW2xK', 'admin');

INSERT INTO site_settings (
  site_name, logo_text, tagline, primary_color, secondary_color, contact_phone,
  whatsapp, email, address, facebook, instagram, youtube, map_embed, about_video,
  founded_year, about_story, about_vision, about_mission
) VALUES (
  'Royal for Pipes & Building Materials',
  'Royal',
  'حلول موثوقة للمواسير والسباكة والكهرباء ومواد البناء',
  '#1d4ed8',
  '#cbd5e1',
  '+967 784414445',
  '+967 784414445',
  'info@royal-yemen.com',
  'شارع الستين، صنعاء - الجمهورية اليمنية',
  'https://facebook.com',
  'https://instagram.com',
  'https://youtube.com',
  'https://www.google.com/maps?q=%D8%B5%D9%86%D8%B9%D8%A7%D8%A1%20%D8%A7%D9%84%D9%8A%D9%85%D9%86&output=embed',
  '',
  '2008',
  'تأسست رويال لتوفير مواد البناء والتمديدات الأساسية بجودة موثوقة وسلاسل توريد مرنة تخدم المقاولين وتجار الجملة والمشاريع الخاصة.',
  'أن تكون رويال الاسم الأول في السوق اليمني للحلول المتكاملة للمواسير والسباكة والكهرباء ومواد البناء.',
  'تقديم منتجات أصلية وخدمة سريعة وشبكة وكلاء منظمة مع دعم مستمر لفرق التنفيذ والعملاء.'
);

INSERT INTO sections (slug, name, headline, summary, icon_key, color, subcategories_json) VALUES
('plumbing', 'السباكة', 'حلول سباكة موثوقة للمشاريع السكنية والتجارية', 'مواسير، محابس، خلاطات، تجهيزات صحية وخزانات مياه بجودة عالية وتوريد سريع.', 'droplet', '#1d4ed8', JSON_ARRAY('PVC', 'حديد', 'بلاستيك', 'نحاس', 'محابس وخلاطات', 'تجهيزات صحية', 'خزانات مياه')),
('electric', 'الكهرباء', 'منتجات كهربائية تعتمد عليها فرق التنفيذ اليومية', 'أسلاك، قواطع، لوحات توزيع، إنارة وأدوات تركيب من علامات تجارية موثوقة.', 'bolt', '#2563eb', JSON_ARRAY('معزولة', 'مضفرة', 'أرضي', 'مفاتيح إضاءة', 'كوابح حماية', 'LED', 'لوحات توزيع', 'عدادات كهرباء', 'أدوات تركيب')),
('building', 'مواد البناء', 'توريد مواد البناء الأساسية لمواقع العمل ومشاريع المقاولات', 'حديد تسليح، أسمنت، رمل وزلط، بلوك، عزل، دهانات وأدوات تنفيذ.', 'building', '#64748b', JSON_ARRAY('حديد تسليح', 'أسمنت', 'رمل وزلط وبحص', 'طابوق وبلوك', 'مواد عازلة', 'دهانات', 'أدوات بناء'));

INSERT INTO products (section_slug, name, subcategory, price_label, description, image_url, featured) VALUES
('plumbing', 'مواسير PVC ضغط عالٍ 110 مم', 'PVC', '0 ر.ي', 'مواسير مخصصة لمشاريع الصرف والتمديدات الرئيسية مع تحمل ممتاز للاستخدام الطويل.', 'https://imag/WhatsApp Image 2026-06-24 at 2.25.57 AM (3).jpeg', 1),
('plumbing', 'لفات نحاس للتوصيلات الصحية', 'نحاس', ',000 ر.ي', 'حل عملي للتوصيلات الدقيقة في الحمامات والمطابخ مع مقاومة عالية للتآكل.', 'imag/WhatsApp Image 2026-06-24 at 2.25.54 AM (1).jpeg', 1),
('electric', 'سلك نحاس معزول 2.5 مم', 'معزولة', ',000 ر.ي', 'سلك مخصص للتمديدات الداخلية مع كفاءة ممتازة في نقل التيار واستقرار التشغيل.', 'imag/WhatsApp Image 2026-06-24 at 1.50.40 AM.jpeg', 1),
('electric', 'لمبة LED موفرة 18 واط', 'LED', '', 'إنارة اقتصادية بعمر تشغيلي طويل وتوزيع ضوئي مريح للمساحات الداخلية.', 'imag/WhatsApp Image 2026-06-24 at 1.50.47 AM.jpeg', 1),
('building', 'حديد تسليح 12 مم', 'حديد تسليح', '', 'حديد تسليح للمشاريع الإنشائية مع توازن جيد بين المتانة وسهولة الاستخدام.', 'imag/WhatsApp Image 2026-06-24 at 2.25.54 AM (3).jpeg', 1),
('building', 'أسمنت بورتلاندي 50 كجم', 'أسمنت', '', 'أسمنت متعدد الاستخدامات مناسب للمباني والأعمال الخرسانية المختلفة.', 'imag/WhatsApp Image 2026-06-24 at 2.25.54 AM.jpeg', 0);

INSERT INTO banners (title, subtitle, image_url, cta_label, link_url, expires_at) VALUES
('Royal for Pipes & Building Materials', 'حلول متكاملة للمواسير وأدوات السباكة والكهرباء ومواد البناء مع توريد سريع للمشاريع.', 'imag/WhatsApp Image 2026-06-24 at 2.25.56 AM.jpeg', 'استعرض المنتجات', '#products', NULL),
('منتجات سباكة معتمدة للمنازل والمشاريع', 'مواسير، محابس، خلاطات، خزانات وأكسسوارات تنفيذ بجودة موثوقة وسعر منافس.', 'imag/WhatsApp Image 2026-06-24 at 1.50.46 AM.jpeg', 'تواصل مع فريق المبيعات', '#contact', NULL),
('مواد بناء وكهرباء جاهزة للتوريد', 'من مواد الأساس حتى التشطيبات النهائية مع شبكة وكلاء تغطي المحافظات اليمنية.', 'imag/WhatsApp Image 2026-06-24 at 1.50.40 AM.jpeg', 'اعرف أقرب وكيل', '#agents', NULL);

INSERT INTO agents (province, name, phone, address, logo_url) VALUES
('صنعاء', 'مؤسسة رويال للتوزيع - صنعاء', '+967 784414445', 'حي السوق الرئيسي، صنعاء', 'imag/WhatsApp Image 2026-06-24 at 1.50.44 AM (2).jpeg'),
('عدن', 'شركة الريادة للمستلزمات - عدن', '+967 784414445', 'منطقة التوزيع الصناعي، عدن', NULL),
('تعز', 'مؤسسة الصفوة التجارية - تعز', '+967 784414445', 'حي السوق الرئيسي، تعز', 'imag/WhatsApp Image 2026-06-24 at 1.50.41 AM.jpeg');