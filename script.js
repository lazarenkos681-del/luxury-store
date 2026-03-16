// --- 1. ПІДКЛЮЧЕННЯ FIREBASE ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, push, onValue, set, remove } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

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
const productsRef = ref(db, 'products');

// --- 2. ГЛОБАЛЬНІ ЗМІННІ ---
let products = [];
let cart = JSON.parse(localStorage.getItem('luxury_cart')) || [];

// --- 3. СИНХРОНІЗАЦІЯ З БАЗОЮ ДАНИХ (Realtime) ---
onValue(productsRef, (snapshot) => {
    const data = snapshot.val();
    products = [];
    if (data) {
        // Перетворюємо об'єкт Firebase у масив з ID
        Object.keys(data).forEach(key => {
            products.push({ firebaseId: key, ...data[key] });
        });
    }
    
    // Визначаємо, яку сторінку оновлювати
    const path = window.location.pathname;
    if (path.includes('admin.html')) {
        renderAdminList();
    } else if (path.includes('whisky.html')) {
        renderProducts('whisky');
    } else if (path.includes('wine.html')) {
        renderProducts('wine');
    } else if (path.includes('cognac.html')) {
        renderProducts('cognac');
    } else if (path.includes('product.html')) {
        renderProductPage();
    } else {
        renderProducts('all');
    }
    updateCartUI();
});

// --- 4. ФУНКЦІЇ КАТАЛОГУ ---
window.renderProducts = function(filter = 'all') {
    const list = document.getElementById('product-list');
    if (!list) return;

    const filtered = filter === 'all' ? products : products.filter(p => p.cat === filter);
    
    list.innerHTML = filtered.map(item => `
        <div class="card">
            <div class="img-container" onclick="location.href='product.html?id=${item.id}'">
                <img src="${item.img}" alt="${item.name}" onerror="this.src='https://via.placeholder.com/300x400?text=No+Image'">
            </div>
            <span class="cat-tag">${item.cat}</span>
            <h3>${item.name}</h3>
            <p class="price">${Number(item.price).toLocaleString()} ₴</p>
            <button class="btn-gold-small" onclick="addToCart(${item.id})">У КОШИК</button>
        </div>
    `).join('');
}

// --- 5. СТОРІНКА ТОВАРУ ---
window.renderProductPage = function() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const item = products.find(p => p.id == id);
    const container = document.getElementById('product-details');
    if (!item || !container) return;

    container.innerHTML = `
        <div class="product-flex">
            <img src="${item.img}" class="product-big-img">
            <div class="product-info-text">
                <h1>${item.name}</h1>
                <p class="cat-label">${item.cat.toUpperCase()}</p>
                <p class="price-big">${Number(item.price).toLocaleString()} ₴</p>
                <div class="description">${item.desc || 'Опис скоро з’явиться...'}</div>
                <button class="btn-gold-filled" onclick="addToCart(${item.id})">ДОДАТИ В КОШИК</button>
            </div>
        </div>
    `;
}

// --- 6. ЛОГІКА КОШИКА ---
window.addToCart = function(id) {
    const p = products.find(x => x.id == id);
    if (!p) return;
    const inCart = cart.find(x => x.id == id);
    if(inCart) inCart.qty++; else cart.push({...p, qty: 1});
    saveCart();
    updateCartUI();
    document.getElementById('cart-dropdown').classList.add('active');
};

window.removeFromCart = function(id) {
    cart = cart.filter(i => i.id !== id);
    saveCart();
    updateCartUI();
};

function saveCart() {
    localStorage.setItem('luxury_cart', JSON.stringify(cart));
}

window.updateCartUI = function() {
    const countEl = document.getElementById('cart-count');
    const totalEl = document.getElementById('cart-total-price');
    const itemsEl = document.getElementById('cart-items');
    if (!countEl || !itemsEl) return;

    const totalQty = cart.reduce((s, i) => s + i.qty, 0);
    const totalPrice = cart.reduce((s, i) => s + (i.price * i.qty), 0);

    countEl.innerText = totalQty;
    totalEl.innerText = totalPrice.toLocaleString();
    itemsEl.innerHTML = cart.length === 0 ? '<p style="text-align:center;padding:10px;">Порожньо</p>' : 
    cart.map(i => `
        <div class="cart-item">
            <span>${i.name} (x${i.qty})</span>
            <button onclick="removeFromCart(${i.id})">×</button>
        </div>
    `).join('');
}

window.openCheckout = function() {
    if(cart.length === 0) return alert("Кошик порожній!");
    const modal = document.getElementById('checkout-modal');
    if(modal) modal.style.display = 'block';
};

// --- 7. АДМІН-ПАНЕЛЬ (Firebase Write) ---
const aForm = document.getElementById('admin-form');
if (aForm) {
    aForm.onsubmit = (e) => {
        e.preventDefault();
        const editId = document.getElementById('edit-id').value;
        
        const productData = {
            id: editId ? parseInt(editId) : Date.now(),
            name: document.getElementById('admin-name').value,
            price: parseInt(document.getElementById('admin-price').value),
            img: document.getElementById('admin-img').value,
            desc: document.getElementById('admin-desc').value,
            cat: document.getElementById('admin-category').value
        };

        if (editId) {
            // Оновлення існуючого через його firebaseId
            const item = products.find(p => p.id == editId);
            set(ref(db, 'products/' + item.firebaseId), productData);
        } else {
            // Створення нового
            push(productsRef, productData);
        }

        alert('Успішно збережено в базі!');
        aForm.reset();
        document.getElementById('edit-id').value = '';
        document.getElementById('admin-submit-btn').innerText = "ДОДАТИ ТОВАР";
    };
}

window.editProduct = function(id) {
    const p = products.find(x => x.id === id);
    if (!p) return;
    document.getElementById('edit-id').value = p.id;
    document.getElementById('admin-name').value = p.name;
    document.getElementById('admin-price').value = p.price;
    document.getElementById('admin-img').value = p.img;
    document.getElementById('admin-desc').value = p.desc || '';
    document.getElementById('admin-category').value = p.cat;
    document.getElementById('admin-submit-btn').innerText = "ЗБЕРЕГТИ ЗМІНИ";
    window.scrollTo(0,0);
};

window.deleteProduct = function(firebaseId) {
    if(confirm('Видалити цей товар з бази назавжди?')) {
        remove(ref(db, 'products/' + firebaseId));
    }
};

window.renderAdminList = function() {
    const list = document.getElementById('admin-product-list');
    if(!list) return;
    list.innerHTML = products.map(p => `
        <div class="admin-item">
            <span>${p.name}</span>
            <div>
                <button onclick="editProduct(${p.id})">✎</button>
                <button onclick="deleteProduct('${p.firebaseId}')">🗑</button>
            </div>
        </div>
    `).join('');
}

// Керування кошиком
document.addEventListener('DOMContentLoaded', () => {
    const cBtn = document.getElementById('cart-btn');
    if(cBtn) cBtn.onclick = () => document.getElementById('cart-dropdown').classList.toggle('active');
});