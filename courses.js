// courses.js - Модуль для работы с курсами и репетиторами

// ВАШ КЛЮЧ API - ВСТАВЬТЕ СВОЙ КЛЮЧ ЗДЕСЬ
const API_KEY = '2b974891-4ca2-4132-9a60-d2cdb785f6bd';
const API_BASE_URL = 'http://exam-api-courses.std-900.ist.mospolytech.ru';

// Локальные данные курсов (используются если API недоступен)
const LOCAL_COURSES = [
    {
        id: 1,
        name: "Английский для начинающих",
        description: "Идеальный курс для тех, кто только начинает изучать английский язык. Основы грамматики, базовая лексика, постановка произношения.",
        teacher: "Анна Иванова",
        level: "Beginner",
        total_length: 12,
        week_length: 4,
        start_dates: [
            "2024-06-01T09:00:00", "2024-06-01T14:00:00", "2024-06-01T18:00:00",
            "2024-07-01T09:00:00", "2024-07-01T14:00:00", "2024-07-01T18:00:00",
            "2024-08-01T09:00:00", "2024-08-01T14:00:00", "2024-08-01T18:00:00"
        ],
        course_fee_per_hour: 250,
        created_at: "2024-01-15T10:30:00"
    },
    {
        id: 2,
        name: "Деловой английский",
        description: "Курс для профессионалов, желающих улучшить навыки делового общения, ведения переговоров, подготовки презентаций и деловой переписки на английском.",
        teacher: "Дмитрий Петров",
        level: "Intermediate",
        total_length: 16,
        week_length: 3,
        start_dates: [
            "2024-06-05T10:00:00", "2024-06-05T19:00:00",
            "2024-07-05T10:00:00", "2024-07-05T19:00:00",
            "2024-08-05T10:00:00", "2024-08-05T19:00:00"
        ],
        course_fee_per_hour: 350,
        created_at: "2024-02-10T14:20:00"
    },
    {
        id: 3,
        name: "Испанский язык с нуля",
        description: "Погружение в испанскую культуру и язык. Изучение основ грамматики, лексики и произношения. Особое внимание уделяется разговорной практике.",
        teacher: "Мария Гарсия",
        level: "Beginner",
        total_length: 10,
        week_length: 4,
        start_dates: [
            "2024-06-10T11:00:00", "2024-06-10T17:00:00",
            "2024-07-10T11:00:00", "2024-07-10T17:00:00",
            "2024-08-10T11:00:00", "2024-08-10T17:00:00"
        ],
        course_fee_per_hour: 280,
        created_at: "2024-01-20T11:45:00"
    },
    {
        id: 4,
        name: "Французский для путешествий",
        description: "Практический курс для туристов. Основные фразы для общения в отеле, ресторане, магазине. Изучение культурных особенностей Франции.",
        teacher: "Пьер Дюпон",
        level: "Beginner",
        total_length: 8,
        week_length: 2,
        start_dates: [
            "2024-06-15T12:00:00", "2024-06-15T20:00:00",
            "2024-07-15T12:00:00", "2024-07-15T20:00:00"
        ],
        course_fee_per_hour: 300,
        created_at: "2024-03-05T09:15:00"
    },
    {
        id: 5,
        name: "Немецкий для продвинутых",
        description: "Сложные грамматические конструкции, идиомы, профессиональная лексика. Подготовка к международным экзаменам Goethe-Zertifikat C1.",
        teacher: "Клаус Шмидт",
        level: "Advanced",
        total_length: 20,
        week_length: 5,
        start_dates: [
            "2024-06-03T18:00:00", "2024-07-03T18:00:00", "2024-08-03T18:00:00"
        ],
        course_fee_per_hour: 400,
        created_at: "2024-02-28T16:30:00"
    }
];

