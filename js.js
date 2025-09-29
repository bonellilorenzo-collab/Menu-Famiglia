// CONFIGURAZIONE FIREBASE (modifica con i tuoi dati)
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

// Variabili globali
const giorni = ["Lunedì","Martedì","Mercoledì","Giovedì","Venerdì","Sabato","Domenica"];
const pasti = ["colazione","pranzo","cena"];
let menuData = {};

// Listener bottone reset
document.getElementById('resetBtn').addEventListener('click', () => {
  if(confirm("Sei sicuro di voler resettare il menù per tutta la settimana?")) {
    db.collection('menu').get().then((snap) => {
      snap.forEach(doc => db.collection('menu').doc(doc.id).delete());
    });
  }
});

// Carica dati da Firestore e mostra
function caricaMenu() {
  db.collection('menu').onSnapshot((snapshot) => {
    menuData = {};
    snapshot.forEach(doc => {
      menuData[doc.id] = doc.data();
    });
    aggiornaUI();
  });
}

// Aggiorna l'interfaccia utente
function aggiornaUI(){
  pasti.forEach(pasto => {
    const container = document.getElementById(pasto);
    container.innerHTML = '';
    giorni.forEach(giorno => {
      const key = giorno + '-' + pasto;
      const piatti = menuData[key]?.piatti || [];
      const divGiorno = document.createElement('div');
      divGiorno.style.borderBottom = '1px solid #f5c6b1';
      divGiorno.style.marginBottom = '0.5rem';
      divGiorno.innerHTML = `<strong>${giorno}</strong>: ${piatti.join(", ") || 'Nessun piatto'}`;
      container.appendChild(divGiorno);
    });
  });
}

// Chiamata iniziale per caricare il menu
caricaMenu();
