/* INDEX.HTML */
    /* CARDS */
    function toggleFeature(clickedElement) {
    const allFeatures = document.querySelectorAll(".feature-box");

    allFeatures.forEach((item) => {
        // fecha todos os outros
        if (item !== clickedElement) {
        item.classList.remove("active");
        }
    });

    // alterna o clicado
    clickedElement.classList.toggle("active");
    }

    /* BACK TO TOP */
    // Mostrar botão ao rolar
    window.onscroll = function () {
    const btn = document.getElementById("backToTop");

    if (document.documentElement.scrollTop > 300) {
        btn.style.display = "block";
    } else {
        btn.style.display = "none";
    }
    };

    // Voltar ao topo suavemente
    const backBtn = document.getElementById("backToTop");

    if (backBtn) {
    backBtn.onclick = function () {
        window.scrollTo({
        top: 0,
        behavior: "smooth"
        });
    };
    }
    
    /* ANIMAÇÃO DO BACKGROUND */
    function createMoneyAnimation() {
    const container = document.querySelector(".money-bg");

    if (!container) return; // evita erro se não existir

    for (let i = 0; i < 30; i++) {
        const span = document.createElement("span");
        span.innerText = "$";

        span.style.left = Math.random() * 100 + "vw";
        span.style.fontSize = Math.random() * 30 + 15 + "px";
        span.style.animationDuration = Math.random() * 5 + 5 + "s";
        span.style.animationDelay = Math.random() * 5 + "s";

        container.appendChild(span);
    }
    }
    document.addEventListener("DOMContentLoaded", () => {
    createMoneyAnimation();
    });
/* FIM DO INDEX.HTML */

/* DASHBOARD.HTML */
    /* TRANSAÇÕES */
    let transactions = JSON.parse(localStorage.getItem("transactions")) || [];

    function handleTransaction(event) {
    event.preventDefault();

    const descricao = document.getElementById("descricao").value;
    const valor = document.getElementById("valor").value;
    const tipo = document.getElementById("tipo").value;

    addTransaction(tipo, valor, descricao);
    }

    function addTransaction(tipo, valor, descricao) {
    const transaction = {
        id: Date.now(),
        tipo,
        valor: parseFloat(valor),
        descricao
    };

    transactions.push(transaction);
    localStorage.setItem("transactions", JSON.stringify(transactions));

    renderTransactions();
    }

    /* LISTAGEM */
    function renderTransactions() {
    const list = document.getElementById("transactionsList");
    if (!list) return;

    list.innerHTML = "";

    transactions.forEach(t => {
        const li = document.createElement("li");

        li.innerHTML = `
        <span>${t.descricao}</span>
        <span style="color: ${t.tipo === 'receita' ? '#22c55e' : '#ef4444'}">
            ${t.tipo === 'receita' ? '+' : '-'} R$ ${t.valor.toFixed(2)}
        </span>
        `;
    });

    calculateBalance();
    updateChart();
    }

   /* SALDO */
    function calculateBalance() {
    let saldo = 0;

    transactions.forEach(t => {
        saldo += t.tipo === "receita" ? t.valor : -t.valor;
    });

    const balance = document.getElementById("balance");
    if (balance) {
        balance.innerText = `R$ ${saldo.toFixed(2)}`;
    }
    }

    /* GRÁFICO */
    let chart;

    function updateChart() {
    let receitas = 0;
    let despesas = 0;

    transactions.forEach(t => {
        if (t.tipo === "receita") receitas += t.valor;
        else despesas += t.valor;
    });

    const ctx = document.getElementById("myChart");

    if (!ctx) return;

    if (chart) chart.destroy();

    chart = new Chart(ctx, {
        type: "doughnut",
        data: {
        labels: ["Receitas", "Despesas"],
        datasets: [{
            data: [receitas, despesas]
        }]
        }
    });
    }