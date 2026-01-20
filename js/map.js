// Ініціалізація карти
let map;
let buildingsLayer;

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
    
    // Створюємо шар для будинків
    buildingsLayer = L.geoJSON(null, {
        style: function(feature) {
            return {
                fillColor: getStatusColor(feature.properties.status || 'unknown'),
                weight: 1,
                opacity: 0.8,
                color: 'white',
                fillOpacity: 0.7
            };
        },
        onEachFeature: onEachBuildingFeature
    }).addTo(map);
    
    console.log('Карта ініціалізована');
    
    // Після ініціалізації карти завантажуємо будинки
    setTimeout(loadBuildingsData, 500);
}

// Колір за статусом
function getStatusColor(status) {
    switch(status) {
        case 'POWER_ON': return '#4CAF50';
        case 'NO_POWER': return '#F44336';
        case 'UNKNOWN': return '#FFC107';
        default: return '#9E9E9E';
    }
}

// Обробка кліку на будинок
function onEachBuildingFeature(feature, layer) {
    if (!feature.properties) return;
    
    layer.on({
        mouseover: function(e) {
            this.setStyle({
                weight: 3,
                color: '#1a237e',
                fillOpacity: 0.9
            });
            
            const street = feature.properties['addr:street'] || 'Невідома вулиця';
            const house = feature.properties['addr:housenumber'] || 'Невідомий номер';
            
            layer.bindTooltip(`<b>${street}</b><br>Будинок ${house}`, {
                direction: 'top',
                className: 'building-tooltip',
                permanent: false,
                sticky: true
            }).openTooltip();
        },
        mouseout: function(e) {
            this.setStyle({
                weight: 1,
                color: 'white',
                fillOpacity: 0.7
            });
            layer.closeTooltip();
        },
        click: function(e) {
            const street = feature.properties['addr:street'] || '';
            const house = feature.properties['addr:housenumber'] || '';
            
            if (street && house) {
                showBuildingInfo(street, house, feature);
                
                // Скидаємо стилі всіх будинків
                buildingsLayer.eachLayer(function(layer) {
                    layer.setStyle({
                        weight: 1,
                        color: 'white',
                        fillOpacity: 0.7
                    });
                });
                
                // Підсвічуємо обраний будинок
                this.setStyle({
                    weight: 4,
                    color: '#1a237e',
                    fillOpacity: 1
                });
            }
        }
    });
}

// Функція для завантаження даних будинків (викликається з buildings.js)
function loadBuildingsToMap(geojsonData) {
    if (!buildingsLayer || !map) {
        console.error('Карта не ініціалізована');
        return;
    }
    
    if (geojsonData && geojsonData.features && geojsonData.features.length > 0) {
        // Додаємо дані на карту
        buildingsLayer.addData(geojsonData);
        
        // Автоматично масштабуємо карту до будинків
        const bounds = buildingsLayer.getBounds();
        if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
        }
        
        console.log(`Завантажено ${geojsonData.features.length} будинків`);
    } else {
        console.error('Немає даних будинків');
    }
}

// Ініціалізуємо карту після завантаження сторінки
document.addEventListener('DOMContentLoaded', initMap);
