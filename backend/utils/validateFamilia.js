function validateNomeFamilia(nome) {
  if (!nome || !String(nome).trim()) return 'Nome da família é obrigatório';
  if (String(nome).trim().length > 60) return 'Nome muito longo (máximo 60 caracteres)';
  return null;
}

function validateCodigoFamilia(codigo) {
  if (!codigo || !String(codigo).trim()) return 'Código é obrigatório';
  return null;
}

module.exports = { validateNomeFamilia, validateCodigoFamilia };
