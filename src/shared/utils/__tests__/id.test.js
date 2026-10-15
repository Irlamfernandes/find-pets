import { createId } from '../id';

describe('createId', () => {
  it('deve gerar UUIDs diferentes a cada chamada', () => {
    const first = createId();

    expect(first).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-/);
    expect(createId()).not.toBe(first);
  });
});
