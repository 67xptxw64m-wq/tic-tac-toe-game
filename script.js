// Конфигурация Telegram бота
// Токен бота нужен для отправки промокодов пользователям
let TELEGRAM_BOT_TOKEN = window.DIRECT_BOT_TOKEN || '';
let TELEGRAM_BOT_USERNAME = window.BOT_USERNAME || '';

// Данные авторизованного пользователя
let currentUser = null;
let userChatId = null;

// Состояние игры
let board = ['', '', '', '', '', '', '', '', ''];
let currentPlayer = 'X'; // X - игрок, O - компьютер
let gameActive = true;
let playerSymbol = 'X';
let computerSymbol = 'O';

// Элементы DOM
const cells = document.querySelectorAll('.cell');
const gameStatus = document.getElementById('gameStatus');
const promoModal = document.getElementById('promoModal');
const loseModal = document.getElementById('loseModal');
const drawModal = document.getElementById('drawModal');
const authModal = document.getElementById('authModal');
const userInfo = document.getElementById('userInfo');
const userName = document.getElementById('userName');
const telegramLoginContainer = document.getElementById('telegram-login-container');
const promoCodeElement = document.getElementById('promoCode');

// Вероятность ошибки компьютера (30% - компьютер может не заблокировать или сделать неоптимальный ход)
const COMPUTER_ERROR_CHANCE = 0.3;

// Комбинации для победы
const winningConditions = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
];

// Инициализация игры
function initGame() {
    cells.forEach((cell, index) => {
        cell.addEventListener('click', () => handleCellClick(index));
        cell.textContent = '';
        cell.classList.remove('x', 'o', 'disabled');
    });
    
    // Проверяем, авторизован ли пользователь
    const savedUser = localStorage.getItem('telegram_user');
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            userChatId = currentUser.id;
            showUserInfo();
            resetGame();
            return;
        } catch (e) {
            console.error('Ошибка при загрузке данных пользователя:', e);
        }
    }
    
    // Если пользователь не авторизован, показываем форму авторизации
    initTelegramLogin();
}

// Инициализация Telegram Login Widget
function initTelegramLogin() {
    // Ждем, если имя бота еще загружается
    if (!TELEGRAM_BOT_USERNAME || TELEGRAM_BOT_USERNAME === 'YOUR_BOT_USERNAME') {
        // Проверяем, есть ли имя бота в window (может быть загружено асинхронно)
        setTimeout(() => {
            TELEGRAM_BOT_USERNAME = window.BOT_USERNAME || TELEGRAM_BOT_USERNAME;
            if (!TELEGRAM_BOT_USERNAME || TELEGRAM_BOT_USERNAME === 'YOUR_BOT_USERNAME') {
                authModal.classList.add('show');
                telegramLoginContainer.innerHTML = `
                    <div style="text-align: center; padding: 20px;">
                        <p style="color: #d63384; margin-bottom: 15px;">⏳ Загрузка настроек бота...</p>
                        <p style="color: #666; font-size: 0.9em;">Пожалуйста, подождите</p>
                    </div>
                `;
                // Повторяем попытку через 2 секунды
                setTimeout(initTelegramLogin, 2000);
                return;
            }
            createTelegramWidget();
        }, 500);
        return;
    }
    
    createTelegramWidget();
}

// Создание виджета Telegram Login
function createTelegramWidget() {
    // Проверяем, используется ли localhost (не работает с Telegram Login Widget)
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    if (isLocalhost) {
        // Показываем инструкцию для настройки домена
        telegramLoginContainer.innerHTML = `
            <div style="text-align: center; padding: 20px; background: #fff5f8; border-radius: 15px; border: 2px dashed #ff69b4;">
                <p style="color: #d63384; font-size: 1.1em; font-weight: 600; margin-bottom: 15px;">⚠️ Требуется публичный домен</p>
                <p style="color: #666; margin-bottom: 20px; line-height: 1.6;">
                    Telegram Login Widget не работает с <code style="background: #ffe4e1; padding: 2px 6px; border-radius: 4px;">localhost</code>
                </p>
                <div style="background: white; padding: 15px; border-radius: 10px; margin-bottom: 15px; text-align: left;">
                    <p style="color: #333; font-weight: 600; margin-bottom: 10px;">📋 Решение:</p>
                    <ol style="color: #666; margin-left: 20px; line-height: 1.8;">
                        <li>Используйте <strong>start-with-ngrok.bat</strong> для получения публичного домена</li>
                        <li>Или разместите игру на хостинге (GitHub Pages, Netlify)</li>
                        <li>Введите полученный HTTPS URL в BotFather → Web Login</li>
                    </ol>
                </div>
                <p style="color: #999; font-size: 0.9em; margin-top: 15px;">
                    💡 Подробная инструкция в файле SETUP.md
                </p>
            </div>
        `;
        authModal.classList.add('show');
        return;
    }
    
    // Создаем скрипт для Telegram Login Widget
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', TELEGRAM_BOT_USERNAME);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.setAttribute('data-request-access', 'write');
    script.async = true;
    
    // Обработка ошибок загрузки виджета
    script.onerror = function() {
        telegramLoginContainer.innerHTML = `
            <div style="text-align: center; padding: 20px; background: #fff5f8; border-radius: 15px; border: 2px dashed #ff69b4;">
                <p style="color: #d63384; font-size: 1.1em; font-weight: 600; margin-bottom: 15px;">❌ Ошибка загрузки виджета</p>
                <p style="color: #666; margin-bottom: 15px;">
                    Возможно, домен не настроен в BotFather или имя бота неверное.
                </p>
                <p style="color: #999; font-size: 0.9em;">
                    Проверьте настройки в BotFather → Web Login
                </p>
            </div>
        `;
    };
    
    telegramLoginContainer.innerHTML = '';
    telegramLoginContainer.appendChild(script);
    
    authModal.classList.add('show');
}

