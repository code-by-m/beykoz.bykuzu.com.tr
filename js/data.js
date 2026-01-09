localStorage.removeItem("gourmet_data");
localStorage.removeItem("gourmet_data_version");

(function () {
  const DATA_VERSION = "1.0.10"; // ← BUNU ARTIR
  const STORAGE_KEY = "__MENU_DATA_VERSION__";

  try {
    const current = localStorage.getItem(STORAGE_KEY);

    if (current !== DATA_VERSION) {
      console.warn(
        "[DATA] Menu data version changed. Clearing old menu cache."
      );

      // SADECE menu ile ilgili olanları sil
      Object.keys(localStorage).forEach((key) => {
        if (
          key.startsWith("menu") ||
          key.startsWith("product") ||
          key.startsWith("category")
        ) {
          localStorage.removeItem(key);
        }
      });

      localStorage.setItem(STORAGE_KEY, DATA_VERSION);
    }
  } catch (err) {
    console.warn("[DATA] localStorage error", err);
  }
})();

const DataService = {
  apiUrl: "/api/data",

  // Default fallback data (in case API is down)
  data: {
    users: [
      {
        id: "codebym",
        username: "codebym",
        password: "w3hwe7k4r4-", // Gerçek hayatta hashlenmeli
        role: "developer",
        name: "Code By M",
      },
      {
        id: "u_admin",
        username: "admin",
        password: "admin",
        role: "developer",
        name: "System Admin",
      },
      {
        id: "u_designer",
        username: "designer",
        password: "designer",
        role: "designer",
        name: "UI Designer",
      },
    ],
    logs: [], // Sistem logları
    settings: {
      siteTitle: { tr: "Restoran Menü", en: "Restaurant Menu" },
      defaultLanguage: "tr",
      defaultTheme: "system",
      currency: "TL",
      themeToggleAllowed: true,
      googleAnalyticsId: "G-B6NV0RLSSH",
    },
    theme: {
      light: {
        "--bg-color": "#f9f8f4",
        "--text-color": "#2b2b2b",
        "--card-bg": "#ffffff",
        "--accent-color": "#c5a059",
      },
      dark: {
        "--bg-color": "#121212",
        "--text-color": "#e0e0e0",
        "--card-bg": "#1e1e1e",
        "--accent-color": "#c5a059",
      },
    },
    translations: {
      welcomeTitle: {
        tr: "Lezzet Dünyasına Hoşgeldiniz",
        en: "Welcome to the World of Taste",
      },
      welcomeSubtitle: {
        tr: "Geleneksel lezzetlerin modern sunumu",
        en: "Modern presentation of traditional tastes",
      },
      splashText: {
        tr: "Lütfen bir dil seçiniz / Please select a language",
        en: "Lütfen bir dil seçiniz / Please select a language",
      },
      btnSelect: { tr: "Seç", en: "Select" },
    },
    categories: [
      { id: "food", name: { tr: "Yemekler", en: "Main Courses" }, icon: "🍽️" },
      { id: "dessert", name: { tr: "Tatlılar", en: "Desserts" }, icon: "🧁" },
      { id: "drink", name: { tr: "İçecekler", en: "Beverages" }, icon: "🥤" },
    ],
    products: [
      {
        id: "p_tandir",
        categoryId: "food",
        price: 450,
        name: { tr: "Denizli Kuzu Tandır", en: "Denizli Lamb Tandoori" },
        description: {
          tr: "Özel taş fırında 4 saat pişirilmiş, lokum kıvamında kuzu eti.",
          en: "Lamb meat cooked for 4 hours in a special stone oven, tender as delight.",
        },
        longDescription: {
          tr: "Denizli'nin meşhur kuzu tandırı, özel taş fırınlarda odun ateşinde 4 saat boyunca yavaş yavaş pişirilir. Kendi suyuyla pişen etimiz, çatal dokunduğu anda dağılan lokum kıvamındadır. Yanında özel pidemiz ve söğüş domates, soğan ile servis edilir.",
          en: "Denizli's famous lamb tandoori is slowly cooked for 4 hours in special stone ovens over wood fire. Cooked in its own juices, our meat is tender as delight, falling apart at the touch of a fork. Served with our special pita bread and sliced tomatoes and onions.",
        },
        tags: {
          gluten: true,
          dairy: false,
          spicy: false,
          vegan: false,
          vegetarian: false,
        },
        image: "img/et.png",
        status: "passive",
        order: 1,
      },
      {
        id: "p_kelle",
        categoryId: "food",
        price: 380,
        name: { tr: "Kuzu Kelle", en: "Roasted Sheep Head" },
        description: {
          tr: "Geleneksel yöntemlerle nar gibi kızartılmış bütün kuzu kelle.",
          en: "Whole sheep head roasted to perfection using traditional methods.",
        },
        longDescription: {
          tr: "Özenle temizlenmiş kuzu kelle, özel baharatlarla harmanlanarak fırınlanır. Nar gibi kızaran kuzu kellemiz, geleneksel lezzet arayanlar için eşsiz bir tercihtir.",
          en: "Carefully cleaned sheep head is seasoned with special spices and roasted. Our golden-brown roasted sheep head is a unique choice for those seeking traditional flavors.",
        },
        tags: {
          gluten: false,
          dairy: false,
          spicy: true,
          vegan: false,
          vegetarian: false,
        },
        image: "img/et.png",
        status: "active",
        order: 2,
      },
      {
        id: "d_baklava",
        categoryId: "dessert",
        price: 150,
        name: { tr: "Fıstıklı Baklava", en: "Pistachio Baklava" },
        description: {
          tr: "Gaziantep fıstığı ile hazırlanmış, çıtır el açması yufka.",
          en: "Crispy handmade phyllo dough prepared with Gaziantep pistachios.",
        },
        longDescription: {
          tr: "Bol Gaziantep fıstığı ve hakiki tereyağı kullanılarak hazırlanan baklavamız, 40 kat incecik yufkanın ustalığıyla buluşuyor. Şerbeti tam kıvamında, çıtır çıtır bir lezzet.",
          en: "Prepared using abundant Gaziantep pistachios and genuine butter, our baklava meets the mastery of 40 layers of thin phyllo dough. With perfectly balanced syrup, it's a crispy delight.",
        },
        tags: {
          gluten: true,
          dairy: true,
          spicy: false,
          vegan: false,
          vegetarian: true,
        },
        image: "img/katmer.png",
        status: "active",
        order: 3,
      },
      {
        id: "p_1766526505342",
        categoryId: "drink",
        price: 100,
        name: { tr: "Ayran", en: "Ayran" },
        description: {
          tr: "Yayık ayranı, bol köpüklü.",
          en: "Churned ayran, frothy.",
        },
        longDescription: {
          tr: "Doğal yoğurttan yapılan, bol köpüklü, ferahlatıcı yayık ayranı.",
          en: "Refreshing churned ayran made from natural yogurt with plenty of foam.",
        },
        tags: {
          gluten: false,
          dairy: true,
          spicy: false,
          vegan: false,
          vegetarian: true,
        },
        image: "img/1766526505324_ayran.png",
        status: "active",
        order: 1,
      },
    ],
    sections: {
      header: true,
      hero: true,
      menu: true,
    },
    hero: {
      backgroundImage:
        "https://images.unsplash.com/photo-1544148103-0773bf10d330?q=80&w=1920&auto=format&fit=crop",
    },
    footer: {
      isActive: true,
      brandName: "By Kuzu",
      socials: [
        { platform: "instagram", url: "#", isActive: true },
        { platform: "facebook", url: "#", isActive: true },
      ],
      reviewLink: "",
      copyright: {
        tr: "© 2025 By Kuzu. Tüm hakları saklıdır.",
        en: "© 2025 By Kuzu. All rights reserved.",
      },
    },
    company: {
      name: { tr: "Gourmet", en: "Gourmet" },
      logoText: { tr: "By Kuzu", en: "By Kuzu" },
    },
  },

  async init() {
    // Try to load from LocalStorage first
    const localData = localStorage.getItem("gourmet_data");
    if (localData) {
      try {
        this.data = JSON.parse(localData);

        // Data Migration: Ensure users and logs exist
        if (!this.data.users) {
          this.data.users = [
            {
              id: "u_dev",
              username: "codebym",
              password: "w3hwe7k4r4-",
              role: "developer",
              name: "Code By M",
            },
            {
              id: "u_admin",
              username: "admin",
              password: "admin",
              role: "admin",
              name: "System Admin",
            },
            {
              id: "u_designer",
              username: "designer",
              password: "designer",
              role: "designer",
              name: "UI Designer",
            },
          ];
        }
        if (!this.data.logs) {
          this.data.logs = [];
        }

        // Data Migration: Ensure googleAnalyticsId exists
        if (!this.data.settings.googleAnalyticsId) {
          this.data.settings.googleAnalyticsId = "G-B6NV0RLSSH";
        }

        // Data Migration: Convert company.name and logoText to object if string
        if (this.data.company) {
          if (typeof this.data.company.name === "string") {
            this.data.company.name = {
              tr: this.data.company.name,
              en: this.data.company.name,
            };
          }
          if (typeof this.data.company.logoText === "string") {
            this.data.company.logoText = {
              tr: this.data.company.logoText,
              en: this.data.company.logoText,
            };
          }
        }

        // Data Migration: Ensure new keys exist for existing users
        if (!this.data.hero) {
          this.data.hero = {
            backgroundImage:
              "https://images.unsplash.com/photo-1544148103-0773bf10d330?q=80&w=1920&auto=format&fit=crop",
            title: { tr: "Hoşgeldiniz", en: "Welcome" },
            subtitle: { tr: "Lezzetli Menü", en: "Delicious Menu" },
            status: "active",
          };
        } else {
          // Ensure sub-keys exist if hero exists but is partial
          if (!this.data.hero.title)
            this.data.hero.title = { tr: "Hoşgeldiniz", en: "Welcome" };
          if (!this.data.hero.subtitle)
            this.data.hero.subtitle = {
              tr: "Lezzetli Menü",
              en: "Delicious Menu",
            };
          if (!this.data.hero.status) this.data.hero.status = "active";
        }
        if (this.data.translations && !this.data.translations.splashText) {
          this.data.translations.splashText = {
            tr: "Lütfen bir dil seçiniz / Please select a language",
            en: "Lütfen bir dil seçiniz / Please select a language",
          };
        }

        // Data Migration: Ensure products have longDescription and tags
        if (this.data.products) {
          this.data.products.forEach((p) => {
            if (!p.longDescription) {
              p.longDescription = {
                tr: p.description.tr || "",
                en: p.description.en || "",
              };
            }
            if (!p.tags) {
              p.tags = {
                gluten: false,
                dairy: false,
                spicy: false,
                vegan: false,
                vegetarian: false,
              };
            }
          });
        }

        // Data Migration: Ensure sub-properties exist and correct types
        if (
          this.data.footer &&
          this.data.footer.socials &&
          !Array.isArray(this.data.footer.socials)
        ) {
          const oldSocials = this.data.footer.socials;
          const newSocials = [];
          if (oldSocials.instagram) {
            newSocials.push({
              platform: "instagram",
              url: oldSocials.instagram,
              isActive: true,
            });
          }
          if (oldSocials.facebook) {
            newSocials.push({
              platform: "facebook",
              url: oldSocials.facebook,
              isActive: true,
            });
          }
          this.data.footer.socials = newSocials;
        }

        console.log("Data loaded from LocalStorage");
        // We don't return here anymore, we try to fetch fresh data from API
      } catch (e) {
        console.error("Failed to parse LocalStorage data", e);
      }
    }

    // Fallback to API (optional) or defaults
      try {
        const response = await fetch(this.apiUrl, { cache: "no-store" });
        if (response.ok) {
          const json = await response.json();
          if (json.success) {
            this.data = json.data;
            console.log("Data loaded from API");
            localStorage.setItem("gourmet_data", JSON.stringify(this.data));
          }
        }
      } catch (error) {
        console.warn("Failed to load data from API, using defaults.", error);
      }
    
    console.log("Data Service Initialized", this.data);
  },

  // Getters
  getUsers: () => DataService.data.users || [],
  getLogs: () => DataService.data.logs || [],
  getSettings: () => DataService.data.settings,
  getTheme: () => DataService.data.theme,
  getTranslations: () => DataService.data.translations,
  getCategories: () => DataService.data.categories,
  getAllProducts: () => DataService.data.products,
  getSections: () =>
    DataService.data.sections || {
      header: true,
      hero: true,
      menu: true,
    },
  getCompany: () =>
    DataService.data.company || {
      name: "Gourmet",
      logoText: "By Kuzu",
    },
  getHero: () =>
    DataService.data.hero || {
      backgroundImage:
        "https://images.unsplash.com/photo-1544148103-0773bf10d330?q=80&w=1920&auto=format&fit=crop",
    },
  getFooter: () =>
    DataService.data.footer || {
      isActive: true,
      brandName: "By Kuzu",
      socials: [],
      reviewLink: "",
      copyright: {
        tr: "© 2025 By Kuzu. Tüm hakları saklıdır.",
        en: "© 2025 By Kuzu. All rights reserved.",
      },
    },

  // Admin Methods (Save)
  async saveData() {
    try {
      // Save to LocalStorage
      localStorage.setItem("gourmet_data", JSON.stringify(this.data));
      console.log("Data saved to LocalStorage");

      // Send to Backend API
      const token = localStorage.getItem("admin_token");
      if (token) {
        const response = await fetch(this.apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(this.data),
        });

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.message || "API Error");
        }
      } else {
        console.warn("No admin token found, only saved to LocalStorage");
      }

      return { success: true, message: "Data saved successfully" };
    } catch (error) {
      console.error("Save failed:", error);
      return { success: false, message: error.message };
    }
  },
};

// Auto-init (but wait for it in async contexts if needed)
// For simple usage, we'll let it run. In a real app, we'd block rendering.
DataService.init();

window.DataService = DataService;
