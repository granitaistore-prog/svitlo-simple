// Завантажити дані вулиць Баранівки
async function loadStreetsData() {
    console.log('Завантаження даних вулиць...');
    
    try {
        // Показуємо завантаження
        const loadingEl = document.getElementById('loading');
        if (loadingEl) {
            loadingEl.style.display = 'flex';
        }
        
        // Завантажуємо GeoJSON з вулицями
        const response = await fetch('baranivka-streets.json');
        
        if (!response.ok) {
            throw new Error(`Помилка завантаження: ${response.status} ${response.statusText}`);
        }
        
        const geojsonData = await response.json();
        
        // Перевіряємо структуру даних
        if (!geojsonData || !geojsonData.features || !Array.isArray(geojsonData.features)) {
            throw new Error('Невірний формат GeoJSON даних');
        }
        
        console.log(`Завантажено ${geojsonData.features.length} вулиць`);
        
        // Додаємо вулиці на карту
        if (typeof loadStreetsToMap === 'function') {
            const success = loadStreetsToMap(geojsonData);
            if (!success) {
                throw new Error('Не вдалося завантажити вулиці на карту');
            }
        } else {
            console.error('Функція loadStreetsToMap не знайдена');
            throw new Error('Функція завантаження на карту не доступна');
        }
        
    } catch (error) {
        console.error('Помилка завантаження даних вулиць:', error);
        
        // Показуємо помилку користувачу
        if (typeof showErrorMessage === 'function') {
            showErrorMessage('Помилка завантаження даних вулиць: ' + error.message);
        }
        
        // Приховуємо індикатор завантаження
        const loadingEl = document.getElementById('loading');
        if (loadingEl) {
            loadingEl.style.display = 'none';
        }
    }
}

// Робимо функцію глобально доступною
window.loadStreetsData = loadStreetsData;
