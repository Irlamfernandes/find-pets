import { postService } from '../postService';
import { postRepository } from '../../data/postRepository';
import { clearDatabase, selectRows } from '../../../../testing/database';

const post = (id, extra = {}) => ({
  id,
  status: 'Perdido',
  images: [],
  ...extra,
});

const ids = (posts) => posts.map((item) => item.id);

describe('postService', () => {
  beforeEach(async () => {
    await clearDatabase();
    jest.restoreAllMocks();
  });

  it('deve começar vazio e guardar o registro mais novo primeiro', async () => {
    await expect(postService.getPosts()).resolves.toEqual([]);

    await postService.savePost(post('1'));
    const saved = await postService.savePost(post('2'));

    expect(ids(saved)).toEqual(['2', '1']);
    expect(ids(await postService.getPosts())).toEqual(['2', '1']);
  });

  it('deve atualizar os campos de um registro mantendo o id', async () => {
    await postService.savePost(post('1'));
    await postService.savePost(post('2'));

    const posts = await postService.updatePost('1', {
      id: 'outro',
      status: 'Encontrado',
    });

    expect(posts).toMatchObject([
      { id: '2', status: 'Perdido' },
      { id: '1', status: 'Encontrado' },
    ]);
  });

  it('deve tirar da lista apenas o registro excluído, sem apagá-lo do banco', async () => {
    await postService.savePost(post('1'));
    await postService.savePost(post('2'));

    expect(ids(await postService.deletePost('1'))).toEqual(['2']);
    await expect(selectRows('SELECT id FROM posts')).resolves.toHaveLength(2);
  });

  it('não deve gravar nada se o registro falhar no meio do salvamento', async () => {
    // O id repetido faz o INSERT falhar dentro da transação
    await postService.savePost(post('1', { images: ['a.jpg'] }));

    await expect(
      postService.savePost(post('1', { images: ['b.jpg'] }))
    ).rejects.toThrow('Erro ao salvar a publicação');
    await expect(
      selectRows('SELECT local_uri FROM post_images')
    ).resolves.toEqual([{ local_uri: 'a.jpg' }]);
  });

  it('deve validar os dados recebidos', () => {
    expect(() => postService.savePost({})).toThrow('Dados do post inválidos.');
    expect(() => postService.savePost(null)).toThrow(
      'Dados do post inválidos.'
    );
    expect(() => postService.deletePost('')).toThrow(
      'ID da publicação é obrigatório.'
    );
    expect(() => postService.updatePost(null, {})).toThrow(
      'ID da publicação é obrigatório.'
    );
  });

  it('deve informar as falhas do banco', async () => {
    jest
      .spyOn(postRepository, 'findActive')
      .mockRejectedValue(new Error('indisponível'));

    await expect(postService.getPosts()).rejects.toThrow(
      'Erro ao carregar as publicações: indisponível'
    );
    await expect(postService.savePost(post('1'))).rejects.toThrow(
      'Erro ao salvar a publicação: indisponível'
    );
    await expect(postService.deletePost('1')).rejects.toThrow(
      'Erro ao excluir a publicação: indisponível'
    );
    await expect(postService.updatePost('1', {})).rejects.toThrow(
      'Erro ao atualizar a publicação: indisponível'
    );
  });
});
