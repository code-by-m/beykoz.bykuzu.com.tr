const Admin = {
  state: {
    isAuthenticated: false,
    currentUser: null,
    currentView: "dashboard",
  },

  init: async () => {
    await DataService.init();
    AuthService.init();
    Admin.checkAuth();
    Admin.bindEvents();
  },

  checkAuth: () => {
    if (AuthService.currentUser) {
      Admin.state.isAuthenticated = true;
      Admin.state.currentUser = AuthService.currentUser;
      Admin.showDashboard();
    } else {
      Admin.showLogin();
    }
  },

  // Resim İşleme Yardımcısı (Resize & Base64)
  processImage: (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          const MAX_WIDTH = 1024; // Yeterli kalite için 1024px
          const MAX_HEIGHT = 1024;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");

          // Arkaplanı beyaz yap (PNG transparanlığı için)
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, width, height);

          ctx.drawImage(img, 0, 0, width, height);
          // JPEG formatında ve %70 kalitede sıkıştır
          resolve(canvas.toDataURL("image/jpeg", 0.7));
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  // 2. Görsel Validasyonu (Helper)
  validateImage: (file) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const ratio = img.width / img.height;
        // 1:1 = 1, 4:3 = 1.33
        const isSquare = Math.abs(ratio - 1) < 0.1;
        const is4_3 = Math.abs(ratio - 1.33) < 0.1;
        const isValidRatio = isSquare || is4_3;

        let warning = null;
        if (!isValidRatio) {
          warning =
            "Uyarı: Görsel oranı 1:1 veya 4:3 değil. Bu görsel modalda taşma yapabilir.";
        }
        resolve({ valid: true, warning });
      };
      img.onerror = () =>
        resolve({ valid: false, warning: "Görsel okunamadı." });
      img.src = URL.createObjectURL(file);
    });
  },

  // 1. Drag & Drop Helper
  enableDragDrop: (tableId, list, updateCallback) => {
    const table = document.getElementById(tableId);
    if (!table) return;

    const tbody = table.querySelector("tbody");
    let dragSrcEl = null;

    [].forEach.call(tbody.querySelectorAll("tr"), function (row) {
      row.setAttribute("draggable", "true");
      row.style.cursor = "move";

      row.addEventListener("dragstart", function (e) {
        dragSrcEl = this;
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/html", this.innerHTML);
        this.classList.add("dragging");
      });

      row.addEventListener("dragover", function (e) {
        if (e.preventDefault) e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        return false;
      });

      row.addEventListener("drop", function (e) {
        if (e.stopPropagation) e.stopPropagation();
        if (dragSrcEl !== this) {
          // Swap DOM
          const srcIndex = [...tbody.children].indexOf(dragSrcEl);
          const targetIndex = [...tbody.children].indexOf(this);

          if (srcIndex < targetIndex) {
            tbody.insertBefore(dragSrcEl, this.nextSibling);
          } else {
            tbody.insertBefore(dragSrcEl, this);
          }

          // Update Data Order
          const rows = tbody.querySelectorAll("tr");
          rows.forEach((r, idx) => {
            const id = r.dataset.id;
            const item = list.find((i) => i.id == id);
            if (item) {
              item.order = idx + 1;
            }
          });

          updateCallback();
        }
        return false;
      });

      row.addEventListener("dragend", function () {
        this.classList.remove("dragging");
      });
    });
  },

  // 4. Preview Mode Helper
  previewProduct: (product) => {
    // Create a modal that mimics the frontend structure
    const modalId = "previewModal";
    let modalEl = document.getElementById(modalId);
    if (modalEl) modalEl.remove();

    const tags = product.tags || {};
    const tagIcons = [];
    if (tags.gluten) tagIcons.push('<span title="Gluten">🌾</span>');
    if (tags.dairy) tagIcons.push('<span title="Süt Ürünü">🥛</span>');
    if (tags.spicy) tagIcons.push('<span title="Acılı">🌶️</span>');
    if (tags.vegan) tagIcons.push('<span title="Vegan">🌱</span>');
    if (tags.vegetarian) tagIcons.push('<span title="Vejetaryen">🥗</span>');

    const html = `
      <div class="modal fade" id="${modalId}" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-lg"> <!-- modal-lg for better preview -->
          <div class="modal-content" style="border-radius: 16px; overflow: hidden; border: none;">
            <div class="modal-body p-0">
               <div style="position: relative;">
                  <button type="button" class="btn-close" data-bs-dismiss="modal" style="position: absolute; right: 15px; top: 15px; z-index: 10; background-color: rgba(255,255,255,0.8); border-radius: 50%; padding: 0.5rem;"></button>
                  <img src="${
                    product.image
                  }" style="width: 100%; height: 300px; object-fit: cover;" alt="${
      product.name.tr
    }">
               </div>
               <div class="p-4">
                  <div class="d-flex justify-content-between align-items-start mb-2">
                      <h3 style="font-weight: 700; margin: 0;">${
                        product.name.tr
                      }</h3>
                      <span style="font-size: 1.25rem; font-weight: 700; color: var(--bs-primary);">₺${
                        product.price
                      }</span>
                  </div>
                  <p class="text-muted mb-3">${product.description.tr}</p>
                  <p class="mb-3">${
                    product.longDescription ? product.longDescription.tr : ""
                  }</p>
                  <div class="d-flex gap-2">
                      ${tagIcons.join("")}
                  </div>
               </div>
               <div class="bg-light p-3 text-center text-muted small">
                  Bu bir önizlemedir. (TR)
               </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", html);
    const modal = new bootstrap.Modal(document.getElementById(modalId));
    modal.show();
  },

  bindEvents: () => {
    // Sidebar Toggle
    const toggleBtn = document.querySelector(".toggle-sidebar-btn");
    if (toggleBtn) {
      toggleBtn.addEventListener("click", () => {
        document.body.classList.toggle("toggle-sidebar");
      });
    }

    // Login Form
    const loginForm = document.getElementById("login-form");
    if (loginForm) {
      loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const user = document.getElementById("username").value;
        const pass = document.getElementById("password").value;
        Admin.login(user, pass);
      });
    }

    // Navigation (Event Delegation)
    document.addEventListener("click", (e) => {
      const targetLink = e.target.closest("[data-view]");
      if (!targetLink) return;

      e.preventDefault();

      // View Yetki Kontrolü
      const view = targetLink.dataset.view;
      if (!AuthService.checkPageAccess(view)) {
        Admin.showAlert("danger", "Bu sayfaya erişim yetkiniz yok!");
        return;
      }

      // 1. Remove active class from all
      document.querySelectorAll(".sidebar-nav .nav-link").forEach((l) => {
        l.classList.remove("active");
      });
      document.querySelectorAll(".sidebar-nav .nav-content a").forEach((l) => {
        l.classList.remove("active");
      });

      // 2. Add active class
      targetLink.classList.add("active");

      // 3. Handle Sidebar Collapse Logic
      // If clicking a top-level link (not in a submenu), collapse others
      if (targetLink.classList.contains("nav-link")) {
        document.querySelectorAll(".nav-content.show").forEach((el) => {
          // Don't close if it's the parent of the clicked link (though top-level links don't have parents in nav-content)
          el.classList.remove("show");
        });
        document
          .querySelectorAll(".nav-link[data-bs-toggle='collapse']")
          .forEach((el) => {
            if (el !== targetLink) {
              el.classList.add("collapsed");
              el.setAttribute("aria-expanded", "false");
            }
          });
      }

      // 4. Load View
      Admin.loadView(view);
    });

    // Logout
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", (e) => {
        e.preventDefault();
        Admin.logout();
      });
    }
  },

  login: (username, password) => {
    const result = AuthService.login(username, password);

    if (result.success) {
      Admin.state.isAuthenticated = true;
      Admin.state.currentUser = AuthService.currentUser;
      Admin.showDashboard();
    } else {
      document.getElementById("login-error").textContent = result.message;
    }
  },

  logout: () => {
    AuthService.logout();
    Admin.state.isAuthenticated = false;
    Admin.state.currentUser = null;
    Admin.showLogin();
  },

  showLogin: () => {
    document.getElementById("login-screen").style.display = "block";
    document.getElementById("header").style.display = "none";
    document.getElementById("sidebar").style.display = "none";
    document.getElementById("main").style.display = "none";
  },

  showDashboard: () => {
    document.getElementById("login-screen").style.display = "none";
    document.getElementById("header").style.display = "flex";
    document.getElementById("sidebar").style.display = "block";
    document.getElementById("main").style.display = "block";

    // Update Profile UI
    const user = AuthService.currentUser;
    if (user) {
      document.getElementById("header-user-name").textContent =
        user.name || user.username;
      document.getElementById("dropdown-user-name").textContent =
        user.name || user.username;
      const roleDisplay =
        user.role.charAt(0).toUpperCase() + user.role.slice(1);
      const roleSpan = document.querySelector(".dropdown-header span");
      if (roleSpan) roleSpan.textContent = roleDisplay;
    }

    // Load default view
    Admin.loadView("dashboard");
  },

  loadView: (viewName) => {
    const contentArea = document.getElementById("content-area");
    const pageTitle = document.getElementById("page-title");
    const breadcrumb = document.getElementById("breadcrumb-active");

    // Helper to capitalize
    const formatTitle = (str) =>
      str
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

    const title = formatTitle(viewName);
    pageTitle.textContent = title;
    breadcrumb.textContent = title;

    Admin.state.currentView = viewName;

    switch (viewName) {
      case "dashboard":
        pageTitle.textContent = "Dashboard";
        Admin.renderDashboard(contentArea);
        break;
      // Site Content
      case "header-manager":
        pageTitle.textContent = "Header Yönetimi";
        Admin.renderHeaderManager(contentArea);
        break;
      case "hero-manager":
        pageTitle.textContent = "Hero (Kapak) Yönetimi";
        Admin.renderHeroManager(contentArea);
        break;
      case "footer-manager":
        pageTitle.textContent = "Footer Yönetimi";
        Admin.renderFooterManager(contentArea);
        break;

      // Menu Management
      case "categories":
        pageTitle.textContent = "Kategori Yönetimi";
        Admin.renderCategories(contentArea);
        break;
      case "products":
        pageTitle.textContent = "Ürün Yönetimi";
        Admin.renderProducts(contentArea);
        break;
      // Others
      case "analytics":
        pageTitle.textContent = "İstatistikler";
        Admin.renderAnalytics(contentArea);
        break;
      case "settings":
        pageTitle.textContent = "Ayarlar";
        Admin.renderSettings(contentArea);
        break;
      case "users":
        pageTitle.textContent = "Kullanıcı Yönetimi";
        Admin.renderUsers(contentArea);
        break;
      case "logs":
        pageTitle.textContent = "Sistem Logları";
        Admin.renderLogs(contentArea);
        break;
      default:
        contentArea.innerHTML = `<div class="alert alert-warning">Sayfa bulunamadı: ${viewName}</div>`;
    }

    // UI Guard: Render sonrası yetkisiz butonları gizle
    AuthService.applyPermissionsToUI();
  },

  showAlert: (type, message) => {
    // Simple alert implementation
    const alertDiv = document.createElement("div");
    alertDiv.className = `alert alert-${type} alert-dismissible fade show fixed-top m-3`;
    alertDiv.style.zIndex = 9999;
    alertDiv.style.maxWidth = "500px";
    alertDiv.style.left = "50%";
    alertDiv.style.transform = "translateX(-50%)";
    alertDiv.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    document.body.appendChild(alertDiv);
    setTimeout(() => alertDiv.remove(), 3000);
  },

  // --- VIEWS ---

  renderUsers: (container) => {
    // Güvenlik Kontrolü
    if (!AuthService.hasPermission("canManageUsers")) {
      container.innerHTML = `<div class="alert alert-danger">Bu alanı görüntüleme yetkiniz yok.</div>`;
      return;
    }

    const users = DataService.getUsers();

    container.innerHTML = `
      <div class="card">
        <div class="card-body">
          <h5 class="card-title">Kullanıcı Listesi</h5>
          <div class="mb-3">
            <button class="btn btn-primary btn-sm" id="btn-add-user">
              <i class="bi bi-person-plus"></i> Yeni Kullanıcı Ekle
            </button>
          </div>
          <table class="table table-hover" id="users-table">
            <thead>
              <tr>
                <th>Kullanıcı Adı</th>
                <th>İsim</th>
                <th>Rol</th>
                <th>İşlem</th>
              </tr>
            </thead>
            <tbody>
              ${users
                .map(
                  (u) => `
                <tr data-id="${u.id}">
                  <td>${u.username}</td>
                  <td>${u.name}</td>
                  <td><span class="badge bg-${
                    u.role === "developer"
                      ? "primary"
                      : u.role === "admin"
                      ? "success"
                      : "info"
                  }">${u.role}</span></td>
                  <td>
                    <button class="btn btn-sm btn-outline-danger btn-delete-user" data-id="${
                      u.id
                    }" ${
                    u.username === "developer" ? "disabled" : ""
                  }><i class="bi bi-trash"></i></button>
                  </td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </div>
      
      <!-- User Modal -->
      <div class="modal fade" id="userModal" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Kullanıcı Ekle</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <form id="user-form">
                <div class="mb-3">
                  <label class="form-label">Kullanıcı Adı</label>
                  <input type="text" class="form-control" id="u_username" required>
                </div>
                <div class="mb-3">
                  <label class="form-label">İsim</label>
                  <input type="text" class="form-control" id="u_name" required>
                </div>
                <div class="mb-3">
                  <label class="form-label">Şifre</label>
                  <input type="password" class="form-control" id="u_password" required>
                </div>
                <div class="mb-3">
                  <label class="form-label">Rol</label>
                  <select class="form-select" id="u_role">
                    <option value="admin">Admin</option>
                    <option value="designer">Designer</option>
                    <option value="developer">Developer</option>
                  </select>
                </div>
                <button type="submit" class="btn btn-primary w-100">Kaydet</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    `;

    const modal = new bootstrap.Modal(document.getElementById("userModal"));

    // Add User
    document.getElementById("btn-add-user").addEventListener("click", () => {
      document.getElementById("user-form").reset();
      modal.show();
    });

    // Save User
    document
      .getElementById("user-form")
      .addEventListener("submit", async (e) => {
        e.preventDefault();
        const newUser = {
          id: "u_" + Date.now(),
          username: document.getElementById("u_username").value,
          name: document.getElementById("u_name").value,
          password: document.getElementById("u_password").value,
          role: document.getElementById("u_role").value,
        };

        // Check duplicate username
        if (
          DataService.data.users.some((u) => u.username === newUser.username)
        ) {
          Admin.showAlert("danger", "Bu kullanıcı adı zaten kullanılıyor.");
          return;
        }

        DataService.data.users.push(newUser);
        await DataService.saveData();

        AuthService.logAction(
          "create_user",
          `Yeni kullanıcı eklendi: ${newUser.username} (${newUser.role})`
        );

        modal.hide();
        Admin.renderUsers(container);
        Admin.showAlert("success", "Kullanıcı eklendi.");
      });

    // Delete User (Event Delegation)
    container
      .querySelector("#users-table tbody")
      .addEventListener("click", async (e) => {
        const btn = e.target.closest(".btn-delete-user");
        if (!btn || btn.disabled) return;

        if (confirm("Bu kullanıcıyı silmek istediğinize emin misiniz?")) {
          const id = btn.dataset.id;
          const user = DataService.data.users.find((u) => u.id === id);

          DataService.data.users = DataService.data.users.filter(
            (u) => u.id !== id
          );
          await DataService.saveData();

          AuthService.logAction(
            "delete_user",
            `Kullanıcı silindi: ${user ? user.username : id}`
          );

          Admin.renderUsers(container);
          Admin.showAlert("success", "Kullanıcı silindi.");
        }
      });
  },

  renderLogs: (container) => {
    // Güvenlik Kontrolü
    if (!AuthService.hasPermission("canViewLogs")) {
      container.innerHTML = `<div class="alert alert-danger">Bu alanı görüntüleme yetkiniz yok.</div>`;
      return;
    }

    const logs = DataService.getLogs();

    const renderTable = (data) => {
      return `
        <table class="table table-sm" id="logs-table" style="font-size: 0.9rem;">
          <thead>
            <tr>
              <th>Tarih</th>
              <th>Kullanıcı</th>
              <th>Rol</th>
              <th>İşlem</th>
              <th>Detay</th>
            </tr>
          </thead>
          <tbody>
            ${
              data.length > 0
                ? data
                    .map(
                      (l) => `
              <tr>
                <td style="white-space:nowrap;">${new Date(
                  l.timestamp
                ).toLocaleString("tr-TR")}</td>
                <td><span class="fw-bold">${l.username}</span></td>
                <td><span class="badge bg-secondary">${l.role}</span></td>
                <td><span class="badge bg-info text-dark">${
                  l.action
                }</span></td>
                <td class="text-muted small">${l.detail}</td>
              </tr>
            `
                    )
                    .join("")
                : '<tr><td colspan="5" class="text-center">Kayıt bulunamadı.</td></tr>'
            }
          </tbody>
        </table>
      `;
    };

    container.innerHTML = `
      <div class="card">
        <div class="card-body">
          <h5 class="card-title">Sistem Logları</h5>
          
          <div class="mb-3">
            <input type="text" class="form-control" id="log-search" placeholder="Loglarda ara (Kullanıcı, İşlem, Detay)...">
          </div>

          <div class="table-responsive" id="logs-table-container">
            ${renderTable(logs)}
          </div>
        </div>
      </div>
    `;

    // Filter Logic
    document.getElementById("log-search").addEventListener("input", (e) => {
      const term = e.target.value.toLowerCase();
      const filteredLogs = logs.filter(
        (l) =>
          l.username.toLowerCase().includes(term) ||
          l.action.toLowerCase().includes(term) ||
          l.detail.toLowerCase().includes(term) ||
          l.role.toLowerCase().includes(term)
      );
      document.getElementById("logs-table-container").innerHTML =
        renderTable(filteredLogs);
    });
  },

  renderDashboard: async (container) => {
    // Clean, static dashboard
    container.innerHTML = `
        <div class="row">
            <div class="col-12">
                <div class="card">
                    <div class="card-body">
                        <h5 class="card-title">Hoşgeldiniz</h5>
                        <p>Yönetim paneline hoşgeldiniz. Sol menüden site içeriğini ve menüleri yönetebilirsiniz.</p>
                        
                        <div class="d-flex gap-3 mt-4">
                            <a href="#" onclick="Admin.loadView('categories')" class="btn btn-outline-primary">
                                <i class="bi bi-grid me-2"></i>Kategoriler
                            </a>
                            <a href="#" onclick="Admin.loadView('products')" class="btn btn-outline-primary">
                                <i class="bi bi-box-seam me-2"></i>Ürünler
                            </a>
                            <a href="#" onclick="Admin.loadView('settings')" class="btn btn-outline-secondary">
                                <i class="bi bi-gear me-2"></i>Ayarlar
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Clear any existing interval
    if (window.dashboardInterval) clearInterval(window.dashboardInterval);
  },

  renderHeaderManager: (container) => {
    const company = DataService.getCompany();

    // Ensure company.name and company.logoText are objects (migration fallback)
    const name =
      typeof company.name === "object"
        ? company.name
        : { tr: company.name, en: company.name };
    const logoText =
      typeof company.logoText === "object"
        ? company.logoText
        : { tr: company.logoText, en: company.logoText };

    container.innerHTML = `
        <div class="card">
            <div class="card-body">
                <h5 class="card-title">Header Bilgileri</h5>
                <form id="header-form">
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <label class="form-label">Şirket Adı (TR)</label>
                            <input type="text" class="form-control" id="h_company_name_tr" value="${
                              name.tr || ""
                            }">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Şirket Adı (EN)</label>
                            <input type="text" class="form-control" id="h_company_name_en" value="${
                              name.en || ""
                            }">
                        </div>
                    </div>
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <label class="form-label">Logo Metni / Slogan (TR)</label>
                            <input type="text" class="form-control" id="h_logo_text_tr" value="${
                              logoText.tr || ""
                            }">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Logo Metni / Slogan (EN)</label>
                            <input type="text" class="form-control" id="h_logo_text_en" value="${
                              logoText.en || ""
                            }">
                        </div>
                    </div>
                    <div class="row mb-3">
                        <label class="col-sm-2 col-form-label">Header Görünürlüğü</label>
                        <div class="col-sm-10">
                            <div class="form-check form-switch">
                                <input class="form-check-input" type="checkbox" id="h_visible" checked>
                                <label class="form-check-label" for="h_visible">Aktif</label>
                            </div>
                        </div>
                    </div>
                    <div class="row mb-3">
                        <div class="col-sm-10 offset-sm-2">
                            <button type="submit" class="btn btn-primary">Kaydet</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    `;

    document
      .getElementById("header-form")
      .addEventListener("submit", async (e) => {
        e.preventDefault();
        // Update DataService
        DataService.data.company.name = {
          tr: document.getElementById("h_company_name_tr").value,
          en: document.getElementById("h_company_name_en").value,
        };
        DataService.data.company.logoText = {
          tr: document.getElementById("h_logo_text_tr").value,
          en: document.getElementById("h_logo_text_en").value,
        };

        const result = await DataService.saveData();
        if (result.success)
          Admin.showAlert("success", "Header ayarları kaydedildi.");
        else Admin.showAlert("danger", "Hata oluştu.");
      });
  },

  renderHeroManager: (container) => {
    const hero = DataService.getHero();

    container.innerHTML = `
        <div class="card">
            <div class="card-body">
                <h5 class="card-title">Hero (Kapak) Alanı Düzenle</h5>
                <form id="hero-form">
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <label class="form-label">Başlık (TR)</label>
                            <input type="text" class="form-control" id="hero_title_tr" value="${
                              hero.title?.tr || ""
                            }">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Başlık (EN)</label>
                            <input type="text" class="form-control" id="hero_title_en" value="${
                              hero.title?.en || ""
                            }">
                        </div>
                    </div>
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <label class="form-label">Alt Başlık (TR)</label>
                            <input type="text" class="form-control" id="hero_subtitle_tr" value="${
                              hero.subtitle?.tr || ""
                            }">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Alt Başlık (EN)</label>
                            <input type="text" class="form-control" id="hero_subtitle_en" value="${
                              hero.subtitle?.en || ""
                            }">
                        </div>
                    </div>
                    <div class="row mb-3">
                        <label class="col-sm-2 col-form-label">Arkaplan Görseli</label>
                        <div class="col-sm-10">
                            <input type="file" class="form-control" id="hero_bg_file" accept="image/*">
                            <input type="hidden" id="hero_bg_current" value="${
                              hero.backgroundImage || ""
                            }">
                            <div class="mt-2">
                                <small class="text-muted">Mevcut Görsel:</small><br>
                                <img src="${
                                  hero.backgroundImage
                                }" id="hero_preview" style="height: 150px; object-fit: cover; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                            </div>
                        </div>
                    </div>
                    <div class="row mb-3">
                         <label class="col-sm-2 col-form-label">Durum</label>
                        <div class="col-sm-10">
                             <div class="form-check form-switch">
                                <input class="form-check-input" type="checkbox" id="hero_status" ${
                                  hero.status === "active" ? "checked" : ""
                                }>
                                <label class="form-check-label">Hero Alanı Göster</label>
                            </div>
                        </div>
                    </div>
                    <button type="submit" class="btn btn-primary">Değişiklikleri Kaydet</button>
                </form>
            </div>
        </div>
    `;

    // Preview listener
    setTimeout(() => {
      document
        .getElementById("hero_bg_file")
        .addEventListener("change", async (e) => {
          if (e.target.files && e.target.files[0]) {
            try {
              const base64 = await Admin.processImage(e.target.files[0]);
              document.getElementById("hero_preview").src = base64;
            } catch (err) {
              console.error("Preview error", err);
            }
          }
        });
    }, 100);

    document
      .getElementById("hero-form")
      .addEventListener("submit", async (e) => {
        e.preventDefault();

        let bgImage = document.getElementById("hero_bg_current").value;
        const fileInput = document.getElementById("hero_bg_file");

        if (fileInput.files.length > 0) {
          try {
            bgImage = await Admin.processImage(fileInput.files[0]);
          } catch (err) {
            Admin.showAlert("danger", "Görsel işlenirken hata oluştu.");
            return;
          }
        }

        DataService.data.hero = {
          ...DataService.data.hero,
          title: {
            tr: document.getElementById("hero_title_tr").value,
            en: document.getElementById("hero_title_en").value,
          },
          subtitle: {
            tr: document.getElementById("hero_subtitle_tr").value,
            en: document.getElementById("hero_subtitle_en").value,
          },
          backgroundImage: bgImage,
          status: document.getElementById("hero_status").checked
            ? "active"
            : "passive",
        };

        const result = await DataService.saveData();
        if (result.success)
          Admin.showAlert("success", "Hero alanı güncellendi.");
      });
  },

  renderFooterManager: (container) => {
    const footer = DataService.getFooter();
    // Ensure socials is an array
    let socials = Array.isArray(footer.socials) ? footer.socials : [];

    // Helper to generate social row HTML
    const getSocialRow = (
      social = { platform: "instagram", url: "", isActive: true },
      index
    ) => `
      <div class="social-item row mb-2 align-items-center" data-index="${index}">
        <div class="col-md-3">
          <select class="form-select social-platform">
            <option value="instagram" ${
              social.platform === "instagram" ? "selected" : ""
            }>Instagram</option>
            <option value="facebook" ${
              social.platform === "facebook" ? "selected" : ""
            }>Facebook</option>
          </select>
        </div>
        <div class="col-md-5">
          <input type="text" class="form-control social-url" placeholder="URL (https://...)" value="${
            social.url || ""
          }">
        </div>
        <div class="col-md-2">
          <div class="form-check form-switch">
            <input class="form-check-input social-active" type="checkbox" ${
              social.isActive ? "checked" : ""
            }>
            <label class="form-check-label">Aktif</label>
          </div>
        </div>
        <div class="col-md-2">
           <button type="button" class="btn btn-outline-danger btn-sm remove-social"><i class="bi bi-trash"></i></button>
        </div>
      </div>
    `;

    container.innerHTML = `
        <div class="card">
            <div class="card-body">
                <h5 class="card-title">Footer Yönetimi</h5>
                <form id="footer-form">
                    <div class="row mb-3">
                        <label class="col-sm-2 col-form-label">Footer Durumu</label>
                        <div class="col-sm-10">
                            <div class="form-check form-switch">
                                <input class="form-check-input" type="checkbox" id="f_active" ${
                                  footer.isActive ? "checked" : ""
                                }>
                                <label class="form-check-label" for="f_active">Aktif</label>
                            </div>
                        </div>
                    </div>
                    
                    <div class="row mb-3">
                        <label class="col-sm-2 col-form-label">Marka Adı</label>
                        <div class="col-sm-10">
                            <input type="text" class="form-control" id="f_brand" value="${
                              footer.brandName || ""
                            }">
                        </div>
                    </div>

                    <div class="mb-3">
                        <label class="form-label fw-bold">Sosyal Medya Linkleri</label>
                        <div class="p-3 border rounded bg-light">
                            <div id="socials-container">
                                ${
                                  socials.length > 0
                                    ? socials
                                        .map((s, i) => getSocialRow(s, i))
                                        .join("")
                                    : '<p class="text-muted small fst-italic no-socials-msg">Henüz sosyal medya eklenmemiş.</p>'
                                }
                            </div>
                            <button type="button" class="btn btn-outline-primary btn-sm mt-3" id="add-social-btn">
                            <i class="bi bi-plus-lg me-1"></i> Yeni Ekle
                            </button>
                        </div>
                    </div>

                    <div class="row mb-3">
                        <label class="col-sm-2 col-form-label">Değerlendirme Linki</label>
                        <div class="col-sm-10">
                            <div class="input-group">
                                <span class="input-group-text"><i class="bi bi-star-fill"></i></span>
                                <input type="text" class="form-control" id="f_review" placeholder="Google Maps / Review Linki" value="${
                                  footer.reviewLink || ""
                                }">
                            </div>
                        </div>
                    </div>

                    <div class="row mb-3">
                        <label class="col-sm-2 col-form-label">Telif Hakkı Metni</label>
                        <div class="col-sm-5">
                            <input type="text" class="form-control mb-2" id="f_copyright_tr" placeholder="TR Metin" value="${
                              footer.copyright.tr || ""
                            }">
                        </div>
                        <div class="col-sm-5">
                            <input type="text" class="form-control" id="f_copyright_en" placeholder="EN Metin" value="${
                              footer.copyright.en || ""
                            }">
                        </div>
                    </div>

                    <div class="row mb-3">
                        <div class="col-sm-10 offset-sm-2">
                            <button type="submit" class="btn btn-primary">Kaydet</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    `;

    // Add Social Button Handler
    document.getElementById("add-social-btn").addEventListener("click", () => {
      const container = document.getElementById("socials-container");
      // Remove "no socials" message if exists
      const noMsg = container.querySelector(".no-socials-msg");
      if (noMsg) noMsg.remove();

      container.insertAdjacentHTML(
        "beforeend",
        getSocialRow(undefined, Date.now())
      );
    });

    // Remove Social Button Handler (Event Delegation)
    document
      .getElementById("socials-container")
      .addEventListener("click", (e) => {
        if (e.target.closest(".remove-social")) {
          e.target.closest(".social-item").remove();
          // Check if empty to show message (optional)
        }
      });

    document
      .getElementById("footer-form")
      .addEventListener("submit", async (e) => {
        e.preventDefault();

        // Collect Socials
        const socialItems = [];
        document.querySelectorAll(".social-item").forEach((item) => {
          socialItems.push({
            platform: item.querySelector(".social-platform").value,
            url: item.querySelector(".social-url").value,
            isActive: item.querySelector(".social-active").checked,
          });
        });

        DataService.data.footer = {
          isActive: document.getElementById("f_active").checked,
          brandName: document.getElementById("f_brand").value,
          socials: socialItems,
          reviewLink: document.getElementById("f_review").value,
          copyright: {
            tr: document.getElementById("f_copyright_tr").value,
            en: document.getElementById("f_copyright_en").value,
          },
        };

        const result = await DataService.saveData();
        if (result.success) {
          AuthService.logAction(
            "update_settings",
            "Footer ayarları güncellendi"
          );
          Admin.showAlert("success", "Footer ayarları kaydedildi.");
        } else {
          Admin.showAlert("danger", "Hata oluştu.");
        }
      });
  },

  renderCategories: (container) => {
    // Sort by order
    const categories = DataService.getCategories().sort(
      (a, b) => (a.order || 0) - (b.order || 0)
    );

    let html = `
        <div class="card">
            <div class="card-body">
                <h5 class="card-title">Kategoriler</h5>
                <button class="btn btn-primary btn-sm mb-3" id="btn-add-cat"><i class="bi bi-plus"></i> Yeni Kategori</button>
                <div class="table-responsive">
                    <table class="table table-hover" id="categories-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>İkon</th>
                                <th>Ad (TR)</th>
                                <th>Ad (EN)</th>
                                <th>İşlemler</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${categories
                              .map(
                                (c) => `
                                <tr data-id="${c.id}">
                                    <td>${c.id}</td>
                                    <td>${c.icon}</td>
                                    <td>${c.name.tr}</td>
                                    <td>${c.name.en}</td>
                                    <td>
                                        <button class="btn btn-sm btn-outline-primary btn-edit-cat" data-id="${c.id}"><i class="bi bi-pencil"></i></button>
                                        <button class="btn btn-sm btn-outline-danger btn-del-cat" data-id="${c.id}"><i class="bi bi-trash"></i></button>
                                    </td>
                                </tr>
                            `
                              )
                              .join("")}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- Category Modal -->
        <div class="modal fade" id="catModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Kategori Düzenle</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="cat-form">
                            <div class="mb-3">
                                <label class="form-label">Kategori ID</label>
                                <input type="text" class="form-control" id="c_id" required>
                            </div>
                             <div class="mb-3">
                                <label class="form-label">İkon (Emoji)</label>
                                <input type="text" class="form-control" id="c_icon" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Ad (TR)</label>
                                <input type="text" class="form-control" id="c_name_tr" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Ad (EN)</label>
                                <input type="text" class="form-control" id="c_name_en" required>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">İptal</button>
                        <button type="button" class="btn btn-primary" id="btn-save-cat">Kaydet</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    container.innerHTML = html;

    // Enable Drag & Drop
    Admin.enableDragDrop(
      "categories-table",
      DataService.data.categories,
      async () => {
        await DataService.saveData();
        // No need to re-render, DOM is updated.
        // But maybe we want to flash a success message?
      }
    );

    // Modal Logic
    const modalEl = document.getElementById("catModal");
    const modal = new bootstrap.Modal(modalEl);
    let isEdit = false;

    document.getElementById("btn-add-cat").addEventListener("click", () => {
      isEdit = false;
      document.getElementById("cat-form").reset();
      document.getElementById("c_id").readOnly = false;
      modal.show();
    });

    document.querySelectorAll(".btn-edit-cat").forEach((btn) => {
      btn.addEventListener("click", () => {
        isEdit = true;
        const id = btn.dataset.id;
        const cat = categories.find((c) => c.id === id);
        if (cat) {
          document.getElementById("c_id").value = cat.id;
          document.getElementById("c_id").readOnly = true;
          document.getElementById("c_icon").value = cat.icon;
          document.getElementById("c_name_tr").value = cat.name.tr;
          document.getElementById("c_name_en").value = cat.name.en;
          modal.show();
        }
      });
    });

    document
      .getElementById("btn-save-cat")
      .addEventListener("click", async () => {
        const id = document.getElementById("c_id").value;
        const newCat = {
          id: id,
          icon: document.getElementById("c_icon").value,
          name: {
            tr: document.getElementById("c_name_tr").value,
            en: document.getElementById("c_name_en").value,
          },
          order: isEdit
            ? DataService.data.categories.find((c) => c.id === id).order
            : DataService.data.categories.length + 1,
        };

        if (isEdit) {
          const idx = DataService.data.categories.findIndex((c) => c.id === id);
          if (idx > -1) DataService.data.categories[idx] = newCat;
        } else {
          DataService.data.categories.push(newCat);
        }

        await DataService.saveData();

        AuthService.logAction(
          isEdit ? "update_category" : "create_category",
          `Kategori ${isEdit ? "güncellendi" : "eklendi"}: ${newCat.name.tr}`
        );

        modal.hide();
        Admin.renderCategories(container);
        Admin.showAlert("success", "Kategori kaydedildi.");
      });

    // Delete Category (Event Delegation)
    container
      .querySelector("#categories-table tbody")
      .addEventListener("click", async (e) => {
        const btn = e.target.closest(".btn-del-cat");
        if (!btn) return;

        if (
          confirm(
            "Bu kategoriyi ve içerisindeki ürünleri silmek istediğinize emin misiniz?"
          )
        ) {
          const id = btn.dataset.id;
          const cat = DataService.data.categories.find((c) => c.id === id);

          // Remove products in this category
          DataService.data.products = DataService.data.products.filter(
            (p) => p.categoryId !== id
          );

          // Remove category
          DataService.data.categories = DataService.data.categories.filter(
            (c) => c.id !== id
          );

          await DataService.saveData();

          AuthService.logAction(
            "delete_category",
            `Kategori silindi: ${cat ? cat.name.tr : id}`
          );

          Admin.renderCategories(container);
          Admin.showAlert("success", "Kategori silindi.");
        }
      });
  },

  renderProducts: (container) => {
    const categories = DataService.data.categories;
    const products = DataService.data.products.sort(
      (a, b) => (a.order || 0) - (b.order || 0)
    );

    // 1. Build HTML String
    let html = `
        <div class="row">
            <div class="col-12">
                <div class="card recent-sales overflow-auto">
                    <div class="card-body">
                        <h5 class="card-title">Ürün Listesi <span>| Tüm Kategoriler</span></h5>
                        <div class="mb-3">
                            <button class="btn btn-primary btn-sm" id="btn-add-product">
                                <i class="bi bi-plus"></i> Yeni Ürün Ekle
                            </button>
                        </div>
                        <table class="table table-borderless datatable" id="products-table">
                            <thead>
                                <tr>
                                    <th scope="col">#</th>
                                    <th scope="col">Görsel</th>
                                    <th scope="col">Ürün Adı</th>
                                    <th scope="col">Kategori</th>
                                    <th scope="col">Fiyat</th>
                                    <th scope="col">Durum</th>
                                    <th scope="col">İşlem</th>
                                </tr>
                            </thead>
                            <tbody>
    `;

    products.forEach((p) => {
      const catName =
        categories.find((c) => c.id === p.categoryId)?.name.tr || "-";
      const statusBadge = p.status === "active" ? "success" : "danger";
      const imageSrc = p.image || "https://via.placeholder.com/50";

      html += `
            <tr data-id="${p.id}">
                <th scope="row">#${p.id}</th>
                <td><img src="${imageSrc}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px;"></td>
                <td>${p.name.tr}</td>
                <td><span class="text-primary">${catName}</span></td>
                <td>₺${p.price}</td>
                <td><span class="badge bg-${statusBadge}">${p.status}</span></td>
                <td>
                    <button class="btn btn-sm btn-outline-info btn-preview" data-id="${p.id}" title="Önizle"><i class="bi bi-eye"></i></button>
                    <button class="btn btn-sm btn-outline-primary btn-edit" data-id="${p.id}" title="Düzenle"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-sm btn-outline-danger btn-delete" data-id="${p.id}" title="Sil"><i class="bi bi-trash"></i></button>
                </td>
            </tr>
        `;
    });

    html += `</tbody></table></div></div></div></div>`;

    // Modal HTML
    html += `
        <div class="modal fade" id="productModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="productModalLabel">Ürün Ekle/Düzenle</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <form id="product-form">
                            <input type="hidden" id="p_id">
                            <div class="row mb-3">
                                <div class="col-md-6">
                                    <label class="form-label">Ürün Adı (TR)</label>
                                    <input type="text" class="form-control" id="p_name_tr" required>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Ürün Adı (EN)</label>
                                    <input type="text" class="form-control" id="p_name_en" required>
                                </div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-6">
                                    <label class="form-label">Açıklama (TR)</label>
                                    <textarea class="form-control" id="p_desc_tr" rows="2"></textarea>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Açıklama (EN)</label>
                                    <textarea class="form-control" id="p_desc_en" rows="2"></textarea>
                                </div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-6">
                                    <label class="form-label">Uzun Açıklama (TR) <span id="cnt_tr" class="float-end small text-muted">0/400</span></label>
                                    <textarea class="form-control" id="p_long_desc_tr" rows="3"></textarea>
                                    <div id="warn_tr" class="form-text text-danger d-none">Karakter limiti aşıldı!</div>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Uzun Açıklama (EN) <span id="cnt_en" class="float-end small text-muted">0/400</span></label>
                                    <textarea class="form-control" id="p_long_desc_en" rows="3"></textarea>
                                    <div id="warn_en" class="form-text text-danger d-none">Karakter limiti aşıldı!</div>
                                </div>
                            </div>
                            <div class="row mb-3">
                                <label class="col-sm-2 col-form-label">Fiyat</label>
                                <div class="col-sm-10">
                                    <input type="number" class="form-control" id="p_price" step="0.01" required>
                                </div>
                            </div>
                            <div class="row mb-3">
                                <label class="col-sm-2 col-form-label">Kategori</label>
                                <div class="col-sm-10">
                                    <select class="form-select" id="p_category" required>
                                        ${categories
                                          .map(
                                            (c) =>
                                              `<option value="${c.id}">${c.name.tr}</option>`
                                          )
                                          .join("")}
                                    </select>
                                </div>
                            </div>
                            <div class="row mb-3">
                                <label class="col-sm-2 col-form-label">Durum</label>
                                <div class="col-sm-10">
                                    <select class="form-select" id="p_status">
                                        <option value="active">Aktif</option>
                                        <option value="passive">Pasif</option>
                                    </select>
                                </div>
                            </div>
                            <div class="row mb-3">
                                <label class="col-sm-2 col-form-label">Ürün Görseli</label>
                                <div class="col-sm-10">
                                    <input type="file" class="form-control" id="p_image_file" accept="image/*">
                                    <input type="hidden" id="p_image_base64">
                                    <div id="img-preview" class="mt-2"></div>
                                    <div id="img-warning" class="alert alert-warning mt-2 d-none"></div>
                                </div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-12">
                                    <label class="form-label d-block">Etiketler</label>
                                    <div class="form-check form-check-inline">
                                        <input class="form-check-input" type="checkbox" id="p_tag_gluten">
                                        <label class="form-check-label" for="p_tag_gluten">Gluten</label>
                                    </div>
                                    <div class="form-check form-check-inline">
                                        <input class="form-check-input" type="checkbox" id="p_tag_dairy">
                                        <label class="form-check-label" for="p_tag_dairy">Süt Ürünü</label>
                                    </div>
                                    <div class="form-check form-check-inline">
                                        <input class="form-check-input" type="checkbox" id="p_tag_spicy">
                                        <label class="form-check-label" for="p_tag_spicy">Acı</label>
                                    </div>
                                    <div class="form-check form-check-inline">
                                        <input class="form-check-input" type="checkbox" id="p_tag_vegan">
                                        <label class="form-check-label" for="p_tag_vegan">Vegan</label>
                                    </div>
                                    <div class="form-check form-check-inline">
                                        <input class="form-check-input" type="checkbox" id="p_tag_vegetarian">
                                        <label class="form-check-label" for="p_tag_vegetarian">Vejetaryen</label>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">İptal</button>
                        <button type="button" class="btn btn-info" id="btn-preview-modal">Önizle</button>
                        <button type="button" class="btn btn-primary" id="btn-save-product">Kaydet</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // 2. Inject HTML
    container.innerHTML = html;

    // 3. Initialize Components
    const modalEl = document.getElementById("productModal");
    const modal = new bootstrap.Modal(modalEl);
    let isEdit = false;

    // Helper: Char Counter
    const setupCharCounter = (inputId, countId, warnId) => {
      const input = document.getElementById(inputId);
      const countSpan = document.getElementById(countId);
      const warnDiv = document.getElementById(warnId);

      const update = () => {
        const len = input.value.length;
        countSpan.textContent = `${len}/400`;
        if (len > 300) {
          countSpan.classList.add("text-danger");
          countSpan.classList.remove("text-muted");
          warnDiv.classList.toggle("d-none", len <= 400);
        } else {
          countSpan.classList.remove("text-danger");
          countSpan.classList.add("text-muted");
          warnDiv.classList.add("d-none");
        }
      };
      input.addEventListener("input", update);
      return update;
    };

    const updateTr = setupCharCounter("p_long_desc_tr", "cnt_tr", "warn_tr");
    const updateEn = setupCharCounter("p_long_desc_en", "cnt_en", "warn_en");

    // Drag & Drop
    Admin.enableDragDrop(
      "products-table",
      DataService.data.products,
      async () => {
        await DataService.saveData();
      }
    );

    // 4. Event Delegation
    container
      .querySelector("#products-table tbody")
      .addEventListener("click", (e) => {
        const btnEdit = e.target.closest(".btn-edit");
        const btnDel = e.target.closest(".btn-delete");
        const btnPreview = e.target.closest(".btn-preview");

        if (btnEdit) {
          isEdit = true;
          const id = btnEdit.dataset.id;
          const p = products.find((x) => x.id == id);
          if (p) {
            document.getElementById("p_id").value = p.id;
            document.getElementById("p_name_tr").value = p.name.tr;
            document.getElementById("p_name_en").value = p.name.en;
            document.getElementById("p_desc_tr").value = p.description.tr;
            document.getElementById("p_desc_en").value = p.description.en;
            document.getElementById("p_long_desc_tr").value =
              p.longDescription?.tr || "";
            document.getElementById("p_long_desc_en").value =
              p.longDescription?.en || "";
            document.getElementById("p_price").value = p.price;
            document.getElementById("p_category").value = p.categoryId;
            document.getElementById("p_status").value = p.status;

            document.getElementById("p_tag_gluten").checked =
              p.tags?.gluten || false;
            document.getElementById("p_tag_dairy").checked =
              p.tags?.dairy || false;
            document.getElementById("p_tag_spicy").checked =
              p.tags?.spicy || false;
            document.getElementById("p_tag_vegan").checked =
              p.tags?.vegan || false;
            document.getElementById("p_tag_vegetarian").checked =
              p.tags?.vegetarian || false;

            document.getElementById("p_image_base64").value = p.image || "";
            document.getElementById("img-preview").innerHTML = p.image
              ? `<img src="${p.image}" style="max-height: 100px;">`
              : "";
            document.getElementById("img-warning").classList.add("d-none");

            updateTr();
            updateEn();
            modal.show();
          }
        }

        if (btnDel) {
          if (confirm("Emin misiniz?")) {
            const id = btnDel.dataset.id;
            const idx = DataService.data.products.findIndex((x) => x.id == id);
            if (idx > -1) {
              const deletedProduct = DataService.data.products[idx];
              DataService.data.products.splice(idx, 1);
              DataService.saveData().then(() => {
                AuthService.logAction(
                  "delete_product",
                  `Ürün silindi: ${deletedProduct.name.tr}`
                );
                Admin.renderProducts(container);
                Admin.showAlert("success", "Ürün silindi.");
              });
            }
          }
        }

        if (btnPreview) {
          const id = btnPreview.dataset.id;
          const p = products.find((x) => x.id == id);
          if (p) Admin.previewProduct(p);
        }
      });

    // Add Product Button
    document.getElementById("btn-add-product").addEventListener("click", () => {
      isEdit = false;
      document.getElementById("product-form").reset();
      document.getElementById("p_id").value = Date.now();
      document.getElementById("img-preview").innerHTML = "";
      document.getElementById("p_image_base64").value = "";
      document.getElementById("img-warning").classList.add("d-none");
      updateTr();
      updateEn();
      modal.show();
    });

    // Image Handling
    document
      .getElementById("p_image_file")
      .addEventListener("change", async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const valResult = await Admin.validateImage(file);
        const warnEl = document.getElementById("img-warning");

        if (!valResult.valid) {
          alert(valResult.warning);
          e.target.value = "";
          return;
        }

        warnEl.textContent = valResult.warning || "";
        warnEl.classList.toggle("d-none", !valResult.warning);

        try {
          const base64 = await Admin.processImage(file);
          document.getElementById("p_image_base64").value = base64;
          document.getElementById(
            "img-preview"
          ).innerHTML = `<img src="${base64}" style="max-height: 100px;">`;
        } catch (err) {
          console.error(err);
          alert("Resim işlenirken hata oluştu.");
        }
      });

    // Modal Preview
    document
      .getElementById("btn-preview-modal")
      .addEventListener("click", () => {
        const tempProduct = {
          name: { tr: document.getElementById("p_name_tr").value },
          price: document.getElementById("p_price").value,
          description: { tr: document.getElementById("p_desc_tr").value },
          longDescription: {
            tr: document.getElementById("p_long_desc_tr").value,
          },
          image:
            document.getElementById("p_image_base64").value ||
            "https://via.placeholder.com/300",
          tags: {
            gluten: document.getElementById("p_tag_gluten").checked,
            dairy: document.getElementById("p_tag_dairy").checked,
            spicy: document.getElementById("p_tag_spicy").checked,
            vegan: document.getElementById("p_tag_vegan").checked,
            vegetarian: document.getElementById("p_tag_vegetarian").checked,
          },
        };
        Admin.previewProduct(tempProduct);
      });

    // Save Button
    document
      .getElementById("btn-save-product")
      .addEventListener("click", async () => {
        const id = document.getElementById("p_id").value;
        const newProduct = {
          id: isEdit ? id : Date.now().toString(),
          categoryId: document.getElementById("p_category").value,
          image: document.getElementById("p_image_base64").value,
          price: parseFloat(document.getElementById("p_price").value),
          status: document.getElementById("p_status").value,
          order: isEdit
            ? DataService.data.products.find((p) => p.id == id)?.order || 999
            : DataService.data.products.length + 1,
          name: {
            tr: document.getElementById("p_name_tr").value,
            en: document.getElementById("p_name_en").value,
          },
          description: {
            tr: document.getElementById("p_desc_tr").value,
            en: document.getElementById("p_desc_en").value,
          },
          longDescription: {
            tr: document.getElementById("p_long_desc_tr").value,
            en: document.getElementById("p_long_desc_en").value,
          },
          tags: {
            gluten: document.getElementById("p_tag_gluten").checked,
            dairy: document.getElementById("p_tag_dairy").checked,
            spicy: document.getElementById("p_tag_spicy").checked,
            vegan: document.getElementById("p_tag_vegan").checked,
            vegetarian: document.getElementById("p_tag_vegetarian").checked,
          },
        };

        if (isEdit) {
          const idx = DataService.data.products.findIndex((p) => p.id == id);
          if (idx > -1) DataService.data.products[idx] = newProduct;
        } else {
          DataService.data.products.push(newProduct);
        }

        const result = await DataService.saveData();
        if (result.success) {
          AuthService.logAction(
            isEdit ? "update_product" : "create_product",
            `Ürün ${isEdit ? "güncellendi" : "eklendi"}: ${newProduct.name.tr}`
          );
          modal.hide();
          Admin.renderProducts(container);
          Admin.showAlert("success", "Ürün kaydedildi.");
        } else {
          Admin.showAlert("danger", "Hata: " + result.message);
        }
      });
  },

  renderSettings: (container) => {
    const settings = DataService.getSettings();
    const theme = DataService.getTheme() || {
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
    };

    container.innerHTML = `
        <div class="card mb-4">
            <div class="card-body">
                <h5 class="card-title">Genel Ayarlar</h5>
                <form id="settings-form">
                    <div class="row mb-3">
                        <label class="col-sm-2 col-form-label">Site Başlığı</label>
                        <div class="col-sm-10">
                            <input type="text" class="form-control" id="s_site_title" value="${
                              settings.siteTitle.tr || ""
                            }">
                        </div>
                    </div>
                    <div class="row mb-3">
                        <label class="col-sm-2 col-form-label">Varsayılan Dil</label>
                        <div class="col-sm-10">
                            <select class="form-select" id="s_default_lang">
                                <option value="tr" ${
                                  settings.defaultLanguage === "tr"
                                    ? "selected"
                                    : ""
                                }>Türkçe</option>
                                <option value="en" ${
                                  settings.defaultLanguage === "en"
                                    ? "selected"
                                    : ""
                                }>English</option>
                            </select>
                        </div>
                    </div>
                    <div class="row mb-3">
                         <label class="col-sm-2 col-form-label">Tema</label>
                        <div class="col-sm-10">
                            <select class="form-select" id="s_default_theme">
                                <option value="system" ${
                                  settings.defaultTheme === "system"
                                    ? "selected"
                                    : ""
                                }>Sistem</option>
                                <option value="light" ${
                                  settings.defaultTheme === "light"
                                    ? "selected"
                                    : ""
                                }>Açık (Light)</option>
                                <option value="dark" ${
                                  settings.defaultTheme === "dark"
                                    ? "selected"
                                    : ""
                                }>Koyu (Dark)</option>
                            </select>
                        </div>
                    </div>
                    <button type="submit" class="btn btn-primary">Ayarları Kaydet</button>
                </form>
            </div>
        </div>

        <div class="card">
            <div class="card-body">
                <h5 class="card-title">Tema Ayarları</h5>
                <p class="text-muted small">Sitenin renklerini buradan özelleştirebilirsiniz. Değişiklikler tüm kullanıcılar için geçerli olacaktır.</p>
                
                <form id="theme-form">
                    <div class="row">
                        <div class="col-md-6 border-end">
                            <h6 class="text-primary mb-3"><i class="bi bi-sun"></i> Açık Tema (Light)</h6>
                            
                            <div class="row mb-2">
                                <label class="col-sm-4 col-form-label">Arkaplan</label>
                                <div class="col-sm-8">
                                    <input type="color" class="form-control form-control-color" id="l_bg" value="${
                                      theme.light["--bg-color"]
                                    }" title="Arkaplan Rengi">
                                </div>
                            </div>
                            <div class="row mb-2">
                                <label class="col-sm-4 col-form-label">Yazı Rengi</label>
                                <div class="col-sm-8">
                                    <input type="color" class="form-control form-control-color" id="l_text" value="${
                                      theme.light["--text-color"]
                                    }" title="Yazı Rengi">
                                </div>
                            </div>
                            <div class="row mb-2">
                                <label class="col-sm-4 col-form-label">Kart Arkaplan</label>
                                <div class="col-sm-8">
                                    <input type="color" class="form-control form-control-color" id="l_card" value="${
                                      theme.light["--card-bg"]
                                    }" title="Kart Rengi">
                                </div>
                            </div>
                            <div class="row mb-2">
                                <label class="col-sm-4 col-form-label">Vurgu Rengi</label>
                                <div class="col-sm-8">
                                    <input type="color" class="form-control form-control-color" id="l_accent" value="${
                                      theme.light["--accent-color"]
                                    }" title="Vurgu Rengi">
                                </div>
                            </div>
                        </div>

                        <div class="col-md-6">
                            <h6 class="text-secondary mb-3"><i class="bi bi-moon"></i> Koyu Tema (Dark)</h6>
                            
                            <div class="row mb-2">
                                <label class="col-sm-4 col-form-label">Arkaplan</label>
                                <div class="col-sm-8">
                                    <input type="color" class="form-control form-control-color" id="d_bg" value="${
                                      theme.dark["--bg-color"]
                                    }" title="Arkaplan Rengi">
                                </div>
                            </div>
                            <div class="row mb-2">
                                <label class="col-sm-4 col-form-label">Yazı Rengi</label>
                                <div class="col-sm-8">
                                    <input type="color" class="form-control form-control-color" id="d_text" value="${
                                      theme.dark["--text-color"]
                                    }" title="Yazı Rengi">
                                </div>
                            </div>
                            <div class="row mb-2">
                                <label class="col-sm-4 col-form-label">Kart Arkaplan</label>
                                <div class="col-sm-8">
                                    <input type="color" class="form-control form-control-color" id="d_card" value="${
                                      theme.dark["--card-bg"]
                                    }" title="Kart Rengi">
                                </div>
                            </div>
                            <div class="row mb-2">
                                <label class="col-sm-4 col-form-label">Vurgu Rengi</label>
                                <div class="col-sm-8">
                                    <input type="color" class="form-control form-control-color" id="d_accent" value="${
                                      theme.dark["--accent-color"]
                                    }" title="Vurgu Rengi">
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="mt-4 text-end">
                        <button type="button" class="btn btn-secondary me-2" id="btn-reset-theme">Varsayılanlara Dön</button>
                        <button type="submit" class="btn btn-primary">Tema Ayarlarını Kaydet</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document
      .getElementById("settings-form")
      .addEventListener("submit", async (e) => {
        e.preventDefault();
        DataService.data.settings.siteTitle.tr =
          document.getElementById("s_site_title").value;
        DataService.data.settings.defaultLanguage =
          document.getElementById("s_default_lang").value;
        DataService.data.settings.defaultTheme =
          document.getElementById("s_default_theme").value;

        const result = await DataService.saveData();
        if (result.success) {
          AuthService.logAction("update_settings", "Genel ayarlar güncellendi");
          Admin.showAlert("success", "Ayarlar kaydedildi.");
        }
      });

    document
      .getElementById("theme-form")
      .addEventListener("submit", async (e) => {
        e.preventDefault();
        DataService.data.theme = {
          light: {
            "--bg-color": document.getElementById("l_bg").value,
            "--text-color": document.getElementById("l_text").value,
            "--card-bg": document.getElementById("l_card").value,
            "--accent-color": document.getElementById("l_accent").value,
          },
          dark: {
            "--bg-color": document.getElementById("d_bg").value,
            "--text-color": document.getElementById("d_text").value,
            "--card-bg": document.getElementById("d_card").value,
            "--accent-color": document.getElementById("d_accent").value,
          },
        };

        const result = await DataService.saveData();
        if (result.success) {
          AuthService.logAction("update_settings", "Tema ayarları güncellendi");
          Admin.showAlert("success", "Tema ayarları kaydedildi.");
        }
      });

    document
      .getElementById("btn-reset-theme")
      .addEventListener("click", async () => {
        if (
          confirm(
            "Tema renklerini varsayılan ayarlara döndürmek istediğinize emin misiniz?"
          )
        ) {
          DataService.data.theme = {
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
          };
          await DataService.saveData();
          AuthService.logAction("update_settings", "Tema ayarları sıfırlandı");
          Admin.renderSettings(container);
          Admin.showAlert("success", "Tema varsayılan ayarlara döndürüldü.");
        }
      });
  },
};

window.Admin = Admin;
Admin.init();
