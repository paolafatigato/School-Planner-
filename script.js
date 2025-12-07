// ===============================
// COSTANTI DI BASE
// ===============================
// Giorni, orari e intestazioni di colonna della tabella
const giorniSettimana = ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"];
const orari = [8, 9, 10, 11, 12, 13];
const colonne = ["classe", "materia", "programma", "compiti"];

// ===============================
// Colori sfondo e testo sincronizzati (con classi diverse)
// ===============================
const grad1 = document.getElementById("grad1");
const grad2 = document.getElementById("grad2");

const gradientiSfondo = ["grad1", "grad2", "grad3"];
const gradientiTesto = ["gradt1", "gradt2", "gradt3"];

let indiceCorrente = 0;

// Funzione da chiamare dopo aver creato dinamicamente gli elementi .grad7
function aggiornaGradientiTesto() {
  const nuoviElementi = document.querySelectorAll('.grad7');
  nuoviElementi.forEach(el => {
    el.classList.remove('grad7'); // Rimuove il placeholder
    el.classList.add(gradientiTesto[indiceCorrente]); // Aggiunge il gradiente di testo corrente
  });
}

document.addEventListener("click", () => {
  let nuovoIndice;
  do {
    nuovoIndice = Math.floor(Math.random() * gradientiSfondo.length);
  } while (nuovoIndice === indiceCorrente);

  const nuovaClasseSfondo = gradientiSfondo[nuovoIndice];
  const nuovaClasseTesto = gradientiTesto[nuovoIndice];

  // Cambia gradiente dello sfondo
  grad2.className = "gradiente " + nuovaClasseSfondo;
  grad2.style.opacity = "1";

  // Cambia gradiente del testo
  const textElements = document.querySelectorAll('.' + gradientiTesto.join(', .'));
  textElements.forEach(el => {
    el.classList.remove(...gradientiTesto);
    el.classList.add(nuovaClasseTesto);
  });

  setTimeout(() => {
    grad1.className = "gradiente " + nuovaClasseSfondo;
    grad2.style.opacity = "0";
    indiceCorrente = nuovoIndice;

    // Assicura che il testo sia ancora sincronizzato
    const updatedTextElements = document.querySelectorAll('.' + gradientiTesto.join(', .'));
    updatedTextElements.forEach(el => {
      el.classList.remove(...gradientiTesto);
      el.classList.add(nuovaClasseTesto);
    });
  }, 1500);
});


// ===============================
// Inizializzazione
// ===============================

let iconaSelezionata = localStorage.getItem("iconaUtente") || "img/iconaprof1.png";
let coloreSelezionato = localStorage.getItem("coloreIcona") || "#5A00E0";

document.addEventListener("DOMContentLoaded", () => {
  localStorage.setItem("iconaUtente", iconaSelezionata);
  localStorage.setItem("coloreIcona", coloreSelezionato);
  aggiornaIconaUtente();
});

// ===============================
// Apertura modale profilo
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
});

//document.getElementById("chiudiProfilo").addEventListener("click", () => {
  //document.getElementById("modalProfilo").style.display = "none";
//});

// ===============================
// Salvataggio profilo
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

  localStorage.setItem("profiloUtente", JSON.stringify(profilo));
  localStorage.setItem("materieInsegnate", JSON.stringify(profilo.materie));
  localStorage.setItem("iconaUtente", iconaSelezionata);
  localStorage.setItem("coloreIcona", coloreSelezionato);

  aggiornaIconaUtente();
  chiudiModale();
  creaSettimane(); // Ricrea le tabelle con il numero corretto di colonne

}

// ===============================
// Selezione icona e colore
// ===============================

function selezionaIcona(div) {
  document.querySelectorAll('.icona-opzione').forEach(i => i.classList.remove('selezionata'));
  div.classList.add('selezionata');
  iconaSelezionata = div.dataset.src;
}

function selezionaColore(div) {
  document.querySelectorAll('.colore-opzione').forEach(c => c.classList.remove('selezionata'));
  div.classList.add('selezionata');
  coloreSelezionato = rgbToHex(getComputedStyle(div).backgroundColor);
  aggiornaAnteprimaIcone(coloreSelezionato);
  aggiornaIconaUtente();
}

// ===============================
// Applica colore con mask
// ===============================

function applicaColoreIconaConMask(div, colore) {
  const src = div.dataset.src;
  div.style.backgroundColor = colore;
  div.style.maskImage = `url(${src})`;
  div.style.webkitMaskImage = `url(${src})`;
}

function aggiornaAnteprimaIcone(colore) {
  document.querySelectorAll(".icona-opzione").forEach(div => {
    applicaColoreIconaConMask(div, colore);
  });
}

function aggiornaIconaUtente() {
  const imgSrc = localStorage.getItem("iconaUtente");
  const colore = localStorage.getItem("coloreIcona") || "#5A00E0";

  const userImage = document.getElementById("userImage");
  const fallback = document.getElementById("userFallback");

  if (imgSrc) {
    userImage.style.display = "block";
    userImage.style.backgroundColor = colore;
    userImage.style.maskImage = `url(${imgSrc})`;
    userImage.style.webkitMaskImage = `url(${imgSrc})`;
    userImage.style.maskSize = "cover";
    userImage.style.webkitMaskSize = "cover";
    userImage.style.maskRepeat = "no-repeat";
    userImage.style.webkitMaskRepeat = "no-repeat";
    userImage.style.maskPosition = "center";
    userImage.style.webkitMaskPosition = "center";
    fallback.style.display = "none";
  } else {
    userImage.style.display = "none";
    fallback.style.display = "block";
    fallback.style.color = colore;
  }
}

// ===============================
// Utilità
// ===============================

function rgbToHex(rgb) {
  if (rgb.startsWith('#')) return rgb;
  const match = rgb.match(/rgb\\((\\d+), (\\d+), (\\d+)\\)/);
  if (!match) return rgb;
  return "#" + [match[1], match[2], match[3]]
    .map(n => parseInt(n).toString(16).padStart(2, '0'))
    .join('');
}

