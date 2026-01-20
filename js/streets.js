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
        
        // Додаємо статус UNKNOWN до всіх вулиць (якщо його немає)
        geojsonData.features.forEach(feature => {
            if (feature.properties && !feature.properties.status) {
                feature.properties.status = 'UNKNOWN';
            }
        });
        
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
    }
}
