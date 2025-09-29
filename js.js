// CONFIGURAZIONE FIREBASE (modifica con i tuoi dati)
// CONFIGURAZIONE FIREBASE (sostituisci con la tua config Firebase)
const firebaseConfig = {
  apiKey: "AIzaSyChjVcwytkIYVSfxv9_8gVpQlfhAX509es",
  authDomain: "menu--settimanale.firebaseapp.com",
  projectId: "menu--settimanale",
  storageBucket: "menu--settimanale.firebasestorage.app",
  messagingSenderId: "206324209751",
  appId: "1:206324209751:web:cc6ddd29e53c4324932b12",
  measurementId: "G-SK8CFFGSKV"
};

// Inizializza Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const giorni = ["Lunedì","Martedì","Mercoledì","Giovedì","Venerdì","Sabato","Domenica"];
const pasti = ["colazione","pranzo","cena"];

let menuData = {};
let currentUser = null;

// Pulsante reset
document.getElementById('resetBtn').addEventListener('click', () => {
  if(confirm('Sei sicuro di voler resettare il menù per tutta la settimana?')) {
    db.collection('menu').get().then(snapshot => {
      snapshot.forEach(doc => db.collection('menu').doc(doc.id).delete());
    });
  }
});

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

// Aggiungi piatto
function aggiungiPiatto(giorno,pasto) {
  if (!currentUser) {
    currentUser = prompt('Inserisci il tuo nome:');
    if (!currentUser) {
      alert('Nome necessario per aggiungere piatti.');
      return;
    }
  }
  const nomePiatto = prompt(`Aggiungi piatto per ${giorno} - ${pasto}:`);
  if(!nomePiatto) return;
  const key = `${giorno}-${pasto}`;
  const piatti = menuData[key]?.piatti || [];
  piatti.push({ nome: nomePiatto, voti: 0, votanti: [] });
  db.collection('menu').doc(key).set({ piatti });
}

// Vota piatto
function votaPiatto(giorno,pasto,nomePiatto) {
  if (!currentUser) {
    currentUser = prompt('Inserisci il tuo nome:');
    if (!currentUser) {
      alert('Nome necessario per votare.');
      return;
    }
  }
  const key = `${giorno}-${pasto}`;
  const piatti = menuData[key]?.piatti || [];
  const piatto = piatti.find(p => p.nome === nomePiatto);
  if (!piatto) return;
  if (piatto.votanti.includes(currentUser)) {
    alert('Hai già votato questo piatto.');
    return;
  }
  piatto.voti ++;
  piatto.votanti.push(currentUser);
  db.collection('menu').doc(key).set({ piatti });
}

// Aggiorna l'interfaccia
function aggiornaUI() {
  pasti.forEach(pasto => {
    const container = document.getElementById(pasto);
    container.innerHTML = '';
    giorni.forEach(giorno => {
      const key = `${giorno}-${pasto}`;
      const piatti = menuData[key]?.piatti || [];
      const divGiorno = document.createElement('div');
      divGiorno.style.borderBottom = '1px solid #f5c6b1';
      divGiorno.style.marginBottom = '0.5rem';
      let content = `<strong>${giorno}</strong> `;
      content += `<button class="btn-add" onclick="aggiungiPiatto('${giorno}','${pasto}')">+ Aggiungi</button><br/>`;
      piatti.sort((a,b) => b.voti - a.voti);
      piatti.forEach(p => {
        content += `<div>${p.nome} <span>(${p.voti})</span> <button onclick="votaPiatto('${giorno}','${pasto}','${p.nome}')">👍</button></div>`;
      });
      divGiorno.innerHTML = content;
      container.appendChild(divGiorno);
    });
  });
}

// Avvia caricamento dati
caricaMenu();


// Chiamata iniziale per caricare il menu
caricaMenu();


