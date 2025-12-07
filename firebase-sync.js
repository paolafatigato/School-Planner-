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
let listenersAttivi = new Set();
let tentativiRiconnessione = 0;
const MAX_TENTATIVI = 5;

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
    
    // ⭐ Abilita persistenza offline
    db.ref('.info/connected').on('value', (snapshot) => {
      if (snapshot.val() === true) {
        console.log('✅ Connesso a Firebase');
        tentativiRiconnessione = 0;
      } else {
        console.log('⚠️ Disconnesso da Firebase - tentativo riconnessione...');
        tentativiRiconnessione++;
        
        if (tentativiRiconnessione < MAX_TENTATIVI) {
          setTimeout(() => {
            console.log(`🔄 Tentativo ${tentativiRiconnessione}/${MAX_TENTATIVI}`);
          }, 2000);
        }
      }
    });
    
    firebaseInitialized = true;
    console.log("✅ Firebase inizializzato con successo");
    return true;
  } catch (err) {
    console.error("❌ Errore inizializzazione Firebase:", err);
    return false;
  }
}

// ===============================
// SALVA ONLINE con retry
// ===============================
function salvaOnline(key, value, retry = 0) {
  if (!db) {
    console.warn("⚠️ Database non disponibile");
    return Promise.reject('Database non disponibile');
  }
  
  const timestamp = new Date().getTime();
  const dispositivo = /Mobile|Android|iPhone/.test(navigator.userAgent) ? 'phone' : 'pc';
  
  return db.ref('dati/' + key).set({
    valore: value,
    timestamp: timestamp,
    dispositivo: dispositivo,
    dataModifica: new Date().toISOString()
  }).then(() => {
    console.log(`✅ Salvato su Firebase: ${key}`);
  }).catch(err => {
    console.error("❌ Errore salvataggio Firebase:", err);
    
    // Retry automatico fino a 3 volte
    if (retry < 3) {
      console.log(`🔄 Retry salvataggio ${retry + 1}/3...`);
      return new Promise(resolve => {
        setTimeout(() => {
          resolve(salvaOnline(key, value, retry + 1));
        }, 2000);
      });
    }
  });
}

// ===============================
// LEGGI ONLINE con timeout
// ===============================
function leggiOnline(key, timeout = 5000) {
  return new Promise((resolve) => {
    if (!db) {
      resolve(null);
      return;
    }
    
    let resolved = false;
    
    // Timeout di sicurezza
    const timeoutId = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        console.warn(`⏱️ Timeout lettura: ${key}`);
        resolve(null);
      }
    }, timeout);
    
    db.ref('dati/' + key).once('value', (snapshot) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timeoutId);
      
      const data = snapshot.val();
      if (data && data.valore !== undefined) {
        console.log(`📥 Letto da Firebase: ${key}`);
        resolve(data);
      } else {
        resolve(null);
      }
    }).catch(err => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timeoutId);
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
  
  if (listenersAttivi.has(key)) return;
  listenersAttivi.add(key);

  const ref = db.ref('dati/' + key);
  
  ref.on('value', (snapshot) => {
    const data = snapshot.val();
    if (!data || data.valore === undefined) return;

    const valoreCloud = data.valore;
    const timestampCloud = data.timestamp || 0;
    const valoreLocale = textarea.value;
    const timestampLocale = parseInt(textarea.dataset.timestamp || 0);

    // Aggiorna solo se cloud è più recente E diverso
    if (timestampCloud > timestampLocale && valoreCloud !== valoreLocale) {
      console.log(`🔄 Aggiornamento real-time: ${key} (${data.dispositivo})`);
      
      textarea.value = valoreCloud;
      textarea.dataset.timestamp = timestampCloud;
      localStorage.setItem(key, valoreCloud);

      // Aggiorna Quill se presente
      if (window.quillInstances && window.quillInstances[key]) {
        const quill = window.quillInstances[key];
        const selection = quill.getSelection();
        
        quill.clipboard.dangerouslyPasteHTML(valoreCloud);
        
        if (selection) {
          setTimeout(() => quill.setSelection(selection), 0);
        }
      }
    }
  }, (error) => {
    console.error(`❌ Errore listener ${key}:`, error);
    listenersAttivi.delete(key);
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

  localStorage.setItem("profiloUtente", JSON.stringify(profilo));
  localStorage.setItem("materieInsegnate", JSON.stringify(profilo.materie));
  localStorage.setItem("iconaUtente", iconaSelezionata);
  localStorage.setItem("coloreIcona", coloreSelezionato);
  localStorage.setItem("profiloTimestamp", timestamp);

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
// CARICA profilo da online
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
    
    if (data.timestamp > timestampLocale) {
      localStorage.setItem("profiloUtente", JSON.stringify(data.profilo));
      localStorage.setItem("materieInsegnate", JSON.stringify(data.profilo.materie));
      localStorage.setItem("iconaUtente", data.icona);
      localStorage.setItem("coloreIcona", data.colore);
      localStorage.setItem("profiloTimestamp", data.timestamp);
      
      aggiornaIconaUtente();
      console.log("✅ Profilo aggiornato da Firebase");
      
      if (typeof creaSettimane === 'function') {
        creaSettimane();
      }
    }
  }).catch(err => {
    console.error("❌ Errore caricamento profilo:", err);
  });
}

