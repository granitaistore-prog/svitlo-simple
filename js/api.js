// API модуль для отримання інформації про вулиці

// Ваш API endpoint
const API_BASE_URL = 'https://svitlo-ye-api.granit-ai-store.workers.dev';

// Обробник для отримання інформації про вулицю
async function getStreetInfo(streetName) {
    try {
        // Показуємо завантаження
        showLoading(true);
        
        console.log(`Запит API для вулиці: ${streetName}`);
        
        // Для вулиць використовуємо будь-який номер будинку (наприклад, 1)
        const response = await fetch(
            `${API_BASE_URL}?city=Баранівка&street=${encodeURIComponent(streetName)}&house=1`
        );
        
        if (!response.ok) {
            throw new Error(`Помилка API: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Отримані дані з API:', data);
        
        // Перетворюємо статус у читабельний формат
        const statusMap = {
            'POWER_ON': 'Світло є',
            'NO_POWER': 'Немає світла',
            'UNKNOWN': 'За графіком'
        };
        
        // Отримуємо графік для черги
        const scheduleText = getScheduleForQueue(data.queue);
        
        return {
            success: true,
            data: {
                street: data.street || streetName,
                city: data.city || 'Баранівка',
                queue: data.queue || '1',
                currentStatus: statusMap[data.currentStatus] || 'Невідомо',
                nowInterval: formatInterval(data.nowInterval),
                nextInterval: formatInterval(data.nextInterval),
                schedule: scheduleText,
                rawStatus: data.currentStatus || 'UNKNOWN',
                provider: data.provider || 'Житомиробленерго / YASNO',
                regionISO: data.regionISO || 'UA-18'
            }
        };
        
    } catch (error) {
        console.error('Помилка при запиті до API:', error);
        
        // Повертаємо тестові дані для демонстрації
        return {
            success: false,
            error: error.message,
            data: getMockStreetData(streetName)
        };
    } finally {
        showLoading(false);
    }
}

// Отримати графік для черги
function getScheduleForQueue(queueNumber) {
    const schedules = {
        1: ["00:00-04:00", "12:00-16:00"],
        2: ["04:00-08:00", "16:00-20:00"],
        3: ["08:00-12:00", "20:00-24:00"],
        4: ["02:00-06:00", "14:00-18:00"],
        5: ["06:00-10:00", "18:00-22:00"],
        6: ["10:00-14:00", "22:00-02:00"]
    };
    
    const queue = queueNumber || 1;
    const intervals = schedules[queue] || schedules[1];
    return intervals.join(', ');
}

// Форматувати інтервал часу
function formatInterval(interval) {
    if (!interval) return 'Немає даних';
    return interval;
}

// Тестові дані для демонстрації
function getMockStreetData(streetName) {
    // Симулюємо різні статуси для демонстрації
    const mockStatuses = ['POWER_ON', 'NO_POWER', 'UNKNOWN'];
    const randomStatus = mockStatuses[Math.floor(Math.random() * mockStatuses.length)];
    
    const statusMap = {
        'POWER_ON': 'Світло є',
        'NO_POWER': 'Немає світла',
        'UNKNOWN': 'За графіком'
    };
    
    return {
        street: streetName,
        city: 'Баранівка',
        queue: '1',
        currentStatus: statusMap[randomStatus],
        nowInterval: '00:00-04:00',
        nextInterval: '12:00-16:00',
        schedule: '00:00-04:00, 12:00-16:00',
        rawStatus: randomStatus,
        provider: 'Житомиробленерго / YASНО',
        regionISO: 'UA-18'
    };
}

// Показати інформацію про вулицю
async function showStreetInfo(feature) {
    if (!feature || !feature.properties) {
        console.error('Немає даних про вулицю');
        return;
    }
    
    // Отримуємо назву вулиці для запиту
    let streetNameForApi = feature.properties.originalName || feature.properties.name;
    
    if (!streetNameForApi) {
        console.error('Немає назви вулиці');
        return;
    }
    
    // Очищуємо назву від мовних тегів
    streetNameForApi = cleanStreetName(streetNameForApi);
    
    const result = await getStreetInfo(streetNameForApi);
    const info = result.data;
    
    // Використовуємо відформатовану назву для відображення
    const displayName = feature.properties.displayName || info.street;
    
    // Оновлюємо панель інформації
    updateInfoPanel(displayName, info, result.success);
    
    // Оновлюємо статус вулиці на карті
    updateStreetStatusOnMap(feature, info.rawStatus);
}

// Очистити назву вулиці від мовних тегів
function cleanStreetName(name) {
    if (!name) return 'Невідома вулиця';
    
    // Розділяємо за крапкою з комою (для мультимовних назв)
    const parts = name.split(';').map(part => part.trim());
    
    // Беремо першу частину
    let cleanedName = parts[0] || name;
    
    // Видаляємо мовні префікси
    const prefixes = [
        'вулиця ',
        'ulica ',
        'Street ',
        'strasse ',
        'name:ru:',
        'name:uk:',
        'name:pl:',
        'name:en:'
    ];
    
    prefixes.forEach(prefix => {
        if (cleanedName.includes(prefix)) {
            cleanedName = cleanedName.replace(prefix, '').trim();
        }
    });
    
    return cleanedName || name;
}

// Оновити панель інформації
function updateInfoPanel(streetName, info, isSuccess) {
    const infoContent = document.querySelector('.info-content');
    if (!infoContent) return;
    
    const statusClass = {
        'POWER_ON': 'status-on',
        'NO_POWER': 'status-off',
        'UNKNOWN': 'status-unknown'
    }[info.rawStatus] || 'status-scheduled';
    
    const statusText = {
        'POWER_ON': 'Світло є',
        'NO_POWER': 'Немає світла',
        'UNKNOWN': 'За графіком'
    }[info.rawStatus] || info.currentStatus;
    
    infoContent.innerHTML = `
        <div class="street-name">
            <i class="fas fa-road"></i> ${streetName}
        </div>
        
        ${!isSuccess ? `
        <div class="warning-message">
            <i class="fas fa-exclamation-circle"></i>
            Використовуються демонстраційні дані
        </div>
        ` : ''}
        
        <div class="info-item">
            <strong><i class="fas fa-city"></i> Місто</strong>
            <div class="value">${info.city}</div>
        </div>
        
        <div class="info-item">
            <strong><i class="fas fa-list-ol"></i> Черга відключення</strong>
            <div class="value highlight">${info.queue}</div>
        </div>
        
        <div class="info-item">
            <strong><i class="fas fa-bolt"></i> Поточний статус</strong>
            <div class="status-indicator ${statusClass}">
                ${statusText}
            </div>
        </div>
        
        <div class="info-item">
            <strong><i class="fas fa-clock"></i> Поточний інтервал</strong>
            <div class="value">${info.nowInterval}</div>
        </div>
        
        <div class="info-item">
            <strong><i class="fas fa-forward"></i> Наступний інтервал</strong>
            <div class="value">${info.nextInterval}</div>
        </div>
        
        <div class="info-item">
            <strong><i class="fas fa-building"></i> Постачальник</strong>
            <div class="value">${info.provider}</div>
        </div>
        
        <div class="info-item">
            <strong><i class="fas fa-calendar-alt"></i> Графік черги ${info.queue}</strong>
            <div class="value schedule">
                ${info.schedule.split(', ').map(int => `<div>${int}</div>`).join('')}
            </div>
        </div>
        
        <div class="info-note">
            <i class="fas fa-info-circle"></i> 
            Для Баранівки діє єдина черга відключень №1 (00:00-04:00, 12:00-16:00)
        </div>
    `;
}

// Оновити статус вулиці на карті
function updateStreetStatusOnMap(feature, status) {
    // Отримуємо шар вулиць з глобальної змінної
    const streetsLayer = window.streetsLayer;
    
    if (!streetsLayer || !status) return;
    
    // Оновлюємо властивість вулиці
    feature.properties.status = status;
    
    // Знаходимо відповідний шар і оновлюємо його стиль
    streetsLayer.eachLayer(function(layer) {
        if (layer.feature === feature) {
            // Отримуємо функцію стилю з глобальної змінної
            const getStreetStyle = window.getStreetStyle;
            if (getStreetStyle) {
                layer.setStyle(getStreetStyle(feature));
            }
            
            // Якщо вулиця виділена, додаємо особливий стиль
            if (layer.isSelected) {
                layer.setStyle({
                    weight: 7,
                    opacity: 1,
                    color: '#1a237e',
                    dashArray: null
                });
            }
        }
    });
}

// Показати/приховати завантаження
function showLoading(show) {
    const loadingEl = document.getElementById('loading');
    if (loadingEl) {
        loadingEl.style.display = show ? 'flex' : 'none';
    }
}

// Закрити панель інформації
function initCloseButton() {
    const closeBtn = document.getElementById('closeBtn');
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            const infoContent = document.querySelector('.info-content');
            if (infoContent) {
                infoContent.innerHTML = '<p class="placeholder">Оберіть вулицю на карті</p>';
            }
            
            // Скидаємо виділення вулиць
            const streetsLayer = window.streetsLayer;
            const getStreetStyle = window.getStreetStyle;
            
            if (streetsLayer && getStreetStyle) {
                streetsLayer.eachLayer(function(layer) {
                    layer.isSelected = false;
                    const status = layer.feature?.properties?.status || 'UNKNOWN';
                    layer.setStyle(getStreetStyle(layer.feature));
                });
            }
        });
    }
}

// Ініціалізація API модуля
function initApi() {
    console.log('API модуль ініціалізовано');
    initCloseButton();
    
    // Отримуємо посилання на функції з map.js
    console.log('Перевірка глобальних змінних:');
    console.log('window.streetsLayer:', window.streetsLayer);
    console.log('window.getStreetStyle:', window.getStreetStyle);
}

// Експортуємо функції для використання в map.js
if (typeof window !== 'undefined') {
    window.showStreetInfo = showStreetInfo;
    window.showLoading = showLoading;
    window.updateStreetStatusOnMap = updateStreetStatusOnMap;
}

// Ініціалізація після завантаження DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApi);
} else {
    initApi();
}
