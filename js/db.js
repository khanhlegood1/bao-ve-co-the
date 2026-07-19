// Khởi tạo và quản lý IndexedDB cho "Bao Ve Co The"
const DB_NAME = "BaoVeCoTheDB";
const DB_VERSION = 1;

function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains("user_profile")) {
                db.createObjectStore("user_profile", { keyPath: "key" });
            }
            if (!db.objectStoreNames.contains("chat_history")) {
                db.createObjectStore("chat_history", { keyPath: "id", autoIncrement: true });
            }
        };

        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject(event.target.error);
    });
}

// Hàm tạo UUID theo quy tắc của ChooseUserRolePanel (Độc nhất, hỗ trợ làm affiliate link)
function generateUUID() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let segment1 = '';
    let segment2 = '';
    for (let i = 0; i < 6; i++) {
        segment1 += chars.charAt(Math.floor(Math.random() * chars.length));
        segment2 += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const timestamp = Date.now().toString(36);
    return `bvct-${segment1}-${timestamp}-${segment2}`;
}

// Lấy hoặc Tạo mới UUID
async function getOrCreateUUID() {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(["user_profile"], "readonly");
        const store = transaction.objectStore("user_profile");
        const request = store.get("uuid");

        request.onsuccess = async () => {
            if (request.result) {
                resolve(request.result.value);
            } else {
                const newUUID = generateUUID();
                await saveToProfile("uuid", newUUID);
                resolve(newUUID);
            }
        };
        request.onerror = () => reject(request.onerror);
    });
}

// Lưu thông tin vào Profile (UUID, Email, Avatar, Role...)
async function saveToProfile(key, value) {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(["user_profile"], "readwrite");
        const store = transaction.objectStore("user_profile");
        const request = store.put({ key: key, value: value });

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.onerror);
    });
}

// Lấy thông tin từ Profile
async function getFromProfile(key) {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(["user_profile"], "readonly");
        const store = transaction.objectStore("user_profile");
        const request = store.get(key);

        request.onsuccess = () => resolve(request.result ? request.result.value : null);
        request.onerror = () => reject(request.onerror);
    });
}

// Lưu tin nhắn Chat vào IndexedDB
async function saveChatMessage(sender, text) {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(["chat_history"], "readwrite");
        const store = transaction.objectStore("chat_history");
        const chatEntry = {
            sender: sender, // 'user' hoặc 'ai'
            text: text,
            timestamp: new Date().toISOString()
        };
        const request = store.add(chatEntry);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.onerror);
    });
}

// Lấy toàn bộ lịch sử Chat
async function getChatHistory() {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(["chat_history"], "readonly");
        const store = transaction.objectStore("chat_history");
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.onerror);
    });
}

// Giả lập tương tác giọng nói (Web Speech API) và xử lý AI Chat
async function handleVoiceInteraction(onSpeechStart, onSpeechEnd, onResponseCallback) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        alert("Trình duyệt của bạn không hỗ trợ nhận diện giọng nói.");
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'vi-VN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    // Đảm bảo đã có UUID trước khi chat
    const uuid = await getOrCreateUUID();
    console.log("Sử dụng UUID:", uuid);

    recognition.onstart = () => {
        if (onSpeechStart) onSpeechStart();
    };

    recognition.onsuccess = () => {};

    recognition.onresult = async (event) => {
        const userText = event.results[0][0].transcript;
        if (onSpeechEnd) onSpeechEnd(userText);

        // Lưu tin nhắn của User vào DB
        await saveChatMessage('user', userText);

        // Giả lập AI Phản hồi (Thực tế sẽ gọi API và truyền UUID kèm theo)
        setTimeout(async () => {
            const aiResponse = `Tôi đã nghe thấy: "${userText}". Tôi là AI hỗ trợ Bảo Vệ Cơ Thể. (UUID: ${uuid})`;
            await saveChatMessage('ai', aiResponse);
            if (onResponseCallback) onResponseCallback(aiResponse);

            // Đọc phản hồi bằng giọng nói
            const utterance = new SpeechSynthesisUtterance(aiResponse);
            utterance.lang = 'vi-VN';
            window.speechSynthesis.speak(utterance);
        }, 1000);
    };

    recognition.onerror = (e) => {
        console.error("Lỗi nhận diện giọng nói: ", e);
        if (onSpeechEnd) onSpeechEnd("[Lỗi hoặc không nghe rõ]");
    };

    recognition.start();
}

// Render Menu điều hướng dùng chung cho việc test các trang dễ dàng
function renderNavigationMenu() {
    const menuHTML = `
        <div id="nav-dev-menu" style="position: fixed; top: 10px; right: 10px; z-index: 10000; background: rgba(0,0,0,0.85); color: white; padding: 10px; border-radius: 8px; font-family: sans-serif; font-size: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">
            <strong style="display:block; margin-bottom: 5px; color: #4caf50;">DEV MENU ĐIỀU HƯỚNG</strong>
            <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 5px;">
                <li><a href="index.html" style="color: #00bcd4; text-decoration: none;">1. Trang chủ (Chat)</a></li>
                <li><a href="ChooseUserRolePanel.html" style="color: #00bcd4; text-decoration: none;">2. Chọn vai trò</a></li>
                <li><a href="DonationHeroPanel.html" style="color: #00bcd4; text-decoration: none;">3. Quyên góp</a></li>
                <li><a href="Login.html" style="color: #00bcd4; text-decoration: none;">4. Đăng nhập</a></li>
            </ul>
            <button onclick="clearAllData()" style="margin-top:8px; width:100%; background: #f44336; border: none; color: white; padding: 3px; cursor: pointer; border-radius: 4px;">Xoá dữ liệu (Reset)</button>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', menuHTML);
}

async function clearAllData() {
    if (confirm("Bạn có muốn xoá UUID và Lịch sử chat để test lại từ đầu?")) {
        const db = await initDB();
        const tx1 = db.transaction("user_profile", "readwrite");
        tx1.objectStore("user_profile").clear();
        const tx2 = db.transaction("chat_history", "readwrite");
        tx2.objectStore("chat_history").clear();
        alert("Đã reset dữ liệu thành công. Trang sẽ tải lại.");
        window.location.reload();
    }
}

// Tự động load menu khi trang tải xong
document.addEventListener("DOMContentLoaded", () => {
    renderNavigationMenu();
});