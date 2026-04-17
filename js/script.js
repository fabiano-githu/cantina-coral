// js/script.js
// =============================================
// Cantina Coral Louvor Vida - Controle de Doações
// Versão FINAL AJUSTADA - Abril 2026
// =============================================

let itens = [];
let currentItem = null;
let db = null;
let unsubscribe = null;
let useFirebase = false;

// ==================== CONFIGURAÇÃO FIREBASE ====================
const firebaseConfig = {
  apiKey: "AIzaSyAFTR0tp0XJ8-YM3SuCOAeiou4MKG8Tt5I",
  authDomain: "lista-cantina-2026.firebaseapp.com",
  projectId: "lista-cantina-2026",
  storageBucket: "lista-cantina-2026.firebasestorage.app",
  messagingSenderId: "948630477430",
  appId: "1:948630477430:web:2fa4dc3fd658aec6afdd57"
};

// ==================== ITENS INICIAIS (sua lista mantida e corrigida) ====================
const initialItems = [
    { id: 1,  nome: "1kg de filé de frango",          quantidade: "1kg",   unidade: "bandeja",  disponivel: true, doadoPor: null },
    { id: 2,  nome: "1kg de filé de frango",          quantidade: "1kg",   unidade: "bandeja",  disponivel: true, doadoPor: null },
    { id: 3,  nome: "1kg de filé de frango",          quantidade: "1kg",   unidade: "bandeja",  disponivel: true, doadoPor: null },

    { id: 4,  nome: "Farinha de trigo (Rosa Branca)", quantidade: "1kg",   unidade: "pacote",   disponivel: true, doadoPor: null },
    { id: 5,  nome: "Farinha de trigo (Rosa Branca)", quantidade: "1kg",   unidade: "pacote",   disponivel: true, doadoPor: null },
    { id: 6,  nome: "Farinha de trigo (Rosa Branca)", quantidade: "1kg",   unidade: "pacote",   disponivel: true, doadoPor: null },

    { id: 7,  nome: "Margarina (Delícia)",            quantidade: "500g",  unidade: "pote",     disponivel: true, doadoPor: null },
    { id: 8,  nome: "Margarina (Delícia)",            quantidade: "500g",  unidade: "pote",     disponivel: true, doadoPor: null },
    { id: 9,  nome: "Margarina (Delícia)",            quantidade: "500g",  unidade: "pote",     disponivel: true, doadoPor: null },

    { id: 10, nome: "Guaraná (Antártica)",            quantidade: "200ml", unidade: "garrafa",  disponivel: true, doadoPor: null },
    { id: 11, nome: "Guaraná (Antártica)",            quantidade: "200ml", unidade: "garrafa",  disponivel: true, doadoPor: null },
    { id: 12, nome: "Guaraná (Antártica)",            quantidade: "200ml", unidade: "garrafa",  disponivel: true, doadoPor: null },

    { id: 13, nome: "Molho de tomate + cheiro-verde", quantidade: "3 sachês", unidade: "kit",    disponivel: true, doadoPor: null },
    { id: 14, nome: "Cebola + lemon pepper",          quantidade: "100g",  unidade: "kit",      disponivel: true, doadoPor: null }
];

// ==================== INICIALIZAÇÃO ====================
function init() {
    console.log('%c🚀 Cantina Coral Louvor Vida - Sistema iniciado!', 'color:#0d6efd; font-size:16px; font-weight:bold');

    if (firebaseConfig.apiKey && firebaseConfig.projectId) {
        useFirebase = true;
        inicializarFirebase();
    } else {
        useFirebase = false;
        console.log('💾 Usando modo LocalStorage (offline)');
        carregarDoLocalStorage();
    }

    renderizarCards();
    atualizarContador();
    atualizarStatusFirebase();
}

// ==================== FIREBASE ====================
function inicializarFirebase() {
    try {
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        db = firebase.firestore();

        unsubscribe = db.collection("itensDoacao").onSnapshot((snapshot) => {
            itens = snapshot.docs.map(doc => ({
                id: parseInt(doc.id),
                nome: doc.data().nome,
                quantidade: doc.data().quantidade,
                unidade: doc.data().unidade,
                disponivel: doc.data().disponivel !== false,
                doadoPor: doc.data().doadoPor || null
            }));

            if (itens.length === 0) {
                seedFirebase();
            } else {
                renderizarCards();
                atualizarContador();
            }
        }, (error) => {
            console.error("Erro no Firebase:", error);
            alert("Erro ao conectar com o Firebase.\n\nVerifique se as regras do Firestore estão como:\nallow read, write: if true;");
            useFirebase = false;
            carregarDoLocalStorage();
            renderizarCards();
        });

    } catch (e) {
        console.error("Falha ao inicializar Firebase:", e);
        useFirebase = false;
        carregarDoLocalStorage();
    }
}

