// Colunas presentes em todas as tabelas, preparando a sincronização com a
// nuvem:
// - created_at / updated_at: quando o registro foi criado e alterado;
// - deleted_at: quando foi excluído. Nada é apagado de verdade (exclusão
//   lógica): o registro fica no banco como histórico e some das consultas;
// - sync_status: 'pending' até ser enviado para a nuvem.
export const SYNC_COLUMNS = `
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  sync_status TEXT NOT NULL DEFAULT 'pending'`;