function initQuillEditors() {
  document.querySelectorAll('textarea.editor-programma').forEach((textarea) => {
    if (textarea.dataset.quillified === '1') return;

    const key = textarea.dataset.key;
    const parent = textarea.parentElement;

    // Crea wrapper + editor
    const wrapper = document.createElement('div');
    wrapper.className = 'quill-wrapper';
    const editor = document.createElement('div');
    editor.className = 'quill-editor';

    parent.insertBefore(wrapper, textarea);
    wrapper.appendChild(editor);
    
    // Nascondi textarea ma mantienila nel DOM
    textarea.style.position = 'absolute';
    textarea.style.left = '-10000px';
    textarea.style.width = '1px';
    textarea.style.height = '1px';
    textarea.style.opacity = '0';

    // Toolbar
    const toolbarOptions = [
      [{ list: 'check' }],
      ['bold', 'italic'],
      [{ list: 'ordered' }, { list: 'bullet' }]
    ];

    const quill = new Quill(editor, {
      theme: 'snow',
      modules: { toolbar: toolbarOptions }
    });

    // Salva istanza Quill globale
    if (!window.quillInstances) window.quillInstances = {};
    window.quillInstances[key] = quill;

    // ⭐ CARICA DA FIREBASE PRIMA, POI DA LOCALSTORAGE
    if (key && typeof leggiOnline === 'function') {
      leggiOnline(key).then(dataCloud => {
        let contenutoFinale = '';
        let timestampFinale = 0;
        
        // Valore da Firebase
        if (dataCloud && dataCloud.valore && dataCloud.valore.trim()) {
          contenutoFinale = dataCloud.valore;
          timestampFinale = dataCloud.timestamp || 0;
        }
        
        // Valore da localStorage (solo se più recente)
        const saved = localStorage.getItem(key);
        const timestampLocale = parseInt(textarea.dataset.timestamp || 0);
        
        if (saved && saved.trim() && timestampLocale > timestampFinale) {
          contenutoFinale = saved;
          timestampFinale = timestampLocale;
        }
        
        // Valore dalla textarea (solo se più recente)
        if (textarea.value && textarea.value.trim() && !contenutoFinale) {
          contenutoFinale = textarea.value;
        }
        
        // Carica il contenuto più recente
        if (contenutoFinale) {
          quill.clipboard.dangerouslyPasteHTML(contenutoFinale);
          textarea.value = contenutoFinale;
          textarea.dataset.timestamp = timestampFinale;
          localStorage.setItem(key, contenutoFinale);
          console.log(`📝 Quill caricato: ${key}`);
        }
        
        // ⭐ ATTIVA LISTENER REAL-TIME DOPO IL CARICAMENTO
        if (typeof ascoltaCambiamentiRealTime === 'function') {
          ascoltaCambiamentiRealTime(key, textarea);
        }
      });
    } else {
      // Fallback se Firebase non disponibile
      const saved = key ? localStorage.getItem(key) : null;
      if (saved && saved.trim()) {
        quill.clipboard.dangerouslyPasteHTML(saved);
        textarea.value = saved;
      } else if (textarea.value && textarea.value.trim()) {
        quill.clipboard.dangerouslyPasteHTML(textarea.value);
      }
    }

    // ⭐ SYNC: Quill -> textarea -> localStorage + Firebase
    let saveTimeout;
    const syncAll = () => {
      const html = quill.root.innerHTML;
      const timestamp = new Date().getTime();
      
      textarea.value = html;
      textarea.dataset.timestamp = timestamp;
      
      if (key) {
        localStorage.setItem(key, html);
        
        // Salva su Firebase con debounce di 1 secondo
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
          if (typeof salvaOnline === 'function') {
            salvaOnline(key, html);
          }
        }, 1000);
      }
    };

    quill.on('text-change', (delta, oldDelta, source) => {
      // Salva solo se il cambiamento è dell'utente
      if (source === 'user') {
        syncAll();
      }
    });

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
  });
}

function chiudiModale() {
  document.getElementById("modalProfilo").style.display = "none";
}





// ===============================
//CANCELLA da qui in poi
// ===============================
function cancellaDaSettimanaCorrente() {
  if (!confirm("Vuoi davvero cancellare tutte le celle dalla settimana corrente in poi?")) return;

  const dataSelezionata = localStorage.getItem("dataSelezionata");
  if (!dataSelezionata) {
    alert("Data non trovata. Torna al calendario e seleziona una data.");
    return;
  }

  const dataCorrente = new Date(dataSelezionata);

  for (let chiave in localStorage) {
    if (!chiave.startsWith("cella-")) continue;

    const match = chiave.match(/^cella-(\d{4}-\d{2}-\d{2})-(\d)-(\d)$/);
    if (!match) continue;

    const dataCella = new Date(match[1]);
    if (dataCella >= dataCorrente) {
      localStorage.removeItem(chiave);
    }
  }

  alert("Celle cancellate dalla settimana corrente in poi.");
  location.reload();
}


// ===============================
//CANCELLA TUTTO
// ===============================
function clearDati() {
  if (confirm("Sei sicura di voler cancellare tutti i dati dell'anno scolastico? L'operazione non è reversibile!")) {
    localStorage.clear();
    location.reload();
  }
}

