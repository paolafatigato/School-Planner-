// ===============================
// SINCRONIZZAZIONE FIREBASE
// ===============================

// 🔥 Configurazione Firebase (sostituisci con i tuoi dati)
const firebaseConfig = {
  apiKey: "AIzaSyBcd1234567890abcdefghijkl",
  authDomain: "schoolbank-realtime.firebaseapp.com",
  databaseURL: "https://schoolbank-realtime-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "schoolbank-realtime",
  storageBucket: "schoolbank-realtime.appspot.com",
  messagingSenderId: "1083482501584",
  appId: "1:1083482501584:web:abc123def456"
};

let db = null;
let firebaseInitialized = false;
let listenersAttivi = new Set(); // Traccia i listener già attivi

// ⭐ INIZIALIZZA FIREBASE UNA SOLA VOLTA
function initFirebase() {
  if (typeof firebase === 'undefined') {
    console.error("❌ Firebase SDK non caricato!");
    return false;
  }
  
  if (firebaseInitialized) {
    console.log("✅ Firebase già inizializzato");
    return true;
  }

  try {
    firebase.initializeApp(firebaseConfig);
    db = firebase.database();
    firebaseInitialized = true;
    console.log("✅ Firebase inizializzato con successo");
    return true;
  } catch (err) {
    console.error("❌ Errore inizializzazione Firebase:", err);
    return false;
  }
}

// ===============================
// SALVA ONLINE con timestamp
// ===============================
function salvaOnline(key, value) {
  if (!db) {
    console.warn("⚠️ Database non disponibile");
    return;
  }
  
  const timestamp = new Date().getTime();
  const dispositivo = /Mobile|Android|iPhone/.test(navigator.userAgent) ? 'phone' : 'pc';
  
  db.ref('dati/' + key).set({
    valore: value,
    timestamp: timestamp,
    dispositivo: dispositivo,
    dataModifica: new Date().toISOString()
  }).then(() => {
    console.log(`✅ Salvato su Firebase: ${key}`);
  }).catch(err => {
    console.error("❌ Errore salvataggio Firebase:", err);
  });
}

// ===============================
// LEGGI ONLINE (una volta sola)
// ===============================
function leggiOnline(key) {
  return new Promise((resolve) => {
    if (!db) {
      resolve(null);
      return;
    }
    
    db.ref('dati/' + key).once('value', (snapshot) => {
      const data = snapshot.val();
      if (data && data.valore !== undefined) {
        console.log(`📥 Letto da Firebase: ${key}`);
        resolve(data);
      } else {
        resolve(null);
      }
    }).catch(err => {
      console.error("❌ Errore lettura Firebase:", err);
      resolve(null);
    });
  });
}

// ===============================
// ⭐ ASCOLTA CAMBIAMENTI IN TEMPO REALE
// ===============================
function ascoltaCambiamentiRealTime(key, textarea) {
  if (!db) return;
  
  // Evita di creare listener multipli sulla stessa chiave
  if (listenersAttivi.has(key)) return;
  listenersAttivi.add(key);

  db.ref('dati/' + key).on('value', (snapshot) => {
    const data = snapshot.val();
    if (!data || data.valore === undefined) return;

    const valoreCloud = data.valore;
    const timestampCloud = data.timestamp || 0;
    const valoreLocale = textarea.value;
    const timestampLocale = parseInt(textarea.dataset.timestamp || 0);

    // Aggiorna solo se il cloud è più recente E diverso
    if (timestampCloud > timestampLocale && valoreCloud !== valoreLocale) {
      console.log(`🔄 Aggiornamento real-time: ${key}`);
      
      // Aggiorna textarea
      textarea.value = valoreCloud;
      textarea.dataset.timestamp = timestampCloud;
      localStorage.setItem(key, valoreCloud);

      // ⭐ Aggiorna anche Quill se presente
      if (window.quillInstances && window.quillInstances[key]) {
        const quill = window.quillInstances[key];
        
        // Salva posizione cursore
        const selection = quill.getSelection();
        
        // Aggiorna contenuto
        quill.clipboard.dangerouslyPasteHTML(valoreCloud);
        
        // Ripristina cursore se l'editor era attivo
        if (selection) {
          setTimeout(() => {
            quill.setSelection(selection);
          }, 0);
        }
      }
    }
  });
}

