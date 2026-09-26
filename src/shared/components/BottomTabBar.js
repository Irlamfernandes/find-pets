import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { SafeTouchable } from './SafeTouchable';
import { palette } from '../theme/colors';

export const TABS = [
  { key: 'feed', label: 'Pets perdidos', icon: 'paw-outline' },
  {
    key: 'report',
    label: 'Registrar desaparecimento',
    icon: 'megaphone-outline',
  },
  { key: 'profile', label: 'Perfil', icon: 'person-outline' },
];

// Barra de abas fixa no rodapé. Mostra a aba ativa e as que têm destino em
// `onNavigate` ({ feed, report, profile }).
export function BottomTabBar({ active, onNavigate }) {
  const visibleTabs = TABS.filter(
    (tab) => tab.key === active || onNavigate[tab.key]
  );

  return (
    <View testID="bottom-tab-bar" style={styles.bar}>
      {visibleTabs.map((tab) => {
        const isActive = tab.key === active;
        return (
          <SafeTouchable
            key={tab.key}
            testID={`tab-${tab.key}`}
            accessibilityState={{ selected: isActive }}
            style={[styles.tab, isActive && styles.tabActive]}
            onPress={isActive ? undefined : onNavigate[tab.key]}
          >
            <Ionicons
              name={tab.icon}
              size={22}
              color={isActive ? palette.primary : palette.textMuted}
            />
            <Text style={styles.label} numberOfLines={2}>
              {tab.label}
            </Text>
          </SafeTouchable>
        );
      })}
    </View>
  );
}

BottomTabBar.propTypes = {
  active: PropTypes.oneOf(TABS.map((tab) => tab.key)).isRequired,
  onNavigate: PropTypes.objectOf(PropTypes.func).isRequired,
};

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 18,
    paddingHorizontal: 16,
    backgroundColor: palette.surface,
    borderTopWidth: 1,
    borderTopColor: palette.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 6,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 4,
  },
  tabActive: { backgroundColor: palette.primarySoft },
  label: {
    color: palette.text,
    fontWeight: 'bold',
    fontSize: 12,
    textAlign: 'center',
  },
});