// ===============================
// SALVATAGGIO AUTOMATICO IN LOCALSTORAGE
// ===============================
// Salva tutto il contenuto delle celle e la data di inizio
function salvaDati() {
  const dati = {
    dataInizio: document.getElementById("dataInizio").value,
    celle: []
  };

  document.querySelectorAll("textarea").forEach(textarea => {
    const value = textarea.value;
    if (value.trim() !== "") {
      dati.celle.push({
        settimana: textarea.dataset.settimana,
        giorno: textarea.dataset.giorno,
        ora: textarea.dataset.ora,
        col: textarea.dataset.col,
        value: value
      });
    }
  });

  localStorage.setItem("plannerDati", JSON.stringify(dati));
}
// Carica i dati salvati dal localStorage
function caricaDati() {
  const dati = JSON.parse(localStorage.getItem("plannerDati"));
  if (!dati) return;

  document.getElementById("dataInizio").value = dati.dataInizio;
  creaSettimane(); // Ricrea la tabella con la data inserita

  setTimeout(() => {
    dati.celle.forEach(item => {
      const textarea = document.querySelector(`[data-settimana="${item.settimana}"][data-giorno="${item.giorno}"][data-ora="${item.ora}"][data-col="${item.col}"]`);
      if (textarea) textarea.value = item.value;
    });
  }, 100); // Attendi che la tabella venga generata
}


// Carica i dati quando la pagina viene caricata
window.addEventListener("DOMContentLoaded", caricaDati);

// ===============================
// FUNZIONE DI SUPPORTO CONVERSIONE DATA
// ===============================
function convertiDataInISO(dataStr, riferimento = null) {
  const mesi = {
    gennaio: "01", febbraio: "02", marzo: "03", aprile: "04", maggio: "05", giugno: "06",
    luglio: "07", agosto: "08", settembre: "09", ottobre: "10", novembre: "11", dicembre: "12"
  };

  const parts = dataStr.toLowerCase().replace(',', '').split(" ");
  const giorno = parts[1].padStart(2, '0');
  const mese = mesi[parts[2]];

  let anno;
  if (riferimento instanceof Date) {
    anno = riferimento.getFullYear(); // usa l’anno della data reale
  } else {
    const oggi = new Date();
    anno = oggi.getFullYear();
  }

  return `${anno}-${mese}-${giorno}`;
}

// ===============================
// RIPETIZIONE MATERIE E CLASSI NELLE SETTIMANE SUCCESSIVE
// ===============================
function ripetiMateriePerAnnoIntero() {
  const celleDaRipetere = [];

  // 1. Trova tutte le celle compilate nella settimana 0 (colonna 0 e 1)
  document.querySelectorAll("textarea[data-settimana='0']").forEach(textarea => {
    const col = parseInt(textarea.dataset.col);
    if (col !== 0 && col !== 1) return;

    const valore = textarea.value.trim();
    if (!valore) return;

    const giorno = parseInt(textarea.dataset.giorno);
    const ora = parseInt(textarea.dataset.ora);

    // Salva temporaneamente
    const entryEsistente = celleDaRipetere.find(e => e.giorno === giorno && e.ora === ora);
    if (!entryEsistente) {
      celleDaRipetere.push({
        giorno,
        ora,
        classe: col === 0 ? valore : "",
        materia: col === 1 ? valore : ""
      });
    } else {
      if (col === 0) entryEsistente.classe = valore;
      if (col === 1) entryEsistente.materia = valore;
    }
  });

  if (celleDaRipetere.length === 0) {
    alert("⚠️ Nessuna materia o classe trovata nella settimana 0.");
    return;
  }

  const dataInizio = new Date(localStorage.getItem("dataSelezionata"));
  
  // Se siamo da settembre a dicembre, l'anno scolastico finisce l'anno successivo
  // Se siamo da gennaio a giugno, l'anno scolastico finisce nello stesso anno
  const annoFine = dataInizio.getMonth() >= 8 ? // settembre = mese 8
    dataInizio.getFullYear() + 1 : // se settembre-dicembre, finisce l'anno dopo
    dataInizio.getFullYear();      // se gennaio-giugno, finisce lo stesso anno
  
  const dataFine = new Date(annoFine, 5, 30); // 30 giugno dell'anno di fine

  let celleInserite = 0;
  const promesseFirebase = []; // Array di promesse per salvare su Firebase

  // 2. Ripeti ciascuna cella nelle settimane successive, stesso giorno e ora
  celleDaRipetere.forEach(({ giorno, ora, classe, materia }) => {
    let data = new Date(dataInizio);

    // Allinea la data al giorno corretto della settimana (0 = lunedì, 6 = sabato)
    while (data.getDay() !== (giorno + 1)) {
      data.setDate(data.getDate() + 1);
    }

    // Genera una nuova data per ogni settimana fino a dataFine
    while (data <= dataFine) {
      const dataISO = data.toISOString().split("T")[0];

      const chiaveClasse = `cella-${dataISO}-${ora}-0`;
      const chiaveMateria = `cella-${dataISO}-${ora}-1`;

      // Salva CLASSE
      if (classe && !localStorage.getItem(chiaveClasse)) {
        localStorage.setItem(chiaveClasse, classe);
        
        // ⭐ Salva anche su Firebase
        if (typeof salvaOnline === 'function') {
          promesseFirebase.push(salvaOnline(chiaveClasse, classe));
        }
        celleInserite++;
      }

      // Salva MATERIA
      if (materia && !localStorage.getItem(chiaveMateria)) {
        localStorage.setItem(chiaveMateria, materia);
        
        // ⭐ Salva anche su Firebase
        if (typeof salvaOnline === 'function') {
          promesseFirebase.push(salvaOnline(chiaveMateria, materia));
        }
        celleInserite++;
      }

      // Passa alla settimana successiva senza errori di ora legale
      data = new Date(data.getTime() + 7 * 24 * 60 * 60 * 1000);
    }
  });

  // ⭐ Aspetta che tutte le celle siano salvate su Firebase
  Promise.all(promesseFirebase).then(() => {
    console.log(`✅ Ripetizione completata: ${celleInserite} celle inserite e sincronizzate su Firebase`);
    alert(`✅ Materie e classi ripetute fino al 30 giugno (${celleInserite} celle inserite).\n\nLa sincronizzazione con Firebase è in corso...`);
    
    // Ricarica la pagina per mostrare le nuove celle
    location.reload();
  }).catch(err => {
    console.error("❌ Errore durante la sincronizzazione:", err);
    alert("⚠️ Celle inserite in localStorage, ma potrebbero esserci problemi con la sincronizzazione su Firebase.");
  });
}

