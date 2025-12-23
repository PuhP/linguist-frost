/**
 * Linguist Frost - Главный скрипт управления обучением
 * Соответствует требованиям ТЗ п. 3.1 - 3.3.5
 */

const API_KEY = 'a0cd61c9-08ca-4666-adc5-cfa927d3e73b';// ЗАМЕНИТЕ НА ВАШ КЛЮЧ
const BASE_URL = 'https://exam-api-courses.std-900.ist.mospolytech.ru';

let allCourses = [];
let allTutors = [];
let currentPage = 1;
const perPage = 10; // Требование п. 3.2.1
let selectedTutorName = null;

// Инициализация системы
window.onload = async () => {
    await loadTutors();   // Сначала загружаем преподавателей
    await loadCourses();  // Затем курсы
    setupEventListeners();
};

// --- БЛОК ЗАГРУЗКИ ДАННЫХ (AJAX FETCH) ---

async function loadTutors() {
  try {
        const res = await fetch(`${BASE_URL}/api/tutors?api_key=${API_KEY}`);
        if (!res.ok) throw new Error(`Ошибка сервера: ${res.status}`);
        allTutors = await res.json();
        renderTutorsSearch();
    } catch (e) {
        console.error('Ошибка API репетиторов:', e);
        showAlert('🎅 Упс! Почта Деда Мороза перегружена (Ошибка сервера). Попробуйте обновить страницу позже.', 'danger');
        // Заполняем таблицу заглушкой, чтобы она не была пустой
        document.getElementById('tutors-search-results').innerHTML = 
            '<tr><td colspan="7" class="text-center text-muted">Сервер временно недоступен ❄️</td></tr>';
    }
}

async function loadCourses() {
  try {
        const res = await fetch(`${BASE_URL}/api/courses?api_key=${API_KEY}`);
        if (!res.ok) throw new Error(`Ошибка сервера: ${res.status}`);
        allCourses = await res.json();
        renderCourses();
    } catch (e) {
        console.error('Ошибка API курсов:', e);
        document.getElementById('courses-list').innerHTML = 
            '<tr><td colspan="4" class="text-center text-muted">Не удалось загрузить список курсов ☃️</td></tr>';
    }
}

// --- БЛОК РЕПЕТИТОРОВ (п. 3.3.1 - 3.3.2) ---

function renderTutorsSearch() {
    const level = document.getElementById('tutor-level-select').value;
    const container = document.getElementById('tutors-search-results');
    if (!container) return;

    container.innerHTML = '';

    // Фильтрация: пустые значения не влияют на поиск (п. 3.3.1)
    const filtered = allTutors.filter(t => level === "" || t.language_level === level);

    filtered.forEach(t => {
        const isSelected = selectedTutorName === t.name;
        const tr = document.createElement('tr');
        if (isSelected) tr.className = 'table-active-row'; // Выделение строки (п. 3.3.1)
        
        tr.innerHTML = `
            <td><img src="https://via.placeholder.com/50/dc3545/ffffff?text=🎅" class="rounded-circle" alt="photo"></td>
            <td>${t.name}</td>
            <td><span class="badge bg-secondary">${t.language_level}</span></td>
            <td>${t.languages_spoken.join(', ')}</td>
            <td>${t.work_experience}</td>
            <td>${t.price_per_hour}</td>
            <td>
                <button class="btn btn-sm ${isSelected ? 'btn-success' : 'btn-danger'}" 
                        onclick="selectTutor('${t.name}', ${t.id})">
                    ${isSelected ? 'Выбран' : 'Выбрать'}
                </button>
            </td>
        `;
        container.appendChild(tr);
    });
}

function selectTutor(name, id) {
    selectedTutorName = name;
    const tutor = allTutors.find(t => t.id === id);
    
    renderTutorsSearch(); 

    // Отображение подробной таблицы (п. 3.3.2)
    const detailsContainer = document.getElementById('tutor-details-container');
    detailsContainer.classList.remove('d-none');

    const detailsBody = document.getElementById('tutor-details-body');
    detailsBody.innerHTML = `
        <tr class="table-light">
            <td><img src="https://via.placeholder.com/80/dc3545/ffffff?text=Elf" class="rounded"></td>
            <td class="fw-bold">${tutor.name}</td>
            <td>${tutor.languages_offered.join(', ')}</td>
            <td>${tutor.work_experience} лет</td>
            <td>${tutor.price_per_hour} р/ч</td>
            <td><span class="text-success small">Выбирайте курс этого эльфа ниже ⬇️</span></td>
        </tr>
    `;

    // Синхронная фильтрация курсов по учителю
    currentPage = 1;
    renderCourses();
}

