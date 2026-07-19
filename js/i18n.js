const resources = {
  vi: {
    "nav-home": "Trang Chủ",
    "nav-game": "Cổng Game",
    "hero-title": "Bảo Vệ Cơ Thể",
    "hero-subtitle": "Học cách tự bảo vệ bản thân thông qua các trò chơi tương tác bổ ích.",
    "btn-start": "Bắt Đầu Ngay",
    "btn-instructions": "Xem Hướng Dẫn",
    "portal-title": "Cổng Game Giáo Dục",
    "portal-subtitle": "Chọn một trò chơi bên dưới để bắt đầu học",
    "game-1-title": "Trò chơi: Vùng An Toàn",
    "game-1-desc": "Tìm hiểu về các vùng nhạy cảm trên cơ thể và cách bảo vệ chúng.",
    "game-2-title": "Trò chơi: Nhận Biết Kẻ Xấu",
    "game-2-desc": "Học cách nhận biết các hành vi nguy hiểm từ người lạ.",
    "btn-play": "Chơi Ngay",
    "btn-back": "Quay Lại",
    "footer-text": "© 2024 Dự án Giáo dục Bảo Vệ Cơ Thể."
  },
  en: {
    "nav-home": "Home",
    "nav-game": "Game Portal",
    "hero-title": "Protect Your Body",
    "hero-subtitle": "Learn how to protect yourself through fun and interactive educational games.",
    "btn-start": "Start Now",
    "btn-instructions": "Instructions",
    "portal-title": "Educational Game Portal",
    "portal-subtitle": "Choose a game below to start learning",
    "game-1-title": "Game: Safe Zones",
    "game-1-desc": "Learn about private body parts and how to keep them safe.",
    "game-2-title": "Game: Stranger Danger",
    "game-2-desc": "Learn to identify dangerous behaviors from strangers.",
    "btn-play": "Play Now",
    "btn-back": "Go Back",
    "footer-text": "© 2024 Protect Your Body Education Project."
  }
};

function applyTranslations(lang) {
  document.querySelectorAll("[data-i18n]").forEach(element => {
    const key = element.getAttribute("data-i18n");
    if (resources[lang] && resources[lang][key]) {
      element.textContent = resources[lang][key];
    }
  });
  document.documentElement.setAttribute("lang", lang);
  
  const toggleBtn = document.getElementById("lang-toggle-btn");
  if (toggleBtn) {
    toggleBtn.textContent = lang === "vi" ? "EN" : "VI";
  }
}

function injectLangToggle() {
  if (document.getElementById("lang-toggle-container")) return;
  
  const container = document.createElement("div");
  container.id = "lang-toggle-container";
  container.style.position = "fixed";
  container.style.top = "20px";
  container.style.right = "20px";
  container.style.zIndex = "1000";
  
  const button = document.createElement("button");
  button.id = "lang-toggle-btn";
  button.style.padding = "10px 20px";
  button.style.fontSize = "14px";
  button.style.fontWeight = "bold";
  button.style.cursor = "pointer";
  button.style.border = "none";
  button.style.backgroundColor = "#2c3e50";
  button.style.color = "#fff";
  button.style.borderRadius = "30px";
  button.style.boxShadow = "0 4px 15px rgba(0,0,0,0.2)";
  button.style.transition = "all 0.3s ease";
  
  button.addEventListener("mouseover", () => {
    button.style.transform = "scale(1.05)";
    button.style.backgroundColor = "#34495e";
  });
  button.addEventListener("mouseout", () => {
    button.style.transform = "scale(1)";
    button.style.backgroundColor = "#2c3e50";
  });

  container.appendChild(button);
  document.body.appendChild(container);
}

document.addEventListener("DOMContentLoaded", () => {
  injectLangToggle();
  
  let currentLang = localStorage.getItem("lang") || "vi";
  applyTranslations(currentLang);

  const toggleBtn = document.getElementById("lang-toggle-btn");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      currentLang = currentLang === "vi" ? "en" : "vi";
      localStorage.setItem("lang", currentLang);
      applyTranslations(currentLang);
    });
  }
});