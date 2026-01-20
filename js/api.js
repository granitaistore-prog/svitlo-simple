// Ваш API endpoint
const API_BASE_URL = 'https://svitlo-ye-api.granit-ai-store.workers.dev';

// Отримати інформацію про вулицю
async function getStreetInfo(streetName) {
    try {
        // Показуємо завантаження
        showLoading(true);
        
        console.log(`Запит API для вулиці: ${streetName}`);
        
        // Для тесту використовуємо прикладну адресу (будь-який номер будинку)
        const response = await fetch(
            `${API_BASE_URL}?city=Баранівка&street=${encodeURIComponent(streetName)}&house=1`
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
            'UNKNOWN': 'За графіком'
        };
        
        return {
            success: true,
            data: {
                street: data.street || streetName,
                city: data.city || 'Баранівка',
                queue: data.queue || '1',
                currentStatus: statusMap[data.currentStatus] || 'Невідомо',
                nowInterval: data.nowInterval || 'Немає даних',
                nextInterval: data.nextInterval || 'Немає даних',
                schedule: data.schedule ? 'Графік доступний' : 'Графік не доступний',
                rawStatus: data.currentStatus || 'UNKNOWN',
                provider: data.provider || 'Житомиробленерго / YASNO'
            }
        };
        
    } catch (error) {
        console.error('Помилка при запиті до API:', error);
        return {
            success: false,
            error: error.message,
            data: {
                street: streetName,
                city: 'Баранівка',
                queue: '1',
                currentStatus: 'Невідомо',
                nowInterval: '00:00-04:00',
                nextInterval: '12:00-16:00',
                schedule: 'Графік для черги 1',
                rawStatus: 'UNKNOWN',
                provider: 'Житомиробленерго / YASNO'
            }
        };
    } finally {
        showLoading(false);
    }
}

// Показати інформацію про вулицю
async function showStreetInfo(feature) {
    const streetName = feature.properties.name;
    if (!streetName) return;
    
    const result = await getStreetInfo(streetName);
    const info = result.data;
    
    // Оновлюємо панель інформації
    const infoContent = document.querySelector('.info-content');
    infoContent.innerHTML = `
        <div class="street-name">
            <i class="fas fa-road"></i> ${info.street}
        </div>
        
        <div class="info-item">
            <strong><i class="fas fa-city"></i> Місто</strong>
            <div class="value">${info.city}</div>
        </div>
        
        <div class="info-item">
            <strong><i class="fas fa-list-ol"></i> Черга відключення</strong>
            <div class="value">${info.queue}</div>
        </div>
        
        <div class="info-item">
            <strong><i class="fas fa-bolt"></i> Поточний статус</strong>
            <div class="status-indicator ${
                info.rawStatus === 'POWER_ON' ? 'status-on' :
                info.rawStatus === 'NO_POWER' ? 'status-off' :
                info.rawStatus === 'UNKNOWN' ? 'status-unknown' : 'status-scheduled'
            }">
                ${info.currentStatus}
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
            <div class="value">
                <small>00:00-04:00, 12:00-16:00</small>
            </div>
        </div>
    `;
    
    // Оновлюємо статус вулиці на карті
    if (info.rawStatus) {
        feature.properties.status = info.rawStatus;
        
        // Знаходимо відповідний шар і оновлюємо його стиль
        streetsLayer.eachLayer(function(layer) {
            if (layer.feature === feature) {
                layer.setStyle(getStreetStyle(info.rawStatus));
            }
        });
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
                infoContent.innerHTML = '<p class="placeholder">Оберіть вулицю на карті</p>';
            }
            
            // Скидаємо виділення вулиць
            if (streetsLayer) {
                streetsLayer.eachLayer(function(layer) {
                    layer.isSelected = false;
                    const status = layer.feature.properties.status || 'unknown';
                    layer.setStyle(getStreetStyle(status));
                });
            }
        });
    }
});
