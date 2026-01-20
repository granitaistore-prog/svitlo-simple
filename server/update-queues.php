<?php
// Парсер для сайту ztoe.com.ua
class QueueParser {
    private $sourceUrl = "https://www.ztoe.com.ua/unhooking-search.php";
    
    public function fetchAndParse() {
        try {
            // Завантажуємо сторінку
            $html = file_get_contents($this->sourceUrl);
            
            if (!$html) {
                throw new Exception("Не вдалося завантажити сторінку");
            }
            
            // Парсимо дані (приклад - потрібно адаптувати)
            $data = $this->parseHTML($html);
            
            // Зберігаємо у файл
            $this->saveToJSON($data);
            
            return $data;
            
        } catch (Exception $e) {
            error_log("Parser error: " . $e->getMessage());
            return $this->getBackupData();
        }
    }
    
    private function parseHTML($html) {
        // Тут потрібно реалізувати парсинг конкретної структури сайту
        // Це приклад - вам потрібно адаптувати під реальну структуру
        
        $data = [
            'date' => date('d.m.Y'),
            'updated' => date('H:i d.m.Y'),
            'restrictions' => [],
            'streets' => [],
            'schedule' => []
        ];
        
        // Парсимо таблицю з вулицями (приклад)
        preg_match_all('/<tr>.*?<td>Баранівський<\/td>.*?<td>(.*?)<\/td>.*?<td>(\d+)<\/td>.*?<\/tr>/s', $html, $matches);
        
        if (!empty($matches[1])) {
            for ($i = 0; $i < count($matches[1]); $i++) {
                $data['streets'][] = [
                    'street' => trim($matches[1][$i]),
                    'queue' => (int)$matches[2][$i]
                ];
            }
        }
        
        return $data;
    }
    
    private function saveToJSON($data) {
        $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        file_put_contents(__DIR__ . '/queues-data.json', $json);
        file_put_contents(__DIR__ . '/queues-data-latest.json', $json);
    }
    
    private function getBackupData() {
        return json_decode(file_get_contents(__DIR__ . '/queues-data-backup.json'), true);
    }
}

// Використання
$parser = new QueueParser();
$data = $parser->fetchAndParse();

header('Content-Type: application/json');
echo json_encode([
    'success' => true,
    'data' => $data,
    'timestamp' => time()
]);
?>
