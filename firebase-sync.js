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
// LEGGI ONLINE con risoluzione conflitti
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
// LISTENER real-time per aggiornamenti
// ===============================
function setupListenerRealTime(key, callback) {
  if (!db) return;
  
  db.ref('dati/' + key).on('value', (snapshot) => {
    const data = snapshot.val();
    if (data && data.valore !== undefined) {
      callback(data);
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
// ⭐ NUOVA FUNZIONE: Sincronizza tutte le celle
// ===============================
function sincronizzaTutteLeTextarea() {
  document.querySelectorAll('textarea[data-key]').forEach(textarea => {
    const key = textarea.dataset.key;
    if (!key) return;

    // Leggi valore da Firebase
    leggiOnline(key).then(dataCloud => {
      if (!dataCloud) return;

      const valoreCloud = dataCloud.valore;
      const timestampCloud = dataCloud.timestamp || 0;
      
      // Controlla timestamp locale
      const timestampLocale = parseInt(textarea.dataset.timestamp || 0);
      
      // Se cloud è più recente, aggiorna
      if (timestampCloud > timestampLocale && valoreCloud !== textarea.value) {
        textarea.value = valoreCloud;
        textarea.dataset.timestamp = timestampCloud;
        localStorage.setItem(key, valoreCloud);
        
        // Aggiorna anche Quill se presente
        if (window.quillInstances && window.quillInstances[key]) {
          const quill = window.quillInstances[key];
          quill.clipboard.dangerouslyPasteHTML(valoreCloud);
        }
        
        console.log(`🔄 Aggiornata cella: ${key}`);
      }
    });

    // Setup listener per salvataggio
    if (!textarea.dataset.listenerAttached) {
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
// ⭐ INIZIALIZZAZIONE AL CARICAMENTO
// ===============================
document.addEventListener('DOMContentLoaded', () => {
  console.log("🚀 Inizializzazione Firebase...");
  
  // Inizializza Firebase
  if (initFirebase()) {
    // Carica profilo
    caricaProfiloOnline();
    
    // Aspetta che le tabelle siano create
    setTimeout(() => {
      sincronizzaTutteLeTextarea();
    }, 1000);
    
    // Sincronizza periodicamente
    setInterval(() => {
      sincronizzaTutteLeTextarea();
    }, 10000); // ogni 10 secondi
  }
});

// ===============================
// RILEVA cambio finestra e sincronizza
// ===============================
window.addEventListener('focus', () => {
  console.log("🔄 Finestra in focus - sincronizzazione...");
  if (db) {
    caricaProfiloOnline();
    sincronizzaTutteLeTextarea();
  }
});

// ===============================
// ⭐ OVERRIDE della funzione initQuillEditors
// ===============================
window.addEventListener('DOMContentLoaded', () => {
  // Salva la funzione originale
  const initQuillEditorsOriginal = window.initQuillEditors;
  
  // Override con versione sincronizzata
  window.initQuillEditors = function() {
    // Chiama la funzione originale
    if (typeof initQuillEditorsOriginal === 'function') {
      initQuillEditorsOriginal();
    }
    
    // Aggiungi sincronizzazione Firebase
    setTimeout(() => {
      sincronizzaTutteLeTextarea();
    }, 500);
  };
});
