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

// Inizializza Firebase quando disponibile
function initFirebase() {
  if (typeof firebase !== 'undefined' && !db) {
    firebase.initializeApp(firebaseConfig);
    db = firebase.database();
    console.log("✅ Firebase inizializzato");
  }
}

// Chiama al caricamento pagina
document.addEventListener('DOMContentLoaded', initFirebase);

// ===============================
// NUOVO: Salva ONLINE con timestamp
// ===============================
function salvaOnline(key, value) {
  if (!db) return;
  
  const timestamp = new Date().getTime();
  const dispositivo = /Mobile|Android|iPhone/.test(navigator.userAgent) ? 'phone' : 'pc';
  
  db.ref('dati/' + key).set({
    valore: value,
    timestamp: timestamp,
    dispositivo: dispositivo,
    dataModifica: new Date().toISOString()
  }).catch(err => {
    console.error("❌ Errore salvataggio Firebase:", err);
  });
}

// ===============================
// NUOVO: Leggi ONLINE con risoluzione conflitti
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
        resolve(data.valore);
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
// NUOVO: Listener real-time per aggiornamenti
// ===============================
function setupListenerRealTime(key, callback) {
  if (!db) return;
  
  db.ref('dati/' + key).on('value', (snapshot) => {
    const data = snapshot.val();
    if (data && data.valore !== undefined) {
      callback(data.valore);
    }
  });
}

// ===============================
// NUOVO: Sincronizza profilo utente
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

  // Salva in localStorage (cache locale)
  localStorage.setItem("profiloUtente", JSON.stringify(profilo));
  localStorage.setItem("materieInsegnate", JSON.stringify(profilo.materie));
  localStorage.setItem("iconaUtente", iconaSelezionata);
  localStorage.setItem("coloreIcona", coloreSelezionato);

  // 🔥 NUOVO: Salva online su Firebase
  if (db) {
    const timestamp = new Date().getTime();
    db.ref('profilo').set({
      profilo: profilo,
      icona: iconaSelezionata,
      colore: coloreSelezionato,
      timestamp: timestamp,
      ultimoAggiornamento: new Date().toISOString()
    }).catch(err => console.error("Errore salvataggio profilo:", err));
  }

  aggiornaIconaUtente();
  chiudiModale();
  creaSettimane();
}

// ===============================
// NUOVO: Carica profilo da online se più recente
// ===============================
function caricaProfiloOnline() {
  if (!db) return;
  
  db.ref('profilo').once('value', (snapshot) => {
    const data = snapshot.val();
    if (!data) return;
    
    const profiloLocale = JSON.parse(localStorage.getItem("profiloUtente")) || {};
    const timestampLocale = localStorage.getItem("profiloTimestamp") || 0;
    
    // Se online è più recente, aggiorna
    if (data.timestamp > timestampLocale) {
      localStorage.setItem("profiloUtente", JSON.stringify(data.profilo));
      localStorage.setItem("materieInsegnate", JSON.stringify(data.profilo.materie));
      localStorage.setItem("iconaUtente", data.icona);
      localStorage.setItem("coloreIcona", data.colore);
      localStorage.setItem("profiloTimestamp", data.timestamp);
      
      aggiornaIconaUtente();
      console.log("✅ Profilo aggiornato da cloud");
    }
  }).catch(err => console.error("Errore caricamento profilo:", err));
}

// ===============================
// MIGLIORATO: Apertura modale con profilo online
// ===============================
document.getElementById("userIcon").addEventListener("click", () => {
  document.getElementById("modalProfilo").style.display = "flex";

  const profilo = JSON.parse(localStorage.getItem("profiloUtente")) || {};
  document.getElementById("inputNome").value = profilo.nome || "";
  document.getElementById("inputCognome").value = profilo.cognome || "";
  document.getElementById("inputScuola").value = profilo.scuola || "";
  document.getElementById("materia1").value = profilo.materie?.[0] || "";
  document.getElementById("materia2").value = profilo.materie?.[1] || "";
  document.getElementById("materia3").value = profilo.materie?.[2] || "";

  document.querySelectorAll('.icona-opzione').forEach(div => {
    div.classList.toggle('selezionata', div.dataset.src === iconaSelezionata);
  });

  document.querySelectorAll('.colore-opzione').forEach(div => {
    const divColor = rgbToHex(getComputedStyle(div).backgroundColor);
    div.classList.toggle('selezionata', divColor === coloreSelezionato);
  });

  aggiornaAnteprimaIcone(coloreSelezionato);
  
  // 🔥 NUOVO: Carica profilo online se disponibile
  caricaProfiloOnline();
});