function mostraOrarioSettimana() {
  const contenitore = document.getElementById("risultati");
  contenitore.innerHTML = "";

  const dataInizioStr = localStorage.getItem("dataSelezionata");
  const dataInizio = new Date(dataInizioStr);
  if (isNaN(dataInizio)) {
    contenitore.innerHTML = "<p>Errore: nessuna data selezionata.</p>";
    return;
  }

  const orari = [8, 9, 10, 11, 12, 13];
  const giorniNomi = ["", "LUN", "MAR", "MER", "GIO", "VEN", "SAB"];
  const mappa = {}; // mappa[oraIndex][giornoSettimana] = "3a", "2b"...

  // Trova il lunedì della settimana selezionata
  const giorno = dataInizio.getDay();
  const lunedi = new Date(dataInizio);
  const diff = lunedi.getDate() - giorno + (giorno === 0 ? -6 : 1);
  lunedi.setDate(diff);

  // Crea array dei 6 giorni da lunedì a sabato
  const giorniValidi = [];
  for (let i = 0; i < 6; i++) {
    const giornoCorrente = new Date(lunedi);
    giornoCorrente.setDate(lunedi.getDate() + i);
    giorniValidi.push(giornoCorrente);
  }

  // Riempi la mappa con le classi presenti in ogni giorno/ora
  giorniValidi.forEach((data, giornoIndex) => {
    const dataISO = data.toISOString().split("T")[0];
    for (let oraIndex = 0; oraIndex < orari.length; oraIndex++) {
      const chiave = `cella-${dataISO}-${oraIndex}-0`; // colonna 0 = classe
      const classe = localStorage.getItem(chiave)?.trim();
      if (classe) {
        if (!mappa[oraIndex]) mappa[oraIndex] = {};
        mappa[oraIndex][giornoIndex + 1] = classe;
      }
    }
  });

  // Crea la tabella
  const tabella = document.createElement("table");
  tabella.classList.add("tabella-risultati");
  tabella.id = "tabella-orariosettimanale";

  const intestazione1 = document.createElement("tr");
  intestazione1.innerHTML = `<th class="th-risultati" colspan="7">Orario settimanale</th>`;
  tabella.appendChild(intestazione1);

  const intestazione2 = document.createElement("tr");
  intestazione2.innerHTML = "<th>Ora</th>";
  for (let g = 1; g <= 6; g++) {
    intestazione2.innerHTML += `<th>${giorniNomi[g]}</th>`;
  }
  tabella.appendChild(intestazione2);

  for (let oraIndex = 0; oraIndex < orari.length; oraIndex++) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${orari[oraIndex]}</td>`;
    for (let g = 1; g <= 6; g++) {
      const td = document.createElement("td");
      td.classList.add("td-orario");
      td.textContent = mappa[oraIndex]?.[g] || "";
      tr.appendChild(td);
    }
    tabella.appendChild(tr);
  }

  contenitore.appendChild(tabella);
  spostaRisultatiSeMobile();
}



// ===============================
// CREAZIONE TABELLE SETTIMANALI
// ===============================
function setupTooltipDinamico() {
    const tooltipContainers = document.querySelectorAll('.tooltip-container-gg');
    
    tooltipContainers.forEach(container => {
        const tooltip = container.querySelector('.tooltip-text-gg');
        const button = container.querySelector('.btn-freccia');
        
        // Eventi per mostrare/nascondere il tooltip
        container.addEventListener('mouseenter', (e) => {
            const rect = button.getBoundingClientRect();
            tooltip.style.position = 'fixed';
            tooltip.style.left = `${rect.left + rect.width/2}px`;
            tooltip.style.top = `${rect.top - 40}px`; // 40px sopra il pulsante
          
            // Mostra il tooltip
            tooltip.style.visibility = 'visible';
            tooltip.style.opacity = '1';
        });
        
        container.addEventListener('mouseleave', () => {
            // Nascondi il tooltip
            tooltip.style.visibility = 'hidden';
            tooltip.style.opacity = '0';
        });
    });
}



function creaSettimane() {

  const container = document.getElementById("container");
  container.innerHTML = "";


  //pulsanti per scorrere tra settimane
  let primoGiorno = true; // flag per inserire solo una volta il pulsante ▲


  const dataInizioStr = localStorage.getItem("dataSelezionata");
  const dataInizio = new Date(dataInizioStr);
  if (isNaN(dataInizio)) {
    alert("Errore: nessuna data selezionata. Torna al calendario.");
    window.location.href = "calendar.html";
    return;
  }

  const materie = JSON.parse(localStorage.getItem("materieInsegnate")) || [];
  const mostraColonnaMateria = materie.length > 1;

  const colonneOriginali = ["classe", "materia", "programma", "compiti"];
  const colonneFiltrate = colonneOriginali.filter((col, idx) => mostraColonnaMateria || idx !== 1);

  let dataCorrente = new Date(dataInizio);
  let giorniInseriti = 0;
  const numeroSettimane = 1;

  while (giorniInseriti < numeroSettimane * 6) {
    if (dataCorrente.getDay() !== 0) { // salta la domenica


      //pulsanti per scorrere tra settimane
      if (primoGiorno) {
        const btnSu = document.createElement("div");
        btnSu.classList.add("tooltip-container","tooltip-container-gg");

        const pulsante = document.createElement("button");
        pulsante.classList.add("btn-freccia");
        pulsante.onclick = () => cambiaGiorno(-1);

        const imgUp = document.createElement("img");
        imgUp.src = "img/up.png";
        imgUp.alt = "Giorno precedente";
        imgUp.classList.add("freccia-img");

        const tooltip = document.createElement("span");
        tooltip.classList.add("tooltip-text-gg");
        tooltip.textContent = "Giorno precedente";

        pulsante.appendChild(imgUp);
        btnSu.appendChild(pulsante);
        btnSu.appendChild(tooltip);
        container.appendChild(btnSu);

        primoGiorno = false;
      }


      const giornoSettimana = giorniSettimana[dataCorrente.getDay()];
      const dataStr = dataCorrente.toLocaleDateString("it-IT", {
        weekday: "long", day: "2-digit", month: "long"
      });

      const tabella = document.createElement("table");
      tabella.classList.add("tabella-settimana");

      const intestazione = tabella.insertRow();
      const th = document.createElement("th");
      th.classList.add("th-settimane");
      th.colSpan = colonneFiltrate.length + 1;

      const contenitore = document.createElement("div");
      contenitore.classList.add("contenitore-th");

        const giornoCompleto = dataCorrente.toISOString().split('T')[0];

        const testoData = document.createElement("span");
        testoData.classList.add("titolo-data", "grad7");
        testoData.textContent = dataStr.charAt(0).toUpperCase() + dataStr.slice(1);
        testoData.dataset.iso = giornoCompleto; // salva data ISO nel DOM


      contenitore.appendChild(testoData);
      th.appendChild(contenitore);
      intestazione.appendChild(th);

      const subHeader = tabella.insertRow();
      subHeader.insertCell().innerText = "Ora";
      colonneFiltrate.forEach(col => {
        subHeader.insertCell().innerText = col;
      });

      for (let ora = 0; ora < orari.length; ora++) {
        const row = tabella.insertRow();
        row.insertCell().innerText = orari[ora];

        for (let i = 0; i < colonneFiltrate.length; i++) {
          const colOriginale = colonneOriginali.indexOf(colonneFiltrate[i]);
          const cell = row.insertCell();
          const textarea = document.createElement("textarea");


              if (colOriginale === 2) {//per mettere toolbar
                textarea.classList.add('editor-programma');
              }


          const giornoCompleto = dataCorrente.toISOString().split('T')[0];
          const chiave = `cella-${giornoCompleto}-${ora}-${colOriginale}`;
          textarea.dataset.key = chiave;              // ⬅️ AGGIUNTO QUESTA

          const valoreSalvato = localStorage.getItem(chiave);
          if (valoreSalvato) textarea.value = valoreSalvato;

          textarea.addEventListener("change", () => {
            localStorage.setItem(chiave, textarea.value);
          });

          textarea.setAttribute('data-settimana', Math.floor(giorniInseriti / 6));
          textarea.setAttribute('data-giorno', giorniInseriti % 6);
          textarea.setAttribute('data-ora', ora);
          textarea.setAttribute('data-col', colOriginale);

          // === Pulsanti ===
          if (colOriginale === 0) {
            const pulsante = document.createElement("button");
            pulsante.classList.add(`btn-col-0`);
            pulsante.title = "Mostra orario settimanale della classe";
            pulsante.onclick = (e) => {
              trovaOrarioClasse({ target: textarea });
            };
            cell.appendChild(pulsante);
          } else if (colOriginale === 1 && mostraColonnaMateria) {
            const pulsante = document.createElement("button");
            pulsante.classList.add(`btn-col-1`);
            pulsante.title = "Mostra orario settimanale della materia";
            pulsante.onclick = (e) => {
              mostraOrarioMateria({ target: textarea });
            };
            cell.appendChild(pulsante);
          } else if (colOriginale === 2) {
            const pulsante = document.createElement("button");
            pulsante.classList.add(`btn-col-2`);
            pulsante.title = "Mostra programma";
            pulsante.onclick = () => {
              recuperaProgramma({ target: textarea });
            };
            cell.appendChild(pulsante);
          }

          cell.appendChild(textarea);
        }
      }

      container.appendChild(tabella);
      giorniInseriti++;
    }

    dataCorrente.setDate(dataCorrente.getDate() + 1);
  }

  aggiornaGradientiTesto();

    //pulsanti per scorrere tra settimane
      const btnGiu = document.createElement("div");
      btnGiu.classList.add("tooltip-container-gg");

      const pulsante = document.createElement("button");
      pulsante.classList.add("btn-freccia");
      pulsante.onclick = () => cambiaGiorno(1);

      const imgDown = document.createElement("img");
      imgDown.src = "img/down.png";
      imgDown.alt = "Giorno successivo";
      imgDown.classList.add("freccia-img");

      const tooltip = document.createElement("span");
      tooltip.classList.add( "tooltip-text-gg");
      tooltip.textContent = "Giorno successivo";

      pulsante.appendChild(imgDown);
      btnGiu.appendChild(pulsante);
      btnGiu.appendChild(tooltip);
      container.appendChild(btnGiu);


        setupTooltipDinamico();
  initQuillEditors();
  
  // ⭐ SINCRONIZZA CON FIREBASE DOPO AVER CREATO LE TABELLE
  if (typeof window.avviaSincronizzazioneFirebase === 'function') {
    window.avviaSincronizzazioneFirebase();
  }
}

function cambiaGiorno(direzione) {
  const dataStr = localStorage.getItem("dataSelezionata");
  const data = new Date(dataStr);

  data.setDate(data.getDate() + direzione);

  // Salta la domenica
  if (data.getDay() === 0) {
    data.setDate(data.getDate() + (direzione > 0 ? 1 : -1));
  }

  localStorage.setItem("dataSelezionata", data.toISOString().split('T')[0]);
  creaSettimane();
}



// ===============================
// FUNZIONE PER TROVARE PROGRAMMA 
function recuperaProgramma(event) {
  const textareaProgramma = event.target;
  if (!textareaProgramma || textareaProgramma.dataset.col !== "2") return;

  const settimana = textareaProgramma.dataset.settimana;
  const giorno = textareaProgramma.dataset.giorno;
  const ora = textareaProgramma.dataset.ora;

  const textareaClasse = document.querySelector(
    `[data-settimana="${settimana}"][data-giorno="${giorno}"][data-ora="${ora}"][data-col="0"]`
  );
  const textareaMateria = document.querySelector(
    `[data-settimana="${settimana}"][data-giorno="${giorno}"][data-ora="${ora}"][data-col="1"]`
  );

  if (!textareaClasse) return;

  const classeValore = textareaClasse.value.trim();
  const materiaValore = textareaMateria?.value.trim() || null;

  if (!classeValore) return;

  // Calcola dataFocus in base a settimana e giorno
  const dataInizio = new Date(localStorage.getItem("dataSelezionata"));
  const settimanaIndex = parseInt(settimana);
  const giornoIndex = parseInt(giorno);

  let dataFocus = new Date(dataInizio);
  let giorniAggiunti = 0;
  while (giorniAggiunti < (settimanaIndex * 6) + giornoIndex) {
    dataFocus.setDate(dataFocus.getDate() + 1);
    if (dataFocus.getDay() !== 0) { // salta le domeniche
      giorniAggiunti++;
    }
  }
  const dataFocusISO = dataFocus.toISOString().split("T")[0];

  const risultatiMap = new Map();

  // ✅ Raccoglie tutte le righe esistenti (solo classe + programma)
  for (let chiave in localStorage) {
    if (!chiave.startsWith("cella-")) continue;

    const match = chiave.match(/^cella-(\d{4}-\d{2}-\d{2})-(\d)-(\d)$/);
    if (!match) continue;

    const [_, dataISO, oraStr, colStr] = match;
    const oraNum = parseInt(oraStr);
    const colNum = parseInt(colStr);

    if (colNum !== 0) continue; // Consideriamo solo le colonne classe (col=0)

    const classe = localStorage.getItem(`cella-${dataISO}-${oraStr}-0`)?.trim();
    const materia = localStorage.getItem(`cella-${dataISO}-${oraStr}-1`)?.trim();

    // ✅ Condizione adattiva
    const coincide = materiaValore
      ? classe === classeValore && materia === materiaValore
      : classe === classeValore;

    if (coincide) {
      const key = `${dataISO}-${oraStr}`;
      const programma = localStorage.getItem(`cella-${dataISO}-${oraStr}-2`) || "";

      risultatiMap.set(key, {
        data: dataISO,
        ora: oraNum + 8,
        programma: programma.trim()
      });
    }
  }

  const risultati = Array.from(risultatiMap.values());
  mostraRisultati(risultati, classeValore, materiaValore, dataFocusISO);
}
// ===============================
// TABELLA PROGRAMMA
// ===============================
function mostraRisultati(risultati, classe, materia, dataFocus) {
  // Rimuove eventuale tabella programma già esistente
  const tabellaEsistente = document.getElementById("tabella-programma");
  if (tabellaEsistente) tabellaEsistente.remove();

  if (!risultati || risultati.length === 0) {
    alert("Nessun dato trovato.");
    return;
  }

  // Ordina i risultati per data e ora
  risultati.sort((a, b) => a.data.localeCompare(b.data) || a.ora - b.ora);

  // ✅ NUOVO: Applica il filtro basato su dataFocus
  const risultatiFiltrati = [];
  let giorniVuotiConsecutivi = 0;

  for (const item of risultati) {
    const itemData = item.data; // formato YYYY-MM-DD
    const isProgrammaVuoto = !item.programma || item.programma.trim() === "";
    const isVuoto = isProgrammaVuoto;

    if (itemData < dataFocus) {
      // ➤ Date precedenti: includi solo se NON vuoto
      if (!isVuoto) {
        risultatiFiltrati.push(item);
      }
    } else {
      // ➤ Date uguali o successive: includi tutte finché non hai 3 vuoti consecutivi
      risultatiFiltrati.push(item);
      
      if (isVuoto) {
        giorniVuotiConsecutivi++;
        if (giorniVuotiConsecutivi >= 3) {
          // Stop: hai raggiunto 3 giorni vuoti consecutivi
          break;
        }
      } else {
        giorniVuotiConsecutivi = 0; // reset contatore
      }
    }
  }

  // Se non ci sono risultati dopo il filtro
  if (risultatiFiltrati.length === 0) {
    alert("Nessun dato da mostrare dopo il filtro.");
    return;
  }

  // Crea la tabella con i risultati filtrati
  const tabella = document.createElement("table");
  tabella.id = "tabella-programma";
  tabella.classList.add("tabella-risultati");

  const titolo = materia ? `${classe} - ${materia}` : `${classe}`;

  tabella.innerHTML = `
    <tr>
      <th class="th-risultati" id="titolo-tab-Programma" colspan="3">Programma svolto: ${titolo}</th>
    </tr>
    <tr>
      <th class="th-programma">Data</th>
      <th class="th-programma">Ora</th>
      <th class="th-programma">Programma</th>
    </tr>
  `;

  risultatiFiltrati.forEach(item => {
    const data = new Date(item.data);
    const dataStr = data.toLocaleDateString("it-IT", {
      weekday: "short", day: "2-digit", month: "2-digit"
    });

    const tr = document.createElement("tr");

    // Cella data
    const tdData = document.createElement("td");
    tdData.classList.add("td-programma");
    tdData.textContent = dataStr;
    
    // ✅ Evidenzia la data su cui hai cliccato
    if (item.data === dataFocus) {
      tdData.style.fontWeight = "bold";
      tdData.style.color = "#ff6546";
      tdData.style.backgroundColor = "#ffffff";
    }
    
    tr.appendChild(tdData);

    // Cella ora
    const tdOra = document.createElement("td");
    tdOra.classList.add("td-programma");
    tdOra.textContent = item.ora;
    tr.appendChild(tdOra);

    // Programma (modificabile)
    const tdProgramma = document.createElement("td");
    tdProgramma.classList.add("td-programma");
const key = `cella-${item.data}-${item.ora - 8}-2`;   // stesso schema della settimana
const inputProgramma = document.createElement("textarea");
inputProgramma.classList.add("editor-programma");      // ⬅️ fa scattare Quill
inputProgramma.dataset.key = key;                      // ⬅️ chiave per sync
const salvato = localStorage.getItem(key);
inputProgramma.value = salvato ?? (item.programma || "");
tdProgramma.appendChild(inputProgramma);
// niente listener "change": salva già initQuillEditors()

    tr.appendChild(tdProgramma);



    tabella.appendChild(tr);
  });

  // ✅ Posiziona la tabella sopra quella della settimana su cui hai cliccato
  // Usa dataFocus invece del primo risultato
  const giornoTargetData = new Date(dataFocus);
  const giornoITA = giornoTargetData.toLocaleDateString("it-IT", {
    weekday: "long", day: "2-digit", month: "long"
  });
  
  const titoliGiorni = Array.from(document.querySelectorAll(".titolo-data"));
  let tabellaGiorno = null;
  
  // Cerca il titolo che corrisponde al giorno cliccato
  for (const titolo of titoliGiorni) {
    const testoTitolo = titolo.textContent.toLowerCase();
    const giornoTarget = giornoITA.toLowerCase();
    
    // Controlla sia il nome del giorno che la data
    if (testoTitolo.includes(giornoTarget.slice(0, 8)) || // nome giorno + primi caratteri
        testoTitolo.includes(giornoTargetData.getDate().toString().padStart(2, '0'))) {
      tabellaGiorno = titolo.closest("table");
      break;
    }
  }

  if (tabellaGiorno && tabellaGiorno.parentNode) {
    tabellaGiorno.parentNode.insertBefore(tabella, tabellaGiorno);
  } else {
    document.getElementById("container").appendChild(tabella);
  }

  spostaRisultatiSeMobile();
  
  // ✅ Scrolla automaticamente alla tabella appena creata
  setTimeout(() => {
    tabella.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'start',
      inline: 'nearest' 
    });
  }, 100); // Piccolo delay per assicurarsi che il DOM sia aggiornato

  initQuillEditors();
}




// ===============================
// FUNZIONE PER TROVARE ORARIO CLASSE - SOLO SETTIMANA CORRENTE
// ===============================
function trovaOrarioClasse(event) {
  const textareaClasse = event.target;
  if (!textareaClasse || textareaClasse.dataset.col !== "0") return;

  const classeValore = textareaClasse.value.trim();
  if (!classeValore) return;

  // OTTIENI LA SETTIMANA CORRENTE
  const settimanaCorrente = ottieniSettimanaCorrente(textareaClasse);
  
  const orarioClasse = [];

  // Scorre tutto il localStorage per trovare materia e classe
  for (let chiave in localStorage) {
    if (!chiave.startsWith("cella-")) continue;

    const match = chiave.match(/^cella-(\d{4}-\d{2}-\d{2})-(\d)-(\d)$/);
    if (!match) continue;

    const [_, dataISO, oraStr, colStr] = match;
    const ora = parseInt(oraStr);
    const col = parseInt(colStr);

    if (col !== 0) continue; // solo classe

    // CONTROLLA SE LA DATA APPARTIENE ALLA SETTIMANA CORRENTE
    const dataObj = new Date(dataISO);
    if (!appartieneSettimana(dataObj, settimanaCorrente)) continue;

    const classe = localStorage.getItem(`cella-${dataISO}-${oraStr}-0`)?.trim();
    const materia = localStorage.getItem(`cella-${dataISO}-${oraStr}-1`)?.trim();

    if (classe === classeValore) {
      const giornoSettimana = dataObj.getDay(); // 1 = lun, 6 = sab

      if (giornoSettimana >= 0 && giornoSettimana <= 5) {
        orarioClasse.push({
          giorno: giornoSettimana,
          ora: ora + 8,
          materia: materia
        });
      }
    }
  }

  mostraRisultatiOrario(orarioClasse, classeValore);
}

// ===============================
// FUNZIONI AUSILIARIE PER GESTIRE LA SETTIMANA
// ===============================
function ottieniSettimanaCorrente(elemento) {
  // Ottieni il numero della settimana dall'attributo data-settimana
  const numeroSettimana = parseInt(elemento.dataset.settimana);
  const numeroGiorno = parseInt(elemento.dataset.giorno);
  
  // Ottieni la data di inizio dalle impostazioni
  const dataInizioStr = localStorage.getItem("dataSelezionata");
  const dataInizio = new Date(dataInizioStr);
  
  // Calcola la data specifica della cella cliccata
  const dataCorrente = new Date(dataInizio);
  
  // Aggiungi i giorni per arrivare alla settimana e al giorno giusti
  let giorniDaAggiungere = (numeroSettimana * 6) + numeroGiorno;
  
  // Salta le domeniche che vengono saltate nel tuo codice
  let giorniAggiunti = 0;
  let tempData = new Date(dataInizio);
  
  while (giorniAggiunti < giorniDaAggiungere) {
    tempData.setDate(tempData.getDate() + 1);
    // Salta le domeniche (getDay() === 0)
    if (tempData.getDay() !== 0) {
      giorniAggiunti++;
    }
  }
  
  // Restituisci il lunedì della settimana di questa data
  const lunediSettimana = getLunediSettimana(tempData);
  return formatDateISO(lunediSettimana);
}

function appartieneSettimana(data, inizioSettimana) {
  const lunediSettimana = new Date(inizioSettimana);
  const domenicaSettimana = new Date(lunediSettimana);
  domenicaSettimana.setDate(domenicaSettimana.getDate() + 6);
  
  return data >= lunediSettimana && data <= domenicaSettimana;
}

function getLunediSettimana(data) {
  const giorno = data.getDay();
  const lunedi = new Date(data);
  const diff = lunedi.getDate() - giorno + (giorno === 0 ? -6 : 1);
  lunedi.setDate(diff);
  return lunedi;
}

function formatDateISO(data) {
  return data.toISOString().split('T')[0];
}
// ===============================
// TABELLA ORARIO CLASSE
// ===============================
function mostraRisultatiOrario(orarioClasse, classe) {
  
const contenitore = document.getElementById("risultati");
  contenitore.innerHTML = ""; // cancella eventuali tabelle precedenti

    document.getElementById("container").after(contenitore);


  if (orarioClasse.length === 0) {
    contenitore.innerHTML += "<p>Nessuna materia trovata per questa classe.</p>";
    return;
  }

  const giorniNomi = ["", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];
  const orari = [8, 9, 10, 11, 12, 13];
  const mappa = {};

  orarioClasse.forEach(entry => {
    if (!mappa[entry.ora]) mappa[entry.ora] = {};
    mappa[entry.ora][entry.giorno] = entry.materia|| classe;
  });

  const tabella = document.createElement("table");
  tabella.classList.add("tabella-risultati");
  tabella.id = "tabella-orarioclasse";


  const intestazione1 = document.createElement("tr");
  intestazione1.innerHTML = `<th class="th-risultati" id="th-orarioclasse" colspan="7">Orario della classe ${classe}</th>`;

  const intestazione = document.createElement("tr");
  intestazione.innerHTML = "<th>Ora</th>";
  for (let g = 1; g <= 6; g++) {
    intestazione.innerHTML += `<th>${giorniNomi[g]}</th>`;
  }
  tabella.appendChild(intestazione1);
  tabella.appendChild(intestazione);

  orari.forEach(ora => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${ora}</td>`;
    for (let g = 1; g <= 6; g++) {
      const td = document.createElement("td");
      td.classList.add("td-orario");
      td.textContent = mappa[ora]?.[g] || "";
      tr.appendChild(td);
    }
    tabella.appendChild(tr);
  });

  contenitore.appendChild(tabella);
  spostaRisultatiSeMobile();
}


