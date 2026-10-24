"""Testes baseados em propriedades (Hypothesis) das validações da API.

Em vez de escrever cada caso, descrevemos uma regra que vale para QUALQUER
entrada e o Hypothesis gera centenas de entradas (inclusive casos-limite,
como textos vazios, só espaços, emojis e números enormes) tentando quebrá-la.

Rodar: pytest tests_propriedades -p no:cacheprovider --no-cov
(fica fora da pasta tests/, então não entra no pytest normal nem no CI)
"""

import uuid
from datetime import datetime, timedelta, timezone

import pytest
from hypothesis import given, settings
from hypothesis import strategies as st

from findpets_api.auth.passwords import (
    MAX_PASSWORD_BYTES,
    check_password,
    hash_password,
)
from findpets_api.clock import normalize_iso, to_iso
from findpets_api.config import split_list
from findpets_api.errors import ApiError
from findpets_api.posts.payload import MAX_IMAGES, read_images
from findpets_api.validation import (
    check_length,
    optional_number,
    optional_text,
    require_uuid,
    required_text,
)

# Datas com qualquer fuso de -12h a +14h
fusos = st.integers(min_value=-12 * 60, max_value=14 * 60).map(
    lambda minutos: timezone(timedelta(minutes=minutos))
)
datas = st.datetimes(
    min_value=datetime(1971, 1, 1), max_value=datetime(2999, 12, 31), timezones=fusos
)


# --- Textos -------------------------------------------------------------------


@given(st.text())
def test_texto_obrigatorio_sai_sem_espacos_nas_pontas(texto):
    if texto.strip():
        assert required_text({"campo": texto}, "campo") == texto.strip()
    else:
        with pytest.raises(ApiError):
            required_text({"campo": texto}, "campo")


@given(st.text(), st.integers(min_value=0, max_value=50))
def test_limite_de_tamanho_vale_para_qualquer_texto(texto, limite):
    if len(texto) <= limite:
        assert check_length(texto, "campo", limite) == texto
    else:
        with pytest.raises(ApiError):
            check_length(texto, "campo", limite)


@given(st.one_of(st.none(), st.text()))
def test_texto_opcional_aceita_vazio_e_nunca_muda_o_conteudo(valor):
    resultado = optional_text({"campo": valor}, "campo")
    assert resultado == (None if valor is None else valor.strip())


@given(
    st.one_of(
        st.booleans(), st.lists(st.integers()), st.dictionaries(st.text(), st.text())
    )
)
def test_texto_opcional_recusa_o_que_nao_e_texto(valor):
    with pytest.raises(ApiError):
        optional_text({"campo": valor}, "campo")


# --- Números ------------------------------------------------------------------


@given(st.one_of(st.integers(), st.floats(allow_nan=False)))
def test_numero_opcional_aceita_inteiros_e_decimais(numero):
    assert optional_number({"campo": numero}, "campo") == numero


@given(st.one_of(st.booleans(), st.text(), st.lists(st.integers())))
def test_numero_opcional_recusa_booleanos_e_textos(valor):
    # True/False são inteiros no Python, mas não podem passar como coordenada
    with pytest.raises(ApiError):
        optional_number({"campo": valor}, "campo")


# --- Identificadores ----------------------------------------------------------


@given(st.uuids())
def test_qualquer_uuid_e_aceito_e_normalizado(valor):
    assert require_uuid(str(valor).upper()) == str(valor)


@given(st.text())
def test_texto_que_nao_e_uuid_e_recusado(texto):
    try:
        uuid.UUID(texto)
    except ValueError:
        with pytest.raises(ApiError):
            require_uuid(texto)


# --- Datas --------------------------------------------------------------------


@given(datas)
def test_data_em_qualquer_fuso_vira_utc_sem_perder_o_instante(momento):
    texto = to_iso(momento)
    assert texto.endswith("Z") and len(texto) == len("2026-10-15T12:00:00.000Z")
    lida = datetime.fromisoformat(texto)
    # Só os microssegundos abaixo de 1 ms são descartados
    assert abs(lida - momento) < timedelta(milliseconds=1)


@given(datas)
def test_normalizar_uma_data_ja_normalizada_nao_muda_nada(momento):
    texto = to_iso(momento)
    assert normalize_iso(texto, "campo") == texto


@given(datas, datas)
def test_ordem_dos_textos_e_a_ordem_das_datas(primeira, segunda):
    # É o que permite comparar datas como texto no banco
    a, b = to_iso(primeira), to_iso(segunda)
    instante_a = datetime.fromisoformat(a)
    instante_b = datetime.fromisoformat(b)
    assert (a < b) == (instante_a < instante_b)


@given(st.text())
def test_texto_que_nao_e_data_e_recusado(texto):
    try:
        datetime.fromisoformat(texto)
    except ValueError:
        with pytest.raises(ApiError):
            normalize_iso(texto, "campo")


# --- Fotos do registro --------------------------------------------------------

enderecos = st.text(min_size=1, max_size=40)


@given(st.lists(enderecos, max_size=MAX_IMAGES))
def test_fotos_mantem_a_ordem_e_tiram_repetidas(fotos):
    resultado = read_images({"images": fotos})
    assert resultado == list(dict.fromkeys(fotos))
    assert len(resultado) <= MAX_IMAGES


@given(st.lists(enderecos, min_size=MAX_IMAGES + 1, max_size=20))
def test_mais_fotos_que_o_limite_sao_recusadas(fotos):
    with pytest.raises(ApiError):
        read_images({"images": fotos})


# --- Configuração -------------------------------------------------------------


@given(st.lists(st.text(alphabet="abc.:/", min_size=1, max_size=10)))
def test_lista_separada_por_virgula_volta_os_mesmos_itens(itens):
    texto = " , ".join(itens)
    assert split_list(texto) == [item.strip() for item in itens if item.strip()]


# --- Senhas (bcrypt é lento: menos exemplos) ----------------------------------


@settings(max_examples=15, deadline=None)
@given(st.text(min_size=1).filter(lambda s: len(s.encode()) <= MAX_PASSWORD_BYTES))
def test_qualquer_senha_confere_so_com_ela_mesma(senha):
    guardada = hash_password(senha)
    assert check_password(senha, guardada)
    assert (
        not check_password(senha + "x", guardada)
        or len((senha + "x").encode()) > MAX_PASSWORD_BYTES
    )


@settings(max_examples=15, deadline=None)
@given(st.text(min_size=MAX_PASSWORD_BYTES + 1))
def test_senha_longa_demais_e_recusada(senha):
    with pytest.raises(ApiError):
        hash_password(senha)