// ===============================
// ⭐ SINCRONIZZAZIONE MASSIVA al caricamento
// ===============================
function sincronizzazioneMassiva() {
  if (!db) return;
  
  console.log("🔄 Sincronizzazione massiva in corso...");
  
  // Carica TUTTI i dati da Firebase in una volta
  db.ref('dati').once('value', (snapshot) => {
    const datiCloud = snapshot.val();
    if (!datiCloud) {
      console.log("📭 Nessun dato su Firebase");
      return;
    }
    
    let aggiornamenti = 0;
    
    Object.keys(datiCloud).forEach(key => {
      const data = datiCloud[key];
      const textarea = document.querySelector(`textarea[data-key="${key}"]`);
      
      if (textarea && data.valore !== undefined) {
        const timestampCloud = data.timestamp || 0;
        const timestampLocale = parseInt(textarea.dataset.timestamp || 0);
        
        if (timestampCloud > timestampLocale) {
          textarea.value = data.valore;
          textarea.dataset.timestamp = timestampCloud;
          localStorage.setItem(key, data.valore);
          
          // Aggiorna Quill
          if (window.quillInstances && window.quillInstances[key]) {
            window.quillInstances[key].clipboard.dangerouslyPasteHTML(data.valore);
          }
          
          aggiornamenti++;
        }
      }
    });
    
    console.log(`✅ Sincronizzazione completata: ${aggiornamenti} celle aggiornate`);
  }).catch(err => {
    console.error("❌ Errore sincronizzazione massiva:", err);
  });
}

// ===============================
// CONFIGURA textarea
// ===============================
function configuraTutteLeTextarea() {
  document.querySelectorAll('textarea[data-key]').forEach(textarea => {
    const key = textarea.dataset.key;
    if (!key) return;

    // Ascolta cambiamenti real-time
    ascoltaCambiamentiRealTime(key, textarea);

    // Salva quando modifica (solo textarea NON-Quill)
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
// CONFIGURA Quill
// ===============================
function configuraQuillConFirebase(quill, textarea, key) {
  if (!quill || !key) return;
  
  console.log(`🎨 Configurazione Quill: ${key}`);
  
  // Ascolta cambiamenti real-time
  ascoltaCambiamentiRealTime(key, textarea);
  
  // Salva quando Quill cambia
  let saveTimeout;
  quill.on('text-change', (delta, oldDelta, source) => {
    if (source === 'user') {
      const html = quill.root.innerHTML;
      const timestamp = new Date().getTime();
      
      textarea.value = html;
      textarea.dataset.timestamp = timestamp;
      localStorage.setItem(key, html);
      
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(() => {
        salvaOnline(key, html);
      }, 1000);
    }
  });
}

// ===============================
// INIZIALIZZAZIONE
// ===============================
document.addEventListener('DOMContentLoaded', () => {
  console.log("🚀 Inizializzazione Firebase...");
  
  if (initFirebase()) {
    caricaProfiloOnline();
    
    // Sincronizzazione massiva dopo 2 secondi
    setTimeout(() => {
      sincronizzazioneMassiva();
      configuraTutteLeTextarea();
    }, 2000);
  }
});

// ===============================
// FOCUS finestra
// ===============================
window.addEventListener('focus', () => {
  console.log("🔄 Focus - risincronizzazione...");
  if (db) {
    caricaProfiloOnline();
    sincronizzazioneMassiva();
  }
});

// ===============================
// OVERRIDE initQuillEditors
// ===============================
window.addEventListener('DOMContentLoaded', () => {
  const initQuillEditorsOriginal = window.initQuillEditors;
  
  window.initQuillEditors = function() {
    if (typeof initQuillEditorsOriginal === 'function') {
      initQuillEditorsOriginal();
    }
    
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
      
      configuraTutteLeTextarea();
    }, 500);
  };
});