async function seedFirebase() {
    if (!db) return;
    const batch = db.batch();

    initialItems.forEach(item => {
        const docRef = db.collection("itensDoacao").doc(item.id.toString());
        batch.set(docRef, {
            nome: item.nome,
            quantidade: item.quantidade,
            unidade: item.unidade,
            disponivel: true,
            doadoPor: null
        });
    });

    await batch.commit();
    console.log("✅ Itens iniciais criados no Firebase");
}

// ==================== LOCALSTORAGE ====================
function carregarDoLocalStorage() {
    const salvo = localStorage.getItem("itensDoacaoCantina");
    itens = salvo ? JSON.parse(salvo) : JSON.parse(JSON.stringify(initialItems));
    if (!salvo) salvarNoLocalStorage();
}

function salvarNoLocalStorage() {
    if (!useFirebase) {
        localStorage.setItem("itensDoacaoCantina", JSON.stringify(itens));
    }
}

// ==================== RENDERIZAÇÃO DOS CARDS ====================
function renderizarCards() {
    const container = document.getElementById("items-container");
    if (!container) return;

    container.innerHTML = "";

    itens.forEach(item => {
        const disponivel = item.disponivel;

        const cardHTML = `
        <div class="col-12 col-sm-6 col-lg-4 col-xl-3">
            <div class="card card-donation ${!disponivel ? 'card-unavailable' : ''}" 
                 onclick="${disponivel ? `selecionarItem(${item.id})` : ''}">
                <div class="card-body text-center">
                    <div class="icon-container mx-auto mb-3">
                        <i class="bi bi-gift-fill fs-1"></i>
                    </div>
                    <h5 class="card-title">${item.nome}</h5>
                    <p class="mb-3">
                        <strong>${item.quantidade}</strong> <span class="text-muted">${item.unidade}</span>
                    </p>
                    
                    ${disponivel 
                        ? `<span class="badge bg-success status-badge w-100 py-2">✅ Disponível</span>`
                        : `<div>
                               <span class="badge bg-danger status-badge w-100 py-2 mb-2">❌ Indisponível</span>
                               <p class="small mb-0"><strong>Doado por:</strong><br>${item.doadoPor || '—'}</p>
                           </div>`
                    }
                </div>
            </div>
        </div>`;

        container.innerHTML += cardHTML;
    });
}

function atualizarContador() {
    const doados = itens.filter(i => !i.disponivel).length;
    const el = document.getElementById("contador-doacoes");
    if (el) el.textContent = doados;
}

function atualizarStatusFirebase() {
    const el = document.getElementById("firebase-mode-text");
    if (el) {
        el.textContent = useFirebase ? "🔥 Firebase AO VIVO" : "💾 LocalStorage";
    }
}

// ==================== FUNÇÕES DO MODAL ====================
function selecionarItem(id) {
    currentItem = itens.find(item => item.id === id);
    if (!currentItem || !currentItem.disponivel) return;

    document.getElementById("modal-item-name").textContent = 
        `${currentItem.nome} (${currentItem.quantidade} ${currentItem.unidade})`;
    
    document.getElementById("donorName").value = "";
    
    new bootstrap.Modal(document.getElementById("donationModal")).show();
}

function confirmarDoacao() {
    const nomeDoador = document.getElementById("donorName").value.trim();
    if (!nomeDoador) {
        alert("Por favor, digite seu nome completo.");
        return;
    }
    if (!currentItem) return;

    currentItem.disponivel = false;
    currentItem.doadoPor = nomeDoador;

    if (useFirebase && db) {
        db.collection("itensDoacao").doc(currentItem.id.toString()).update({
            disponivel: false,
            doadoPor: nomeDoador
        }).catch(err => console.error("Erro ao salvar no Firebase:", err));
    } else {
        salvarNoLocalStorage();
    }

    bootstrap.Modal.getInstance(document.getElementById("donationModal")).hide();
    renderizarCards();
    atualizarContador();
}

function resetarTodasDoacoes() {
    if (!confirm("Resetar todas as doações?")) return;

    itens.forEach(item => {
        item.disponivel = true;
        item.doadoPor = null;
    });

    if (useFirebase && db) {
        const batch = db.batch();
        itens.forEach(item => {
            batch.update(db.collection("itensDoacao").doc(item.id.toString()), 
                        { disponivel: true, doadoPor: null });
        });
        batch.commit();
    } else {
        salvarNoLocalStorage();
    }

    renderizarCards();
    atualizarContador();
    alert("✅ Todas as doações foram resetadas!");
}

// Inicia tudo
window.onload = init;