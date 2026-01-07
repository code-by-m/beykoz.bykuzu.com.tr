/**
 * AUTH SERVICE
 * ----------------------------------------------------------------
 * Yetkilendirme (RBAC) ve Loglama işlemlerini yönetir.
 * Roller: Developer, Admin, Designer
 */

const AuthService = {
  // Rol Tanımları ve Yetkileri
  roles: {
    developer: {
      canManageUsers: true,
      canViewLogs: true,
      canManageProducts: true,
      canManageSettings: true,
    },
    admin: {
      canManageUsers: false,
      canViewLogs: false,
      canManageProducts: true,
      canManageSettings: true,
    },
    designer: {
      canManageUsers: false,
      canViewLogs: false,
      canManageProducts: true,
      canManageSettings: false,
    },
  },

  // Mevcut Oturum
  currentUser: null,

  // Başlatma
  init: () => {
    const savedUser = localStorage.getItem("admin_user");
    if (savedUser) {
      AuthService.currentUser = JSON.parse(savedUser);
    }
  },

  // Giriş Yap
  login: (username, password) => {
    const users = DataService.getUsers();
    const user = users.find(
      (u) => u.username === username && u.password === password
    );

    if (user) {
      AuthService.currentUser = user;
      localStorage.setItem("admin_user", JSON.stringify(user));
      AuthService.logAction("login", "Kullanıcı giriş yaptı");
      return { success: true };
    }

    // Hatalı giriş denemesini logla (eğer sistemde bir developer varsa ona görünür)
    // Not: Anonim loglama yapıyoruz
    // DataService.data.logs.push({...}) manuel ekleme yapabiliriz ama
    // AuthService.logAction çalışmaz çünkü currentUser yok.
    // Güvenlik için sadece başarılı girişleri loglayalım şimdilik.

    return { success: false, message: "Kullanıcı adı veya şifre hatalı!" };
  },

  // Çıkış Yap
  logout: () => {
    if (AuthService.currentUser) {
      AuthService.logAction("logout", "Kullanıcı çıkış yaptı");
    }
    AuthService.currentUser = null;
    localStorage.removeItem("admin_user");
    localStorage.removeItem("admin_token"); // Eski token yapısını da temizle
  },

  // Yetki Kontrolü (Guard)
  hasPermission: (permissionKey) => {
    if (!AuthService.currentUser) return false;
    const role = AuthService.currentUser.role;
    const permissions = AuthService.roles[role];
    return permissions ? !!permissions[permissionKey] : false;
  },

  // Rol Kontrolü
  hasRole: (roleName) => {
    return AuthService.currentUser && AuthService.currentUser.role === roleName;
  },

  // Loglama Sistemi
  logAction: (action, detail) => {
    if (!AuthService.currentUser) return;

    const log = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      username: AuthService.currentUser.username,
      role: AuthService.currentUser.role,
      action: action,
      detail: detail,
    };

    // Logları DataService'e ekle
    DataService.data.logs.unshift(log); // En yeni en üstte

    // Log sayısını sınırla (Örn: Son 1000 işlem)
    if (DataService.data.logs.length > 1000) {
      DataService.data.logs.pop();
    }

    DataService.saveData(); // Logları kalıcı hale getir
  },

  // UI Guard: Yetkisiz elemanları gizle
  applyPermissionsToUI: () => {
    const protectedElements = document.querySelectorAll("[data-permission]");

    protectedElements.forEach((el) => {
      const permission = el.dataset.permission;
      if (!AuthService.hasPermission(permission)) {
        // Elementi DOM'dan kaldır (Display:none değil, güvenlik için remove)
        el.remove();
      }
    });
  },

  // Sayfa Guard: Yetkisiz sayfaya erişimi engelle
  checkPageAccess: (viewName) => {
    // Görünüm (View) bazlı yetki haritası
    const viewPermissions = {
      users: "canManageUsers",
      logs: "canViewLogs",
      settings: "canManageSettings",
      // dashboard ve products herkese açık (temel yetki)
    };

    const requiredPermission = viewPermissions[viewName];
    if (requiredPermission && !AuthService.hasPermission(requiredPermission)) {
      AuthService.logAction(
        "security_alert",
        `Yetkisiz erişim denemesi: ${viewName}`
      );
      return false;
    }
    return true;
  },
};

// Global'e ekle
window.AuthService = AuthService;
