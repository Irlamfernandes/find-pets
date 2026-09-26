import { File } from 'expo-file-system';
import { profilePhotoStorage } from '../profilePhotoStorage';

const mockFiles = [];

jest.mock('expo-file-system', () => {
  class MockFile {
    constructor(base, name) {
      this.uri = name ? `${base.uri}${name}` : base;
      this.exists = !this.uri.includes('missing');
      this.copy = jest.fn().mockResolvedValue(undefined);
      this.delete = jest.fn(() => {
        if (this.uri.includes('locked')) throw new Error('bloqueado');
      });
      mockFiles.push(this);
    }
  }
  return {
    File: MockFile,
    Paths: { document: { uri: 'file:///docs/' } },
  };
});

describe('profilePhotoStorage', () => {
  beforeEach(() => {
    mockFiles.length = 0;
    jest.spyOn(Date, 'now').mockReturnValue(123);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('deve copiar a foto do cache para a pasta de documentos', async () => {
    const uri = await profilePhotoStorage.persist('file:///cache/picker.jpg');

    expect(uri).toBe('file:///docs/profile-photo-123.jpg');
    const [source, destination] = [mockFiles[1], mockFiles[0]];
    expect(source.uri).toBe('file:///cache/picker.jpg');
    expect(source.copy).toHaveBeenCalledWith(destination);
    expect(mockFiles[0]).toBeInstanceOf(File);
  });

  it('não deve copiar uma foto já salva nem valores vazios', async () => {
    await expect(
      profilePhotoStorage.persist('file:///docs/profile-photo-1.jpg')
    ).resolves.toBe('file:///docs/profile-photo-1.jpg');
    await expect(profilePhotoStorage.persist(null)).resolves.toBeNull();
    expect(mockFiles).toHaveLength(0);
  });

  it('deve apagar apenas fotos de perfil salvas e ignorar falhas', () => {
    profilePhotoStorage.remove('file:///docs/profile-photo-1.jpg');
    expect(mockFiles[0].delete).toHaveBeenCalledTimes(1);

    profilePhotoStorage.remove('file:///docs/profile-photo-missing.jpg');
    expect(mockFiles[1].delete).not.toHaveBeenCalled();

    expect(() =>
      profilePhotoStorage.remove('file:///docs/profile-photo-locked.jpg')
    ).not.toThrow();

    profilePhotoStorage.remove('file:///cache/picker.jpg');
    profilePhotoStorage.remove(null);
    expect(mockFiles).toHaveLength(3);
  });
});
