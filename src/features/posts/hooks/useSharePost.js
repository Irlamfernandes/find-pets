import { useState } from 'react';
import { shareService } from '../services/shareService';
import { useAppAlert } from '../../../shared/components/AppAlert';

export function useSharePost() {
  const showAlert = useAppAlert();
  const [sharingPost, setSharingPost] = useState(null);

  const sharePoster = async (posterRef) => {
    try {
      await shareService.sharePoster(posterRef);
    } catch {
      showAlert({
        type: 'danger',
        title: 'Não foi possível compartilhar',
        message: 'Tente novamente em alguns instantes.',
      });
    }
  };

  return {
    sharingPost,
    openShare: setSharingPost,
    closeShare: () => setSharingPost(null),
    sharePoster,
  };
}
