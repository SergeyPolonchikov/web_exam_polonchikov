// Общие функции для работы с API

const API_BASE_URL = 'http://exam-api-courses.std-900.ist.mospolytech.ru';

// ВАШ ЛИЧНЫЙ КЛЮЧ API - замените на свой
const API_KEY = 'ВАШ_КЛЮЧ_API_ЗДЕСЬ';

// Настройки CORS прокси (раскомментируйте если нужно)
const USE_CORS_PROXY = true; // Включить прокси для обхода CORS
const CORS_PROXY_URL = 'https://cors-anywhere.herokuapp.com/'; // Публичный прокси
// Альтернативные прокси:
// 'https://api.allorigins.win/raw?url='
// 'https://corsproxy.io/?'
// 'https://proxy.cors.sh/'

// Конфигурация заголовков для запросов
// В зависимости от формата вашего API, выберите один из вариантов:
const API_HEADERS = {
    'Content-Type': 'application/json'
    // Вариант 1: Bearer token (раскомментируйте если нужно)
    // 'Authorization': `Bearer ${API_KEY}`
    
    // Вариант 2: API Key в заголовке (раскомментируйте если нужно)
    // 'X-API-Key': API_KEY
    
    // Вариант 3: Простой ключ (раскомментируйте если нужно)
    // 'api-key': API_KEY
    
    // Для CORS прокси может потребоваться добавить
    // 'X-Requested-With': 'XMLHttpRequest'
};

// Функция для создания URL с учетом CORS прокси
function buildApiUrl(endpoint) {
    let url = `${API_BASE_URL}/${endpoint}`;
    
    if (USE_CORS_PROXY && CORS_PROXY_URL) {
        // Для разных прокси может быть разный формат
        if (CORS_PROXY_URL.includes('cors-anywhere')) {
            url = `${CORS_PROXY_URL}${url}`;
        } else if (CORS_PROXY_URL.includes('allorigins')) {
            url = `${CORS_PROXY_URL}${encodeURIComponent(url)}`;
        } else if (CORS_PROXY_URL.includes('corsproxy')) {
            url = `${CORS_PROXY_URL}${encodeURIComponent(url)}`;
        } else if (CORS_PROXY_URL.includes('proxy.cors.sh')) {
            url = `${CORS_PROXY_URL}${url}`;
        }
    }
    
    return url;
}

// Функция для отображения уведомлений
function showNotification(message, type = 'info', duration = 5000) {
    const notificationArea = document.getElementById('notification-area');
    if (!notificationArea) {
        console.error('Элемент notification-area не найден');
        return;
    }
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show notification`;
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    notificationArea.appendChild(alert);
    
    // Автоматическое скрытие уведомления
    setTimeout(() => {
        if (alert.parentNode) {
            alert.classList.remove('show');
            setTimeout(() => {
                if (alert.parentNode && alert.parentNode === notificationArea) {
                    notificationArea.removeChild(alert);
                }
            }, 150);
        }
    }, duration);
}

// Функция для обработки ошибок запросов
function handleApiError(error, endpoint) {
    console.error(`Ошибка при запросе к ${endpoint}:`, error);
    
    let errorMessage = `Ошибка загрузки данных: ${error.message}`;
    
    // Проверяем CORS ошибки
    if (error.message.includes('CORS') || error.message.includes('cross-origin')) {
        errorMessage = 'CORS ошибка. Сервер не разрешает кросс-доменные запросы. ';
        errorMessage += 'Попробуйте включить CORS прокси в настройках.';
        
        // Показываем инструкцию по настройке прокси
        showNotification(`
            <strong>CORS ошибка!</strong><br>
            1. Установите <code>USE_CORS_PROXY = true</code> в api.js<br>
            2. Или используйте расширение CORS для браузера<br>
            3. Или запустите проект через локальный сервер
        `, 'danger', 10000);
    }
    
    showNotification(errorMessage, 'danger');
    return [];
}

// Функция для получения курсов
async function fetchCourses() {
    try {
        console.log('Загрузка курсов...');
        const url = buildApiUrl('courses');
        console.log('URL запроса:', url);
        
        const response = await fetch(url, {
            headers: API_HEADERS,
            mode: USE_CORS_PROXY ? 'cors' : undefined
        });
        
        console.log('Ответ от API (курсы):', response.status, response.statusText);
        
        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Неверный API ключ. Проверьте корректность ключа.');
            }
            throw new Error(`Ошибка загрузки курсов: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Получены данные курсов:', data);
        
        // Проверяем структуру ответа
        if (Array.isArray(data)) {
            return data;
        } else if (data && Array.isArray(data.courses)) {
            return data.courses;
        } else if (data && data.data && Array.isArray(data.data)) {
            return data.data;
        } else {
            console.warn('Неожиданная структура ответа API:', data);
            return [];
        }
    } catch (error) {
        return handleApiError(error, 'courses');
    }
}

