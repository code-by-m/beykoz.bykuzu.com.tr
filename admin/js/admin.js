const Admin = {
  token: localStorage.getItem("adminToken") || null,
  data: null,
  editingProductId: null,

  async init() {
    if (!this.token) {
      this.showLogin();
      return;
    }

    await this.fetchData();
    this.renderProducts();
    this.bindGlobalEvents();
  },

  /* ================= LOGIN ================= */

  showLogin() {
    document.getElementById("login-form").style.display = "block";

    document
      .getElementById("login-btn")
      .addEventListener("click", async () => {
        const password = document.getElementById("login-password").value;

        const res = await fetch("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        });

        const json = await res.json();

        if (json.success) {
          this.token = json.token;
          localStorage.setItem("adminToken", json.token);
          location.reload();
        } else {
          alert("Şifre yanlış");
        }
      });
  },

  /* ================= DATA ================= */

  async fetchData() {
    const res = await fetch("/api/data");
    const json = await res.json();
    this.data = json.data;
  },

  async saveData() {
    await fetch("/api/data", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.token}`,
      },
      body: JSON.stringify(this.data),
    });
  },

  /* ================= RENDER ================= */

  renderProducts() {
    const tbody = document.getElementById("product-table-body");
    tbody.innerHTML = "";

    this.data.products.forEach((p) => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${p.title?.tr || "-"}</td>
        <td>${p.price || "-"}</td>
        <td>
          <button class="btn-edit" data-id="${p.id}">✏️</button>
          <button class="btn-delete" data-id="${p.id}">🗑️</button>
        </td>
      `;

      tbody.appendChild(tr);
    });
  },

  /* ================= EVENTS (DELEGATION) ================= */

  bindGlobalEvents() {
    document.addEventListener("click", async (e) => {
      // ADD
      if (e.target.closest("#btn-add-product")) {
        this.openAddModal();
      }

      // EDIT
      if (e.target.closest(".btn-edit")) {
        const id = e.target.closest(".btn-edit").dataset.id;
        this.openEditModal(id);
      }

      // DELETE
      if (e.target.closest(".btn-delete")) {
        const id = e.target.closest(".btn-delete").dataset.id;
        if (confirm("Ürün silinsin mi?")) {
          this.deleteProduct(id);
        }
      }

      // SAVE
      if (e.target.closest("#btn-save-product")) {
        await this.saveProduct();
      }

      // CLOSE MODAL
      if (e.target.closest(".modal-close")) {
        this.closeModal();
      }
    });
  },

  /* ================= MODAL ================= */

  openAddModal() {
    this.editingProductId = null;
    document.getElementById("product-form").reset();
    document.getElementById("product-modal").style.display = "block";
  },

  openEditModal(id) {
    const product = this.data.products.find((p) => p.id == id);
    if (!product) return;

    this.editingProductId = id;

    document.getElementById("title-tr").value = product.title.tr || "";
    document.getElementById("title-en").value = product.title.en || "";
    document.getElementById("price").value = product.price || "";

    document.getElementById("product-modal").style.display = "block";
  },

  closeModal() {
    document.getElementById("product-modal").style.display = "none";
  },

  /* ================= CRUD ================= */

  async saveProduct() {
    const tr = document.getElementById("title-tr").value.trim();
    const en = document.getElementById("title-en").value.trim();
    const price = document.getElementById("price").value.trim();

    if (!tr || !price) {
      alert("Zorunlu alanlar boş");
      return;
    }

    if (this.editingProductId) {
      const p = this.data.products.find(
        (x) => x.id == this.editingProductId
      );
      p.title.tr = tr;
      p.title.en = en;
      p.price = price;
    } else {
      this.data.products.push({
        id: Date.now(),
        title: { tr, en },
        price,
      });
    }

    await this.saveData();
    this.renderProducts();
    this.closeModal();
  },

  async deleteProduct(id) {
    this.data.products = this.data.products.filter((p) => p.id != id);
    await this.saveData();
    this.renderProducts();
  },
};

/* ================= START ================= */

document.addEventListener("DOMContentLoaded", () => {
  Admin.init();
});
