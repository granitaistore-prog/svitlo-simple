// Завантажити дані вулиць Баранівки
async function loadStreetsData() {
    try {
        showLoading(true);
        console.log('Початок завантаження даних вулиць...');
        
        // Завантажуємо GeoJSON з вулицями
        const response = await fetch('data/baranivka-streets.json');
        
        if (!response.ok) {
            throw new Error(`Помилка завантаження: ${response.status}`);
        }
        
        const geojsonData = await response.json();
        
        // Перевіряємо структуру даних
        if (!geojsonData || !geojsonData.features || !Array.isArray(geojsonData.features)) {
            throw new Error('Невірний формат GeoJSON даних');
        }
        
        console.log(`Завантажено ${geojsonData.features.length} вулиць`);
        
        // Додаємо вулиці на карту
        if (typeof loadStreetsToMap === 'function') {
            loadStreetsToMap(geojsonData);
        } else {
            console.error('Функція loadStreetsToMap не знайдена');
        }
        
        showLoading(false);
        
    } catch (error) {
        console.error('Помилка завантаження даних вулиць:', error);
        showLoading(false);
        
        // Показуємо помилку користувачу
        const infoContent = document.querySelector('.info-content');
        if (infoContent) {
            infoContent.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h4>Помилка завантаження даних</h4>
                    <p>${error.message}</p>
                    <p>Перевірте файл data/baranivka-streets.json</p>
                </div>
            `;
        }
        
        // Завантажуємо тестові дані
        loadTestStreetsData();
    }
}

// Завантажити тестові дані, якщо основні недоступні
function loadTestStreetsData() {
    const testData = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "properties": {
                    "name": "Симона Петлюри",
                    "status": "UNKNOWN"
                },
                "geometry": {
                    "type": "LineString",
                    "coordinates": [
                        [27.658, 50.299],
                        [27.664, 50.299],
                        [27.664, 50.295],
                        [27.658, 50.295]
                    ]
                }
            },
            {
                "type": "Feature",
                "properties": {
                    "name": "Володимирська",
                    "status": "UNKNOWN"
                },
                "geometry": {
                    "type": "LineString",
                    "coordinates": [
                        [27.660, 50.300],
                        [27.662, 50.298],
                        [27.662, 50.294]
                    ]
                }
            },
            {
                "type": "Feature",
                "properties": {
                    "name": "Соборна",
                    "status": "UNKNOWN"
                },
                "geometry": {
                    "type": "LineString",
                    "coordinates": [
                        [27.656, 50.298],
                        [27.666, 50.298]
                    ]
                }
            },
            {
                "type": "Feature",
                "properties": {
                    "name": "Шевченка",
                    "status": "UNKNOWN"
                },
                "geometry": {
                    "type": "LineString",
                    "coordinates": [
                        [27.659, 50.301],
                        [27.659, 50.293]
                    ]
                }
            },
            {
                "type": "Feature",
                "properties": {
                    "name": "Лесі Українки",
                    "status": "UNKNOWN"
                },
                "geometry": {
                    "type": "LineString",
                    "coordinates": [
                        [27.655, 50.296],
                        [27.665, 50.296]
                    ]
                }
            }
        ]
    };
    
    console.log('Використовуються тестові дані вулиць');
    if (typeof loadStreetsToMap === 'function') {
        loadStreetsToMap(testData);
    }
}
