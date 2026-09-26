import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

export const shareService = {
  // Gera uma imagem do cartaz (foto + informações) e abre o compartilhamento
  // do celular, para enviar tudo em uma única mensagem
  async sharePoster(posterRef) {
    if (!(await Sharing.isAvailableAsync())) {
      throw new Error('O compartilhamento não está disponível neste aparelho.');
    }
    const uri = await captureRef(posterRef, {
      format: 'jpg',
      quality: 0.9,
      result: 'tmpfile',
    });
    await Sharing.shareAsync(uri, {
      mimeType: 'image/jpeg',
      dialogTitle: 'Compartilhar cartaz do pet',
    });
  },
};
