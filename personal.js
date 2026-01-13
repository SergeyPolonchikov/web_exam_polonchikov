// Личный кабинет - скрипты

let allOrders = [];
let filteredOrders = [];
let currentOrderPage = 1;
const ITEMS_PER_PAGE = 5;
const STUDENT_ID = 1; // В реальном приложении получаем из сессии/авторизации

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', async () => {
    await loadOrders();
    setupEventListeners();
});

// Загрузка заявок
async function loadOrders() {
    try {
        allOrders = await fetchOrders(STUDENT_ID);
        filteredOrders = [...allOrders];
        renderOrders();
    } catch (error) {
        console.error('Error loading orders:', error);
    }
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Кнопка обновления
    const refreshBtn = document.querySelector('button[onclick="refreshOrders()"]');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', refreshOrders);
    }
    
    // Обработка кликов по таблице
    document.addEventListener('click', (e) => {
        if (e.target.closest('.view-order-btn')) {
            const orderId = e.target.closest('.view-order-btn').dataset.orderId;
            viewOrderDetails(orderId);
        }
        
        if (e.target.closest('.edit-order-btn')) {
            const orderId = e.target.closest('.edit-order-btn').dataset.orderId;
            editOrder(orderId);
        }
        
        if (e.target.closest('.delete-order-btn')) {
            const orderId = e.target.closest('.delete-order-btn').dataset.orderId;
            confirmDeleteOrder(orderId);
        }
    });
}

// Обновление заявок
async function refreshOrders() {
    await loadOrders();
    showNotification('Список заявок обновлен', 'success');
}

