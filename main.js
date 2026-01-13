// Глобальные переменные
let allCourses = [];
let allTutors = [];

// Инициализация
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🏁 Страница загружена, начинаем инициализацию');
    
    // Показываем сообщение о загрузке
    showNotification('Загрузка данных...', 'info');
    
    // Ждем немного чтобы courses.js успел загрузиться
    setTimeout(async () => {
        await loadInitialData();
        setupEventListeners();
        console.log('✅ Инициализация завершена');
    }, 100);
});

// Загрузка данных
async function loadInitialData() {
    console.log('🔄 Начинаем загрузку данных...');
    
    try {
        // Проверяем доступность функций из courses.js
        if (typeof window.loadAllData !== 'function') {
            throw new Error('Функция loadAllData не найдена. Проверьте загрузку courses.js');
        }
        
        console.log('📥 Загружаем данные через loadAllData...');
        const result = await window.loadAllData();
        
        // Сохраняем данные
        allCourses = result.courses || [];
        allTutors = result.tutors || [];
        
        console.log(`📊 Получено данных: ${allCourses.length} курсов, ${allTutors.length} репетиторов`);
        console.log(`📍 Источник: ${result.source}`);
        console.log(`💬 Сообщение: ${result.message}`);
        
        // Показываем уведомление
        let notificationType = result.success ? 'success' : 'warning';
        if (result.source === 'local') {
            notificationType = 'warning';
        }
        
        showNotification(
            `Данные загружены (${result.source}): ${allCourses.length} курсов, ${allTutors.length} репетиторов<br>` +
            `<small>${result.message}</small>`,
            notificationType,
            7000
        );
        
        // Отображаем данные
        renderCourses();
        renderTutors();
        
    } catch (error) {
        console.error('❌ Ошибка загрузки данных:', error);
        
        // Пробуем использовать локальные данные напрямую
        if (window.LOCAL_COURSES && window.LOCAL_TUTORS) {
            allCourses = window.LOCAL_COURSES;
            allTutors = window.LOCAL_TUTORS;
            
            showNotification(
                `Используются локальные данные: ${allCourses.length} курсов, ${allTutors.length} репетиторов`,
                'warning'
            );
            
            renderCourses();
            renderTutors();
        } else {
            showNotification('Критическая ошибка загрузки данных', 'danger');
        }
    }
}