// ===============================
// FUNZIONE PER TROVARE ORARIO MATERIA NELLA SETTIMANA
// ===============================
function mostraOrarioMateria(event) {
  const textareaMateria = event.target;
  if (!textareaMateria || textareaMateria.dataset.col !== "1") return;

  const materiaValore = textareaMateria.value.trim();
  if (!materiaValore) return;

  const settimanaTarget = textareaMateria.dataset.settimana;
  const orarioMateria = [];

  // Scorre tutto il localStorage per trovare materia e classe
  for (let chiave in localStorage) {
    if (!chiave.startsWith("cella-")) continue;

    const match = chiave.match(/^cella-(\d{4}-\d{2}-\d{2})-(\d)-1$/); // solo colonna materia
    if (!match) continue;

    const [_, dataISO, oraStr] = match;
    const giornoSettimana = new Date(dataISO).getDay(); // 1 = lunedì, ..., 6 = sabato

    if (giornoSettimana < 1 || giornoSettimana > 6) continue; // esclude domenica

    const materia = localStorage.getItem(chiave)?.trim();
    if (materia !== materiaValore) continue;

    // Verifica che sia della stessa settimana
    const dataInizio = new Date(localStorage.getItem("dataSelezionata"));
    const settimanaInizio = new Date(dataInizio);
    settimanaInizio.setDate(dataInizio.getDate() + (parseInt(settimanaTarget) * 7));
    const settimanaFine = new Date(settimanaInizio);
    settimanaFine.setDate(settimanaFine.getDate() + 6);

    const dataMateria = new Date(dataISO);
    if (dataMateria < settimanaInizio || dataMateria > settimanaFine) continue;

    const classe = localStorage.getItem(`cella-${dataISO}-${oraStr}-0`)?.trim(); // colonna classe
    if (!classe) continue;

    orarioMateria.push({
      data: dataMateria,
      ora: parseInt(oraStr) + 8,
      classe: classe
    });
  }

  mostraRisultatiMateria(orarioMateria, materiaValore);
}
// ===============================
// TABELLA MATERIA
// ===============================
function mostraRisultatiMateria(orarioMateria, materia) {
  const contenitore = document.getElementById("risultati");
  contenitore.innerHTML = ""; // cancella qualsiasi risultato precedente

  if (orarioMateria.length === 0) {
    contenitore.innerHTML += "<p>Nessuna occorrenza trovata per questa materia nella settimana selezionata.</p>";
    return;
  }

  const tabella = document.createElement("table");
  tabella.classList.add("tabella-risultati");
  tabella.id = "tabella-materia";

  tabella.innerHTML = `
    <tr>
      <th id="titolo-orario-materia" class="th-risultati" colspan="3">${materia}</th>
    </tr>
    <tr>
      <th>Data</th>
      <th>Ora</th>
      <th>Classe</th>
    </tr>
  `;

  orarioMateria.sort((a, b) => a.data - b.data || a.ora - b.ora);

  orarioMateria.forEach(item => {
    const dataStr = item.data.toLocaleDateString("it-IT", {
      weekday: "short", day: "2-digit", month: "2-digit"
    });

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="td-orario">${dataStr}</td>
      <td class="td-orario">${item.ora}</td>
      <td class="td-orario">${item.classe}</td>
    `;
    tabella.appendChild(tr);
  });

  contenitore.appendChild(tabella);
  spostaRisultatiSeMobile();
}

function spostaRisultatiSeMobile() {
  const isMobile = window.innerWidth <= 600;
  const risultati = document.getElementById("risultati");
  const container = document.getElementById("container");

  if (isMobile && risultati && container) {
    container.parentNode.insertBefore(risultati, container); // sposta sopra
    setTimeout(() => {
      risultati.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100); // leggero delay per sicurezza
  }
}

window.addEventListener("resize", spostaRisultatiSeMobile);





