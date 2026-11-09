#!/usr/bin/env bash
set -u

PASTA="$(cd "$(dirname "$0")" && pwd)"
APROVADAS="$PASTA/.aprovadas"
CONTA="$PASTA/.conta"
EXPO_URL="${EXPO_URL:-exp://127.0.0.1:8081}"
SENHA="senha123"
NOVA_SENHA="novasenha123"
export PATH="$PATH:$HOME/.maestro/bin:$HOME/Android/platform-tools"

if [ "${1:-}" = "--tudo" ]; then
  rm -f "$APROVADAS" "$CONTA"
fi
touch "$APROVADAS"

aprovada() {
  grep -qx "$1" "$APROVADAS"
}

tela_aprovada() {
  local pasta="$PASTA/telas/$1" funcao
  for funcao in "$pasta"/[0-9]*.yaml; do
    aprovada "$1/$(basename "$funcao" .yaml)" || return 1
  done
}

if [ -s "$CONTA" ] && tela_aprovada 02-cadastro && tela_aprovada 03-perfil-inicial; then
  EMAIL="$(cat "$CONTA")"
  CONTA_CRIADA=true
  echo "Usando a conta já criada: $EMAIL"
else
  EMAIL="e2e$(date +%s)@teste.com"
  CONTA_CRIADA=false
  rm -f "$CONTA"
  echo "Criando a conta nova: $EMAIL"
fi

adb reverse tcp:8081 tcp:8081 >/dev/null

driver="--reinstall-driver"

rodar() {
  maestro test "$driver" \
    -e EXPO_URL="$EXPO_URL" -e EMAIL="$EMAIL" -e SENHA="$SENHA" \
    -e NOVA_SENHA="$NOVA_SENHA" -e CONTA_CRIADA="$CONTA_CRIADA" \
    "$1" > "$PASTA/.ultimo.log" 2>&1
  local resultado=$?
  driver="--no-reinstall-driver"
  return $resultado
}

falhou() {
  echo "  ✖ $1 falhou. Detalhes:"
  grep -vE "^\s*$" "$PASTA/.ultimo.log" | tail -15 | sed 's/^/    /'
  if [ "${2:-}" = "10-trocar-senha" ]; then
    rm -f "$CONTA"
  fi
  exit 1
}

for pasta in "$PASTA"/telas/*/; do
  tela="$(basename "$pasta")"
  echo "▶ $tela"

  if [ -f "$pasta/preparar.yaml" ]; then
    rodar "$pasta/preparar.yaml" || falhou "preparar" "$tela"
  fi

  for arquivo in "$pasta"/[0-9]*.yaml; do
    funcao="$(basename "$arquivo" .yaml)"
    nome="${funcao#*-}"
    if aprovada "$tela/$funcao"; then
      echo "  ↷ ${nome//-/ } (já aprovada)"
      continue
    fi
    rodar "$arquivo" || falhou "${nome//-/ }" "$tela"
    echo "$tela/$funcao" >> "$APROVADAS"
    echo "  ✔ ${nome//-/ }"
  done

  rodar "$pasta/caminho-feliz.yaml" || falhou "caminho feliz" "$tela"
  echo "  ✔ caminho feliz"

  if [ "$tela" = "02-cadastro" ] && [ "$CONTA_CRIADA" = false ]; then
    echo "$EMAIL" > "$CONTA"
  fi
done

echo "Todas as telas passaram."