// ===============================
// SINCRONIZZA profilo utente
// ===============================
function salvaProfilo() {
  const profilo = {
    nome: document.getElementById("inputNome").value.trim(),
    cognome: document.getElementById("inputCognome").value.trim(),
    scuola: document.getElementById("inputScuola").value.trim(),
    materie: [
      document.getElementById("materia1").value.trim(),
      document.getElementById("materia2").value.trim(),
      document.getElementById("materia3").value.trim(),
    ].filter(Boolean)
  };

  if (!profilo.materie.length) {
    alert("Devi inserire almeno una materia.");
    return;
  }

  const timestamp = new Date().getTime();

  // Salva in localStorage (cache locale)
  localStorage.setItem("profiloUtente", JSON.stringify(profilo));
  localStorage.setItem("materieInsegnate", JSON.stringify(profilo.materie));
  localStorage.setItem("iconaUtente", iconaSelezionata);
  localStorage.setItem("coloreIcona", coloreSelezionato);
  localStorage.setItem("profiloTimestamp", timestamp);

  // 🔥 Salva online su Firebase
  if (db) {
    db.ref('profilo').set({
      profilo: profilo,
      icona: iconaSelezionata,
      colore: coloreSelezionato,
      timestamp: timestamp,
      ultimoAggiornamento: new Date().toISOString()
    }).then(() => {
      console.log("✅ Profilo salvato su Firebase");
    }).catch(err => {
      console.error("❌ Errore salvataggio profilo:", err);
    });
  }

  aggiornaIconaUtente();
  chiudiModale();
  creaSettimane();
}

// ===============================
// CARICA profilo da online se più recente
// ===============================
function caricaProfiloOnline() {
  if (!db) return;
  
  db.ref('profilo').once('value', (snapshot) => {
    const data = snapshot.val();
    if (!data) {
      console.log("📭 Nessun profilo su Firebase");
      return;
    }
    
    const timestampLocale = parseInt(localStorage.getItem("profiloTimestamp") || 0);
    
    // Se online è più recente, aggiorna
    if (data.timestamp > timestampLocale) {
      localStorage.setItem("profiloUtente", JSON.stringify(data.profilo));
      localStorage.setItem("materieInsegnate", JSON.stringify(data.profilo.materie));
      localStorage.setItem("iconaUtente", data.icona);
      localStorage.setItem("coloreIcona", data.colore);
      localStorage.setItem("profiloTimestamp", data.timestamp);
      
      aggiornaIconaUtente();
      console.log("✅ Profilo aggiornato da Firebase");
      
      // Ricrea le tabelle se siamo nella pagina planner
      if (typeof creaSettimane === 'function') {
        creaSettimane();
      }
    } else {
      console.log("✅ Profilo locale già aggiornato");
    }
  }).catch(err => {
    console.error("❌ Errore caricamento profilo:", err);
  });
}

// ===============================
// ⭐ CONFIGURA tutte le textarea
// ===============================
function configuraTutteLeTextarea() {
  document.querySelectorAll('textarea[data-key]').forEach(textarea => {
    const key = textarea.dataset.key;
    if (!key) return;

    // 1️⃣ Carica valore iniziale da Firebase (una volta)
    leggiOnline(key).then(dataCloud => {
      if (dataCloud && dataCloud.valore) {
        const timestampCloud = dataCloud.timestamp || 0;
        const timestampLocale = parseInt(textarea.dataset.timestamp || 0);
        
        if (timestampCloud > timestampLocale) {
          textarea.value = dataCloud.valore;
          textarea.dataset.timestamp = timestampCloud;
          localStorage.setItem(key, dataCloud.valore);
          
          // Aggiorna Quill se presente
          if (window.quillInstances && window.quillInstances[key]) {
            window.quillInstances[key].clipboard.dangerouslyPasteHTML(dataCloud.valore);
          }
        }
      }
    });

    // 2️⃣ Ascolta cambiamenti in tempo reale
    ascoltaCambiamentiRealTime(key, textarea);

    // 3️⃣ Salva quando l'utente modifica (solo per textarea NON-Quill)
    if (!textarea.dataset.listenerAttached && !textarea.classList.contains('editor-programma')) {
      const saveHandler = () => {
        const v = textarea.value;
        const timestamp = new Date().getTime();
        
        textarea.dataset.timestamp = timestamp;
        localStorage.setItem(key, v);
        salvaOnline(key, v);
      };

      textarea.addEventListener("change", saveHandler);
      textarea.addEventListener("blur", saveHandler);
      textarea.dataset.listenerAttached = "true";
    }
  });
}

