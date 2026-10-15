// Valores das colunas de controle (ver tables/syncColumns.js). Toda
// alteração volta o registro para 'pending', para ser enviado à nuvem.
export const SYNC_STATUS = { PENDING: 'pending', SYNCED: 'synced' };

const now = () => new Date().toISOString();

export const createdFields = (at = now()) => ({
  created_at: at,
  updated_at: at,
  deleted_at: null,
  sync_status: SYNC_STATUS.PENDING,
});

export const updatedFields = (at = now()) => ({
  updated_at: at,
  sync_status: SYNC_STATUS.PENDING,
});

// Exclusão lógica: marca a data em vez de apagar a linha
export const deletedFields = (at = now()) => ({
  deleted_at: at,
  ...updatedFields(at),
});
