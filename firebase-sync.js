// ===============================
// SINCRONIZZAZIONE FIREBASE
// (Versione multi-utente - usa le variabili da firebase-auth-multiuser.js)
// ===============================

// ⚠️ NIENTE configurazione qui! È già in firebase-auth-multiuser.js

let listenersAttivi = new Set();
let tentativiRiconnessione = 0;
const MAX_TENTATIVI = 5;

// ===============================
// CONFIGURA textarea
// ===============================
function configuraTutteLeTextarea() {
  const textareas = document.querySelectorAll('textarea[data-key]');
  console.log(`🔧 Configurazione di ${textareas.length} textarea...`);
  
  textareas.forEach(textarea => {
    const key = textarea.dataset.key;
    if (!key) return;

    // Usa le funzioni multiutente
    if (typeof ascoltaCambiamentiRealTime === 'function') {
      ascoltaCambiamentiRealTime(key, textarea);
    }

    if (!textarea.dataset.listenerAttached && !textarea.classList.contains('editor-programma')) {
      const saveHandler = () => {
        const v = textarea.value;
        const timestamp = new Date().getTime();
        
        textarea.dataset.timestamp = timestamp;
        localStorage.setItem(key, v);
        
        if (typeof salvaOnline === 'function') {
          salvaOnline(key, v);
        }
      };

      textarea.addEventListener("change", saveHandler);
      textarea.addEventListener("blur", saveHandler);
      textarea.dataset.listenerAttached = "true";
    }
  });
}

// ===============================
// ⭐ FUNZIONE PUBBLICA: chiamala DOPO creaSettimane()
// ===============================
window.avviaSincronizzazioneFirebase = function() {
  console.log("🚀 Avvio sincronizzazione Firebase...");
  
  setTimeout(() => {
    configuraTutteLeTextarea();
  }, 500);
};

// ===============================
// FOCUS finestra
// ===============================
window.addEventListener('focus', () => {
  console.log("🔄 Focus - risincronizzazione...");
  
  setTimeout(() => {
    const textareas = document.querySelectorAll('textarea[data-key]');
    if (textareas.length > 0) {
      configuraTutteLeTextarea();
    }
  }, 500);
});