// Отображение курсов
function renderCourses() {
    const container = document.getElementById('coursesContainer');
    if (!container) {
        console.error('❌ Элемент coursesContainer не найден!');
        return;
    }
    
    console.log(`🎨 Отрисовываем ${allCourses.length} курсов`);
    
    container.innerHTML = '';
    
    if (allCourses.length === 0) {
        container.innerHTML = `
            <div class="alert alert-warning">
                <i class="bi bi-exclamation-triangle me-2"></i>
                Нет доступных курсов
            </div>
        `;
        return;
    }
    
    // Создаем сетку для курсов
    const coursesGrid = document.createElement('div');
    coursesGrid.className = 'row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4';
    
    // Отображаем все курсы
    allCourses.forEach(course => {
        const col = document.createElement('div');
        col.className = 'col';
        
        // Форматируем уровень
        let levelBadgeClass = 'bg-secondary';
        if (course.level === 'Beginner') levelBadgeClass = 'bg-success';
        if (course.level === 'Intermediate') levelBadgeClass = 'bg-warning';
        if (course.level === 'Advanced') levelBadgeClass = 'bg-danger';
        
        col.innerHTML = `
            <div class="card h-100 shadow-sm">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <h5 class="card-title">${course.name}</h5>
                        <span class="badge ${levelBadgeClass}">${course.level || 'Не указан'}</span>
                    </div>
                    <p class="card-text text-muted">${course.description || 'Описание отсутствует'}</p>
                    <div class="mb-2">
                        <small class="text-muted">
                            <i class="bi bi-person me-1"></i>
                            ${course.teacher || 'Не указан'}
                        </small>
                    </div>
                    <div class="mb-3">
                        <small class="text-muted">
                            <i class="bi bi-clock me-1"></i>
                            ${course.total_length || 0} недель, ${course.week_length || 0} ч/нед
                        </small>
                    </div>
                    <div class="d-flex justify-content-between align-items-center">
                        <span class="h5 text-primary mb-0">${course.course_fee_per_hour || 0} руб/час</span>
                        <button class="btn btn-primary btn-sm" onclick="openOrderModal(${course.id})">
                            Записаться
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        coursesGrid.appendChild(col);
    });
    
    container.appendChild(coursesGrid);
}

// Отображение репетиторов
function renderTutors() {
    const tableBody = document.getElementById('tutorsTableBody');
    if (!tableBody) {
        console.error('❌ Элемент tutorsTableBody не найден!');
        return;
    }
    
    console.log(`🎨 Отрисовываем ${allTutors.length} репетиторов`);
    
    tableBody.innerHTML = '';
    
    if (allTutors.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4">
                    <div class="alert alert-warning mb-0">
                        <i class="bi bi-exclamation-triangle me-2"></i>
                        Нет доступных репетиторов
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    // Отображаем всех репетиторов
    allTutors.forEach(tutor => {
        const row = document.createElement('tr');
        
        // Форматируем уровень
        let levelBadgeClass = 'bg-secondary';
        if (tutor.language_level === 'Beginner') levelBadgeClass = 'bg-success';
        if (tutor.language_level === 'Intermediate') levelBadgeClass = 'bg-warning';
        if (tutor.language_level === 'Advanced') levelBadgeClass = 'bg-danger';
        
        row.innerHTML = `
            <td>
                <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(tutor.name)}&background=4361ee&color=fff&rounded=true" 
                     alt="${tutor.name}" width="40" height="40" class="rounded-circle">
            </td>
            <td class="fw-bold">${tutor.name || 'Не указано'}</td>
            <td>${tutor.languages_offered ? tutor.languages_offered.join(', ') : 'Не указаны'}</td>
            <td><span class="badge ${levelBadgeClass}">${tutor.language_level || 'Не указан'}</span></td>
            <td>${tutor.work_experience || 0} лет</td>
            <td class="fw-bold text-primary">${tutor.price_per_hour || 0} руб/час</td>
            <td>
                <button class="btn btn-outline-primary btn-sm" onclick="selectTutor(${tutor.id})">
                    Выбрать
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

// Настройка обработчиков
function setupEventListeners() {
    console.log('🎯 Настраиваем обработчики событий');
    
    // Добавляем кнопку для перезагрузки данных
    const reloadButton = document.createElement('button');
    reloadButton.className = 'btn btn-outline-secondary btn-sm mt-3';
    reloadButton.innerHTML = '<i class="bi bi-arrow-clockwise me-1"></i>Перезагрузить данные';
    reloadButton.onclick = async () => {
        showNotification('Перезагрузка данных...', 'info');
        await loadInitialData();
    };
    
    const coursesSection = document.getElementById('courses');
    if (coursesSection) {
        coursesSection.appendChild(reloadButton);
    }
}

// Функция отображения уведомлений
function showNotification(message, type = 'info', duration = 5000) {
    console.log(`📢 Уведомление [${type}]: ${message}`);
    
    let notificationArea = document.getElementById('notification-area');
    if (!notificationArea) {
        notificationArea = document.createElement('div');
        notificationArea.id = 'notification-area';
        notificationArea.className = 'container mt-3';
        document.body.insertBefore(notificationArea, document.body.firstChild);
    }
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    notificationArea.appendChild(alert);
    
    // Автоматическое скрытие
    if (duration > 0) {
        setTimeout(() => {
            if (alert.parentNode) {
                alert.classList.remove('show');
                setTimeout(() => {
                    if (alert.parentNode) {
                        notificationArea.removeChild(alert);
                    }
                }, 150);
            }
        }, duration);
    }
}

// Глобальные функции для кнопок
window.openOrderModal = function(courseId) {
    alert(`Открывается форма записи на курс ID: ${courseId}\n(Функция будет реализована позже)`);
};

window.selectTutor = function(tutorId) {
    alert(`Выбран репетитор ID: ${tutorId}\n(Функция будет реализована позже)`);
};

console.log('✅ main.js загружен');