// Отображение заявок
function renderOrders() {
    const tableBody = document.getElementById('ordersTableBody');
    if (!tableBody) return;
    
    // Применяем пагинацию
    const paginated = paginateData(filteredOrders, currentOrderPage, ITEMS_PER_PAGE);
    
    // Очищаем таблицу
    tableBody.innerHTML = '';
    
    if (paginated.items.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-5">
                    <div class="alert alert-info mb-0">
                        <i class="bi bi-info-circle me-2"></i>
                        У вас пока нет заявок. Оформите первую заявку на главной странице!
                    </div>
                </td>
            </tr>
        `;
        document.getElementById('ordersPagination').innerHTML = '';
        return;
    }
    
    // Отображаем заявки
    paginated.items.forEach((order, index) => {
        const row = document.createElement('tr');
        const course = getCourseById(order.course_id);
        const tutor = getTutorById(order.tutor_id);
        
        row.innerHTML = `
            <td>${(currentOrderPage - 1) * ITEMS_PER_PAGE + index + 1}</td>
            <td>${course ? course.name : 'Курс не найден'}</td>
            <td>${formatDate(order.date_start)} ${order.time_start}</td>
            <td>${order.persons}</td>
            <td><strong>${order.price} руб</strong></td>
            <td>
                <span class="badge ${getStatusBadgeClass(order)}">
                    ${getOrderStatus(order)}
                </span>
            </td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-info view-order-btn" 
                            data-order-id="${order.id}"
                            data-bs-toggle="tooltip" title="Подробнее">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-outline-warning edit-order-btn" 
                            data-order-id="${order.id}"
                            data-bs-toggle="tooltip" title="Изменить">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-outline-danger delete-order-btn" 
                            data-order-id="${order.id}"
                            data-bs-toggle="tooltip" title="Удалить">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Создаем пагинацию
    createPagination(
        paginated.totalPages, 
        currentOrderPage, 
        'ordersPagination', 
        (page) => {
            currentOrderPage = page;
            renderOrders();
        }
    );
    
    // Инициализируем tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

// Просмотр деталей заявки
async function viewOrderDetails(orderId) {
    try {
        const order = allOrders.find(o => o.id == orderId);
        if (!order) {
            showNotification('Заявка не найдена', 'danger');
            return;
        }
        
        const course = await getCourseById(order.course_id);
        const tutor = await getTutorById(order.tutor_id);
        
        // Заполняем модальное окно
        document.getElementById('viewId').textContent = order.id;
        document.getElementById('viewCourse').textContent = course ? course.name : 'Не указан';
        document.getElementById('viewTutor').textContent = tutor ? tutor.name : 'Не указан';
        document.getElementById('viewDate').textContent = formatDate(order.date_start);
        document.getElementById('viewTime').textContent = order.time_start;
        document.getElementById('viewDuration').textContent = order.duration;
        document.getElementById('viewPersons').textContent = order.persons;
        document.getElementById('viewBasePrice').textContent = calculateBasePrice(order);
        document.getElementById('viewTotalPrice').textContent = order.price;
        
        // Заполняем опции
        const optionsContainer = document.getElementById('viewOptions');
        optionsContainer.innerHTML = '';
        
        const options = [
            { id: 'early_registration', label: 'Ранняя регистрация', value: order.early_registration },
            { id: 'group_enrollment', label: 'Групповая запись', value: order.group_enrollment },
            { id: 'intensive_course', label: 'Интенсивный курс', value: order.intensive_course },
            { id: 'supplementary', label: 'Доп. материалы', value: order.supplementary },
            { id: 'personalized', label: 'Индивидуальные занятия', value: order.personalized },
            { id: 'excursions', label: 'Экскурсии', value: order.excursions },
            { id: 'assessment', label: 'Оценка уровня', value: order.assessment },
            { id: 'interactive', label: 'Интерактивная платформа', value: order.interactive }
        ];
        
        options.forEach(option => {
            if (option.value) {
                const col = document.createElement('div');
                col.className = 'col-md-6 mb-2';
                col.innerHTML = `
                    <span class="badge bg-light text-dark">
                        <i class="bi bi-check-circle text-success me-1"></i>
                        ${option.label}
                    </span>
                `;
                optionsContainer.appendChild(col);
            }
        });
        
        // Заполняем скидки/надбавки
        const discountsContainer = document.getElementById('viewDiscounts');
        discountsContainer.innerHTML = calculateDiscountsText(order);
        
        // Показываем модальное окно
        const modal = new bootstrap.Modal(document.getElementById('viewOrderModal'));
        modal.show();
        
    } catch (error) {
        console.error('Error viewing order details:', error);
        showNotification('Ошибка при загрузке деталей заявки', 'danger');
    }
}

// Редактирование заявки
async function editOrder(orderId) {
    try {
        const order = allOrders.find(o => o.id == orderId);
        if (!order) {
            showNotification('Заявка не найдена', 'danger');
            return;
        }
        
        // Загружаем данные курсов и репетиторов
        const [courses, tutors] = await Promise.all([
            fetchCourses(),
            fetchTutors()
        ]);
        
        // Находим курс и репетитора
        const course = courses.find(c => c.id === order.course_id);
        const tutor = tutors.find(t => t.id === order.tutor_id);
        
        if (!course) {
            showNotification('Курс не найден', 'danger');
            return;
        }
        
        // Заполняем форму
        const modal = new bootstrap.Modal(document.getElementById('orderModal'));
        const modalTitle = document.getElementById('modalTitle');
        const submitBtn = document.getElementById('submitOrderBtn');
        
        // Устанавливаем режим редактирования
        document.getElementById('orderForm').dataset.mode = 'edit';
        document.getElementById('orderId').value = order.id;
        modalTitle.textContent = 'Редактирование заявки';
        submitBtn.textContent = 'Сохранить изменения';
        
        // Заполняем поля
        document.getElementById('courseSelect').value = order.course_id;
        document.getElementById('tutorSelect').value = order.tutor_id || 0;
        document.getElementById('studentId').value = order.student_id;
        
        // Обновляем даты
        updateAvailableDates();
        
        // Устанавливаем дату и время (после обновления дат)
        setTimeout(() => {
            document.getElementById('startDate').value = order.date_start;
            updateAvailableTimes();
            
            setTimeout(() => {
                document.getElementById('startTime').value = order.time_start;
                document.getElementById('persons').value = order.persons;
                
                // Устанавливаем чекбоксы
                document.getElementById('supplementary').checked = order.supplementary;
                document.getElementById('personalized').checked = order.personalized;
                document.getElementById('excursions').checked = order.excursions;
                document.getElementById('assessment').checked = order.assessment;
                document.getElementById('interactive').checked = order.interactive;
                
                // Рассчитываем стоимость
                calculateTotalPrice();
            }, 100);
        }, 100);
        
        modal.show();
        
    } catch (error) {
        console.error('Error editing order:', error);
        showNotification('Ошибка при загрузке формы редактирования', 'danger');
    }
}

// Подтверждение удаления заявки
function confirmDeleteOrder(orderId) {
    document.getElementById('deleteOrderId').value = orderId;
    const modal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
    modal.show();
}

// Удаление заявки
async function confirmDelete() {
    const orderId = document.getElementById('deleteOrderId').value;
    
    try {
        await deleteOrder(orderId);
        
        // Удаляем из локального массива
        allOrders = allOrders.filter(order => order.id != orderId);
        filteredOrders = [...allOrders];
        
        // Перерисовываем таблицу
        renderOrders();
        
        // Закрываем модальное окно
        const modal = bootstrap.Modal.getInstance(document.getElementById('deleteConfirmModal'));
        modal.hide();
        
    } catch (error) {
        console.error('Error deleting order:', error);
    }
}

// Вспомогательные функции
async function getCourseById(courseId) {
    try {
        const courses = await fetchCourses();
        return courses.find(c => c.id === courseId);
    } catch (error) {
        console.error('Error fetching course:', error);
        return null;
    }
}

async function getTutorById(tutorId) {
    if (!tutorId || tutorId === 0) return null;
    
    try {
        const tutors = await fetchTutors();
        return tutors.find(t => t.id === tutorId);
    } catch (error) {
        console.error('Error fetching tutor:', error);
        return null;
    }
}

function getOrderStatus(order) {
    const startDate = new Date(order.date_start);
    const today = new Date();
    
    if (startDate < today) {
        return 'Завершен';
    } else if (startDate.toDateString() === today.toDateString()) {
        return 'Сегодня';
    } else if (startDate < new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)) {
        return 'На этой неделе';
    } else {
        return 'Запланирован';
    }
}

function getStatusBadgeClass(order) {
    const status = getOrderStatus(order);
    const classes = {
        'Завершен': 'bg-secondary',
        'Сегодня': 'bg-danger',
        'На этой неделе': 'bg-warning',
        'Запланирован': 'bg-success'
    };
    return classes[status] || 'bg-info';
}

function calculateBasePrice(order) {
    // Упрощенный расчет базовой стоимости
    // В реальном приложении нужно учитывать все параметры
    return Math.round(order.price * 0.7);
}

function calculateDiscountsText(order) {
    let text = '';
    
    if (order.early_registration) {
        text += '✓ Ранняя регистрация: -10%<br>';
    }
    
    if (order.group_enrollment) {
        text += '✓ Групповая запись: -15%<br>';
    }
    
    if (order.intensive_course) {
        text += '✓ Интенсивный курс: +20%<br>';
    }
    
    if (order.supplementary) {
        text += '✓ Доп. материалы: +2000 руб/студент<br>';
    }
    
    if (order.personalized) {
        text += '✓ Индивидуальные занятия: +1500 руб/неделю<br>';
    }
    
    if (order.excursions) {
        text += '✓ Культурные экскурсии: +25%<br>';
    }
    
    if (order.assessment) {
        text += '✓ Оценка уровня: +300 руб<br>';
    }
    
    if (order.interactive) {
        text += '✓ Интерактивная платформа: +50%<br>';
    }
    
    return text || 'Нет примененных скидок или надбавок';
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}