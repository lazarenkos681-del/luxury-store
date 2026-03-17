import { initializeApp } from "https://www.gstatic.com/firebasejs/9.1.0/firebase-app.js";
import { getDatabase, ref, push, onValue, remove, update } from "https://www.gstatic.com/firebasejs/9.1.0/firebase-database.js";

// --- КОНФІГУРАЦІЯ FIREBASE ---
const firebaseConfig = {
  databaseURL: "https://grand-reserve-3b55c-default-rtdb.firebaseio.com/",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const productsRef = ref(db, 'products');

// --- 1. ЛОГІКА ВІДОБРАЖЕННЯ ТОВАРІВ ---
onValue(productsRef, (snapshot) => {
    const data = snapshot.val();
    const path = window.location.pathname;
    const isAdmin = path.includes('admin.html');
    
    // Очищення контейнерів перед рендером
    const containers = ['list-whisky', 'list-wine', 'list-cognac', 'product-list'];
    containers.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = '';
    });

    if (data) {
        Object.keys(data).forEach(id => {
            const p = { id, ...data[id] };
            
            // --- ЛОГІКА ДЛЯ АДМІН-ПАНЕЛІ ---
            if (isAdmin) {
                const adminList = document.getElementById(`list-${p.category}`);
                if (adminList) {
                    adminList.innerHTML += `
                        <div class="admin-item">
                            <img src="${p.image}" style="width:40px; height:50px; object-fit:contain; margin-right:15px;">
                            <div style="flex-grow:1">
                                <div style="font-weight:600">${p.name}</div>
                                <div style="color:var(--gold); font-size:14px">${p.price} ₴</div>
                            </div>
                            <button onclick="deleteProd('${p.id}')" style="background:none; border:1px solid #444; color:#ff4d4d; padding:5px 10px; cursor:pointer;">Видалити</button>
                        </div>`;
                }
            } 
            // --- ЛОГІКА ДЛЯ КЛІЄНТСЬКИХ СТОРІНОК ---
            else {
                const productList = document.getElementById('product-list');
                if (productList) {
                    // Визначаємо, чи підходить товар під поточну сторінку
                    const isAllPage = path.includes('index.html') || path === '/' || path.endsWith('/');
                    const isCategoryPage = path.includes(p.category);

                    if (isAllPage || isCategoryPage) {
                        productList.innerHTML += `
                            <div class="product-card">
                                <div class="cat-label">${p.category}</div>
                                <img src="${p.image}" alt="${p.name}">
                                <h3>${p.name}</h3>
                                <div class="price">${p.price} ₴</div>
                                <button class="btn-gold" onclick="addToCart('${p.id}', '${p.name}', ${p.price})">У КОШИК</button>
                            </div>`;
                    }
                }
            }
        });
    }
});

// --- 2. ДОДАВАННЯ ТОВАРУ (АДМІНКА) ---
const addForm = document.getElementById('add-product-form');
if (addForm) {
    addForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newProduct = {
            name: document.getElementById('prod-name').value,
            price: Number(document.getElementById('prod-price').value),
            category: document.getElementById('prod-category').value,
            image: document.getElementById('prod-img').value || 'https://via.placeholder.com/300x450?text=Grand+Reserve',
            inStock: document.getElementById('prod-stock').checked,
            description: document.getElementById('prod-desc').value || ""
        };
        push(productsRef, newProduct).then(() => {
            alert('Товар успішно додано!');
            addForm.reset();
        });
    });
}

// --- 3. ВИДАЛЕННЯ ТОВАРУ (АДМІНКА) ---
window.deleteProd = (id) => {
    if (confirm('Ви дійсно хочете видалити цей товар?')) {
        remove(ref(db, `products/${id}`));
    }
};

// --- 4. КОШИК (ПРОСТА РЕАЛІЗАЦІЯ) ---
let cart = JSON.parse(localStorage.getItem('cart')) || [];

window.addToCart = (id, name, price) => {
    cart.push({ id, name, price });
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartUI();
    alert(`${name} додано до кошика!`);
};

function updateCartUI() {
    const countEl = document.getElementById('cart-count');
    if (countEl) countEl.innerText = cart.length;
}

// Викликаємо при завантаженні для оновлення лічильника
updateCartUI();

// --- 5. LIVE PREVIEW В АДМІНЦІ ---
const nameInput = document.getElementById('prod-name');
if (nameInput) {
    nameInput.oninput = () => document.getElementById('prev-name').innerText = nameInput.value || "Назва товару";
    document.getElementById('prod-price').oninput = (e) => document.getElementById('prev-price').innerText = e.target.value || "0";
    document.getElementById('prod-img').oninput = (e) => document.getElementById('prev-img').src = e.target.value || "https://via.placeholder.com/300x400";
    document.getElementById('prod-category').onchange = (e) => document.getElementById('prev-cat').innerText = e.target.value;
}