import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push, onValue, remove, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// === 1. КОНФІГУРАЦІЯ FIREBASE ===
const firebaseConfig = {
  apiKey: "AIzaSyDt63mFK3ebpBD0qv-QQ3khfi3dBDdcTOg",
  authDomain: "grand-reserve-3b55c.firebaseapp.com",
  databaseURL: "https://grand-reserve-3b55c-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "grand-reserve-3b55c",
  storageBucket: "grand-reserve-3b55c.firebasestorage.app",
  messagingSenderId: "254377443723",
  appId: "1:254377443723:web:ff376b45a30dbd32ee6f8e",
  measurementId: "G-Y6N247WCC9"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);
const ADMIN_EMAIL = "lazarenkos681@gmail.com";

// === 2. АВТОРИЗАЦІЯ (ВХІД ТА РЕЄСТРАЦІЯ) ===
const authForm = document.getElementById('auth-form');
const authBtnToggle = document.getElementById('auth-toggle-btn');
let isLoginMode = true;

if (authBtnToggle) {
    authBtnToggle.addEventListener('click', (e) => {
        e.preventDefault(); // Зупиняє перезавантаження сторінки
        isLoginMode = !isLoginMode;
        
        document.getElementById('auth-title').innerText = isLoginMode ? "Вхід у кабінет" : "Реєстрація";
        document.getElementById('auth-submit-btn').innerText = isLoginMode ? "УВІЙТИ" : "СТВОРИТИ АКАУНТ";
        document.getElementById('auth-toggle-text').innerText = isLoginMode ? "Ще не маєте акаунту?" : "Вже є акаунт?";
        authBtnToggle.innerText = isLoginMode ? "Зареєструватися" : "Увійти";
    });
}

if (authForm) {
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Зупиняє очищення полів
        
        const email = document.getElementById('auth-email').value;
        const pass = document.getElementById('auth-pass').value;

        try {
            if (isLoginMode) {
                await signInWithEmailAndPassword(auth, email, pass);
                alert("Успішний вхід!");
                window.location.href = (email === ADMIN_EMAIL) ? "admin.html" : "index.html";
            } else {
                await createUserWithEmailAndPassword(auth, email, pass);
                alert("Акаунт створено!");
                window.location.href = "index.html";
            }
        } catch (error) {
            alert("Помилка: " + error.message);
        }
    });
}

// === 3. ЗАХИСТ ТА СТАТУС КОРИСТУВАЧА ===
onAuthStateChanged(auth, (user) => {
    const adminShield = document.getElementById('admin-shield');
    const authMenuItem = document.getElementById('auth-menu-item');

    if (window.location.pathname.includes('admin.html')) {
        if (user && user.email === ADMIN_EMAIL) {
            if (adminShield) adminShield.style.display = 'block';
            loadAdminProducts();
        } else {
            alert("Доступ лише для адміна!");
            window.location.href = "auth.html";
        }
    }

    if (authMenuItem) {
        if (user) {
            authMenuItem.innerHTML = `<a href="#" id="logout-link" style="color:var(--gold);">Вихід (${user.email.split('@')[0]})</a>`;
            document.getElementById('logout-link').onclick = (e) => {
                e.preventDefault();
                signOut(auth).then(() => window.location.href = "index.html");
            };
        } else {
            authMenuItem.innerHTML = `<a href="auth.html" class="btn-gold" style="padding: 5px 10px; border: 1px solid var(--gold);">Вхід</a>`;
        }
    }
});

// === 4. АДМІН-ПАНЕЛЬ (ТОВАРИ) ===
function loadAdminProducts() {
    const adminList = document.getElementById('admin-product-list');
    onValue(ref(db, 'products'), (snapshot) => {
        if (!adminList) return;
        adminList.innerHTML = "";
        snapshot.forEach((child) => {
            const p = child.val();
            const div = document.createElement('div');
            div.style = "display:flex; justify-content:space-between; padding:10px; border-bottom:1px solid #333; color:white;";
            div.innerHTML = `
                <span>${p.name} (${p.price} ₴)</span>
                <button onclick="window.deleteProduct('${child.key}')" style="color:red; background:none; border:none; cursor:pointer;">Видалити</button>
            `;
            adminList.appendChild(div);
        });
    });
}

window.deleteProduct = (id) => {
    if (confirm("Видалити цей товар?")) remove(ref(db, 'products/' + id));
};

const adminForm = document.getElementById('admin-form');
if (adminForm) {
    adminForm.onsubmit = (e) => {
        e.preventDefault();
        const productData = {
            name: document.getElementById('admin-name').value,
            price: document.getElementById('admin-price').value,
            img: document.getElementById('admin-img').value,
            desc: document.getElementById('admin-desc').value,
            category: document.getElementById('admin-category').value
        };
        push(ref(db, 'products'), productData).then(() => {
            adminForm.reset();
            alert("Товар додано!");
        });
    };
}

// === 5. КАТАЛОГ (ДЛЯ КЛІЄНТІВ) ===
const productList = document.getElementById('product-list');
if (productList) {
    onValue(ref(db, 'products'), (snapshot) => {
        productList.innerHTML = "";
        const path = window.location.pathname;
        const page = path.split('/').pop().replace('.html', '') || 'index';
        
        snapshot.forEach((child) => {
            const p = child.val();
            // Фільтр: на головній всі, на категоріях — тільки відповідні
            if (page === "index" || p.category === page) {
                productList.innerHTML += `
                    <div class="product-card">
                        <img src="${p.img}" alt="${p.name}">
                        <h3>${p.name}</h3>
                        <div class="price">${p.price} ₴</div>
                        <button class="btn-gold" onclick="window.addToCart('${p.name}', ${p.price}, '${p.img}')">В КОШИК</button>
                    </div>`;
            }
        });
    });
}

// === 6. КОШИК ===
let cart = JSON.parse(localStorage.getItem('luxury_cart')) || [];

window.addToCart = (name, price, img) => {
    cart.push({ name, price, img });
    updateCart();
    alert("Додано: " + name);
};

function updateCart() {
    localStorage.setItem('luxury_cart', JSON.stringify(cart));
    const count = document.getElementById('cart-count');
    const items = document.getElementById('cart-items');
    const total = document.getElementById('cart-total-price');

    if (count) count.innerText = cart.length;
    if (items) {
        items.innerHTML = cart.map((item, index) => `
            <div class="cart-item" style="display:flex; justify-content:space-between; margin-bottom:10px;">
                <span style="font-size:14px;">${item.name}</span>
                <button onclick="window.removeFromCart(${index})" style="background:none; color:gold; border:none; cursor:pointer;">×</button>
            </div>
        `).join('');
    }
    if (total) {
        total.innerText = cart.reduce((acc, item) => acc + Number(item.price), 0);
    }
}

window.removeFromCart = (index) => {
    cart.splice(index, 1);
    updateCart();
};

window.openCheckout = () => {
    if (cart.length === 0) return alert("Кошик порожній!");
    const modal = document.getElementById('checkout-modal');
    if (modal) modal.style.display = 'flex';
};

const cartBtn = document.getElementById('cart-btn');
const cartDropdown = document.getElementById('cart-dropdown');
if (cartBtn && cartDropdown) {
    cartBtn.onclick = () => cartDropdown.classList.toggle('active');
}

updateCart();