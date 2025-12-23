/**
 * Linguist Frost - Личный кабинет студента
 * Соответствует требованиям ТЗ п. 3.2.3, 3.4.1, 3.4.2
 */

const API_KEY = 'a0cd61c9-08ca-4666-adc5-cfa927d3e73b'; // ЗАМЕНИТЕ НА ВАШ КЛЮЧ
const BASE_URL = 'https://exam-api-courses.std-900.ist.mospolytech.ru';

let myOrders = [];
let allCourses = [];
let currentPage = 1;
const perPage = 5; // СТРОГО ПО ТЗ (п. 3.2.1)

// Инициализация
window.onload = async () => {
    await loadInitialData();
};

async function loadInitialData() {
    try {
        // Загружаем курсы для сопоставления ID и названий
        const resCourses = await fetch(`${BASE_URL}/api/courses?api_key=${API_KEY}`);
        allCourses = await resCourses.json();
        
        await loadOrders();
    } catch (e) {
        showAlert('Ошибка при загрузке данных с сервера ❄️', 'danger');
    }
}

// 1. ЗАГРУЗКА СПИСКА ЗАЯВОК (п. 3.2.1, 4.4)
async function loadOrders() {
    try {
        const res = await fetch(`${BASE_URL}/api/orders?api_key=${API_KEY}`);
        myOrders = await res.json();
        renderOrders();
    } catch (e) {
        showAlert('Не удалось загрузить ваши заказы', 'danger');
    }
}

// 2. ОТОБРАЖЕНИЕ ТАБЛИЦЫ С ПАГИНАЦИЕЙ (п. 3.2.1)
function renderOrders() {
    const tbody = document.getElementById('orders-list');
    if (!tbody) return;
    tbody.innerHTML = '';

    // Клиентская пагинация (5 записей на страницу)
    const start = (currentPage - 1) * perPage;
    const end = start + perPage;
    const paginatedOrders = myOrders.slice(start, end);

    if (paginatedOrders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">У вас пока нет оформленных подарков-курсов ☃️</td></tr>';
        return;
    }

    paginatedOrders.forEach((order, index) => {
        const course = allCourses.find(c => c.id === order.course_id);
        const globalIndex = start + index + 1;

        tbody.innerHTML += `
            <tr class="align-middle">
                <td class="fw-bold">${globalIndex}</td>
                <td><span class="text-danger">🎄</span> ${course ? course.name : 'Курс не найден'}</td>
                <td>📅 ${order.date_start}<br><small class="text-muted">⏰ ${order.time_start}</small></td>
                <td class="fw-bold">${order.price} ₽</td>
                <td>
                    <div class="btn-group shadow-sm">
                        <button class="btn btn-sm btn-outline-primary" onclick="viewOrderDetails(${order.id})" title="Подробнее">
                            👁️
                        </button>
                        <button class="btn btn-sm btn-outline-warning" onclick="openEditOrder(${order.id})" title="Изменить">
                            ✏️
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="confirmDeleteOrder(${order.id})" title="Удалить">
                            🗑️
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    renderPagination(myOrders.length);
}

// 3. ПРОСМОТР ПОДРОБНОСТЕЙ (п. 3.4.1)
function viewOrderDetails(id) {
    const order = myOrders.find(o => o.id === id);
    const course = allCourses.find(c => c.id === order.course_id);
    
    // Используем то же модальное окно, но отключаем поля
    openEditOrder(id);
    
    // Меняем заголовок и скрываем кнопку сохранения
    document.querySelector('#editModal .modal-title').innerText = '🔍 Просмотр заявки';
    document.querySelector('#edit-form button[type="submit"]').style.display = 'none';
    
    // Делаем все поля только для чтения
    const inputs = document.querySelectorAll('#edit-form input, #edit-form select');
    inputs.forEach(i => i.disabled = true);
}

// 4. РЕДАКТИРОВАНИЕ ЗАЯВКИ (п. 3.2.3, 3.3.4, 4.6)
async function openEditOrder(id) {
    const order = myOrders.find(o => o.id === id);
    const course = allCourses.find(c => c.id === order.course_id);
    const form = document.getElementById('edit-form');
    
    form.dataset.orderId = id;
    
    // Сбрасываем состояние модалки (после возможного "просмотра")
    document.querySelector('#editModal .modal-title').innerText = '📝 Редактирование заявки';
    document.querySelector('#edit-form button[type="submit"]').style.display = 'block';
    const inputs = document.querySelectorAll('#edit-form input, #edit-form select');
    inputs.forEach(i => i.disabled = false);

    // Заполнение полей данными (п. 3.2.3)
    document.getElementById('e-course').value = course ? course.name : '';
    document.getElementById('e-teacher').value = course ? course.teacher : '';
    document.getElementById('e-date').value = order.date_start;
    document.getElementById('e-time').value = order.time_start;
    document.getElementById('e-persons').value = order.persons;
    document.getElementById('e-price').value = order.price + ' ₽';
    
    // Опции
    document.getElementById('e-supp').checked = order.supplementary;
    document.getElementById('e-inter').checked = order.interactive;

    new bootstrap.Modal('#editModal').show();
}

// СОХРАНЕНИЕ ИЗМЕНЕНИЙ (PUT ЗАПРОС)
document.getElementById('edit-form').onsubmit = async (e) => {
    e.preventDefault();
    if (e.submitter && e.submitter.type === 'button') return; // Если нажали "Закрыть"

    const orderId = e.target.dataset.orderId;
    
    const updatedData = {
        date_start: document.getElementById('e-date').value,
        time_start: document.getElementById('e-time').value,
        persons: parseInt(document.getElementById('e-persons').value),
        supplementary: document.getElementById('e-supp').checked,
        interactive: document.getElementById('e-inter').checked
        // Остальные логические поля по ТЗ передавать необязательно, если они не менялись,
        // но для надежности API лучше сохранять все.
    };

    try {
        const res = await fetch(`${BASE_URL}/api/orders/${orderId}?api_key=${API_KEY}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData)
        });

        if (res.ok) {
            showAlert('✨ Заявка успешно обновлена!', 'success');
            bootstrap.Modal.getInstance(document.getElementById('editModal')).hide();
            await loadOrders(); // Обновляем таблицу (п. 3.2.3)
        } else {
            const data = await res.json();
            showAlert(`Ошибка: ${data.error}`, 'danger');
        }
    } catch (e) {
        showAlert('Ошибка сети', 'danger');
    }
};

