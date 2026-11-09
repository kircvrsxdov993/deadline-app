const express = require('express');
const webpush = require('web-push');
const bodyParser = require('body-parser');
const Database = require('better-sqlite3');

const app = express();
app.use(bodyParser.json());
app.use(express.static('public'));

const publicVapidKey = 'BND8q8T8vYfSufLZWLTwM_EUL_tgINYQ9tbc29JTDsC0rkf52cE0IZIP_UcUNGipb-qpCkUfLkhHRd7JqbOC7F4';
const privateVapidKey = 'MYMuW-V39_ew7bB2JnotYGX0ru65DnJY11O_Jt64hJY';

webpush.setVapidDetails('mailto:your-email@example.com', publicVapidKey, privateVapidKey);

const db = new Database('./database.sqlite');
console.log('Подключено к базе данных SQLite через better-sqlite3.');

db.prepare(`CREATE TABLE IF NOT EXISTS deadlines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    notifyTime INTEGER,
    subscription TEXT,
    sent INTEGER DEFAULT 0
)`).run();

function scheduleNotification(id, subscriptionObj, title, delay) {
    setTimeout(async () => {
        const payload = JSON.stringify({
            title: `Deadline: ${title}`,
            body: 'Time has came!'
        });

        try {
            await webpush.sendNotification(subscriptionObj, payload);
            console.log(`Push (ID: ${id}) успешно отправлен!`);
            
            db.prepare(`UPDATE deadlines SET sent = 1 WHERE id = ?`).run(id);
        } catch (error) {
            console.error('Ошибка отправки push:', error);
        }
    }, delay);
}

function restoreTasks() {
    const now = Date.now();
    const rows = db.prepare(`SELECT * FROM deadlines WHERE sent = 0 AND notifyTime > ?`).all(now);

    console.log(`Восстановлено активных задач из БД: ${rows.length}`);
    rows.forEach(row => {
        const delay = row.notifyTime - now;
        const subscriptionObj = JSON.parse(row.subscription);
        scheduleNotification(row.id, subscriptionObj, row.title, delay);
        console.log(`Событие "${row.title}" запланировано через ${Math.round(delay / 1000)} сек.`);
    });
}

restoreTasks();

app.post('/api/schedule', (req, res) => {
    const { subscription, title, notifyTime } = req.body;
    const delay = notifyTime - Date.now();

    if (delay <= 0) {
        return res.status(400).send({ error: 'Date must be in the future' });
    }

    const subscriptionString = JSON.stringify(subscription);

    try {
        // Сохраняем дедлайн в базу данных
        const stmt = db.prepare(`INSERT INTO deadlines (title, notifyTime, subscription, sent) VALUES (?, ?, ?, 0)`);
        const info = stmt.run(title, notifyTime, subscriptionString);
        const id = info.lastInsertRowid;

        console.log(`Событие "${title}" (ID: ${id}) сохранено и запланировано через ${Math.round(delay / 1000)} сек.`);

        // Запускаем таймер
        scheduleNotification(id, subscription, title, delay);

        res.status(200).json({ success: true, id });
    } catch (err) {
        console.error('Ошибка сохранения в БД:', err.message);
        res.status(500).json({ error: 'Database error' });
    }
});

app.listen(3030, () => console.log('Server has runned on http://localhost:3030'));