// ===============================
// ⭐ CONFIGURA Quill con sincronizzazione Firebase
// ===============================
function configuraQuillConFirebase(quill, textarea, key) {
  if (!quill || !key) return;
  
  console.log(`🎨 Configurazione Quill con Firebase per: ${key}`);
  
  // 1️⃣ Carica valore iniziale da Firebase
  leggiOnline(key).then(dataCloud => {
    if (dataCloud && dataCloud.valore && dataCloud.valore.trim()) {
      const timestampCloud = dataCloud.timestamp || 0;
      const timestampLocale = parseInt(textarea.dataset.timestamp || 0);
      
      if (timestampCloud > timestampLocale) {
        quill.clipboard.dangerouslyPasteHTML(dataCloud.valore);
        textarea.value = dataCloud.valore;
        textarea.dataset.timestamp = timestampCloud;
        localStorage.setItem(key, dataCloud.valore);
      }
    }
  });
  
  // 2️⃣ Ascolta cambiamenti in tempo reale
  ascoltaCambiamentiRealTime(key, textarea);
  
  // 3️⃣ Salva su Firebase quando Quill cambia
  let saveTimeout;
  quill.on('text-change', (delta, oldDelta, source) => {
    // Salva solo se il cambiamento è fatto dall'utente (non da codice)
    if (source === 'user') {
      const html = quill.root.innerHTML;
      const timestamp = new Date().getTime();
      
      textarea.value = html;
      textarea.dataset.timestamp = timestamp;
      localStorage.setItem(key, html);
      
      // Debounce: salva su Firebase dopo 1 secondo di inattività
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(() => {
        salvaOnline(key, html);
      }, 1000);
    }
  });
}

// ===============================
// ⭐ INIZIALIZZAZIONE AL CARICAMENTO
// ===============================
document.addEventListener('DOMContentLoaded', () => {
  console.log("🚀 Inizializzazione Firebase...");
  
  // Inizializza Firebase
  if (initFirebase()) {
    // Carica profilo
    caricaProfiloOnline();
    
    // Aspetta che le tabelle siano create, poi configura
    setTimeout(() => {
      configuraTutteLeTextarea();
    }, 1000);
  }
});

// ===============================
// RILEVA cambio finestra
// ===============================
window.addEventListener('focus', () => {
  console.log("🔄 Finestra in focus - ricarico profilo...");
  if (db) {
    caricaProfiloOnline();
  }
});

// ===============================
// ⭐ OVERRIDE initQuillEditors per sincronizzazione
// ===============================
window.addEventListener('DOMContentLoaded', () => {
  const initQuillEditorsOriginal = window.initQuillEditors;
  
  window.initQuillEditors = function() {
    if (typeof initQuillEditorsOriginal === 'function') {
      initQuillEditorsOriginal();
    }
    
    // Configura Firebase per ogni istanza Quill
    setTimeout(() => {
      if (window.quillInstances) {
        Object.keys(window.quillInstances).forEach(key => {
          const quill = window.quillInstances[key];
          const textarea = document.querySelector(`textarea[data-key="${key}"]`);
          
          if (quill && textarea) {
            configuraQuillConFirebase(quill, textarea, key);
          }
        });
      }
      
      // Riconfigura anche le textarea normali
      configuraTutteLeTextarea();
    }, 500);
  };
});
