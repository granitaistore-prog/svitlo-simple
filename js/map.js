// Глобальні змінні
let map;
let streetsLayer = null;

// Стиль для вулиці за статусом
function getStreetStyle(feature) {
    const status = feature?.properties?.status || 'UNKNOWN';
    
    const styles = {
        'POWER_ON': {
            color: '#4CAF50',
            weight: 5,  // Збільшено для кращої видимості
            opacity: 0.9,
            dashArray: null
        },
        'NO_POWER': {
            color: '#F44336',
            weight: 6,  // Збільшено для кращої видимості
            opacity: 0.9,
            dashArray: null
        },
        'UNKNOWN': {
            color: '#FFC107',
            weight: 5,  // Збільшено для кращої видимості
            opacity: 0.9,
            dashArray: null
        }
    };
    
    return styles[status] || {
        color: '#9E9E9E',
        weight: 4,
        opacity: 0.9,
        dashArray: null
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
        
        // Перевірка Leaflet
        if (typeof L === 'undefined') {
            throw new Error('Leaflet не завантажений!');
        }
        
        // Центр Баранівки - більш точні координати
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
        console.log('Розмір контейнера:', mapContainer.offsetWidth, 'x', mapContainer.offsetHeight);
        
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
    feature.properties.originalName = feature.properties.name; // Зберігаємо оригінальну назву для API
    
    // Додаємо властивість статусу, якщо її немає
    if (!feature.properties.status) {
        feature.properties.status = 'UNKNOWN';
    }
    
    layer.on({
        mouseover: function(e) {
            this.setStyle({
                weight: 7,
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
                weight: 8,
                opacity: 1,
                color: '#1a237e',
                dashArray: null
            });
            
            // Показуємо інформацію про вулицю
            try {
                if (typeof showStreetInfo === 'function') {
                    showStreetInfo(feature);
                } else {
                    console.error('Функція showStreetInfo не знайдена');
                    // Показати базову інформацію
                    const infoContent = document.querySelector('.info-content');
                    if (infoContent) {
                        infoContent.innerHTML = `
                            <div class="street-name">
                                <i class="fas fa-road"></i> ${streetName}
                            </div>
                            <div class="info-item">
                                <strong><i class="fas fa-info-circle"></i> Інформація</strong>
                                <div class="value">Натисніть на вулицю для отримання інформації про відключення</div>
                            </div>
                            <div class="info-note">
                                <i class="fas fa-info-circle"></i> 
                                API модуль тимчасово недоступний
                            </div>
                        `;
                    }
                }
            } catch (error) {
                console.error('Помилка при показі інформації про вулицю:', error);
                const infoContent = document.querySelector('.info-content');
                if (infoContent) {
                    infoContent.innerHTML = `
                        <div class="error-message">
                            <i class="fas fa-exclamation-triangle"></i>
                            <h4>Помилка</h4>
                            <p>Не вдалося отримати інформацію про вулицю</p>
                            <p>${error.message}</p>
                        </div>
                    `;
                }
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
    
    if (geojsonData && geojsonData.features && Array.isArray(geojsonData.features)) {
        console.log(`Додаємо ${geojsonData.features.length} вулиць на карту...`);
        
        // Перевірка перших координат
        if (geojsonData.features.length > 0) {
            console.log('Приклад координат першої вулиці:');
            console.log('Перша точка:', geojsonData.features[0].geometry.coordinates[0]);
            console.log('Назва:', geojsonData.features[0].properties.name);
        }
        
        // Додаємо статус UNKNOWN до всіх вулиць (якщо його немає)
        geojsonData.features.forEach(feature => {
            if (feature.properties && !feature.properties.status) {
                feature.properties.status = 'UNKNOWN';
            }
        });
        
        // Додаємо дані на карту
        streetsLayer.addData(geojsonData);
        
        // Автоматично масштабуємо карту до вулиць
        setTimeout(() => {
            const bounds = streetsLayer.getBounds();
            if (bounds.isValid()) {
                console.log('Межі вулиць:', bounds);
                map.fitBounds(bounds, { 
                    padding: [50, 50], 
                    maxZoom: 15 
                });
            } else {
                console.warn('Невірні межі вулиць, використовуємо центр Баранівки');
                map.setView([50.297, 27.662], 14);
            }
        }, 100);
        
        console.log(`Успішно додано ${geojsonData.features.length} вулиць`);
        
        // Оновлюємо розмір карти
        setTimeout(() => {
            map.invalidateSize();
            console.log('Карта оновлена');
        }, 500);
        
        // Приховуємо індикатор завантаження
        const loadingEl = document.getElementById('loading');
        if (loadingEl) {
            loadingEl.style.display = 'none';
        }
        
        // Очищуємо панель інформації від попередніх помилок
        const infoContent = document.querySelector('.info-content');
        if (infoContent && infoContent.querySelector('.error-message')) {
            infoContent.innerHTML = '<p class="placeholder">Оберіть вулицю на карті</p>';
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

// Додаткова перевірка після завантаження
window.addEventListener('load', function() {
    console.log('Сторінка повністю завантажена');
    
    // Оновлюємо розмір карти
    if (map) {
        setTimeout(() => {
            map.invalidateSize();
        }, 1000);
    }
});
