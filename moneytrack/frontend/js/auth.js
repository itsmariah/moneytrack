function register(event) {
  event.preventDefault();

  const nome = document.getElementById("nome").value;
  const email = document.getElementById("email").value;
  const senha = document.getElementById("senha").value;

  let usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];

  const usuarioExistente = usuarios.find((user) => user.email === email);

  if (usuarioExistente) {
    alert("Este e-mail já está cadastrado.");
    return;
  }

  const novoUsuario = {
    id: Date.now(),
    nome,
    email,
    senha
  };

  usuarios.push(novoUsuario);
  localStorage.setItem("usuarios", JSON.stringify(usuarios));

  alert("Cadastro realizado com sucesso!");
  window.location.href = "login.html";
}

function login(event) {
  event.preventDefault();

  const email = document.getElementById("loginEmail").value;
  const senha = document.getElementById("loginSenha").value;

  let usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];

  const usuario = usuarios.find(
    (user) => user.email === email && user.senha === senha
  );

  if (!usuario) {
    alert("E-mail ou senha inválidos.");
    return;
  }

  localStorage.setItem("usuarioLogado", JSON.stringify(usuario));
  window.location.href = "dashboard.html";
}

function checkAuth() {
  const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));

  if (!usuario) {
    window.location.href = "login.html";
  }
}

function logout() {
  localStorage.removeItem("usuarioLogado");
  window.location.href = "login.html";
}

function showUserName() {
  const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
  const userName = document.getElementById("userName");

  if (usuario && userName) {
    userName.innerText = `Olá, ${usuario.nome}`;
  }
}