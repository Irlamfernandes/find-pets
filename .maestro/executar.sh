#!/usr/bin/env bash
# Roda as telas do FindPets em ordem, uma por vez, numa conta nova criada no
# começo. Na primeira vez, cada tela faz a verificação completa; depois de
# aprovada, faz só o caminho feliz (mais rápido). As telas aprovadas ficam
# anotadas em .maestro/.aprovadas (só neste computador).
#
# Uso:
#   npm run test:e2e              verifica só as telas ainda não aprovadas
#   npm run test:e2e -- --tudo    esquece as aprovações e verifica tudo
#
# Precisa do celular no cabo (adb), do Expo Go e do "npx expo start" rodando.
set -u

PASTA="$(cd "$(dirname "$0")" && pwd)"
APROVADAS="$PASTA/.aprovadas"
EXPO_URL="${EXPO_URL:-exp://127.0.0.1:8081}"
EMAIL="e2e$(date +%s)@teste.com"
SENHA="senha123"
# Usada na tela de troca de senha (que depois volta para a original)
NOVA_SENHA="novasenha123"
export PATH="$PATH:$HOME/.maestro/bin:$HOME/Android/platform-tools"

if [ "${1:-}" = "--tudo" ]; then
  rm -f "$APROVADAS"
fi
touch "$APROVADAS"

# O celular acessa o Metro do computador pelo próprio localhost
adb reverse tcp:8081 tcp:8081 >/dev/null

for tela in "$PASTA"/telas/*.yaml; do
  nome="$(basename "$tela" .yaml)"
  if grep -qx "$nome" "$APROVADAS"; then
    verificar=false
    echo "▶ $nome (caminho feliz)"
  else
    verificar=true
    echo "▶ $nome (verificação completa)"
  fi

  if ! maestro test \
    -e EXPO_URL="$EXPO_URL" -e EMAIL="$EMAIL" -e SENHA="$SENHA" \
    -e NOVA_SENHA="$NOVA_SENHA" \
    -e VERIFICAR="$verificar" "$tela"; then
    echo "✖ $nome falhou. Corrija e rode de novo: as telas aprovadas serão rápidas."
    exit 1
  fi

  if [ "$verificar" = true ]; then
    echo "$nome" >> "$APROVADAS"
  fi
  echo "✔ $nome"
done

echo "Todas as telas passaram."
