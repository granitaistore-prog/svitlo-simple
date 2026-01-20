// Дані про черги та графіки відключень
const QUEUE_DATA = {
    // Базова інформація про обмеження
    restrictions: {
        "20.01.2026": [
            { time: "00:00-06:00", queues: 3.0 },
            { time: "06:00-08:00", queues: 3.5 },
            { time: "08:00-10:00", queues: 4.0 },
            { time: "10:00-18:00", queues: 4.5 },
            { time: "18:00-20:00", queues: 4.0 },
            { time: "20:00-22:00", queues: 3.5 },
            { time: "22:00-24:00", queues: 3.0 }
        ]
    },
    
    // Усі вулиці Баранівки належать до черги 1
    allStreetsQueue: 1,
    
    // Графік відключень на сьогодні
    schedule: {
        date: "20.01.2026",
        updated: "17:30 20.01.2026",
        // Черга 1 не відключається сьогодні
        queue1: {
            status: "active", // "active" - світло є, "inactive" - відключення
            periods: [] // порожній масив = без відключень
        }
    }
};

// Отримати інформацію про вулицю
function getStreetQueueInfo(streetName) {
    return {
        street: streetName,
        queue: QUEUE_DATA.allStreetsQueue,
        subqueue: "1.1", // Підчерга для побутових споживачів
        consumerType: "побутові споживачі",
        schedule: QUEUE_DATA.schedule,
        restrictions: QUEUE_DATA.restrictions
    };
}

// Оновити API функцію
async function getEnhancedStreetInfo(streetName) {
    try {
        // Викликаємо оригінальне API
        const apiResult = await getStreetInfo(streetName);
        
        // Додаємо дані про черги
        const queueInfo = getStreetQueueInfo(streetName);
        
        return {
            ...apiResult,
            queueData: queueInfo,
            enhanced: true
        };
        
    } catch (error) {
        console.error('Помилка отримання розширених даних:', error);
        
        // Повертаємо тільки дані про черги як запасний варіант
        return {
            success: true,
            data: {
                street: streetName,
                queue: QUEUE_DATA.allStreetsQueue,
                currentStatus: "За графіком",
                schedule: "00:00-04:00, 12:00-16:00",
                queueInfo: getStreetQueueInfo(streetName)
            }
        };
    }
}

// Функція для оновлення панелі з розширеною інформацією
function updateInfoPanelWithQueueData(streetName, info, isSuccess, queueInfo) {
    const infoContent = document.querySelector('.info-content');
    if (!infoContent) return;
    
    const statusClass = info.rawStatus === 'POWER_ON' ? 'status-on' : 
                       info.rawStatus === 'NO_POWER' ? 'status-off' : 'status-unknown';
    
    const statusText = info.currentStatus || 'За графіком';
    
    // Формуємо HTML з розширеною інформацією
    infoContent.innerHTML = `
        <div class="street-name">
            <i class="fas fa-road"></i> ${streetName}
        </div>
        
        <!-- Блок статусу -->
        <div class="info-item">
            <strong><i class="fas fa-bolt"></i> Поточний статус</strong>
            <div class="status-indicator ${statusClass}">
                ${statusText}
            </div>
        </div>
        
        <!-- Блок черги -->
        <div class="info-item">
            <strong><i class="fas fa-list-ol"></i> Черга відключення</strong>
            <div class="value highlight">${queueInfo.queue}</div>
            <small>Підчерга: ${queueInfo.subqueue} (${queueInfo.consumerType})</small>
        </div>
        
        <!-- Статус на сьогодні -->
        <div class="info-item">
            <strong><i class="fas fa-calendar-day"></i> Статус на ${queueInfo.schedule.date}</strong>
            <div class="status-indicator status-on">
                ${queueInfo.schedule.queue1.status === 'active' ? 'Без планових відключень' : 'За графіком відключень'}
            </div>
            <small>Оновлено: ${queueInfo.schedule.updated}</small>
        </div>
        
        <!-- Графік обмежень -->
        <div class="info-item">
            <strong><i class="fas fa-exclamation-triangle"></i> Рівень обмежень на сьогодні</strong>
            <div class="restrictions-timeline">
                ${queueInfo.restrictions["20.01.2026"].map(item => `
                    <div class="time-slot">
                        <span class="time">${item.time}</span>
                        <span class="queues">${item.queues} черги</span>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <!-- Початкова інформація (залишаємо оригінальну) -->
        <div class="info-item">
            <strong><i class="fas fa-clock"></i> Стандартний графік черги</strong>
            <div class="value schedule">
                ${info.schedule ? info.schedule.split(', ').map(int => `<div>${int}</div>`).join('') : 'Немає даних'}
            </div>
        </div>
        
        <!-- Додаткова інформація -->
        <div class="info-note">
            <i class="fas fa-info-circle"></i> 
            Всі вулиці Баранівки належать до Черги №1. Рівні обмежень (3.0, 4.0 тощо) вказують на навантаження в енергосистемі.
        </div>
    `;
}

// Додати стилі для таймлайну
const style = document.createElement('style');
style.textContent = `
    .restrictions-timeline {
        display: flex;
        flex-direction: column;
        gap: 5px;
        margin-top: 10px;
    }
    
    .time-slot {
        display: flex;
        justify-content: space-between;
        padding: 8px 12px;
        background: #f8f9fa;
        border-radius: 6px;
        border-left: 4px solid #667eea;
    }
    
    .time-slot .time {
        font-weight: bold;
        color: #1a237e;
    }
    
    .time-slot .queues {
        color: #d32f2f;
        font-weight: bold;
    }
`;

document.head.appendChild(style);

// Експорт функцій
if (typeof window !== 'undefined') {
    window.getEnhancedStreetInfo = getEnhancedStreetInfo;
    window.updateInfoPanelWithQueueData = updateInfoPanelWithQueueData;
    window.QUEUE_DATA = QUEUE_DATA;
}