// --- БЛОК КУРСОВ (п. 3.1, 3.2.1) ---

function renderCourses() {
    const search = document.getElementById('course-search').value.toLowerCase();
    const level = document.getElementById('level-filter').value;
    
    let filtered = allCourses;

    // Фильтр по выбранному репетитору
    if (selectedTutorName) {
        filtered = filtered.filter(c => c.teacher === selectedTutorName);
    }

    // Фильтр по поиску и уровню
    filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(search) && (level === "" || c.level === level)
    );

    const container = document.getElementById('courses-list');
    container.innerHTML = '';
    
    const start = (currentPage - 1) * perPage;
    const paginated = filtered.slice(start, start + perPage);

    if (paginated.length === 0) {
        container.innerHTML = '<tr><td colspan="4" class="text-center">Ничего не найдено ❄️</td></tr>';
    }

    paginated.forEach(c => {
        container.innerHTML += `
            <tr>
                <td class="fw-bold">🎄 ${c.name}</td>
                <td><span class="badge bg-danger">${c.level}</span></td>
                <td>👤 ${c.teacher}</td>
                <td><button class="btn btn-outline-danger btn-sm" onclick="openOrder(${c.id})">Оформить</button></td>
            </tr>`;
    });
    renderPagination(filtered.length);
}

// --- БЛОК ОФОРМЛЕНИЯ ЗАЯВКИ И РАСЧЕТА (п. 3.3.3 - 3.3.5) ---

async function openOrder(id) {
    const c = allCourses.find(item => item.id === id);
    const form = document.getElementById('order-form');
    form.dataset.courseId = id;
    
    // Предзаполнение нередактируемых полей (п. 3.3.3)
    document.getElementById('m-course').value = c.name;
    document.getElementById('m-teacher').value = c.teacher;
    document.getElementById('m-dur').value = `${c.total_length} нед.`;
    
    // Генерация доступных дат и времени (п. 3.3.3)
    const dSel = document.getElementById('m-date');
    const uniqueDates = [...new Set(c.start_dates.map(d => d.split('T')[0]))];
    dSel.innerHTML = uniqueDates.map(d => `<option value="${d}">${d}</option>`).join('');
    
    const tSel = document.getElementById('m-time');
    tSel.innerHTML = c.start_dates.map(d => {
        const time = d.split('T')[1].substring(0,5);
        return `<option value="${time}">${time}</option>`;
    }).join('');

    calculatePrice(); // Начальный расчет
    new bootstrap.Modal('#orderModal').show();
}

function calculatePrice() {
    const courseId = document.getElementById('order-form').dataset.courseId;
    const course = allCourses.find(c => c.id == courseId);
    if (!course) return;

    const persons = parseInt(document.getElementById('m-persons').value) || 1;
    const startDateStr = document.getElementById('m-date').value;
    const startTimeStr = document.getElementById('m-time').value;

    // 1. Базовая стоимость (п. 3.3.4)
    const durationInHours = course.total_length * course.week_length;
    let basePrice = course.course_fee_per_hour * durationInHours;

    // 2. Коэффициент выходного дня (п. 3.3.4)
    const date = new Date(startDateStr);
    if (date.getDay() === 0 || date.getDay() === 6) basePrice *= 1.5;

    // 3. Надбавки за время (п. 3.3.4)
    const hour = parseInt(startTimeStr.split(':')[0]);
    let morningSurcharge = (hour >= 9 && hour <= 12) ? 400 : 0;
    let eveningSurcharge = (hour >= 18 && hour <= 20) ? 1000 : 0;

    // Промежуточный итог по формуле ТЗ
    let total = (basePrice + morningSurcharge + eveningSurcharge) * persons;

    // 4. Опции и скидки (п. 3.3.5)
    
    // Ранняя регистрация (за месяц до начала) - 10%
    const diffDays = Math.ceil((new Date(startDateStr) - new Date()) / (1000 * 60 * 60 * 24));
    if (diffDays >= 30) total *= 0.9;

    // Групповая скидка (5+ человек) - 15%
    if (persons >= 5) total *= 0.85;

    // Интенсив (+20%), если более 20 часов в неделю
    if (course.week_length > 20) total *= 1.2;

    // Пользовательские опции (чекбоксы)
    if (document.getElementById('supplementary').checked) total += (2000 * persons);
    if (document.getElementById('personalized').checked) total += (1500 * course.total_length);
    if (document.getElementById('assessment').checked) total += 300;
    if (document.getElementById('excursions').checked) total *= 1.25;
    if (document.getElementById('interactive').checked) total *= 1.5;

    document.getElementById('final-price').innerText = Math.round(total);
}

