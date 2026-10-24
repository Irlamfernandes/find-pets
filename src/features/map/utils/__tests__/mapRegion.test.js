import { regionAround, regionForPoints } from '../mapRegion';

describe('mapRegion', () => {
  it('deve centralizar no ponto com a área informada ou a mínima', () => {
    expect(regionAround({ latitude: -22, longitude: -43 }, 0.005)).toEqual({
      latitude: -22,
      longitude: -43,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    });
    expect(regionAround({ latitude: 1, longitude: 2 }).latitudeDelta).toBe(
      0.01
    );
  });

  it('deve mostrar todos os pontos, centralizados e com margem', () => {
    const region = regionForPoints([
      { latitude: -22, longitude: -44 },
      { latitude: -23, longitude: -43 },
    ]);

    expect(region.latitude).toBeCloseTo(-22.5);
    expect(region.longitude).toBeCloseTo(-43.5);
    expect(region.latitudeDelta).toBeCloseTo(1.4);
    expect(region.longitudeDelta).toBeCloseTo(1.4);
  });

  it('deve usar a área mínima quando há um ponto só', () => {
    expect(regionForPoints([{ latitude: -22, longitude: -43 }])).toEqual({
      latitude: -22,
      longitude: -43,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
  });
});
