#!/usr/bin/env bash
set -u

PASTA="$(cd "$(dirname "$0")" && pwd)"
APROVADAS="$PASTA/.aprovadas"
EXPO_URL="${EXPO_URL:-exp://127.0.0.1:8081}"
EMAIL="e2e$(date +%s)@teste.com"
SENHA="senha123"
NOVA_SENHA="novasenha123"
export PATH="$PATH:$HOME/.maestro/bin:$HOME/Android/platform-tools"

if [ "${1:-}" = "--tudo" ]; then
  rm -f "$APROVADAS"
fi
touch "$APROVADAS"

adb reverse tcp:8081 tcp:8081 >/dev/null

driver="--reinstall-driver"

for tela in "$PASTA"/telas/*.yaml; do
  nome="$(basename "$tela" .yaml)"
  if grep -qx "$nome" "$APROVADAS"; then
    verificar=false
    echo "▶ $nome (caminho feliz)"
  else
    verificar=true
    echo "▶ $nome (verificação completa)"
  fi

  if ! maestro test "$driver" \
    -e EXPO_URL="$EXPO_URL" -e EMAIL="$EMAIL" -e SENHA="$SENHA" \
    -e NOVA_SENHA="$NOVA_SENHA" \
    -e VERIFICAR="$verificar" "$tela"; then
    echo "✖ $nome falhou. Corrija e rode de novo: as telas aprovadas serão rápidas."
    exit 1
  fi
  driver="--no-reinstall-driver"

  if [ "$verificar" = true ]; then
    echo "$nome" >> "$APROVADAS"
  fi
  echo "✔ $nome"
done

echo "Todas as telas passaram."