// --- ОТПРАВКА ДАННЫХ (п. 3.2.2, 4.5) ---

document.getElementById('order-form').onsubmit = async (e) => {
    e.preventDefault();
    const courseId = parseInt(e.target.dataset.courseId);
    const course = allCourses.find(c => c.id === courseId);
    
    // Формирование JSON для API (п. 4.1)
    const requestBody = {
        course_id: courseId,
        tutor_id: 0,
        date_start: document.getElementById('m-date').value,
        time_start: document.getElementById('m-time').value,
        persons: parseInt(document.getElementById('m-persons').value),
        duration: (course.total_length * course.week_length),
        price: parseInt(document.getElementById('final-price').innerText),
        // Обязательные логические поля
        early_registration: false, 
        group_enrollment: parseInt(document.getElementById('m-persons').value) >= 5,
        intensive_course: course.week_length > 20,
        supplementary: document.getElementById('supplementary').checked,
        personalized: document.getElementById('personalized').checked,
        excursions: document.getElementById('excursions').checked,
        assessment: document.getElementById('assessment').checked,
        interactive: document.getElementById('interactive').checked
    };

    try {
        const response = await fetch(`${BASE_URL}/api/orders?api_key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        if (response.ok) {
            showAlert('🎅 Заявка успешно оформлена!', 'success');
            bootstrap.Modal.getInstance(document.getElementById('orderModal')).hide();
        } else {
            const err = await response.json();
            showAlert(`Ошибка: ${err.error}`, 'danger');
        }
    } catch (err) {
        showAlert('Не удалось связаться с сервером ❄️', 'danger');
    }
};

// --- ВСПОМОГАТЕЛЬНЫЙ ФУНКЦИОНАЛ ---

function setupEventListeners() {
    // Реальное время для курсов
    document.getElementById('course-search').oninput = renderCourses;
    document.getElementById('level-filter').onchange = renderCourses;
    
    // Реальное время для репетиторов (п. 3.3.1)
    document.getElementById('tutor-level-select').onchange = renderTutorsSearch;
    
    // Пересчет цены при любых изменениях в форме
    const priceInputs = ['.opt', '#m-persons', '#m-date', '#m-time'];
    priceInputs.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => el.onchange = calculatePrice);
    });
}

function renderPagination(total) {
    const pages = Math.ceil(total / perPage);
    const pag = document.getElementById('courses-pagination');
    if (!pag) return;
    pag.innerHTML = '';
    for(let i = 1; i <= pages; i++) {
        pag.innerHTML += `
            <li class="page-item ${i === currentPage ? 'active' : ''}">
                <a class="page-link" href="#" onclick="currentPage=${i};renderCourses();return false;">${i}</a>
            </li>`;
    }
}

function showAlert(msg, type) {
    const cont = document.getElementById('alert-container');
    const div = document.createElement('div');
    div.className = `alert alert-${type} alert-dismissible fade show shadow-lg`;
    div.innerHTML = `${msg}<button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;
    cont.appendChild(div);
    // Автоматическое исчезновение через 5 секунд (п. 3.2.3)
    setTimeout(() => { if(div) div.remove(); }, 5000);
}


