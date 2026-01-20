// Завантажити дані будинків Баранівки
async function loadBuildingsData() {
    try {
        showLoading(true);
        console.log('Початок завантаження даних будинків...');
        
        // Завантажуємо GeoJSON з будинками
        const response = await fetch('data/baranivka-buildings.json');
        
        if (!response.ok) {
            throw new Error(`Помилка завантаження: ${response.status}`);
        }
        
        const geojsonData = await response.json();
        
        // Перевіряємо структуру даних
        if (!geojsonData || !geojsonData.features || !Array.isArray(geojsonData.features)) {
            throw new Error('Невірний формат GeoJSON даних');
        }
        
        console.log(`Завантажено ${geojsonData.features.length} будинків`);
        
        // Додаємо будинки на карту
        if (typeof loadBuildingsToMap === 'function') {
            loadBuildingsToMap(geojsonData);
        } else {
            console.error('Функція loadBuildingsToMap не знайдена');
        }
        
        showLoading(false);
        
    } catch (error) {
        console.error('Помилка завантаження даних будинків:', error);
        showLoading(false);
        
        // Показуємо помилку користувачу
        const infoContent = document.querySelector('.info-content');
        if (infoContent) {
            infoContent.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h4>Помилка завантаження даних</h4>
                    <p>${error.message}</p>
                    <p>Перевірте файл data/baranivka-buildings.json</p>
                </div>
            `;
        }
    }
}
