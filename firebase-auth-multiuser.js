// ===============================
// FIREBASE AUTH + MULTI-USER
// ===============================

// 🔥 Configurazione Firebase (sostituisci con i tuoi dati)
const firebaseConfig = {
  apiKey: "AIzaSyCuRzRCJmRVKiGHSVOBAxNsjeqKLDBaebI",
  authDomain: "schoolplanner-conid.firebaseapp.com",
  databaseURL: "https://schoolplanner-conid-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "schoolplanner-conid",
  storageBucket: "schoolplanner-conid.firebasestorage.app",
  messagingSenderId: "929831649456",
  appId: "1:929831649456:web:2344922202a867d5093b75",
  measurementId: "G-95VXRYLWZ4"
};

let db = null;
let auth = null;
let currentUser = null;
let htmlOriginale = null; // ⭐ SALVA L'HTML ORIGINALE
let authInitialized = false; // ⭐ PREVIENE LOOP

// ===============================
// INIZIALIZZAZIONE
// ===============================
function initFirebase() {
  if (typeof firebase === 'undefined') {
    console.error("❌ Firebase SDK non caricato!");
    return false;
  }

  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    
    db = firebase.database();
    auth = firebase.auth();
    
    // ⭐ SALVA HTML ORIGINALE PRIMA DI MODIFICARLO
    if (!htmlOriginale) {
      htmlOriginale = document.body.innerHTML;
    }
    
    // Listener per stato autenticazione
    auth.onAuthStateChanged(user => {
      if (user) {
        currentUser = user;
        console.log("✅ Utente autenticato:", user.email);
        
        // ⭐ PREVIENI LOOP: esegui solo una volta
        if (!authInitialized) {
          authInitialized = true;
          onUserLoggedIn(user);
        }
      } else {
        currentUser = null;
        authInitialized = false;
        console.log("👤 Nessun utente autenticato");
        
        // ⭐ Mostra login solo se non siamo già nella schermata
        if (!document.getElementById('login-screen')) {
          mostraSchermataLogin();
        }
      }
    });
    
    console.log("✅ Firebase inizializzato");
    return true;
  } catch (err) {
    console.error("❌ Errore inizializzazione:", err);
    return false;
  }
}

// ===============================
// AUTENTICAZIONE
// ===============================

// Registrazione nuovo utente
async function registraUtente(email, password, nome, cognome) {
  try {
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;
    
    // Salva profilo iniziale
    await db.ref(`users/${user.uid}/profilo`).set({
      email: email,
      nome: nome,
      cognome: cognome,
      dataCreazione: new Date().toISOString()
    });
    
    console.log("✅ Utente registrato:", email);
    return { success: true, user };
  } catch (error) {
    console.error("❌ Errore registrazione:", error);
    return { success: false, error: getMsgErrore(error.code) };
  }
}

// Login
async function login(email, password) {
  try {
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    console.log("✅ Login effettuato:", email);
    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error("❌ Errore login:", error);
    return { success: false, error: getMsgErrore(error.code) };
  }
}

// Logout
async function logout() {
  try {
    await auth.signOut();
    console.log("✅ Logout effettuato");
    localStorage.clear();
    location.reload(); // Ricarica la pagina
  } catch (error) {
    console.error("❌ Errore logout:", error);
  }
}

// Reset password
async function resetPassword(email) {
  try {
    await auth.sendPasswordResetEmail(email);
    return { success: true };
  } catch (error) {
    console.error("❌ Errore reset password:", error);
    return { success: false, error: getMsgErrore(error.code) };
  }
}

// Traduci errori Firebase in italiano
function getMsgErrore(code) {
  const errori = {
    'auth/email-already-in-use': 'Email già registrata',
    'auth/invalid-email': 'Email non valida',
    'auth/operation-not-allowed': 'Operazione non consentita',
    'auth/weak-password': 'Password troppo debole (minimo 6 caratteri)',
    'auth/user-disabled': 'Account disabilitato',
    'auth/user-not-found': 'Utente non trovato',
    'auth/wrong-password': 'Password errata',
    'auth/too-many-requests': 'Troppi tentativi. Riprova più tardi',
    'auth/network-request-failed': 'Errore di rete. Controlla la connessione'
  };
  return errori[code] || code;
}

// ===============================
// GESTIONE DATI UTENTE
// ===============================

// Salva dati con percorso utente
function salvaOnline(key, value) {
  if (!currentUser) {
    console.warn("⚠️ Utente non autenticato");
    return Promise.reject('Utente non autenticato');
  }
  
  const userPath = `users/${currentUser.uid}/dati/${key}`;
  const timestamp = new Date().getTime();
  
  return db.ref(userPath).set({
    valore: value,
    timestamp: timestamp,
    dataModifica: new Date().toISOString()
  }).then(() => {
    console.log(`✅ Salvato: ${key}`);
    localStorage.setItem(key, value);
  }).catch(err => {
    console.error("❌ Errore salvataggio:", err);
  });
}

