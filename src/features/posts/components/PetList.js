import React from 'react';
import { FlatList, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { canManage, isOwnedBy } from '../domain/post';
import { PetCard } from './PetCard';

// Ações que só o autor vê no próprio card
function getOwnerActions(post, currentUser, handlers) {
  const manageable = canManage(post, currentUser);
  return {
    onEdit:
      manageable && handlers.onEdit ? () => handlers.onEdit(post) : undefined,
    onDelete: isOwnedBy(post, currentUser)
      ? () => handlers.onDelete(post.id)
      : undefined,
    onMarkFound: manageable ? () => handlers.onMarkFound(post.id) : undefined,
  };
}

// Lista de cards dos pets; `header` aparece antes do primeiro card
export function PetList({
  posts,
  currentUser,
  header,
  onOpenPhoto,
  onOpenMap,
  onOpenWhatsApp,
  onOpenRoute,
  onShare,
  ownerHandlers,
}) {
  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      ListHeaderComponent={header}
      showsVerticalScrollIndicator={false}
      renderItem={({ item }) => (
        <PetCard
          item={item}
          onOpenPhoto={(index) => onOpenPhoto(item, index)}
          onOpenMap={() => onOpenMap(item)}
          onOpenWhatsApp={onOpenWhatsApp}
          onOpenRoute={() => onOpenRoute(item)}
          onShare={() => onShare(item)}
          {...getOwnerActions(item, currentUser, ownerHandlers)}
        />
      )}
    />
  );
}

PetList.propTypes = {
  posts: PropTypes.arrayOf(PropTypes.object).isRequired,
  currentUser: PropTypes.string,
  header: PropTypes.element,
  onOpenPhoto: PropTypes.func.isRequired,
  onOpenMap: PropTypes.func.isRequired,
  onOpenWhatsApp: PropTypes.func.isRequired,
  onOpenRoute: PropTypes.func.isRequired,
  onShare: PropTypes.func.isRequired,
  ownerHandlers: PropTypes.shape({
    onEdit: PropTypes.func,
    onDelete: PropTypes.func.isRequired,
    onMarkFound: PropTypes.func.isRequired,
  }).isRequired,
};

const styles = StyleSheet.create({
  list: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 120 },
});