// Функция для получения репетиторов
async function fetchTutors() {
    try {
        console.log('Загрузка репетиторов...');
        const url = buildApiUrl('tutors');
        console.log('URL запроса:', url);
        
        const response = await fetch(url, {
            headers: API_HEADERS,
            mode: USE_CORS_PROXY ? 'cors' : undefined
        });
        
        console.log('Ответ от API (репетиторы):', response.status, response.statusText);
        
        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Неверный API ключ. Проверьте корректность ключа.');
            }
            throw new Error(`Ошибка загрузки репетиторов: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Получены данные репетиторов:', data);
        
        // Проверяем структуру ответа
        if (Array.isArray(data)) {
            return data;
        } else if (data && Array.isArray(data.tutors)) {
            return data.tutors;
        } else if (data && data.data && Array.isArray(data.data)) {
            return data.data;
        } else {
            console.warn('Неожиданная структура ответа API:', data);
            return [];
        }
    } catch (error) {
        return handleApiError(error, 'tutors');
    }
}

// Функция для получения заявок
async function fetchOrders(studentId = 1) {
    try {
        console.log('Загрузка заявок...');
        const url = buildApiUrl('orders');
        console.log('URL запроса:', url);
        
        const response = await fetch(url, {
            headers: API_HEADERS,
            mode: USE_CORS_PROXY ? 'cors' : undefined
        });
        
        console.log('Ответ от API (заявки):', response.status, response.statusText);
        
        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Неверный API ключ. Проверьте корректность ключа.');
            }
            throw new Error(`Ошибка загрузки заявок: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Получены данные заявок:', data);
        
        // Проверяем структуру ответа
        let orders;
        if (Array.isArray(data)) {
            orders = data;
        } else if (data && Array.isArray(data.orders)) {
            orders = data.orders;
        } else if (data && data.data && Array.isArray(data.data)) {
            orders = data.data;
        } else {
            console.warn('Неожиданная структура ответа API:', data);
            return [];
        }
        
        // Фильтруем заявки по studentId
        return orders.filter(order => order.student_id == studentId);
    } catch (error) {
        return handleApiError(error, 'orders');
    }
}

// Функция для создания заявки
async function createOrder(orderData) {
    try {
        console.log('Создание заявки:', orderData);
        const url = buildApiUrl('orders');
        console.log('URL запроса:', url);
        
        const response = await fetch(url, {
            method: 'POST',
            headers: API_HEADERS,
            body: JSON.stringify(orderData),
            mode: USE_CORS_PROXY ? 'cors' : undefined
        });
        
        const result = await response.json();
        console.log('Ответ при создании заявки:', result);
        
        if (response.ok) {
            showNotification('Заявка успешно создана', 'success');
            return result;
        } else {
            if (response.status === 401) {
                throw new Error('Неверный API ключ. Проверьте корректность ключа.');
            }
            const errorMsg = result.error || result.message || `Ошибка создания заявки: ${response.status}`;
            throw new Error(errorMsg);
        }
    } catch (error) {
        console.error('Error creating order:', error);
        showNotification(`Ошибка создания заявки: ${error.message}`, 'danger');
        throw error;
    }
}

// Функция для обновления заявки
async function updateOrder(orderId, orderData) {
    try {
        console.log(`Обновление заявки ${orderId}:`, orderData);
        const url = buildApiUrl(`orders/${orderId}`);
        console.log('URL запроса:', url);
        
        const response = await fetch(url, {
            method: 'PUT',
            headers: API_HEADERS,
            body: JSON.stringify(orderData),
            mode: USE_CORS_PROXY ? 'cors' : undefined
        });
        
        const result = await response.json();
        console.log('Ответ при обновлении заявки:', result);
        
        if (response.ok) {
            showNotification('Заявка успешно обновлена', 'success');
            return result;
        } else {
            if (response.status === 401) {
                throw new Error('Неверный API ключ. Проверьте корректность ключа.');
            }
            const errorMsg = result.error || result.message || `Ошибка обновления заявки: ${response.status}`;
            throw new Error(errorMsg);
        }
    } catch (error) {
        console.error('Error updating order:', error);
        showNotification(`Ошибка обновления заявки: ${error.message}`, 'danger');
        throw error;
    }
}

// Функция для удаления заявки
async function deleteOrder(orderId) {
    try {
        console.log(`Удаление заявки ${orderId}`);
        const url = buildApiUrl(`orders/${orderId}`);
        console.log('URL запроса:', url);
        
        const response = await fetch(url, {
            method: 'DELETE',
            headers: API_HEADERS,
            mode: USE_CORS_PROXY ? 'cors' : undefined
        });
        
        let result;
        try {
            result = await response.json();
            console.log('Ответ при удалении заявки:', result);
        } catch (e) {
            // Если ответ не в JSON формате
            result = {};
        }
        
        if (response.ok) {
            showNotification('Заявка успешно удалена', 'success');
            return result;
        } else {
            if (response.status === 401) {
                throw new Error('Неверный API ключ. Проверьте корректность ключа.');
            }
            const errorMsg = result.error || result.message || `Ошибка удаления заявки: ${response.status}`;
            throw new Error(errorMsg);
        }
    } catch (error) {
        console.error('Error deleting order:', error);
        showNotification(`Ошибка удаления заявки: ${error.message}`, 'danger');
        throw error;
    }
}

