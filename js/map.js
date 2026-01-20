// Глобальні змінні
let map;
let streetsLayer = null;

// Стиль для вулиці за статусом
function getStreetStyle(feature) {
    const status = feature?.properties?.status || 'UNKNOWN';
    
    const styles = {
        'POWER_ON': {
            color: '#4CAF50',
            weight: 4,
            opacity: 0.8,
            dashArray: null
        },
        'NO_POWER': {
            color: '#F44336',
            weight: 5,
            opacity: 0.9,
            dashArray: null
        },
        'UNKNOWN': {
            color: '#FFC107',
            weight: 4,
            opacity: 0.7,
            dashArray: '5, 5'
        }
    };
    
    return styles[status] || {
        color: '#9E9E9E',
        weight: 3,
        opacity: 0.6,
        dashArray: '3, 3'
    };
}

// Ініціалізація карти
function initMap() {
    console.log('Ініціалізація карти...');
    
    try {
        // Перевірка чи існує контейнер для карти
        const mapContainer = document.getElementById('map');
        if (!mapContainer) {
            throw new Error('Контейнер карти не знайдено!');
        }
        
        // Центр Баранівки
        const baranivkaCenter = [50.297, 27.662];
        
        // Ініціалізація карти
        map = L.map('map').setView(baranivkaCenter, 14);
        
        // Додаємо тайли OpenStreetMap
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            maxZoom: 19
        }).addTo(map);
        
        // Додаємо контроль масштабу
        L.control.scale().addTo(map);
        
        console.log('Карта успішно ініціалізована');
        
        // Створюємо шар для вулиць
        streetsLayer = L.geoJSON(null, {
            style: getStreetStyle,
            onEachFeature: onEachStreetFeature
        }).addTo(map);
        
        console.log('Шар для вулиць створено');
        
        // Робимо глобально доступним для інших файлів
        window.streetsLayer = streetsLayer;
        window.getStreetStyle = getStreetStyle;
        
        // Завантажуємо вулиці
        setTimeout(function() {
            if (typeof loadStreetsData === 'function') {
                loadStreetsData();
            } else {
                console.error('Функція loadStreetsData не знайдена!');
                showErrorMessage('Помилка завантаження даних вулиць');
            }
        }, 500);
        
    } catch (error) {
        console.error('Помилка ініціалізації карти:', error);
        showErrorMessage('Помилка завантаження карти: ' + error.message);
    }
}

// Показати повідомлення про помилку
function showErrorMessage(message) {
    const infoContent = document.querySelector('.info-content');
    if (infoContent) {
        infoContent.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <h4>Помилка</h4>
                <p>${message}</p>
                <p>Будь ласка, перезавантажте сторінку</p>
            </div>
        `;
    }
    
    // Приховуємо індикатор завантаження
    const loadingEl = document.getElementById('loading');
    if (loadingEl) {
        loadingEl.style.display = 'none';
    }
}

// Обробка кліку на вулицю
function onEachStreetFeature(feature, layer) {
    if (!feature.properties) return;
    
    // Форматуємо назву вулиці
    const streetName = formatStreetName(feature.properties.name) || 'Невідома вулиця';
    feature.properties.displayName = streetName;
    
    layer.on({
        mouseover: function(e) {
            this.setStyle({
                weight: 6,
                opacity: 1
            });
            
            layer.bindTooltip(`<b>${streetName}</b>`, {
                direction: 'top',
                className: 'street-tooltip',
                permanent: false,
                sticky: true
            }).openTooltip();
        },
        mouseout: function(e) {
            if (!layer.isSelected) {
                const status = feature.properties.status || 'UNKNOWN';
                this.setStyle(getStreetStyle(feature));
            }
            layer.closeTooltip();
        },
        click: function(e) {
            // Скидаємо виділення всіх вулиць
            if (streetsLayer) {
                streetsLayer.eachLayer(function(streetLayer) {
                    streetLayer.isSelected = false;
                    streetLayer.setStyle(getStreetStyle(streetLayer.feature));
                });
            }
            
            // Виділяємо обрану вулицю
            this.isSelected = true;
            this.setStyle({
                weight: 7,
                opacity: 1,
                color: '#1a237e',
                dashArray: null
            });
            
            // Показуємо інформацію про вулицю
            if (typeof showStreetInfo === 'function') {
                showStreetInfo(feature);
            }
        }
    });
}

// Функція для завантаження вулиць на карту
function loadStreetsToMap(geojsonData) {
    if (!streetsLayer || !map) {
        console.error('Карта або шар вулиць не ініціалізовані');
        return false;
    }
    
    if (geojsonData && geojsonData.features && geojsonData.features.length > 0) {
        console.log(`Додаємо ${geojsonData.features.length} вулиць на карту...`);
        
        // Додаємо статус UNKNOWN до всіх вулиць (якщо його немає)
        geojsonData.features.forEach(feature => {
            if (feature.properties && !feature.properties.status) {
                feature.properties.status = 'UNKNOWN';
            }
        });
        
        // Додаємо дані на карту
        streetsLayer.addData(geojsonData);
        
        // Автоматично масштабуємо карту до вулиць
        const bounds = streetsLayer.getBounds();
        if (bounds.isValid()) {
            map.fitBounds(bounds, { 
                padding: [50, 50], 
                maxZoom: 15 
            });
        }
        
        console.log(`Успішно додано ${geojsonData.features.length} вулиць`);
        
        // Приховуємо індикатор завантаження
        const loadingEl = document.getElementById('loading');
        if (loadingEl) {
            loadingEl.style.display = 'none';
        }
        
        return true;
    } else {
        console.error('Немає даних вулиць для відображення');
        showErrorMessage('Немає даних вулиць для відображення');
        return false;
    }
}

// Функція для форматування назв вулиць
function formatStreetName(name) {
    if (!name) return 'Невідома вулиця';
    
    let formatted = name;
    
    // Видаляємо мовні префікси
    if (formatted.includes(';')) {
        formatted = formatted.split(';')[0].trim();
    }
    
    // Видаляємо "вулиця" з початку
    if (formatted.toLowerCase().includes('вулиця')) {
        formatted = formatted.replace(/вулиця\s*/i, '');
    }
    
    // Видаляємо інші мовні варіанти
    formatted = formatted
        .replace(/ulica\s*/i, '')
        .replace(/street\s*/i, '')
        .replace(/name:[a-z]+:\s*/i, '')
        .trim();
    
    return formatted || name;
}

// Робимо функції глобально доступними
window.initMap = initMap;
window.loadStreetsToMap = loadStreetsToMap;
window.formatStreetName = formatStreetName;
window.showErrorMessage = showErrorMessage;