// ===============================
// MIGLIORATO: Salvataggio textarea con sincronizzazione
// ===============================
function setupTextareaSyncronizzata(textarea, chiave) {
  if (!chiave) return;
  
  // 1️⃣ Leggi da cloud prima
  leggiOnline(chiave).then(valoreCloud => {
    if (valoreCloud && valoreCloud.trim()) {
      textarea.value = valoreCloud;
      localStorage.setItem(chiave, valoreCloud);
    } else {
      // 2️⃣ Se non online, usa locale
      const valoreSalvato = localStorage.getItem(chiave);
      if (valoreSalvato) textarea.value = valoreSalvato;
    }
  });

  // 3️⃣ Ascolta cambiamenti in tempo reale
  if (db) {
    db.ref('dati/' + chiave).on('value', (snapshot) => {
      const data = snapshot.val();
      if (data && data.valore !== undefined) {
        const valoreCloud = data.valore;
        const valoreLocale = textarea.value;
        
        // Se il cloud è diverso dal locale E più recente, aggiorna
        if (valoreCloud !== valoreLocale) {
          // Controlla il timestamp per evitare sovrascritture
          const timestampCloud = data.timestamp || 0;
          const timestampLocale = parseInt(textarea.dataset.timestamp || 0);
          
          if (timestampCloud > timestampLocale) {
            textarea.value = valoreCloud;
            textarea.dataset.timestamp = timestampCloud;
            
            // Se è un editor Quill, aggiorna anche lì
            const wrapper = textarea.closest('.quill-wrapper');
            if (wrapper && window.quillInstances && window.quillInstances[chiave]) {
              const quill = window.quillInstances[chiave];
              quill.clipboard.dangerouslyPasteHTML(valoreCloud);
            }
          }
        }
      }
    });
  }

  // 4️⃣ Salva locale + online quando cambia
  const saveHandler = () => {
    const v = textarea.value;
    const timestamp = new Date().getTime();
    
    textarea.dataset.timestamp = timestamp;
    localStorage.setItem(chiave, v);
    salvaOnline(chiave, v);
  };

  textarea.addEventListener("change", saveHandler);
  textarea.addEventListener("blur", saveHandler);
}

// ===============================
// MIGLIORATO: Quill editor con sincronizzazione
// ===============================
function initQuillEditors() {
  document.querySelectorAll('textarea.editor-programma').forEach((textarea) => {
    if (textarea.dataset.quillified === '1') return;

    const key = textarea.dataset.key;
    const parent = textarea.parentElement;

    const wrapper = document.createElement('div');
    wrapper.className = 'quill-wrapper';
    const editor = document.createElement('div');
    editor.className = 'quill-editor';

    parent.insertBefore(wrapper, textarea);
    wrapper.appendChild(editor);

    textarea.style.position = 'absolute';
    textarea.style.left = '-10000px';
    textarea.style.width = '1px';
    textarea.style.height = '1px';
    textarea.style.opacity = '0';

    const toolbarOptions = [
      [{ list: 'check' }],
      ['bold', 'italic'],
      [{ list: 'ordered' }, { list: 'bullet' }]
    ];

    const quill = new Quill(editor, {
      theme: 'snow',
      modules: { toolbar: toolbarOptions }
    });

    // Salva istanza Quill globale per accesso da altre funzioni
    if (!window.quillInstances) window.quillInstances = {};
    window.quillInstances[key] = quill;

    // Carica valore: prima cloud, poi locale
    const saved = key ? localStorage.getItem(key) : null;
    if (saved && saved.trim()) {
      quill.clipboard.dangerouslyPasteHTML(saved);
      textarea.value = saved;
    } else if (textarea.value && textarea.value.trim()) {
      quill.clipboard.dangerouslyPasteHTML(textarea.value);
    }

    // Tenta cloud se locale è vuoto
    if (key && (!saved || !saved.trim())) {
      leggiOnline(key).then(valoreCloud => {
        if (valoreCloud && valoreCloud.trim()) {
          quill.clipboard.dangerouslyPasteHTML(valoreCloud);
          textarea.value = valoreCloud;
          localStorage.setItem(key, valoreCloud);
        }
      });
    }

    // Sync: Quill -> textarea -> localStorage + cloud
    const syncAll = () => {
      const html = quill.root.innerHTML;
      textarea.value = html;
      if (key) {
        localStorage.setItem(key, html);
        salvaOnline(key, html);
      }
    };

    quill.on('text-change', syncAll);

    // Focus per toolbar
    quill.on('selection-change', (range) => {
      if (range) {
        wrapper.classList.add('focus');
      } else {
        setTimeout(() => {
          if (!document.activeElement.closest('.ql-toolbar')) {
            wrapper.classList.remove('focus');
          }
        }, 150);
      }
    });

    textarea.dataset.quillified = '1';
    wrapper.dataset.key = key || '';

    syncAll();
  });
}

// ===============================
// NUOVO: Sincronizzazione periodica
// ===============================
function avviaSync() {
  // Sincronizza ogni 5 secondi
  setInterval(() => {
    // Se online è disponibile, carica profilo
    caricaProfiloOnline();
    
    // Sincronizza tutte le celle visibili
    document.querySelectorAll('textarea[data-key]').forEach(textarea => {
      const key = textarea.dataset.key;
      if (key) {
        setupTextareaSyncronizzata(textarea, key);
      }
    });
  }, 5000);
}

// Inizia sincronizzazione al caricamento
document.addEventListener('DOMContentLoaded', avviaSync);

// ===============================
// NUOVO: Rileva cambio dispositivo e sincronizza
// ===============================
window.addEventListener('focus', () => {
  console.log("🔄 App rientrato in focus - sincronizzazione...");
  caricaProfiloOnline();
});

// ===============================
// ALERT: Conflitto dati rilevato
// ===============================
function gestisciConflitto(key, valoreLocale, valoreCloud, timestampLocale, timestampCloud) {
  // Usa il più recente (timestamp)
  if (timestampCloud > timestampLocale) {
    console.log(`⚠️  Conflitto su ${key}: vince versione cloud (più recente)`);
    return valoreCloud;
  } else {
    console.log(`⚠️  Conflitto su ${key}: vince versione locale (più recente)`);
    return valoreLocale;
  }
}
