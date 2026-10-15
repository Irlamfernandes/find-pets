import React from 'react';
import PropTypes from 'prop-types';
import { InfoRow } from '../../../shared/components/InfoRow';
import { SYNC_STATUS } from '../../../shared/database/syncFields';

// Registro alterado neste celular que ainda não chegou ao servidor
export function SyncPendingNotice({ syncStatus }) {
  if (syncStatus !== SYNC_STATUS.PENDING) return null;
  return (
    <InfoRow
      icon="cloud-upload-outline"
      text="Aguardando internet para enviar ao servidor"
    />
  );
}

SyncPendingNotice.propTypes = {
  syncStatus: PropTypes.string,
};
