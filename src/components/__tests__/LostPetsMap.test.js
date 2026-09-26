import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { LostPetsMap, buildLostPetsMapHtml } from '../LostPetsMap';

const mockInjectJavaScript = jest.fn();

jest.mock('react-native-webview', () => {
  const React = require('react');
  const { View } = require('react-native');
  const WebView = React.forwardRef((props, ref) => {
    React.useImperativeHandle(ref, () => ({
      injectJavaScript: mockInjectJavaScript,
    }));
    return <View {...props} />;
  });
  WebView.displayName = 'WebView';
  return { WebView };
});

describe('LostPetsMap', () => {
  const posts = [
    { id: '1', latitude: -23.5, longitude: -46.6, petName: 'Rex' },
    { id: '2', latitude: -23.6, longitude: -46.7 },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve gerar o mapa só com id e coordenadas de cada pet', () => {
    const html = buildLostPetsMapHtml(posts);

    expect(html).toContain(
      'var points = [{"id":"1","latitude":-23.5,"longitude":-46.6},{"id":"2","latitude":-23.6,"longitude":-46.7}];'
    );
    expect(html).not.toContain('Rex');
    expect(html).toContain('map.fitBounds');
    expect(html).toContain('tile.openstreetmap.org');
  });

  it('deve impedir que dados fechem a tag de script', () => {
    const html = buildLostPetsMapHtml([
      { id: '</script><b>', latitude: 1, longitude: 2 },
    ]);

    expect(html).not.toContain('</script><b>');
    expect(html).toContain('\\u003c/script>\\u003cb>');
  });

  it('deve avisar o ponto tocado e o toque fora dos pontos', () => {
    const onSelect = jest.fn();
    const onClear = jest.fn();
    const { getByTestId } = render(
      <LostPetsMap
        posts={posts}
        selectedId={null}
        onSelect={onSelect}
        onClear={onClear}
      />
    );

    const map = getByTestId('lost-pets-map');
    expect(map.props.source.baseUrl).toBe('https://findpets.app/');
    fireEvent(map, 'message', {
      nativeEvent: { data: JSON.stringify({ type: 'select', id: '2' }) },
    });
    fireEvent(map, 'message', {
      nativeEvent: { data: JSON.stringify({ type: 'clear' }) },
    });

    expect(onSelect).toHaveBeenCalledWith('2');
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('deve tirar o destaque do ponto quando o resumo for fechado no app', () => {
    const props = { posts, onSelect: jest.fn(), onClear: jest.fn() };
    const { rerender } = render(<LostPetsMap {...props} selectedId="1" />);
    expect(mockInjectJavaScript).not.toHaveBeenCalled();

    rerender(<LostPetsMap {...props} selectedId={null} />);
    expect(mockInjectJavaScript).toHaveBeenCalledWith(
      'window.clearSelection && window.clearSelection(); true;'
    );
  });

  it('deve mostrar aviso quando não houver pets com localização', () => {
    const { getByText, queryByTestId } = render(
      <LostPetsMap
        posts={[]}
        selectedId={null}
        onSelect={jest.fn()}
        onClear={jest.fn()}
      />
    );

    expect(
      getByText('Nenhum pet perdido com localização registrada.')
    ).toBeTruthy();
    expect(queryByTestId('lost-pets-map')).toBeNull();
  });
});