// Функция для пагинации данных
function paginateData(data, currentPage, itemsPerPage = 5) {
    if (!Array.isArray(data)) {
        console.error('paginateData: ожидался массив, получено:', typeof data);
        return {
            items: [],
            currentPage: 1,
            totalPages: 0,
            totalItems: 0
        };
    }
    
    const totalItems = data.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    
    return {
        items: data.slice(startIndex, endIndex),
        currentPage: Math.min(Math.max(1, currentPage), totalPages || 1),
        totalPages: totalPages || 1,
        totalItems
    };
}

// Функция для создания пагинации
function createPagination(totalPages, currentPage, containerId, callback) {
    const paginationContainer = document.getElementById(containerId);
    if (!paginationContainer) {
        console.error(`Контейнер пагинации ${containerId} не найден`);
        return;
    }
    
    paginationContainer.innerHTML = '';
    
    if (totalPages <= 1) return;
    
    const ul = document.createElement('ul');
    ul.className = 'pagination justify-content-center';
    
    // Кнопка "Назад"
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `<a class="page-link" href="#" data-page="${currentPage - 1}">Назад</a>`;
    ul.appendChild(prevLi);
    
    // Номера страниц
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    // Первая страница
    if (startPage > 1) {
        const li = document.createElement('li');
        li.className = 'page-item';
        li.innerHTML = `<a class="page-link" href="#" data-page="1">1</a>`;
        ul.appendChild(li);
        
        if (startPage > 2) {
            const dotsLi = document.createElement('li');
            dotsLi.className = 'page-item disabled';
            dotsLi.innerHTML = `<span class="page-link">...</span>`;
            ul.appendChild(dotsLi);
        }
    }
    
    // Основные страницы
    for (let i = startPage; i <= endPage; i++) {
        const li = document.createElement('li');
        li.className = `page-item ${i === currentPage ? 'active' : ''}`;
        li.innerHTML = `<a class="page-link" href="#" data-page="${i}">${i}</a>`;
        ul.appendChild(li);
    }
    
    // Последняя страница
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            const dotsLi = document.createElement('li');
            dotsLi.className = 'page-item disabled';
            dotsLi.innerHTML = `<span class="page-link">...</span>`;
            ul.appendChild(dotsLi);
        }
        
        const li = document.createElement('li');
        li.className = 'page-item';
        li.innerHTML = `<a class="page-link" href="#" data-page="${totalPages}">${totalPages}</a>`;
        ul.appendChild(li);
    }
    
    // Кнопка "Вперед"
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = `<a class="page-link" href="#" data-page="${currentPage + 1}">Вперед</a>`;
    ul.appendChild(nextLi);
    
    paginationContainer.appendChild(ul);
    
    // Добавляем обработчики событий
    paginationContainer.querySelectorAll('.page-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = parseInt(link.dataset.page);
            if (page && page !== currentPage && page >= 1 && page <= totalPages) {
                callback(page);
            }
        });
    });
}

// Проверка доступности CORS прокси
async function testCorsProxy() {
    if (!USE_CORS_PROXY) return true;
    
    try {
        const testUrl = buildApiUrl('courses');
        console.log('Тестирование CORS прокси...', testUrl);
        
        const response = await fetch(testUrl, {
            method: 'HEAD',
            mode: 'cors'
        });
        
        console.log('CORS прокси работает:', response.ok);
        return response.ok;
    } catch (error) {
        console.error('CORS прокси не работает:', error);
        
        // Показываем уведомление с альтернативами
        showNotification(`
            <strong>CORS прокси недоступен!</strong><br>
            Попробуйте:<br>
            1. Сменить прокси на другой<br>
            2. Использовать расширение CORS для браузера<br>
            3. Запустить через локальный сервер (python -m http.server)
        `, 'warning', 10000);
        
        return false;
    }
}

// Инициализация при загрузке страницы
async function initializeApi() {
    console.log('Инициализация API...');
    console.log('USE_CORS_PROXY:', USE_CORS_PROXY);
    console.log('CORS_PROXY_URL:', CORS_PROXY_URL);
    console.log('API_BASE_URL:', API_BASE_URL);
    
    // Тестируем подключение
    await testCorsProxy();
    
    // Проверяем настройки API ключа
    if (API_KEY === 'ВАШ_КЛЮЧ_API_ЗДЕСЬ') {
        showNotification(`
            <strong>Внимание!</strong><br>
            Не забудьте установить ваш API ключ в файле api.js<br>
            Найдите строку: <code>const API_KEY = 'ВАШ_КЛЮЧ_API_ЗДЕСЬ';</code>
        `, 'warning', 15000);
    }
}

// Запускаем инициализацию при загрузке
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApi);
} else {
    initializeApi();
}

// Экспортируем функции для использования в других файлах
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        API_BASE_URL,
        API_KEY,
        API_HEADERS,
        USE_CORS_PROXY,
        CORS_PROXY_URL,
        fetchCourses,
        fetchTutors,
        fetchOrders,
        createOrder,
        updateOrder,
        deleteOrder,
        paginateData,
        createPagination,
        showNotification,
        buildApiUrl,
        testCorsProxy,
        initializeApi
    };
}