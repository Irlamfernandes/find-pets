import {
  createdFields,
  updatedFields,
  deletedFields,
  SYNC_STATUS,
} from '../syncFields';

const AT = '2026-10-15T12:00:00.000Z';

describe('syncFields', () => {
  it('deve marcar o registro novo como pendente de envio', () => {
    expect(createdFields(AT)).toEqual({
      created_at: AT,
      updated_at: AT,
      deleted_at: null,
      sync_status: SYNC_STATUS.PENDING,
    });
  });

  it('deve marcar a alteração e a exclusão com a data', () => {
    expect(updatedFields(AT)).toEqual({
      updated_at: AT,
      sync_status: 'pending',
    });
    expect(deletedFields(AT)).toEqual({
      deleted_at: AT,
      updated_at: AT,
      sync_status: 'pending',
    });
  });

  it('deve usar a data atual quando nenhuma for informada', () => {
    jest.useFakeTimers({ now: new Date(AT) });

    expect(createdFields().created_at).toBe(AT);
    expect(updatedFields().updated_at).toBe(AT);
    expect(deletedFields().deleted_at).toBe(AT);

    jest.useRealTimers();
  });
});
