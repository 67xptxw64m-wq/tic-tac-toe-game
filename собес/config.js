// Конфигурация Telegram-бота
// ВАЖНО: Вставьте сюда токен вашего бота для отправки промокодов
// Получить токен можно у @BotFather в Telegram

// Раскомментируйте и заполните следующую строку:
const DIRECT_BOT_TOKEN = '8281549818:AAGvr9X67P0BzWOPtV9ctWYPtIoqOJ3zEJg';

// Если токен задан здесь, он будет использован
if (typeof DIRECT_BOT_TOKEN !== 'undefined' && DIRECT_BOT_TOKEN) {
    window.DIRECT_BOT_TOKEN = DIRECT_BOT_TOKEN;
}

// Имя бота для Telegram Login Widget (без @)
// Например, если ваш бот @mygame_bot, то BOT_USERNAME = 'mygame_bot'
// Если не указано, будет получено автоматически через API
let BOT_USERNAME = 'YOUR_BOT_USERNAME'; // Замените на имя вашего бота или оставьте для автоматического получения

// Экспортируем имя бота в window для использования в script.js
if (typeof BOT_USERNAME !== 'undefined' && BOT_USERNAME !== 'YOUR_BOT_USERNAME') {
    window.BOT_USERNAME = BOT_USERNAME;
}

// Автоматическое получение имени бота через API (если не указано вручную)
if ((!window.BOT_USERNAME || window.BOT_USERNAME === 'YOUR_BOT_USERNAME') && window.DIRECT_BOT_TOKEN) {
    fetch(`https://api.telegram.org/bot${window.DIRECT_BOT_TOKEN}/getMe`)
        .then(response => response.json())
        .then(data => {
            if (data.ok && data.result) {
                window.BOT_USERNAME = data.result.username;
                console.log('Имя бота получено автоматически:', window.BOT_USERNAME);
            }
        })
        .catch(error => {
            console.error('Ошибка при получении имени бота:', error);
        });
}

