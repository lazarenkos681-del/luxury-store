import { initializeApp } from "https://www.gstatic.com/firebasejs/9.1.0/firebase-app.js";
import { getDatabase, ref, push, onValue, remove, update } from "https://www.gstatic.com/firebasejs/9.1.0/firebase-database.js";

const firebaseConfig = {
  databaseURL: "https://grand-reserve-3b55c-default-rtdb.firebaseio.com/",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const productsRef = ref(db, 'products');

// Відображення товарів
onValue(productsRef, (snapshot) => {
    const data = snapshot.val();
    const isAdmin = window.location.pathname.includes('admin.html');
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    // Очищення контейнерів
    const containers = ['list-whisky', 'list-wine', 'list-cognac', 'product-list'];
    containers.forEach(id => { if(document.getElementById(id)) document.getElementById(id).innerHTML = ''; });

    if (data) {
        Object.keys(data).forEach(id => {
            const p = { id, ...data[id] };
            
            if (isAdmin) {
                const container = document.getElementById(`list-${p.category}`);
                if (container) container.innerHTML += `
                    <div class="admin-item">
                        <span>${p.name}</span>
                        <input type="number" class="quick-price-edit" value="${p.price}" onchange="updatePrice('${p.id}', this.value)">
                        <button onclick="deleteProd('${p.id}')" style="color:red; background:none; border:none; cursor:pointer;">Видалити</button>
                    </div>`;
            } else {
                const list = document.getElementById('product-list');
                // Фільтрація за категоріями для окремих сторінок
                const shouldShow = currentPage === 'index.html' || currentPage === '' || currentPage.includes(p.category);
                if (list && shouldShow) {
                    list.innerHTML += `
                        <div class="product-card">
                            <img src="${p.image}" alt="">
                            <h3>${p.name}</h3>
                            <div class="price">${p.price} ₴</div>
                            <button class="btn-gold">У КОШИК</button>
                        </div>`;
                }
            }
        });
    }
});

// Глобальні функції для кнопок
window.deleteProd = (id) => { if(confirm('Видалити?')) remove(ref(db, `products/${id}`)); };
window.updatePrice = (id, val) => update(ref(db, `products/${id}`), { price: Number(val) });

// Додавання товару
const form = document.getElementById('add-product-form');
if(form) {
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        push(productsRef, {
            name: document.getElementById('prod-name').value,
            price: Number(document.getElementById('prod-price').value),
            category: document.getElementById('prod-category').value,
            image: document.getElementById('prod-img').value || 'https://via.placeholder.com/300'
        });
        form.reset();
    });
}