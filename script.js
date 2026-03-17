import { initializeApp } from "https://www.gstatic.com/firebasejs/9.1.0/firebase-app.js";
import { getDatabase, ref, push, onValue, remove, update } from "https://www.gstatic.com/firebasejs/9.1.0/firebase-database.js";

// Твій конфіг Firebase (переконайся, що він тут є)
const firebaseConfig = {
  databaseURL: "https://grand-reserve-3b55c-default-rtdb.firebaseio.com/",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const productsRef = ref(db, 'products');

// --- 1. ВІДОБРАЖЕННЯ ТОВАРІВ (Адмінка та Категорії) ---
onValue(productsRef, (snapshot) => {
    const data = snapshot.val();
    
    // Очищаємо всі можливі контейнери перед рендером
    const containers = {
        whisky: document.getElementById('list-whisky') || document.getElementById('product-list'),
        wine: document.getElementById('list-wine'),
        cognac: document.getElementById('list-cognac'),
        all: document.getElementById('product-list') // Для головної сторінки
    };

    // Обнуляємо вміст контейнерів, якщо вони існують
    Object.values(containers).forEach(el => { if(el) el.innerHTML = ''; });

    if (data) {
        Object.keys(data).forEach(id => {
            const product = { id, ...data[id] };
            const category = product.category;

            // Визначаємо, куди малювати товар
            if (window.location.pathname.includes('admin.html')) {
                // Логіка для АДМІНКИ (сортування за категоріями)
                const targetList = document.getElementById(`list-${category}`);
                if (targetList) {
                    targetList.innerHTML += createAdminItem(product);
                }
            } else {
                // Логіка для КЛІЄНТСЬКИХ СТОРІНОК
                const productList = document.getElementById('product-list');
                if (productList) {
                    // Якщо ми на сторінці категорії (напр. whisky.html), фільтруємо
                    if (window.location.pathname.includes(category) || window.location.pathname.includes('index.html')) {
                        productList.innerHTML += createProductCard(product);
                    }
                }
            }
        });
    }
});

// --- 2. ФУНКЦІЯ СТВОРЕННЯ КАРТКИ ДЛЯ АДМІНКИ (з функціями 1, 2, 4) ---
function createAdminItem(product) {
    return `
        <div class="admin-item">
            <img src="${product.image}" alt="" style="width:50px; height:50px; object-fit:contain;">
            <div style="flex-grow: 1; margin-left: 15px;">
                <div style="font-weight:600;">${product.name}</div>
                <div style="font-size: 10px; color: ${product.inStock ? '#4caf50' : '#ff4d4d'}">
                    ${product.inStock ? '● В НАЯВНОСТІ' : '○ НЕМАЄ'}
                </div>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
                <input type="number" class="quick-price-edit" value="${product.price}" 
                       onchange="updateProductPrice('${product.id}', this.value)" 
                       style="width: 80px; background:#222; color:var(--gold); border:1px solid #333; padding:5px; text-align:center;">
                <button class="btn-delete" onclick="deleteProduct('${product.id}')" 
                        style="color:#ff4d4d; background:none; border:1px solid #ff4d4d; padding:5px 10px; cursor:pointer;">Видалити</button>
            </div>
        </div>
    `;
}

// --- 3. ФУНКЦІЯ СТВОРЕННЯ КАРТКИ ДЛЯ САЙТУ (як на скріншоті) ---
function createProductCard(product) {
    return `
        <div class="product-card">
            <img src="${product.image}" alt="${product.name}">
            <div class="category-label">${product.category}</div>
            <h3>${product.name}</h3>
            <div class="price">${product.price} ₴</div>
            <button class="btn-gold" onclick="addToCart('${product.id}')">У КОШИК</button>
        </div>
    `;
}

// --- 4. ДІЇ (ВИДАЛЕННЯ ТА ОНОВЛЕННЯ) ---
window.deleteProduct = (id) => {
    if(confirm('Видалити цей товар?')) {
        remove(ref(db, 'products/' + id));
    }
};

window.updateProductPrice = (id, newPrice) => {
    update(ref(db, 'products/' + id), { price: Number(newPrice) });
};

// --- 5. ДОДАВАННЯ НОВОГО ТОВАРУ ---
const addForm = document.getElementById('add-product-form');
if (addForm) {
    addForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newProduct = {
            name: document.getElementById('prod-name').value,
            price: Number(document.getElementById('prod-price').value),
            category: document.getElementById('prod-category').value,
            image: document.getElementById('prod-img').value,
            inStock: document.getElementById('prod-stock').checked,
            description: document.getElementById('prod-desc').value
        };
        push(productsRef, newProduct);
        addForm.reset();
    });
}