// Elimina dati utente
function eliminaOnline(key) {
  if (!currentUser) {
    console.warn("⚠️ Utente non autenticato");
    return Promise.reject('Utente non autenticato');
  }

  const userPath = `users/${currentUser.uid}/dati/${key}`;

  return db.ref(userPath).remove().then(() => {
    console.log(`🗑️ Eliminato: ${key}`);
  }).catch(err => {
    console.error("❌ Errore eliminazione:", err);
  });
}

// Leggi dati utente
function leggiOnline(key, timeout = 5000) {
  return new Promise((resolve) => {
    if (!currentUser) {
      resolve(null);
      return;
    }
    
    const userPath = `users/${currentUser.uid}/dati/${key}`;
    let resolved = false;
    
    const timeoutId = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve(null);
      }
    }, timeout);
    
    db.ref(userPath).once('value', (snapshot) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timeoutId);
      
      const data = snapshot.val();
      resolve(data ? data : null);
    }).catch(err => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timeoutId);
      console.error("❌ Errore lettura:", err);
      resolve(null);
    });
  });
}

// ⭐ TRACCIA QUALE EDITOR HA IL FOCUS
let editorAttivo = null;
let ultimaModificaLocale = {};

// Listener globale per tracciare il focus su Quill
document.addEventListener('focusin', (e) => {
  const quillEditor = e.target.closest('.quill-editor');
  if (quillEditor) {
    const wrapper = quillEditor.closest('.quill-wrapper');
    if (wrapper && wrapper.dataset.key) {
      editorAttivo = wrapper.dataset.key;
      console.log(`🎯 Focus su editor: ${editorAttivo}`);
    }
  }
});

document.addEventListener('focusout', (e) => {
  const quillEditor = e.target.closest('.quill-editor');
  if (quillEditor) {
    // Ritarda il reset per evitare falsi positivi durante il click sulla toolbar
    setTimeout(() => {
      const activeQuill = document.activeElement.closest('.quill-editor, .ql-toolbar');
      if (!activeQuill) {
        console.log(`👋 Focus perso da editor: ${editorAttivo}`);
        editorAttivo = null;
      }
    }, 200);
  }
});

// Ascolta cambiamenti real-time (versione migliorata - NON sovrascrive mentre scrivi)
function ascoltaCambiamentiRealTime(key, textarea) {
  if (!currentUser) return;
  
  const userPath = `users/${currentUser.uid}/dati/${key}`;
  
  db.ref(userPath).on('value', (snapshot) => {
    const data = snapshot.val();
    if (!data || data.valore === undefined) return;
    
    const valoreCloud = data.valore;
    const timestampCloud = data.timestamp || 0;
    const timestampLocale = parseInt(textarea.dataset.timestamp || 0);
    
    // ⭐ CONDIZIONE 1: Non aggiornare se questo editor ha il focus
    if (editorAttivo === key) {
      console.log(`⏸️ Skip sync per ${key}: editor attivo`);
      return;
    }
    
    // ⭐ CONDIZIONE 2: Non aggiornare se la modifica locale è recente (< 3 secondi)
    const ultimaModifica = ultimaModificaLocale[key] || 0;
    const tempoPassato = Date.now() - ultimaModifica;
    if (tempoPassato < 3000) {
      console.log(`⏸️ Skip sync per ${key}: modifica recente (${tempoPassato}ms fa)`);
      return;
    }
    
    // ⭐ CONDIZIONE 3: Aggiorna solo se il timestamp cloud è davvero più recente
    if (timestampCloud > timestampLocale) {
      console.log(`☁️ Sync da cloud: ${key}`);
      textarea.value = valoreCloud;
      textarea.dataset.timestamp = timestampCloud;
      localStorage.setItem(key, valoreCloud);
      
      // Aggiorna Quill se presente E se non ha il focus
      if (window.quillInstances && window.quillInstances[key]) {
        const quill = window.quillInstances[key];
        
        // Controlla se Quill ha il focus
        const hasFocus = quill.hasFocus();
        if (!hasFocus) {
          const currentLength = quill.getLength();
          quill.deleteText(0, currentLength);
          quill.clipboard.dangerouslyPasteHTML(0, valoreCloud);
        } else {
          console.log(`⏸️ Skip Quill update per ${key}: ha il focus`);
        }
      }
    }
  });
}

// ⭐ FUNZIONE HELPER: chiamala quando l'utente modifica localmente
function segnaModificaLocale(key) {
  ultimaModificaLocale[key] = Date.now();
}