// Локальные данные репетиторов
const LOCAL_TUTORS = [
    {
        id: 1,
        name: "Анна Ковалева",
        work_experience: 8,
        languages_spoken: ["Русский", "Английский", "Французский"],
        languages_offered: ["Английский", "Французский"],
        language_level: "Advanced",
        price_per_hour: 1200
    },
    {
        id: 2,
        name: "Михаил Соколов",
        work_experience: 12,
        languages_spoken: ["Русский", "Английский", "Немецкий", "Испанский"],
        languages_offered: ["Английский", "Немецкий", "Испанский"],
        language_level: "Advanced",
        price_per_hour: 1500
    },
    {
        id: 3,
        name: "Елена Петрова",
        work_experience: 5,
        languages_spoken: ["Русский", "Китайский", "Английский"],
        languages_offered: ["Китайский", "Английский"],
        language_level: "Intermediate",
        price_per_hour: 1000
    },
    {
        id: 4,
        name: "Ольга Иванова",
        work_experience: 10,
        languages_spoken: ["Русский", "Итальянский", "Испанский"],
        languages_offered: ["Итальянский", "Испанский"],
        language_level: "Advanced",
        price_per_hour: 1300
    },
    {
        id: 5,
        name: "Дмитрий Новиков",
        work_experience: 6,
        languages_spoken: ["Русский", "Японский", "Английский"],
        languages_offered: ["Японский", "Английский"],
        language_level: "Intermediate",
        price_per_hour: 1100
    }
];

