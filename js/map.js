// Ініціалізація карти
let map;
let buildingsLayer;

function initMap() {
    // Центр Баранівки
    const baranivkaCenter = [50.297, 27.662];
    
    // Ініціалізація карти
    map = L.map('map').setView(baranivkaCenter, 14);
    
    // Додаємо тайли OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
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
}

// Колір за статусом
function getStatusColor(status) {
    switch(status) {
        case 'has_power': return '#4CAF50';
        case 'scheduled': return '#FFC107';
        case 'no_power': return '#F44336';
        default: return '#9E9E9E';
    }
}

// Обробка кліку на будинок
function onEachBuildingFeature(feature, layer) {
    layer.on({
        mouseover: function(e) {
            e.target.setStyle({
                weight: 3,
                color: '#1a237e',
                fillOpacity: 0.9
            });
            
            const street = feature.properties['addr:street'] || 'Невідома вулиця';
            const house = feature.properties['addr:housenumber'] || 'Невідомий номер';
            
            layer.bindTooltip(`<b>${street}</b><br>Будинок ${house}`, {
                direction: 'top',
                className: 'building-tooltip'
            }).openTooltip();
        },
        mouseout: function(e) {
            buildingsLayer.resetStyle(e.target);
            e.target.closeTooltip();
        },
        click: function(e) {
            const street = feature.properties['addr:street'] || '';
            const house = feature.properties['addr:housenumber'] || '';
            
            if (street && house) {
                // Запит даних про будинок
                showBuildingInfo(street, house, feature);
                
                // Підсвічуємо обраний будинок
                buildingsLayer.eachLayer(function(l) {
                    if (l !== e.target) {
                        l.setStyle({
                            fillOpacity: 0.5
                        });
                    }
                });
                
                e.target.setStyle({
                    weight: 4,
                    color: '#1a237e',
                    fillOpacity: 1
                });
            }
        }
    });
}

// Ініціалізуємо карту після завантаження сторінки
document.addEventListener('DOMContentLoaded', function() {
    initMap();
});