// Salva profilo utente
async function salvaProfiloMultiuser(profilo) {
  if (!currentUser) return;
  
  const timestamp = new Date().getTime();
  
  await db.ref(`users/${currentUser.uid}/profilo`).update({
    ...profilo,
    timestamp: timestamp,
    ultimoAggiornamento: new Date().toISOString()
  });
  
  console.log("✅ Profilo salvato");
}

// Carica profilo utente
async function caricaProfiloMultiuser() {
  if (!currentUser) return null;
  
  const snapshot = await db.ref(`users/${currentUser.uid}/profilo`).once('value');
  return snapshot.val();
}

// ===============================
// UI - SCHERMATA LOGIN
// ===============================
function mostraSchermataLogin() {
  document.body.innerHTML = `
    <div id="login-screen">
      <div class="login-container">
        <h1 class="login-title">Planner Scolastico</h1>
        
        <div id="login-form">
          <input type="email" id="login-email" placeholder="Email" class="login-input">
          <input type="password" id="login-password" placeholder="Password" class="login-input">
          
          <button id="btn-login" class="btn-primary">Accedi</button>
          <button id="btn-register-toggle" class="btn-secondary">Registrati</button>
          <button id="btn-reset-password" class="btn-text">Password dimenticata?</button>
          
          <div id="login-message" class="message-box"></div>
        </div>
        
        <div id="register-form" style="display: none;">
          <input type="text" id="register-nome" placeholder="Nome" class="login-input">
          <input type="text" id="register-cognome" placeholder="Cognome" class="login-input">
          <input type="email" id="register-email" placeholder="Email" class="login-input">
          <input type="password" id="register-password" placeholder="Password (min 6 caratteri)" class="login-input">
          
          <button id="btn-register" class="btn-primary">Crea Account</button>
          <button id="btn-back-to-login" class="btn-secondary">Torna al Login</button>
          
          <div id="register-message" class="message-box"></div>
        </div>
      </div>
    </div>
  `;
  
  setupLoginHandlers();
}

// ===============================
// SETUP LOGIN HANDLERS - VERSIONE CON REDIRECT
// ===============================
function setupLoginHandlers() {
  // Toggle tra login e registrazione
  document.getElementById('btn-register-toggle').onclick = () => {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-form').style.display = 'block';
  };
  
  document.getElementById('btn-back-to-login').onclick = () => {
    document.getElementById('register-form').style.display = 'none';
    document.getElementById('login-form').style.display = 'block';
  };
  
  // ✅ Login con redirect immediato
  document.getElementById('btn-login').onclick = async () => {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    if (!email || !password) {
      mostraMessaggio('login-message', {
        success: false,
        error: 'Inserisci email e password'
      });
      return;
    }
    
    const result = await login(email, password);
    if (!result.success) {
      mostraMessaggio('login-message', result);
    } else {
      // ✅ REDIRECT IMMEDIATO dopo login riuscito
      console.log("✅ Login completato, redirect a index.html");
      window.location.href = 'index.html';
    }
  };
  
  // ✅ Registrazione con redirect immediato
  document.getElementById('btn-register').onclick = async () => {
    const nome = document.getElementById('register-nome').value;
    const cognome = document.getElementById('register-cognome').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    
    if (!email || !password) {
      mostraMessaggio('register-message', {
        success: false,
        error: 'Inserisci email e password'
      });
      return;
    }
    
    if (password.length < 6) {
      mostraMessaggio('register-message', {
        success: false,
        error: 'La password deve essere di almeno 6 caratteri'
      });
      return;
    }
    
    const result = await registraUtente(email, password, nome, cognome);
    if (!result.success) {
      mostraMessaggio('register-message', result);
    } else {
      // ✅ REDIRECT IMMEDIATO dopo registrazione riuscita
      console.log("✅ Registrazione completata, redirect a index.html");
      window.location.href = 'index.html';
    }
  };
  
  // Reset password
  document.getElementById('btn-reset-password').onclick = async () => {
    const email = prompt('Inserisci la tua email:');
    if (email) {
      const result = await resetPassword(email);
      if (result.success) {
        alert('Email di reset inviata! Controlla la tua casella di posta.');
      } else {
        alert('Errore: ' + result.error);
      }
    }
  };
  
  // Enter per login
  document.getElementById('login-password').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      document.getElementById('btn-login').click();
    }
  });
}