// Функция для загрузки курсов через API с использованием ключа
async function loadCoursesFromApi() {
    console.log('🔍 Попытка загрузки курсов из API...');
    
    // Проверяем ключ API
    if (API_KEY === 'ВАШ_РЕАЛЬНЫЙ_API_КЛЮЧ_ЗДЕСЬ') {
        console.error('❌ ОШИБКА: Не установлен API ключ!');
        console.error('Замените "ВАШ_РЕАЛЬНЫЙ_API_КЛЮЧ_ЗДЕСЬ" на ваш реальный ключ в файле courses.js');
        throw new Error('API ключ не установлен. Замените значение API_KEY в courses.js');
    }
    
    try {
        const API_URL = `${API_BASE_URL}/courses`;
        
        // Список CORS-прокси для обхода CORS ошибок
        const proxyConfigs = [
            {
                url: `https://api.allorigins.win/raw?url=${encodeURIComponent(API_URL)}`,
                name: 'allorigins',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${API_KEY}`
                }
            },
            {
                url: `https://corsproxy.io/?${encodeURIComponent(API_URL)}`,
                name: 'corsproxy.io',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${API_KEY}`
                }
            },
            {
                url: API_URL, // Прямой запрос (работает если нет CORS проблем)
                name: 'direct',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${API_KEY}`
                }
            },
            {
                url: `https://thingproxy.freeboard.io/fetch/${API_URL}`,
                name: 'thingproxy',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${API_KEY}`
                }
            }
        ];
        
        let coursesData = null;
        let successfulProxy = null;
        let lastError = null;
        
        console.log(`🔑 Используем API ключ: ${API_KEY.substring(0, 10)}...`);
        
        // Пробуем каждый прокси по очереди
        for (let proxy of proxyConfigs) {
            try {
                console.log(`🔄 Пробуем прокси: ${proxy.name}...`);
                
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 8000);
                
                const response = await fetch(proxy.url, {
                    method: 'GET',
                    headers: proxy.headers,
                    mode: 'cors',
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                console.log(`📊 Ответ от ${proxy.name}: ${response.status} ${response.statusText}`);
                
                if (response.ok) {
                    const data = await response.json();
                    
                    // Проверяем структуру ответа
                    if (Array.isArray(data)) {
                        coursesData = data;
                    } else if (data && Array.isArray(data.courses)) {
                        coursesData = data.courses;
                    } else if (data && data.data && Array.isArray(data.data)) {
                        coursesData = data.data;
                    } else {
                        console.warn(`⚠️ Неожиданный формат данных от ${proxy.name}:`, data);
                        continue;
                    }
                    
                    successfulProxy = proxy.name;
                    console.log(`✅ Успешно через ${proxy.name}! Загружено ${coursesData.length} курсов`);
                    break;
                } else {
                    if (response.status === 401) {
                        lastError = new Error(`Ошибка авторизации (401). Проверьте API ключ: ${API_KEY}`);
                    } else {
                        lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }
                }
                
            } catch (error) {
                lastError = error;
                console.log(`❌ Прокси ${proxy.name} не сработал:`, error.message);
                continue;
            }
        }
        
        if (!coursesData) {
            console.error('❌ Все прокси не сработали. Последняя ошибка:', lastError?.message);
            throw new Error(lastError?.message || 'Не удалось получить данные через прокси');
        }
        
        return coursesData;
        
    } catch (error) {
        console.error('❌ Критическая ошибка загрузки курсов:', error.message);
        throw error;
    }
}

// Функция для загрузки репетиторов через API
async function loadTutorsFromApi() {
    console.log('🔍 Попытка загрузки репетиторов из API...');
    
    // Проверяем ключ API
    if (API_KEY === 'ВАШ_РЕАЛЬНЫЙ_API_КЛЮЧ_ЗДЕСЬ') {
        console.error('❌ ОШИБКА: Не установлен API ключ!');
        throw new Error('API ключ не установлен');
    }
    
    try {
        const API_URL = `${API_BASE_URL}/tutors`;
        
        // Список CORS-прокси
        const proxyConfigs = [
            {
                url: `https://api.allorigins.win/raw?url=${encodeURIComponent(API_URL)}`,
                name: 'allorigins',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${API_KEY}`
                }
            },
            {
                url: `https://corsproxy.io/?${encodeURIComponent(API_URL)}`,
                name: 'corsproxy.io',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${API_KEY}`
                }
            },
            {
                url: API_URL,
                name: 'direct',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${API_KEY}`
                }
            }
        ];
        
        let tutorsData = null;
        let successfulProxy = null;
        
        // Пробуем каждый прокси
        for (let proxy of proxyConfigs) {
            try {
                console.log(`🔄 Пробуем прокси для репетиторов: ${proxy.name}...`);
                
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);
                
                const response = await fetch(proxy.url, {
                    method: 'GET',
                    headers: proxy.headers,
                    mode: 'cors',
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                if (response.ok) {
                    const data = await response.json();
                    
                    if (Array.isArray(data)) {
                        tutorsData = data;
                    } else if (data && Array.isArray(data.tutors)) {
                        tutorsData = data.tutors;
                    } else if (data && data.data && Array.isArray(data.data)) {
                        tutorsData = data.data;
                    }
                    
                    successfulProxy = proxy.name;
                    console.log(`✅ Репетиторы через ${proxy.name}! Загружено ${tutorsData.length} репетиторов`);
                    break;
                }
                
            } catch (error) {
                console.log(`❌ Прокси ${proxy.name} не сработал для репетиторов:`, error.message);
                continue;
            }
        }
        
        if (!tutorsData) {
            console.error('❌ Не удалось загрузить репетиторов через API');
            throw new Error('Не удалось получить данные репетиторов');
        }
        
        return tutorsData;
        
    } catch (error) {
        console.error('❌ Критическая ошибка загрузки репетиторов:', error.message);
        throw error;
    }
}

