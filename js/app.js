/**
 * APPLICATION LOGIC
 * ----------------------------------------------------------------
 * Bu dosya, uygulamanın kontrol mekanizmasıdır (Controller).
 * DataService'den veriyi alır ve UI'ı günceller.
 */

const App = {
  // Uygulama Durumu (State)
  state: {
    language: null, // Başlangıçta dil seçilmedi
    theme: "light", // Varsayılan tema
  },

  // Başlatıcı Fonksiyon
  init: () => {
    console.log("App Initialized v2.1");

    // Splash ekranı aktifken kaydırmayı engelle (Scrollbar kaymasını önler)
    document.body.style.overflow = "hidden";

    App.cacheDOM(); // Cache DOM first to ensure elements are available

    // Splash Text Update (Varsayılan olarak TR değerini kullan)
    const t = DataService.getTranslations();
    if (t && t.splashText && App.dom.splashText) {
      App.dom.splashText.textContent = t.splashText.tr;
    }

    App.applyGeneralSettings(); // Genel ayarları uygula
    App.applyCompanyInfo(); // Firma bilgilerini uygula
    App.applyHero(); // Hero görselini uygula
    App.initTheme(); // Temayı yükle ve uygula
    App.bindEvents();
    // Varsayılan render yok, kullanıcı dil seçince başlayacak
  },

  // Genel Ayarları Uygula
  applyGeneralSettings: () => {
    const settings = DataService.getSettings();
    if (!settings) return;

    // Tema değiştirme izni kontrolü
    if (settings.themeToggleAllowed === false && App.dom.themeToggle) {
      App.dom.themeToggle.style.display = "none";
    }

    // Site başlığını güncelle (Varsayılan dil ile başla)
    // Dil seçildikten sonra setLanguage içinde tekrar güncellenecek
    const defaultLang = settings.defaultLanguage || "tr";
    if (settings.siteTitle && settings.siteTitle[defaultLang]) {
      document.title = settings.siteTitle[defaultLang];
    }
  },

  // Firma Bilgilerini Uygula
  applyCompanyInfo: () => {
    const company = DataService.getCompany();
    if (!company) return;
    const lang = App.state.language || "tr";

    // 1. Header Logo
    const logoEl = document.querySelector(".logo");
    // JavaScript ile logoyu güncelliyoruz
    if (logoEl) {
      // Handle object or string for backward compatibility
      const text =
        typeof company.logoText === "object"
          ? company.logoText[lang]
          : company.logoText;

      const parts = text.split(" ");
      if (parts.length > 1) {
        // İlk kelimeyi prefix, geri kalanı main olarak ayır
        logoEl.innerHTML = `<span class="brand-prefix">${
          parts[0]
        }</span><span class="brand-main">${parts.slice(1).join(" ")}</span>`;
      } else {
        logoEl.textContent = text;
      }
    }

    // 2. Splash Screen Logo (Admin panelden gelen marka adı)
    const splashLogoEl = document.querySelector(".splash-logo");
    if (splashLogoEl && company.logoText) {
      const text =
        typeof company.logoText === "object"
          ? company.logoText[lang]
          : company.logoText;

      const parts = text.split(" ");
      if (parts.length > 1) {
        // CSS class tabanlı yapı (app.js temizlendi)
        splashLogoEl.innerHTML = `<span class="brand-prefix">${
          parts[0]
        }</span><span class="brand-main">${parts.slice(1).join(" ")}</span>`;
      } else {
        splashLogoEl.textContent = text;
      }
    }
  },

  // Hero Görselini Uygula
  applyHero: () => {
    const hero = DataService.getHero();
    const heroSection = document.querySelector(".hero");

    if (heroSection && hero && hero.backgroundImage) {
      heroSection.style.backgroundImage = `url('${hero.backgroundImage}')`;
    }
  },

  // Tema Yönetimi (Dark/Light)
  initTheme: () => {
    // 1. LocalStorage kontrol et
    const savedTheme = localStorage.getItem("gourmet_theme");
    const settings = DataService.getSettings();

    if (savedTheme) {
      App.state.theme = savedTheme;
    } else if (
      settings &&
      settings.defaultTheme &&
      settings.defaultTheme !== "system"
    ) {
      // Admin panelinden seçilen varsayılan tema
      App.state.theme = settings.defaultTheme.toLowerCase();
    } else {
      // Sistem temasını kontrol et
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      App.state.theme = prefersDark ? "dark" : "light";
    }

    // Temayı uygula
    App.applyThemeColors();
  },

  // Tema Renklerini CSS Değişkenlerine Ata
  applyThemeColors: () => {
    const themeMode = App.state.theme; // 'light' or 'dark'
    const themeData = DataService.getTheme(); // { light: {...}, dark: {...} }

    if (themeData && themeData[themeMode]) {
      const colors = themeData[themeMode];
      Object.entries(colors).forEach(([key, value]) => {
        document.documentElement.style.setProperty(key, value);
      });
    }

    // Data-theme attribute güncelle (CSS'deki diğer stiller için)
    document.documentElement.setAttribute("data-theme", themeMode);

    // İkonları güncelle
    if (App.dom.themeToggle) App.updateThemeIcon();
  },

  toggleTheme: () => {
    const newTheme = App.state.theme === "light" ? "dark" : "light";
    App.state.theme = newTheme;

    // Renkleri ve durumu uygula
    App.applyThemeColors();

    // LocalStorage kaydet
    localStorage.setItem("gourmet_theme", newTheme);

    // Analytics Event
    Analytics.logThemeChange(newTheme);
  },

  updateThemeIcon: () => {
    const sunIcon = App.dom.themeToggle.querySelector(".icon-sun");
    const moonIcon = App.dom.themeToggle.querySelector(".icon-moon");

    if (App.state.theme === "dark") {
      sunIcon.style.display = "none";
      moonIcon.style.display = "inline";
    } else {
      sunIcon.style.display = "inline";
      moonIcon.style.display = "none";
    }
  },

  // DOM Elementlerini Önbelleğe Alma
  cacheDOM: () => {
    App.dom = {
      splashScreen: document.getElementById("lang-splash"),
      splashButtons: document.querySelectorAll(".splash-btn"),
      splashText: document.querySelector(".splash-content p"),

      // Main Content Elements
      mainHeader: document.getElementById("main-header"),
      themeToggle: document.getElementById("theme-toggle"),

      heroSection: document.querySelector(".hero"),
      mainContent: document.querySelector("main.container"),

      langButtons: document.querySelectorAll(".lang-toggle"),
      menuContainer: document.getElementById("menu-container"),
      welcomeTitle: document.getElementById("welcome-title"),
      welcomeSubtitle: document.getElementById("welcome-subtitle"),
      footer: document.getElementById("main-footer"),
    };

    // Tema ikonlarını başlangıçta ayarla
    if (App.dom.themeToggle) App.updateThemeIcon();
  },

  // Splash Screen Eventlerini Bağla (Veri yüklenmesini beklemeden)
  bindSplashEvents: () => {
    if (!App.dom.splashButtons) return;

    App.dom.splashButtons.forEach((btn) => {
      // Önceki listener'ları temizle (varsa) - Clone yöntemi en temizidir ama
      // burada init öncesi çalıştığı için çakışma olmaz.
      btn.addEventListener("click", (e) => {
        // e.target yerine e.currentTarget kullanıyoruz
        const lang = e.currentTarget.dataset.lang;
        if (lang) {
          App.setLanguage(lang);
          App.hideSplash();
        }
      });
    });
  },

  // Event Listener'ları Tanımlama
  bindEvents: () => {
    // Menu Item Click Delegation (Product Modal)
    if (App.dom.menuContainer) {
      App.dom.menuContainer.addEventListener("click", (e) => {
        const card = e.target.closest(".product-card");
        if (card && card.dataset.id) {
          App.openProductModal(card.dataset.id);
        }
      });
    }

    // Header Dil Değişimi
    App.dom.langButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const lang = e.target.closest(".lang-toggle").dataset.lang;
        App.setLanguage(lang);
      });
    });

    // Tema Değiştirme
    if (App.dom.themeToggle) {
      App.dom.themeToggle.addEventListener("click", App.toggleTheme);
    }

    // Modal Close Events
    const modalCloseBtn = document.querySelector(".product-modal-close");
    const modalBackdrop = document.querySelector(".product-modal-backdrop");

    if (modalCloseBtn)
      modalCloseBtn.addEventListener("click", App.closeProductModal);
    if (modalBackdrop)
      modalBackdrop.addEventListener("click", App.closeProductModal);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") App.closeProductModal();
    });

    // Cross-Tab Data Sync (Admin panelinden yapılan değişiklikleri anlık yakala)
    window.addEventListener("storage", async (e) => {
      if (e.key === "gourmet_data") {
        console.log("Data changed externally. Reloading...");
        await DataService.init();

        // Eğer uygulama zaten açıksa arayüzü güncelle
        if (App.state.language) {
          App.applyGeneralSettings();
          App.applyCompanyInfo();
          App.render();

          // Eğer footer açıksa onu da güncelle
          if (App.dom.footer && App.dom.footer.style.display !== "none") {
            App.renderFooter();
          }
        }
      }
    });
  },

  // Splash Screen'i Gizle ve İçeriği Göster
  hideSplash: () => {
    const splash = App.dom.splashScreen;
    document.body.style.overflow = "hidden"; // Scroll'u engelle
    splash.style.opacity = "0";
    splash.style.transition = "opacity 0.5s ease";

    setTimeout(() => {
      splash.style.display = "none";
      document.body.style.overflow = ""; // Scroll'u geri getir
      App.renderSections();

      setTimeout(() => {
        App.dom.mainHeader.style.opacity = "1";
        App.dom.heroSection.style.opacity = "1";
        App.dom.mainContent.style.opacity = "1";
      }, 50);
    }, 500);
  },

  // Durum Değiştiriciler
  setLanguage: (lang) => {
    if (App.state.language === lang) return;
    App.state.language = lang;

    // LocalStorage (Opsiyonel: kalıcılık için)
    localStorage.setItem("gourmet_language", lang);

    // Site başlığını güncelle
    const settings = DataService.getSettings();
    if (settings && settings.siteTitle && settings.siteTitle[lang]) {
      document.title = settings.siteTitle[lang];
    }

    // Aktif buton stilini güncelle (Header'daki)
    App.dom.langButtons.forEach((btn) => {
      if (btn.dataset.lang === lang) btn.classList.add("active");
      else btn.classList.remove("active");
    });

    App.render(); // Arayüzü yeniden çiz

    // Analytics Event
    Analytics.logLanguageChange(lang);
  },

  // Product Modal Logic
  openProductModal: (productId) => {
    const products = DataService.getAllProducts();
    if (!products) return;

    const product = products.find((p) => p.id === productId);
    if (!product) {
      console.error("Product not found:", productId);
      return;
    }

    const lang = App.state.language || "tr";
    const settings = DataService.getSettings();

    // Elements
    const modal = document.getElementById("product-modal");
    const imgContainer = document.querySelector(
      ".product-modal-image-container"
    );
    const img = document.getElementById("pm-image");
    const title = document.getElementById("pm-title");
    const descEl = document.getElementById("pm-desc");
    const priceEl = document.getElementById("pm-price");
    const tagsContainer = document.getElementById("pm-tags");

    if (!modal || !img || !title || !descEl || !priceEl || !tagsContainer)
      return;

    // 1. Image Handling
    // If image exists and is not empty string, show it. Otherwise hide container.
    if (product.image && product.image.trim() !== "") {
      if (imgContainer) {
        imgContainer.style.display = "flex"; // Ensure it's visible and using flex

        // Reset classes
        imgContainer.classList.remove("fit-contain", "fit-cover");

        // Smart Object-Fit Logic
        // Drink -> Contain (Bottle/Glass proportions)
        // Food/Dessert -> Contain (Show full plate presentation)
        if (product.categoryId === "drink") {
          imgContainer.classList.add("fit-contain");
        } else {
          // Changed to contain based on new requirement for full visibility
          imgContainer.classList.add("fit-contain");
        }
      }

      img.style.display = "block";
      img.src = product.image;
      img.alt = product.name[lang] || "";
      // Fallback only on error (broken link), not on missing data
      img.onerror = () => {
        img.src = "img/logo.jpeg";
      };
    } else {
      if (imgContainer) imgContainer.style.display = "none";
      else img.style.display = "none";
    }

    // 2. Title Handling
    title.textContent = product.name[lang] || "";

    // 3. Description Handling (Prefer longDescription)
    let descText = "";
    if (product.longDescription && product.longDescription[lang]) {
      descText = product.longDescription[lang];
    } else if (product.description && product.description[lang]) {
      descText = product.description[lang];
    }

    if (descText && descText.trim() !== "") {
      descEl.style.display = "block";
      descEl.textContent = descText;
    } else {
      descEl.style.display = "none";
    }

    // 4. Price Handling
    // Check for null, undefined, or empty string (but allow 0)
    if (
      product.price !== undefined &&
      product.price !== null &&
      product.price !== ""
    ) {
      priceEl.style.display = "block";
      priceEl.textContent = `${product.price} ${settings.currency}`;
    } else {
      priceEl.style.display = "none";
    }

    // 5. Tags Handling
    tagsContainer.innerHTML = "";
    tagsContainer.style.display = "none"; // Hide by default

    if (product.tags) {
      const tagLabels = {
        gluten: { tr: "Gluten İçerir", en: "Contains Gluten", icon: "🌾" },
        dairy: { tr: "Süt Ürünü", en: "Dairy", icon: "🥛" },
        spicy: { tr: "Acılı", en: "Spicy", icon: "🌶️" },
        vegan: { tr: "Vegan", en: "Vegan", icon: "🌱" },
        vegetarian: { tr: "Vejetaryen", en: "Vegetarian", icon: "🥗" },
      };

      let hasTags = false;
      Object.entries(product.tags).forEach(([key, value]) => {
        // Only show if value is explicitly true
        if (value === true && tagLabels[key]) {
          const tag = document.createElement("span");
          tag.className = "tag-item";
          tag.innerHTML = `${tagLabels[key].icon} ${tagLabels[key][lang]}`;
          tagsContainer.appendChild(tag);
          hasTags = true;
        }
      });

      if (hasTags) {
        tagsContainer.style.display = "flex";
      }
    }

    // Show Modal
    modal.classList.add("active");
    document.body.style.overflow = "hidden";
  },

  closeProductModal: () => {
    const modal = document.getElementById("product-modal");
    modal.classList.remove("active");
    document.body.style.overflow = "";
  },

  // Render Fonksiyonları
  render: () => {
    App.renderSections();
    App.renderStaticTexts();
    App.renderMenu();
    App.renderFooter();
  },

  renderSections: () => {
    const sections = DataService.getSections();
    const footerData = DataService.getFooter();

    if (!sections) return;

    if (App.dom.mainHeader)
      App.dom.mainHeader.style.display = sections.header ? "block" : "none";
    if (App.dom.heroSection)
      App.dom.heroSection.style.display = sections.hero ? "flex" : "none";
    if (App.dom.mainContent)
      App.dom.mainContent.style.display = sections.menu ? "block" : "none";
    if (App.dom.footer)
      App.dom.footer.style.display = footerData.isActive ? "block" : "none";
  },

  renderFooter: () => {
    const footerData = DataService.getFooter();
    const lang = App.state.language;
    const footer = App.dom.footer;

    if (!footer || !footerData.isActive) return;

    // Build Social Links HTML
    let socialLinksHtml = "";
    const socials = footerData.socials;

    if (Array.isArray(socials)) {
      socials.forEach((social) => {
        if (social.isActive && social.url) {
          const iconClass =
            social.platform === "instagram"
              ? "bi-instagram"
              : social.platform === "facebook"
              ? "bi-facebook"
              : "bi-link";
          socialLinksHtml += `
            <a href="${social.url}" target="_blank" class="footer-social-link" aria-label="${social.platform}">
              <i class="bi ${iconClass}"></i>
            </a>`;
        }
      });
    } else {
      // Fallback for old object structure (just in case)
      if (socials.instagram) {
        socialLinksHtml += `
          <a href="${socials.instagram}" target="_blank" class="footer-social-link" aria-label="Instagram">
            <i class="bi bi-instagram"></i>
          </a>`;
      }
      if (socials.facebook) {
        socialLinksHtml += `
          <a href="${socials.facebook}" target="_blank" class="footer-social-link" aria-label="Facebook">
            <i class="bi bi-facebook"></i>
          </a>`;
      }
    }

    // Build Review Button HTML
    let reviewHtml = "";
    if (footerData.reviewLink) {
      reviewHtml = `
        <a href="${footerData.reviewLink}" target="_blank" class="btn-review">
          <i class="bi bi-star-fill"></i> ${
            lang === "tr" ? "Bizi Değerlendirin" : "Rate Us"
          }
        </a>`;
    }

    // Render Content
    footer.innerHTML = `
      <div class="footer-content">
        <div class="footer-top">
          <!-- Brand -->
          <div class="footer-brand">
            <span class="footer-brand-name">${footerData.brandName}</span>
            <span class="footer-tagline">
              ${
                lang === "tr"
                  ? "Geleneksel lezzetlerin modern sunumu"
                  : "Modern presentation of traditional tastes"
              }
            </span>
          </div>

          <!-- Actions -->
          <div class="footer-actions">
            <div class="footer-socials">
              ${socialLinksHtml}
            </div>
            ${reviewHtml}
          </div>
        </div>

        <div class="footer-bottom">
          <p class="footer-copyright">${footerData.copyright[lang]}</p>
        </div>
      </div>
    `;
  },

  renderStaticTexts: () => {
    const t = DataService.getTranslations();
    const hero = DataService.getHero();
    const lang = App.state.language;

    if (App.dom.welcomeTitle) {
      if (hero && hero.title && hero.title[lang]) {
        App.dom.welcomeTitle.textContent = hero.title[lang];
      } else {
        App.dom.welcomeTitle.textContent = t.welcomeTitle[lang];
      }
    }
    if (App.dom.welcomeSubtitle) {
      if (hero && hero.subtitle && hero.subtitle[lang]) {
        App.dom.welcomeSubtitle.textContent = hero.subtitle[lang];
      } else {
        App.dom.welcomeSubtitle.textContent = t.welcomeSubtitle[lang];
      }
    }
  },

  renderMenu: () => {
    const menuContainer = App.dom.menuContainer;
    menuContainer.style.opacity = "0"; // Fade out efekti için

    setTimeout(() => {
      menuContainer.innerHTML = "";
      const categories = DataService.getCategories();
      const products = DataService.getAllProducts(); // Tüm ürünleri getir
      const lang = App.state.language;
      const t = DataService.getTranslations();
      const settings = DataService.getSettings();

      categories.forEach((category) => {
        // Bu kategorideki ürünleri filtrele
        const categoryProducts = products.filter(
          (p) => p.categoryId === category.id && p.status === "active"
        );

        if (categoryProducts.length > 0) {
          // Kategori Başlığı
          const section = document.createElement("section");
          section.className = "menu-section";

          const title = document.createElement("h2");
          title.className = "category-title";
          title.innerHTML = `<span>${category.icon}</span> ${category.name[lang]}`;
          section.appendChild(title);

          // Grid
          const grid = document.createElement("div");
          grid.className = "menu-grid";

          categoryProducts.forEach((product) => {
            const card = document.createElement("article");
            card.className = "product-card";
            card.dataset.id = product.id; // Add data-id for delegation
            card.style.cursor = "pointer";

            // Fiyat formatlama
            const formattedPrice = `${product.price} ${settings.currency}`;

            card.innerHTML = `
                            <div class="card-image">
                                <img src="${product.image}" alt="${product.name[lang]}" loading="lazy" onerror="this.src='img/logo.jpeg'">
                            </div>
                            <div class="card-content">
                                <div class="card-header">
                                    <h3 class="product-name">${product.name[lang]}</h3>
                                    <span class="product-price">${formattedPrice}</span>
                                </div>
                                <p class="product-desc">${product.description[lang]}</p>
                            </div>
                        `;
            grid.appendChild(card);
          });

          section.appendChild(grid);
          menuContainer.appendChild(section);
        }
      });

      menuContainer.style.opacity = "1"; // Fade in
    }, 200);
  },
};

// Sayfa yüklendiğinde başlat
document.addEventListener("DOMContentLoaded", async () => {
  // DOM elementlerini hemen önbelleğe al
  App.cacheDOM();

  // Splash eventlerini hemen bağla (Veri beklenirken kullanıcı tıklayabilsin)
  App.bindSplashEvents();

  // Verileri çek
  await DataService.init();

  // Eğer inline script tarafından dil seçildiyse, bunu al
  if (document.body.dataset.pendingLang) {
    App.state.language = document.body.dataset.pendingLang;
    localStorage.setItem("selectedLanguage", App.state.language);
  }

  // Uygulamayı başlat
  App.init();

  // Eğer kullanıcı veri yüklenmeden önce dili seçtiyse ve splash kapandıysa,
  // içeriğin güncel veriyle render edildiğinden emin ol.
  if (App.state.language && App.dom.splashScreen.style.display === "none") {
    App.render();
  }
});
