// Завантажити дані будинків Баранівки
async function loadBuildingsData() {
    try {
        showLoading(true);
        
        // Відкриваємо JSON файл з даними будинків
        const response = await fetch('data/baranivka-buildings-simple.json');
        
        if (!response.ok) {
            throw new Error(`Помилка завантаження: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Додаємо будинки на карту
        buildingsLayer.addData(data);
        
        // Центруємо карту на будинках
        const bounds = buildingsLayer.getBounds();
        if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [50, 50] });
        }
        
        console.log(`Завантажено ${data.features.length} будинків`);
        
    } catch (error) {
        console.error('Помилка завантаження даних будинків:', error);
        alert('Не вдалося завантажити дані будинків. Спробуйте оновити сторінку.');
    } finally {
        showLoading(false);
    }
}

// Завантажити дані після ініціалізації карти
document.addEventListener('DOMContentLoaded', function() {
    // Чекаємо ініціалізації карти
    setTimeout(() => {
        if (map) {
            loadBuildingsData();
        }
    }, 100);
});

// Експортуємо для використання в інших файлах
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { loadBuildingsData };
}
