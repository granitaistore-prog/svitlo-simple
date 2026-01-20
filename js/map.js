// Ініціалізація карти
let map;
let streetsLayer;

// Ініціалізація карти
function initMap() {
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
    
    // Створюємо шар для вулиць
    streetsLayer = L.geoJSON(null, {
        style: function(feature) {
            return getStreetStyle(feature.properties.status || 'unknown');
        },
        onEachFeature: onEachStreetFeature
    }).addTo(map);
    
    console.log('Карта ініціалізована');
    
    // Після ініціалізації карти завантажуємо вулиці
    setTimeout(loadStreetsData, 500);
}

// Стиль для вулиці за статусом
function getStreetStyle(status) {
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
        },
        'default': {
            color: '#9E9E9E',
            weight: 3,
            opacity: 0.6,
            dashArray: '3, 3'
        }
    };
    
    return styles[status] || styles.default;
}

// Обробка кліку на вулицю
function onEachStreetFeature(feature, layer) {
    if (!feature.properties) return;
    
    const streetName = feature.properties.name || 'Невідома вулиця';
    
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
                const status = feature.properties.status || 'unknown';
                this.setStyle(getStreetStyle(status));
            }
            layer.closeTooltip();
        },
        click: function(e) {
            // Скидаємо виділення всіх вулиць
            streetsLayer.eachLayer(function(streetLayer) {
                streetLayer.isSelected = false;
                const status = streetLayer.feature.properties.status || 'unknown';
                streetLayer.setStyle(getStreetStyle(status));
            });
            
            // Виділяємо обрану вулицю
            this.isSelected = true;
            this.setStyle({
                weight: 7,
                opacity: 1,
                color: '#1a237e'
            });
            
            // Показуємо інформацію про вулицю
            showStreetInfo(feature);
        }
    });
}

// Функція для завантаження вулиць на карту
function loadStreetsToMap(geojsonData) {
    if (!streetsLayer || !map) {
        console.error('Карта не ініціалізована');
        return;
    }
    
    if (geojsonData && geojsonData.features && geojsonData.features.length > 0) {
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
        
        console.log(`Завантажено ${geojsonData.features.length} вулиць`);
    } else {
        console.error('Немає даних вулиць');
    }
}

// Ініціалізуємо карту
document.addEventListener('DOMContentLoaded', initMap);
