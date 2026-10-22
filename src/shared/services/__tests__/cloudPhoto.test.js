import { isCloudPhoto, toCloudPhoto } from '../cloudPhoto';

describe('cloudPhoto', () => {
  it('deve reconhecer fotos que já estão no formato da nuvem', () => {
    expect(isCloudPhoto('data:image/jpeg;base64,AAA')).toBe(true);
    expect(isCloudPhoto('file:///docs/post-photo-1.jpg')).toBe(false);
    expect(isCloudPhoto(null)).toBe(false);
  });

  it('deve reduzir a foto do celular e convertê-la em texto', async () => {
    await expect(toCloudPhoto('file:///docs/a.jpg')).resolves.toBe(
      'data:image/jpeg;base64,foto(file:///docs/a.jpg)'
    );
  });
});
