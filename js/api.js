// Ваш API endpoint
const API_BASE_URL = 'https://svitlo-ye-api.granit-ai-store.workers.dev';

// Отримати інформацію про будинок
async function getBuildingInfo(street, houseNumber) {
    try {
        // Показуємо завантаження
        showLoading(true);
        
        console.log(`Запит API для: ${street}, ${houseNumber}`);
        
        const response = await fetch(
            `${API_BASE_URL}?city=Баранівка&street=${encodeURIComponent(street)}&house=${houseNumber}`
        );
        
        if (!response.ok) {
            throw new Error(`Помилка API: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Отримані дані з API:', data);
        
        // Перетворюємо статус у читабельний формат
        const statusMap = {
            'POWER_ON': 'Світло є',
            'NO_POWER': 'Немає світла',
            'UNKNOWN': 'Невідомо'
        };
        
        return {
            success: true,
            data: {
                street: data.street || street,
                house: data.house || houseNumber,
                queue: data.queue || '1',
                currentStatus: statusMap[data.currentStatus] || 'Невідомо',
                nowInterval: data.nowInterval || 'Немає даних',
                nextInterval: data.nextInterval || 'Немає даних',
                schedule: data.schedule ? 'Графік доступний' : 'Графік не доступний',
                rawStatus: data.currentStatus || 'UNKNOWN'
            }
        };
        
    } catch (error) {
        console.error('Помилка при запиті до API:', error);
        return {
            success: false,
            error: error.message,
            data: {
                street: street,
                house: houseNumber,
                queue: '1',
                currentStatus: 'Невідомо',
                nowInterval: '00:00-04:00',
                nextInterval: '12:00-16:00',
                schedule: 'Графік для черги 1',
                rawStatus: 'UNKNOWN'
            }
        };
    } finally {
        showLoading(false);
    }
}

// Показати інформацію про будинок
async function showBuildingInfo(street, houseNumber, feature) {
    const result = await getBuildingInfo(street, houseNumber);
    const info = result.data;
    
    // Оновлюємо панель інформації
    const infoContent = document.querySelector('.info-content');
    infoContent.innerHTML = `
        <div class="info-item">
            <strong><i class="fas fa-road"></i> Вулиця</strong>
            ${info.street}
        </div>
        <div class="info-item">
            <strong><i class="fas fa-home"></i> Номер будинку</strong>
            ${info.house}
        </div>
        <div class="info-item">
            <strong><i class="fas fa-list-ol"></i> Черга відключення</strong>
            <span class="highlight">${info.queue}</span>
        </div>
        <div class="info-item">
            <strong><i class="fas fa-bolt"></i> Поточний статус</strong>
            <span class="status-indicator" style="background: ${getStatusColor(info.rawStatus)}">
                ${info.currentStatus}
            </span>
        </div>
        <div class="info-item">
            <strong><i class="fas fa-clock"></i> Поточний інтервал</strong>
            ${info.nowInterval}
        </div>
        <div class="info-item">
            <strong><i class="fas fa-forward"></i> Наступний інтервал</strong>
            ${info.nextInterval}
        </div>
        <div class="info-item">
            <strong><i class="fas fa-calendar-alt"></i> Графік черги</strong>
            <small>00:00-04:00, 12:00-16:00</small>
        </div>
        <div class="info-item">
            <strong><i class="fas fa-info-circle"></i> Постачальник</strong>
            Житомиробленерго / YASNO
        </div>
    `;
    
    // Оновлюємо статус будинку на карті
    if (feature && info.rawStatus) {
        feature.properties.status = info.rawStatus;
        
        // Знаходимо відповідний шар і оновлюємо його стиль
        buildingsLayer.eachLayer(function(layer) {
            if (layer.feature === feature) {
                layer.setStyle({
                    fillColor: getStatusColor(info.rawStatus)
                });
            }
        });
    }
}

// Допоміжні функції для статусів
function getStatusColor(status) {
    switch(status) {
        case 'POWER_ON': return '#4CAF50';
        case 'NO_POWER': return '#F44336';
        case 'UNKNOWN': return '#FFC107';
        default: return '#9E9E9E';
    }
}

// Показати/приховати завантаження
function showLoading(show) {
    const loadingEl = document.getElementById('loading');
    if (loadingEl) {
        loadingEl.style.display = show ? 'flex' : 'none';
    }
}

// Закрити панель інформації
document.addEventListener('DOMContentLoaded', function() {
    const closeBtn = document.getElementById('closeBtn');
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            const infoContent = document.querySelector('.info-content');
            if (infoContent) {
                infoContent.innerHTML = '<p>Оберіть будинок на карті</p>';
            }
            
            // Скидаємо виділення будинків
            if (buildingsLayer) {
                buildingsLayer.eachLayer(function(layer) {
                    layer.setStyle({
                        weight: 1,
                        color: 'white',
                        fillOpacity: 0.7
                    });
                });
            }
        });
    }
});