// Обработка авторизации через Telegram
window.onTelegramAuth = function(user) {
    currentUser = user;
    userChatId = user.id;
    
    // Сохраняем данные пользователя
    localStorage.setItem('telegram_user', JSON.stringify(user));
    
    showUserInfo();
}

// Показать информацию о пользователе
function showUserInfo() {
    if (currentUser) {
        const name = currentUser.first_name || 'Игрок';
        userName.textContent = name;
        userInfo.style.display = 'block';
    }
}

// Выход из аккаунта
function logout() {
    currentUser = null;
    userChatId = null;
    localStorage.removeItem('telegram_user');
    userInfo.style.display = 'none';
    authModal.classList.remove('show');
    initTelegramLogin();
}

// Начать игру после авторизации
function startGameAfterAuth() {
    authModal.classList.remove('show');
    resetGame();
}

// Обработка клика по клетке
function handleCellClick(index) {
    if (board[index] !== '' || !gameActive || currentPlayer !== 'X') {
        return;
    }

    makeMove(index, playerSymbol);
    
    const winner = checkWinner();
    if (winner === playerSymbol) {
        handlePlayerWin();
        return;
    }
    
    if (checkDraw()) {
        handleDraw();
        return;
    }
    
    // Ход компьютера
    setTimeout(() => {
        computerMove();
    }, 500);
}

// Сделать ход
function makeMove(index, symbol) {
    board[index] = symbol;
    cells[index].textContent = symbol;
    cells[index].classList.add(symbol.toLowerCase());
    cells[index].classList.add('disabled');
}

// Ход компьютера (ослабленный ИИ с вероятностью ошибки)
function computerMove() {
    if (!gameActive) return;
    
    let move = -1;
    
    // С вероятностью ошибки компьютер может сделать случайный ход вместо оптимального
    const makeError = Math.random() < COMPUTER_ERROR_CHANCE;
    
    if (!makeError) {
        // Сначала проверяем, может ли компьютер выиграть
        move = findWinningMove(computerSymbol);
        
        // Если нет, проверяем, нужно ли блокировать игрока
        if (move === -1) {
            move = findWinningMove(playerSymbol);
        }
    }
    
    // Если нет оптимального хода или компьютер делает ошибку, выбираем случайный ход
    if (move === -1) {
        move = findRandomMove();
    }
    
    // Если случайный ход не найден, используем лучший ход как запасной вариант
    if (move === -1) {
        move = findBestMove();
    }
    
    if (move !== -1) {
        makeMove(move, computerSymbol);
        
        const winner = checkWinner();
        if (winner === computerSymbol) {
            handleComputerWin();
        } else if (checkDraw()) {
            handleDraw();
        } else {
            currentPlayer = 'X';
            gameStatus.textContent = 'Твой ход! Выбери клетку';
        }
    }
}

// Найти выигрышный ход
function findWinningMove(symbol) {
    for (let condition of winningConditions) {
        const [a, b, c] = condition;
        const values = [board[a], board[b], board[c]];
        const symbolCount = values.filter(v => v === symbol).length;
        const emptyCount = values.filter(v => v === '').length;
        
        if (symbolCount === 2 && emptyCount === 1) {
            return condition.find(index => board[index] === '');
        }
    }
    return -1;
}