// 5. УДАЛЕНИЕ ЗАЯВКИ (п. 3.2.3, 4.7)
let idToDelete = null;

function confirmDeleteOrder(id) {
    idToDelete = id;
    new bootstrap.Modal('#deleteModal').show();
}

document.getElementById('confirm-delete-btn').onclick = async () => {
    try {
        const res = await fetch(`${BASE_URL}/api/orders/${idToDelete}?api_key=${API_KEY}`, {
            method: 'DELETE'
        });

        if (res.ok) {
            showAlert('🗑️ Заявка удалена. Снеговики грустят...', 'warning');
            bootstrap.Modal.getInstance(document.getElementById('deleteModal')).hide();
            await loadOrders();
        } else {
            showAlert('Не удалось удалить заявку', 'danger');
        }
    } catch (e) {
        showAlert('Ошибка сети', 'danger');
    }
};

// --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---

function renderPagination(total) {
    const pages = Math.ceil(total / perPage);
    const container = document.getElementById('orders-pagination');
    if (!container) return;
    container.innerHTML = '';

    for (let i = 1; i <= pages; i++) {
        container.innerHTML += `
            <li class="page-item ${i === currentPage ? 'active' : ''}">
                <a class="page-link" href="#" onclick="currentPage=${i}; renderOrders(); return false;">${i}</a>
            </li>
        `;
    }
}

function showAlert(msg, type) {
    const cont = document.getElementById('alert-container');
    const div = document.createElement('div');
    div.className = `alert alert-${type} alert-dismissible fade show shadow-lg border-2`;
    div.innerHTML = `<strong>${type === 'success' ? '❄️' : '⚠️'}</strong> ${msg}
                     <button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;
    cont.appendChild(div);
    // Исчезновение через 5 секунд (п. 3.2.3)
    setTimeout(() => { if (div) div.remove(); }, 5000);
}

