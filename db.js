// Shared IndexedDB Utility for "bao-ve-co-the"
const DB_NAME = 'BaoVeCoTheDB';
const DB_VERSION = 1;

function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('users')) {
                db.createObjectStore('users', { keyPath: 'uuid' });
            }
            if (!db.objectStoreNames.contains('chats')) {
                db.createObjectStore('chats', { keyPath: 'id', autoIncrement: true });
            }
        };
        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject(event.target.error);
    });
}

function generateUUID() {
    return 'u-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now().toString(36);
}

async function getOrCreateUser() {
    const db = await initDB();
    return new Promise((resolve) => {
        const transaction = db.transaction(['users'], 'readonly');
        const store = transaction.objectStore('users');
        const request = store.openCursor();
        request.onsuccess = async (event) => {
            const cursor = event.target.result;
            if (cursor) {
                // Return first existing user (local user)
                resolve(cursor.value);
            } else {
                // No user exists, check URL for referrer
                const urlParams = new URLSearchParams(window.location.search);
                const ref = urlParams.get('ref') || null;
                
                const newUser = {
                    uuid: generateUUID(),
                    email: null,
                    avatar: null,
                    referrer: ref,
                    createdAt: new Date().toISOString()
                };
                await saveUser(newUser);
                resolve(newUser);
            }
        };
    });
}

async function saveUser(user) {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['users'], 'readwrite');
        const store = transaction.objectStore('users');
        const request = store.put(user);
        request.onsuccess = () => resolve(user);
        request.onerror = () => reject(request.error);
    });
}

async function getChats(uuid) {
    const db = await initDB();
    return new Promise((resolve) => {
        const transaction = db.transaction(['chats'], 'readonly');
        const store = transaction.objectStore('chats');
        const chats = [];
        store.openCursor().onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                if (cursor.value.uuid === uuid) {
                    chats.push(cursor.value);
                }
                cursor.continue();
            } else {
                resolve(chats.sort((a, b) => a.timestamp - b.timestamp));
            }
        };
    });
}

async function saveChat(uuid, message, sender) {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['chats'], 'readwrite');
        const store = transaction.objectStore('chats');
        const chatEntry = {
            uuid: uuid,
            message: message,
            sender: sender, // 'user' or 'ai'
            timestamp: Date.now()
        };
        const request = store.add(chatEntry);
        request.onsuccess = () => resolve(chatEntry);
        request.onerror = () => reject(request.error);
    });
}

// Micro AI Helper Function
async function startSpeechRecognition(uuid, onResult, onAIResponse) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        alert("Trình duyệt không hỗ trợ nhận diện giọng nói!");
        return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'vi-VN';
    recognition.start();

    recognition.onresult = async (event) => {
        const speechToText = event.results[0][0].transcript;
        onResult(speechToText);
        
        // Save User Chat
        await saveChat(uuid, speechToText, 'user');
        
        // Mock AI Response (Call dynamic doctor assistant)
        const aiReplies = [
            "Tôi có thể hỗ trợ gì về sức khỏe cho bạn?",
            "Cơ thể của bạn cần được bảo vệ đúng cách!",
            "Hãy uống nước đầy đủ và tập thể dục nhé.",
            "Tôi đã ghi nhận thông tin của bạn vào hệ thống bảo vệ cơ thể."
        ];
        const aiText = aiReplies[Math.floor(Math.random() * aiReplies.length)];
        
        // Save AI Chat
        await saveChat(uuid, aiText, 'ai');
        onAIResponse(aiText);
    };
}