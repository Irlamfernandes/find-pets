import { postsApi } from '../postsApi';
import { request } from '../../../../shared/api/httpClient';

jest.mock('../../../../shared/api/httpClient', () => ({
  request: jest.fn().mockResolvedValue([]),
}));

describe('postsApi', () => {
  it('deve buscar o que mudou desde a última sincronização', async () => {
    await postsApi.listChangedSince('t', '2026-10-15T10:00:00.000Z');

    expect(request).toHaveBeenCalledWith(
      '/posts?since=2026-10-15T10%3A00%3A00.000Z',
      { token: 't' }
    );
  });

  it('deve criar ou atualizar o registro pelo id', async () => {
    const post = { id: 'p1', petName: 'Rex' };

    await postsApi.save('t', post);

    expect(request).toHaveBeenCalledWith('/posts/p1', {
      method: 'PUT',
      body: post,
      token: 't',
    });
  });
});
