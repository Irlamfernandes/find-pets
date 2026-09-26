// Fixa o fuso horário da suíte para que datas e siglas (BRT) sejam as mesmas
// em qualquer máquina, inclusive no CI. Roda antes de os workers iniciarem.
module.exports = function setTestTimeZone() {
  process.env.TZ = 'America/Sao_Paulo';
};
