const firebaseConfig = {
  apiKey: "AIzaSyChjVcwytkIYVSfxv9_8gVpQlfhAX509es",
  authDomain: "menu--settimanale.firebaseapp.com",
  projectId: "menu--settimanale",
  storageBucket: "menu--settimanale.firebasestorage.app",
  messagingSenderId: "206324209751",
  appId: "1:206324209751:web:cc6ddd29e53c4324932b12",
  measurementId: "G-SK8CFFGSKV"
};

// Inizializza Firebase e Firestore
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const giorni = ["Lunedì","Martedì","Mercoledì","Giovedì","Venerdì","Sabato","Domenica"];
const pasti = ["colazione","pranzo","cena"];

let selectedDays = [...giorni];
let selectedMeals = [...pasti];

let menuData = {};
let currentUser = null;

let modalPiatto = null;
let formPiatto = null;
let inputNomePiatto = null;
let modalGiorno = null;
let modalPasto = null;

function mostraToast(messaggio, tipo = "info") {
  let bgColor = "linear-gradient(to right, #00b09b, #96c93d)"; // verde per info/success
  if(tipo === "error") bgColor = "linear-gradient(to right, #ff5f6d, #ffc371)"; // rosso per errori
  Toastify({
    text: messaggio,
    duration: 3000,
    close: true,
    gravity: "top",
    position: "right",
    backgroundColor: bgColor,
    stopOnFocus: true,
  }).showToast();
}

// Pulsante reset generale
document.getElementById('resetBtn').addEventListener('click', () => {
  if(confirm('Sei sicuro di voler resettare il menù per tutta la settimana?')) {
    db.collection('menu').get().then(snapshot => {
      snapshot.forEach(doc => db.collection('menu').doc(doc.id).delete());
      mostraToast('Menù resettato con successo.', 'info');
    });
  }
});

// Funzione per resettare il menù di un singolo giorno (tutti i pasti)
function resetGiorno(giorno) {
  if (confirm(`Sei sicuro di voler resettare il menù per ${giorno}?`)) {
    pasti.forEach(pasto => {
      const key = `${giorno}-${pasto}`;
      db.collection('menu').doc(key).delete();
    });
    mostraToast(`Menù di ${giorno} resettato con successo.`, "info");
  }
}

// Carica dati in tempo reale
function caricaMenu() {
  db.collection('menu').onSnapshot(snapshot=>{
    menuData = {};
    snapshot.forEach(doc=>{
      menuData[doc.id] = doc.data();
    });
    aggiornaUI();
  });
}

// Setup filtri per giorni e pasti
function setupFilters() {
  document.querySelectorAll('.filter-day').forEach(cb => {
    cb.addEventListener('change', () => {
      selectedDays = Array.from(document.querySelectorAll('.filter-day:checked')).map(e => e.value);
      aggiornaUI();
    });
  });
  document.querySelectorAll('.filter-meal').forEach(cb => {
    cb.addEventListener('change', () => {
      selectedMeals = Array.from(document.querySelectorAll('.filter-meal:checked')).map(e => e.value);
      aggiornaUI();
    });
  });
}

// Setup modal inserimento piatto
function setupModal() {
  modalPiatto = document.getElementById('modalPiatto');
  formPiatto = document.getElementById('formPiatto');
  inputNomePiatto = document.getElementById('inputNomePiatto');
  const btnAnnulla = document.getElementById('btnAnnulla');

  btnAnnulla.addEventListener('click', () => {
    chiudiModal();
  });

  formPiatto.addEventListener('submit', (e) => {
    e.preventDefault();
    const nomePiatto = inputNomePiatto.value.trim();
    if (nomePiatto && modalGiorno && modalPasto) {
      aggiungiPiattoConNome(modalGiorno, modalPasto, nomePiatto);
      chiudiModal();
    }
  });
}

function apriModal(giorno, pasto) {
  modalGiorno = giorno;
  modalPasto = pasto;
  inputNomePiatto.value = '';
  modalPiatto.classList.remove('hidden');
  inputNomePiatto.focus();
}

function chiudiModal() {
  modalPiatto.classList.add('hidden');
  modalGiorno = null;
  modalPasto = null;
}

document.addEventListener('DOMContentLoaded', () => {
  setupFilters();
  setupModal();
});

// Aggiungi piatto (apre modal)
function aggiungiPiatto(giorno, pasto) {
  if (!currentUser) {
    currentUser = prompt('Inserisci il tuo nome:');
    if (!currentUser) {
      mostraToast('Nome necessario per aggiungere piatti.', 'error');
      return;
    }
  }
  apriModal(giorno, pasto);
}

// Aggiungi piatto con nome dal modal
function aggiungiPiattoConNome(giorno, pasto, nomePiatto) {
  const key = `${giorno}-${pasto}`;
  const piatti = menuData[key]?.piatti || [];
  piatti.push({ nome: nomePiatto, voti: 0, votanti: [] });
  db.collection('menu').doc(key).set({ piatti });
  mostraToast(`Piatto "${nomePiatto}" aggiunto per ${giorno} - ${pasto}.`, "info");
}

// Vota piatto
function votaPiatto(giorno,pasto,nomePiatto) {
  if (!currentUser) {
    currentUser = prompt('Inserisci il tuo nome:');
    if (!currentUser) {
      mostraToast('Nome necessario per votare.', 'error');
      return;
    }
  }
  const key = `${giorno}-${pasto}`;
  const piatti = menuData[key]?.piatti || [];
  const piatto = piatti.find(p => p.nome === nomePiatto);
  if (!piatto) return;
  if (piatto.votanti.includes(currentUser)) {
    mostraToast('Hai già votato questo piatto.', 'error');
    return;
  }
  piatto.voti ++;
  piatto.votanti.push(currentUser);
  db.collection('menu').doc(key).set({ piatti });
  mostraToast(`Hai votato "${nomePiatto}" per ${giorno} - ${pasto}.`, "info");
}

// Aggiorna l'interfaccia
function aggiornaUI() {
  pasti.forEach(pasto => {
    const container = document.getElementById(pasto);
    if (!selectedMeals.includes(pasto)) {
      container.style.display = 'none';
      return;
    } else {
      container.style.display = '';
    }
    container.innerHTML = '';
    giorni.forEach(giorno => {
      if (!selectedDays.includes(giorno)) return;
      const key = `${giorno}-${pasto}`;
      const piatti = menuData[key]?.piatti || [];
      const divGiorno = document.createElement('div');
      divGiorno.style.borderBottom = '1px solid #f5c6b1';
      divGiorno.style.marginBottom = '0.5rem';
      let content = `<strong>${giorno}</strong> `;
      content += `<button class="bg-green-500 hover:bg-green-600 text-white font-semibold py-1 px-2 rounded" onclick="aggiungiPiatto('${giorno}','${pasto}')">+ Aggiungi</button><br/>`;
      piatti.sort((a, b) => b.voti - a.voti);
      piatti.forEach(p => {
        content += `<div>${p.nome} <span>(${p.voti})</span> <button class="bg-blue-500 hover:bg-blue-600 text-white px-2 rounded" onclick="votaPiatto('${giorno}','${pasto}','${p.nome}')">👍</button></div>`;
      });
      divGiorno.innerHTML = content;
      container.appendChild(divGiorno);
    });
  });
}

// Avvia caricamento dati
caricaMenu();

