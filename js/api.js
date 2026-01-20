const API_BASE_URL = 'https://svitlo-ye-api.granit-ai-store.workers.dev';

// Отримати інформацію про будинок
async function getBuildingInfo(street, houseNumber) {
    try {
        // Показуємо завантаження
        showLoading(true);
        
        const response = await fetch(
            `${API_BASE_URL}?city=Баранівка&street=${encodeURIComponent(street)}&house=${houseNumber}`
        );
        
        if (!response.ok) {
            throw new Error(`Помилка API: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Повертаємо стандартизований об'єкт
        return {
            success: true,
            data: {
                street: street,
                house: houseNumber,
                queue: data.queue || 'Невідомо',
                currentStatus: data.currentStatus || 'Невідомо',
                nowInterval: data.nowInterval || 'Немає даних',
                nextInterval: data.nextInterval || 'Немає даних',
                schedule: data.schedule || 'Графік не доступний'
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
                queue: 'Помилка',
                currentStatus: 'Немає даних',
                nowInterval: 'Немає даних',
                nextInterval: 'Немає даних',
                schedule: 'Не вдалося завантажити дані'
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
    
    // Оновлюємо інформацію на панелі
    document.getElementById('infoPanel').querySelector('.info-content').innerHTML = `
        <div class="info-item">
            <strong><i class="fas fa-road"></i> Вулиця</strong>
            ${info.street}
        </div>
        <div class="info-item">
            <strong><i class="fas fa-home"></i> Номер будинку</strong>
            ${info.house}
        </div>
        <div class="info-item">
            <strong><i class="fas fa-list-ol"></i> Черга</strong>
            ${info.queue}
        </div>
        <div class="info-item">
            <strong><i class="fas fa-bolt"></i> Статус</strong>
            <span class="status-indicator" style="background: ${getStatusColorByStatus(info.currentStatus)}">
                ${getStatusText(info.currentStatus)}
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
            <strong><i class="fas fa-calendar-alt"></i> Графік</strong>
            ${info.schedule}
        </div>
    `;
    
    // Оновлюємо статус будинку на карті
    if (feature) {
        feature.properties.status = getStatusKey(info.currentStatus);
        buildingsLayer.resetStyle();
    }
}

// Допоміжні функції для статусів
function getStatusKey(statusText) {
    if (statusText.includes('є')) return 'has_power';
    if (statusText.includes('графік')) return 'scheduled';
    if (statusText.includes('немає')) return 'no_power';
    return 'unknown';
}

function getStatusColorByStatus(statusText) {
    const key = getStatusKey(statusText);
    return getStatusColor(key);
}

function getStatusText(statusText) {
    if (statusText.includes('є')) return 'Світло є';
    if (statusText.includes('графік')) return 'За графіком';
    if (statusText.includes('немає')) return 'Немає світла';
    return statusText;
}

// Показати/приховати завантаження
function showLoading(show) {
    const loadingEl = document.getElementById('loading');
    loadingEl.style.display = show ? 'flex' : 'none';
}

// Закрити панель інформації
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('closeBtn').addEventListener('click', function() {
        document.getElementById('infoPanel').querySelector('.info-content').innerHTML = 
            '<p>Оберіть будинок на карті</p>';
        
        // Скидаємо виділення будинків
        if (buildingsLayer) {
            buildingsLayer.resetStyle();
        }
    });
});