// ===============================
// QUANDO UTENTE È LOGGATO - VERSIONE SEMPLIFICATA
// ===============================
function onUserLoggedIn(user) {
  console.log("📄 Utente già autenticato:", user.email);
  
  const currentPage = window.location.pathname.split('/').pop();
  
  // Carica profilo utente
  caricaProfiloMultiuser().then(profilo => {
    if (profilo && profilo.materie) {
      localStorage.setItem('profiloUtente', JSON.stringify(profilo));
      localStorage.setItem('materieInsegnate', JSON.stringify(profilo.materie));
      if (profilo.icona) localStorage.setItem('iconaUtente', profilo.icona);
      if (profilo.colore) localStorage.setItem('coloreIcona', profilo.colore);
    }

    if (typeof sincronizzaColorePupiniConTema === 'function') {
      sincronizzaColorePupiniConTema();
    }
    
    // ✅ Rimuovi sempre login screen se presente
    const loginScreen = document.getElementById('login-screen');
    if (loginScreen) {
      loginScreen.remove();
      console.log("✅ Login screen rimossa");
    }
    
    // ✅ Se sei su index.html, mostra l'interfaccia utente
    if (currentPage === 'index.html' || currentPage === '') {
      // Il calendario è già caricato dall'HTML, non serve fare altro
      console.log("✅ Calendario visibile");
      aggiungiInterfacciaLogoutCalendario();
    }
    // ✅ Se sei su planner.html, carica l'app
    else if (currentPage === 'planner.html') {
      setTimeout(() => {
        aggiungiPulsanteLogout();
        
        if (typeof aggiornaIconaUtente === 'function') {
          aggiornaIconaUtente();
        }
        
        if (typeof inizializzaApp === 'function') {
          inizializzaApp();
        }
        
        if (typeof creaSettimane === 'function') {
          creaSettimane();
        }
      }, 100);
    }
  });
}

function mostraMessaggio(elementId, result) {
  const msgEl = document.getElementById(elementId);
  msgEl.style.display = 'block';
  
  if (result.success) {
    msgEl.style.background = '#d4edda';
    msgEl.style.color = '#155724';
    msgEl.textContent = 'Operazione completata con successo!';
  } else {
    msgEl.style.background = '#f8d7da';
    msgEl.style.color = '#721c24';
    msgEl.textContent = result.error || 'Errore sconosciuto';
  }
}


function aggiungiPulsanteLogout() {
  // Trova la modale profilo
  const modalContent = document.querySelector('#modalProfilo .modal-content');
  
  if (modalContent && currentUser) {
    // Rimuovi vecchio bottone se esiste
    const vecchioBtn = document.getElementById('btn-logout-modal');
    if (vecchioBtn) vecchioBtn.remove();
    
    // Aggiungi info utente e logout nella modale
    const userInfoDiv = document.createElement('div');
    userInfoDiv.id = 'user-info-modal';
    userInfoDiv.innerHTML = `
      <p class="user-email"><i class="fas fa-user"></i> ${currentUser.email}</p>
      <button id="btn-logout-modal" onclick="logout()">
        <i class="fas fa-sign-out-alt"></i> Logout
      </button>
    `;
    
    // Inserisci all'inizio della modale, dopo il titolo
    const titolo = modalContent.querySelector('h2');
    if (titolo) {
      titolo.after(userInfoDiv);
    } else {
      modalContent.insertBefore(userInfoDiv, modalContent.firstChild);
    }
  }
}

// ===============================
// LOGOUT/INFO SU CALENDARIO
// ===============================
function aggiungiInterfacciaLogoutCalendario() {
  if (!currentUser) return;

  // Rimuovi vecchi elementi se esistono
  const vecchioLogout = document.getElementById('btn-logout');
  const vecchioInfo = document.getElementById('user-info');
  if (vecchioLogout) vecchioLogout.remove();
  if (vecchioInfo) vecchioInfo.remove();

  // Info utente
  const userInfo = document.createElement('div');
  userInfo.id = 'user-info';
  userInfo.innerHTML = `
    <i class="fas fa-user"></i> ${currentUser.email}
  `;
  document.body.appendChild(userInfo);

  // Pulsante logout
  const logoutBtn = document.createElement('button');
  logoutBtn.id = 'btn-logout';
  logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Logout';
  logoutBtn.onclick = logout;
  document.body.appendChild(logoutBtn);
}

// ===============================
// INIZIALIZZAZIONE AL CARICAMENTO
// ===============================
document.addEventListener('DOMContentLoaded', () => {
  initFirebase();
});

// Esporta funzioni globali
window.salvaOnline = salvaOnline;
window.leggiOnline = leggiOnline;
window.ascoltaCambiamentiRealTime = ascoltaCambiamentiRealTime;
window.salvaProfiloMultiuser = salvaProfiloMultiuser;
window.caricaProfiloMultiuser = caricaProfiloMultiuser;
window.logout = logout;
window.segnaModificaLocale = segnaModificaLocale;
window.eliminaOnline = eliminaOnline;