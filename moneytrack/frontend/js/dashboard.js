let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
let chart;

function handleTransaction(event) {
  event.preventDefault();

  const descricao = document.getElementById("descricao").value;
  const valor = document.getElementById("valor").value;
  const tipo = document.getElementById("tipo").value;
  const categoria = document.getElementById("categoria").value;
  const data = document.getElementById("data").value;

  addTransaction(tipo, valor, descricao, categoria, data);
  event.target.reset();
}

function addTransaction(tipo, valor, descricao, categoria, data) {
  const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));

  const transaction = {
    id: Date.now(),
    usuario_id: usuario ? usuario.id : null,
    tipo,
    valor: parseFloat(valor),
    descricao,
    categoria,
    data
  };

  transactions.push(transaction);
  localStorage.setItem("transactions", JSON.stringify(transactions));

  renderTransactions();
}

function renderTransactions() {
  const list = document.getElementById("transactionsList");
  if (!list) return;

  const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
  if (!usuario) return;

  const filterTipo = document.getElementById("filterTipo")?.value || "";
  const filterCategoria = document.getElementById("filterCategoria")?.value || "";

  list.innerHTML = "";

  let userTransactions = transactions.filter((t) => t.usuario_id === usuario.id);

  if (filterTipo) {
    userTransactions = userTransactions.filter((t) => t.tipo === filterTipo);
  }

  if (filterCategoria) {
    userTransactions = userTransactions.filter((t) => t.categoria === filterCategoria);
  }

  userTransactions.forEach((t) => {
    const li = document.createElement("li");

    li.innerHTML = `
      <div>
        <strong>${t.descricao}</strong><br>
        <small>${t.categoria} | ${t.data}</small>
      </div>

      <div>
        <span style="color: ${t.tipo === "receita" ? "#22c55e" : "#ef4444"}">
          ${t.tipo === "receita" ? "+" : "-"} R$ ${t.valor.toFixed(2)}
        </span>
        <button onclick="deleteTransaction(${t.id})">Excluir</button>
      </div>
    `;

    list.appendChild(li);
  });

  calculateBalance();
  updateSummary();
  updateChart();
}

function calculateBalance() {
  const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
  if (!usuario) return;

  const userTransactions = transactions.filter((t) => t.usuario_id === usuario.id);

  let saldo = 0;

  userTransactions.forEach((t) => {
    saldo += t.tipo === "receita" ? t.valor : -t.valor;
  });

  const balance = document.getElementById("balance");

  if (balance) {
    balance.innerText = `R$ ${saldo.toFixed(2)}`;
  }
}

function updateSummary() {
  const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
  if (!usuario) return;

  const userTransactions = transactions.filter((t) => t.usuario_id === usuario.id);

  let receitas = 0;
  let despesas = 0;

  userTransactions.forEach((t) => {
    if (t.tipo === "receita") {
      receitas += t.valor;
    } else {
      despesas += t.valor;
    }
  });

  const totalReceitas = document.getElementById("totalReceitas");
  const totalDespesas = document.getElementById("totalDespesas");

  if (totalReceitas) {
    totalReceitas.innerText = `R$ ${receitas.toFixed(2)}`;
  }

  if (totalDespesas) {
    totalDespesas.innerText = `R$ ${despesas.toFixed(2)}`;
  }
}

function updateChart() {
  const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
  if (!usuario) return;

  const userTransactions = transactions.filter((t) => t.usuario_id === usuario.id);

  let receitas = 0;
  let despesas = 0;

  userTransactions.forEach((t) => {
    if (t.tipo === "receita") {
      receitas += t.valor;
    } else {
      despesas += t.valor;
    }
  });

  const ctx = document.getElementById("myChart");
  if (!ctx || typeof Chart === "undefined") return;

  if (chart) {
    chart.destroy();
  }

  chart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Receitas", "Despesas"],
      datasets: [
        {
          data: [receitas, despesas]
        }
      ]
    }
  });
}

function deleteTransaction(id) {
  transactions = transactions.filter((t) => t.id !== id);
  localStorage.setItem("transactions", JSON.stringify(transactions));
  renderTransactions();
}