// Функция для загрузки всех данных
async function loadAllData() {
    console.log('🚀 Начинаем загрузку всех данных...');
    
    // Проверяем ключ
    if (API_KEY === 'ВАШ_РЕАЛЬНЫЙ_API_КЛЮЧ_ЗДЕСЬ') {
        console.warn('⚠️ API ключ не установлен, используем локальные данные');
        return {
            success: false,
            courses: LOCAL_COURSES,
            tutors: LOCAL_TUTORS,
            source: 'local',
            message: 'API ключ не установлен'
        };
    }
    
    try {
        // Пробуем загрузить из API
        console.log('🔄 Загружаем данные из API...');
        const [courses, tutors] = await Promise.allSettled([
            loadCoursesFromApi(),
            loadTutorsFromApi()
        ]);
        
        let apiCourses = [];
        let apiTutors = [];
        let apiErrors = [];
        
        // Обрабатываем результаты курсов
        if (courses.status === 'fulfilled' && courses.value) {
            apiCourses = courses.value;
            console.log(`✅ Курсы из API: ${apiCourses.length} шт.`);
        } else {
            console.error('❌ Ошибка загрузки курсов:', courses.reason);
            apiErrors.push('Курсы: ' + (courses.reason?.message || 'Ошибка загрузки'));
        }
        
        // Обрабатываем результаты репетиторов
        if (tutors.status === 'fulfilled' && tutors.value) {
            apiTutors = tutors.value;
            console.log(`✅ Репетиторы из API: ${apiTutors.length} шт.`);
        } else {
            console.error('❌ Ошибка загрузки репетиторов:', tutors.reason);
            apiErrors.push('Репетиторы: ' + (tutors.reason?.message || 'Ошибка загрузки'));
        }
        
        // Если что-то загрузилось из API, используем это
        if (apiCourses.length > 0 || apiTutors.length > 0) {
            // Если одна из загрузок не удалась, используем локальные данные для неё
            const finalCourses = apiCourses.length > 0 ? apiCourses : LOCAL_COURSES;
            const finalTutors = apiTutors.length > 0 ? apiTutors : LOCAL_TUTORS;
            
            return {
                success: true,
                courses: finalCourses,
                tutors: finalTutors,
                source: 'api',
                message: apiErrors.length > 0 ? 'Частичный успех: ' + apiErrors.join('; ') : 'Данные успешно загружены'
            };
        } else {
            // Если ничего не загрузилось из API, используем локальные данные
            console.warn('⚠️ Не удалось загрузить данные из API, используем локальные');
            return {
                success: false,
                courses: LOCAL_COURSES,
                tutors: LOCAL_TUTORS,
                source: 'local',
                message: 'API недоступен, используются локальные данные'
            };
        }
        
    } catch (error) {
        console.error('❌ Непредвиденная ошибка при загрузке данных:', error);
        
        // Всегда возвращаем локальные данные как fallback
        return {
            success: false,
            courses: LOCAL_COURSES,
            tutors: LOCAL_TUTORS,
            source: 'local',
            message: 'Ошибка: ' + error.message
        };
    }
}

// Функция для загрузки заказов через API
async function loadOrdersFromApi(studentId = 1) {
    if (API_KEY === 'ВАШ_РЕАЛЬНЫЙ_API_КЛЮЧ_ЗДЕСЬ') {
        console.warn('API ключ не установлен, заказы не будут загружены');
        return [];
    }
    
    try {
        const API_URL = `${API_BASE_URL}/orders`;
        
        // Пробуем через allorigins прокси
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(API_URL)}`;
        
        const response = await fetch(proxyUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            let orders = [];
            
            if (Array.isArray(data)) {
                orders = data;
            } else if (data && Array.isArray(data.orders)) {
                orders = data.orders;
            } else if (data && data.data && Array.isArray(data.data)) {
                orders = data.data;
            }
            
            // Фильтруем заказы по studentId
            return orders.filter(order => order.student_id == studentId);
        }
        
        return [];
        
    } catch (error) {
        console.error('Ошибка загрузки заказов:', error);
        return [];
    }
}

// Экспорт для использования в других файлах
if (typeof window !== 'undefined') {
    window.LOCAL_COURSES = LOCAL_COURSES;
    window.LOCAL_TUTORS = LOCAL_TUTORS;
    window.loadAllData = loadAllData;
    window.loadOrdersFromApi = loadOrdersFromApi;
    
    console.log('📦 courses.js загружен и готов к работе');
    console.log('🔑 API ключ:', API_KEY === 'ВАШ_РЕАЛЬНЫЙ_API_КЛЮЧ_ЗДЕСЬ' ? 'НЕ УСТАНОВЛЕН!' : 'установлен');
}