// Найти случайный ход (для ослабления ИИ)
function findRandomMove() {
    const emptyCells = [];
    for (let i = 0; i < 9; i++) {
        if (board[i] === '') {
            emptyCells.push(i);
        }
    }
    
    if (emptyCells.length > 0) {
        return emptyCells[Math.floor(Math.random() * emptyCells.length)];
    }
    
    return -1;
}

// Найти лучший ход
function findBestMove() {
    // Центр
    if (board[4] === '') return 4;
    
    // Углы
    const corners = [0, 2, 6, 8];
    const emptyCorners = corners.filter(index => board[index] === '');
    if (emptyCorners.length > 0) {
        return emptyCorners[Math.floor(Math.random() * emptyCorners.length)];
    }
    
    // Боковые клетки
    const sides = [1, 3, 5, 7];
    const emptySides = sides.filter(index => board[index] === '');
    if (emptySides.length > 0) {
        return emptySides[Math.floor(Math.random() * emptySides.length)];
    }
    
    return -1;
}

// Проверка победы (возвращает символ победителя или null)
function checkWinner() {
    for (let condition of winningConditions) {
        const [a, b, c] = condition;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a]; // Возвращаем символ победителя
        }
    }
    return null; // Нет победителя
}

// Проверка ничьей
function checkDraw() {
    return board.every(cell => cell !== '') && checkWinner() === null;
}

// Обработка победы игрока
function handlePlayerWin() {
    gameActive = false;
    gameStatus.textContent = '🎉 Ты выиграла! 🎉';
    
    // Генерация промокода
    const promoCode = generatePromoCode();
    promoCodeElement.textContent = promoCode;
    
    // Показ модального окна
    promoModal.classList.add('show');
    
    // Отправка промокода пользователю через бота
    if (userChatId) {
        sendPromoCodeToUser(promoCode);
    } else {
        console.warn('Пользователь не авторизован, промокод не отправлен');
    }
}

// Обработка победы компьютера
function handleComputerWin() {
    gameActive = false;
    gameStatus.textContent = 'Компьютер выиграл 😔';
    
    // Показ модального окна проигрыша
    loseModal.classList.add('show');
    
    // Отправка сообщения о проигрыше в Telegram
    if (userChatId) {
        sendTelegramMessage('Проигрыш');
    }
}

// Обработка ничьей
function handleDraw() {
    gameActive = false;
    gameStatus.textContent = 'Ничья! Попробуй ещё раз';
    
    // Показываем модальное окно ничьей
    setTimeout(() => {
        drawModal.classList.add('show');
    }, 500);
    
    // Отправка сообщения о ничьей в Telegram
    if (userChatId) {
        sendTelegramMessage('Ничья');
    }
}

// Генерация промокода
function generatePromoCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Исключаем похожие символы
    let code = '';
    for (let i = 0; i < 5; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// Отправка промокода пользователю через бота
async function sendPromoCodeToUser(promoCode) {
    if (!TELEGRAM_BOT_TOKEN) {
        console.warn('Токен бота не настроен. Промокод не отправлен.');
        return;
    }
    
    if (!userChatId) {
        console.warn('Пользователь не авторизован. Промокод не отправлен.');
        return;
    }
    
    const message = `🎉 Победа! Промокод выдан: ${promoCode}`;
    
    try {
        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: userChatId,
                text: message
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Ошибка отправки промокода в Telegram:', errorText);
        }
    } catch (error) {
        console.error('Ошибка при отправке промокода в Telegram:', error);
    }
}

// Отправка сообщения в Telegram
async function sendTelegramMessage(message) {
    if (!TELEGRAM_BOT_TOKEN) {
        console.warn('Токен бота не настроен. Сообщение не отправлено.');
        return;
    }
    
    if (!userChatId) {
        console.warn('Пользователь не авторизован. Сообщение не отправлено.');
        return;
    }
    
    try {
        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: userChatId,
                text: message
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Ошибка отправки сообщения в Telegram:', errorText);
        }
    } catch (error) {
        console.error('Ошибка при отправке сообщения в Telegram:', error);
    }
}

// Сброс игры
function resetGame() {
    // Проверяем авторизацию перед началом игры
    if (!currentUser || !userChatId) {
        initTelegramLogin();
        return;
    }
    
    board = ['', '', '', '', '', '', '', '', ''];
    currentPlayer = 'X';
    gameActive = true;
    
    cells.forEach(cell => {
        cell.textContent = '';
        cell.classList.remove('x', 'o', 'disabled');
    });
    
    promoModal.classList.remove('show');
    loseModal.classList.remove('show');
    drawModal.classList.remove('show');
    gameStatus.textContent = 'Твой ход! Выбери клетку';
}

// Инициализация при загрузке страницы
initGame();

