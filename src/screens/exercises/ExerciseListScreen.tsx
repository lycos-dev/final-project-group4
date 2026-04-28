import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ScrollView,
  Modal,
  TextInput,
  Animated,
  PanResponder,
  LayoutAnimation,
  UIManager,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../../components/ui/Button';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { theme } from '../../theme/theme';
import { useRoutine } from '../../context/RoutineContext';
import { Routine, RoutineFolder } from '../../types';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Nav = NativeStackNavigationProp<RootStackParamList>;

// ── Modal type union ─────────────────────────────────────────────────────────
type ActiveModal =
  | { type: 'confirmDeleteRoutine'; routine: Routine }
  | { type: 'confirmDeleteFolder'; folder: RoutineFolder }
  | { type: 'renameFolder'; folder: RoutineFolder }
  | { type: 'createFolder' }
  | { type: 'routineMenu'; routine: Routine }
  | { type: 'noRoutineInFolder'; folderName: string; folderId: string }
  | { type: 'moveRoutine'; routine: Routine };

const TIPS = [
  {
    id: '1',
    icon: 'compass-outline' as const,
    title: 'Explore preset routines',
    sub: 'Browse curated workout plans built for every level — from beginner full-body to advanced splits.',
  },
  {
    id: '2',
    icon: 'repeat-outline' as const,
    title: 'Create your own routines',
    sub: 'Group exercises into routines to stay consistent and track your progress.',
  },
  {
    id: '3',
    icon: 'trending-up-outline' as const,
    title: 'Log every session',
    sub: 'Logging workouts helps you spot trends and keep pushing past plateaus.',
  },
];

// ── BottomSheetModal ──────────────────────────────────────────────────────────
const BottomSheetModal = ({
  visible,
  onClose,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) => {
  const { theme: appTheme } = useTheme();
  const theme = appTheme;
  const styles = createStyles(appTheme);
  const slideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, bounciness: 4 }).start();
    } else {
      Animated.timing(slideAnim, { toValue: 300, duration: 200, useNativeDriver: true }).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <TouchableOpacity style={styles.sheetOverlay} activeOpacity={1} onPress={onClose}>
        <Animated.View
          style={{ transform: [{ translateY: slideAnim }] }}
          onStartShouldSetResponder={() => true}
        >
          {children}
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};

// ── DraggableRoutineCard ──────────────────────────────────────────────────────
interface DraggableRoutineCardProps {
  routine: Routine;
  onMenuPress: (routine: Routine) => void;
  onDragStart: (routine: Routine, pageY: number) => void;
  isDragging: boolean;
}

const DraggableRoutineCard = ({
  routine,
  onMenuPress,
  onDragStart,
  isDragging,
}: DraggableRoutineCardProps) => {
  const { theme: appTheme } = useTheme();
  const theme = appTheme;
  const styles = createStyles(appTheme);
  const scale = useRef(new Animated.Value(1)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        Animated.spring(scale, { toValue: 1.04, useNativeDriver: true }).start();
        onDragStart(routine, evt.nativeEvent.pageY);
      },
      onPanResponderRelease: () => {
        Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
      },
      onPanResponderTerminate: () => {
        Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
      },
    })
  ).current;

  return (
    <Animated.View
      style={[
        styles.routineCard,
        isDragging && styles.routineCardDragging,
        { transform: [{ scale }] },
      ]}
    >
      {/* Drag handle — hold to drag */}
      <View style={styles.dragHandle} {...panResponder.panHandlers}>
        <Ionicons name="reorder-three-outline" size={20} color={theme.colors.muted} />
      </View>

      <View style={styles.routineCardLeft}>
        <View style={styles.routineCardIcon}>
          <MaterialCommunityIcons name="dumbbell" size={18} color={theme.colors.accent} />
        </View>
        <View style={styles.routineCardInfo}>
          <Text style={styles.routineCardName} numberOfLines={1}>
            {routine.name}
          </Text>
          <Text style={styles.routineCardMeta}>
            {routine.exercises.length} exercise{routine.exercises.length !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        onPress={() => onMenuPress(routine)}
      >
        <Ionicons name="ellipsis-vertical" size={16} color={theme.colors.muted} />
      </TouchableOpacity>
    </Animated.View>
  );
};

// ── Main Screen ───────────────────────────────────────────────────────────────
export const ExerciseListScreen = () => {
  const { theme: appTheme } = useTheme();
  const theme = appTheme;
  const styles = createStyles(appTheme);
  const nav = useNavigation<Nav>();
  const { routines, folders, deleteRoutine, deleteFolder, addFolder, assignRoutineToFolder } =
    useRoutine();

  const [activeModal, setActiveModal] = useState<ActiveModal | null>(null);
  const [renameFolderValue, setRenameFolderValue] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());

  // ── Drag state ──────────────────────────────────────────────────────────────
  const [draggingRoutine, setDraggingRoutine] = useState<Routine | null>(null);
  const [hoveredTarget, setHoveredTarget] = useState<string | null>(null); // folderId | 'unfoldered'
  const floatAnim = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const dropZoneLayouts = useRef<Record<string, { y: number; height: number }>>({});
  const scrollOffsetY = useRef(0);

  // We need a ref to draggingRoutine/hoveredTarget inside the PanResponder
  const draggingRoutineRef = useRef<Routine | null>(null);
  const hoveredTargetRef = useRef<string | null>(null);

  const closeModal = () => setActiveModal(null);

  const toggleFolder = (folderId: string) => {
    setCollapsedFolders((prev) => {
      const next = new Set(prev);
      next.has(folderId) ? next.delete(folderId) : next.add(folderId);
      return next;
    });
  };

  const unfolderedRoutines = routines.filter((r) => !r.folderId);
  const routinesInFolder = (folderId: string) => routines.filter((r) => r.folderId === folderId);

  // ── Drag handlers ────────────────────────────────────────────────────────────
  const handleDragStart = useCallback((routine: Routine, pageY: number) => {
    draggingRoutineRef.current = routine;
    setDraggingRoutine(routine);
    floatAnim.setValue({ x: 0, y: pageY - 30 });
  }, []);

  const handleDragMove = useCallback((pageY: number) => {
    floatAnim.setValue({ x: 0, y: pageY - 30 });
    const absoluteY = pageY + scrollOffsetY.current;
    let found: string | null = null;
    for (const [key, zone] of Object.entries(dropZoneLayouts.current)) {
      if (absoluteY >= zone.y && absoluteY <= zone.y + zone.height) {
        found = key;
        break;
      }
    }
    if (found !== hoveredTargetRef.current) {
      hoveredTargetRef.current = found;
      setHoveredTarget(found);
    }
  }, []);

  const handleDragEnd = useCallback(() => {
    const routine = draggingRoutineRef.current;
    const target = hoveredTargetRef.current;
    if (routine && target !== null) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      assignRoutineToFolder(routine.id, target === 'unfoldered' ? undefined : target);
    }
    draggingRoutineRef.current = null;
    hoveredTargetRef.current = null;
    setDraggingRoutine(null);
    setHoveredTarget(null);
  }, [assignRoutineToFolder]);

  // Global PanResponder on the ScrollView to track finger movement during drag
  const scrollPanResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_evt, _gs) => draggingRoutineRef.current !== null,
      onPanResponderMove: (evt) => handleDragMove(evt.nativeEvent.pageY),
      onPanResponderRelease: handleDragEnd,
      onPanResponderTerminate: handleDragEnd,
    })
  ).current;

  const registerDropZone = (key: string, pageY: number, height: number) => {
    dropZoneLayouts.current[key] = { y: pageY, height };
  };

  // ── Other handlers ────────────────────────────────────────────────────────────
  const handleRenameFolder = () => {
    if (activeModal?.type !== 'renameFolder' || !renameFolderValue.trim()) return;
    const oldId = activeModal.folder.id;
    const affected = routines.filter((r) => r.folderId === oldId);
    deleteFolder(oldId);
    const newFolder = addFolder(renameFolderValue.trim());
    affected.forEach((r) => assignRoutineToFolder(r.id, newFolder.id));
    setRenameFolderValue('');
    closeModal();
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    addFolder(newFolderName.trim());
    setNewFolderName('');
    closeModal();
  };

  const handleMoveRoutine = (targetFolderId: string | undefined) => {
    if (activeModal?.type !== 'moveRoutine') return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    assignRoutineToFolder(activeModal.routine.id, targetFolderId);
    closeModal();
  };

  // ── FolderSection sub-component ──────────────────────────────────────────────
  const FolderSection = ({ folder }: { folder: RoutineFolder }) => {
    const items = routinesInFolder(folder.id);
    const isCollapsed = collapsedFolders.has(folder.id);
    const isHovered =
      hoveredTarget === folder.id &&
      draggingRoutine !== null &&
      draggingRoutine.folderId !== folder.id;

    return (
      <View
        style={[styles.folderSection, isHovered && styles.folderSectionHovered]}
        onLayout={(e) => {
          e.target.measure((_x, _y, _w, h, _px, py) => {
            registerDropZone(folder.id, py, h);
          });
        }}
      >
        <TouchableOpacity
          style={styles.folderHeader}
          onPress={() => toggleFolder(folder.id)}
          activeOpacity={0.75}
        >
          <Ionicons
            name={isCollapsed ? 'folder-outline' : 'folder-open-outline'}
            size={16}
            color={theme.colors.accent}
          />
          <Text style={styles.folderName}>{folder.name}</Text>
          <Text style={styles.folderCount}>{items.length}</Text>
          <TouchableOpacity
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={() => {
              setRenameFolderValue(folder.name);
              setActiveModal({ type: 'renameFolder', folder });
            }}
          >
            <Ionicons name="pencil-outline" size={14} color={theme.colors.muted} />
          </TouchableOpacity>
          <TouchableOpacity
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={() => setActiveModal({ type: 'confirmDeleteFolder', folder })}
          >
            <Ionicons name="trash-outline" size={14} color={theme.colors.muted} />
          </TouchableOpacity>
          <Ionicons
            name={isCollapsed ? 'chevron-forward' : 'chevron-down'}
            size={16}
            color={theme.colors.muted}
          />
        </TouchableOpacity>

        {/* Drop hint */}
        {isHovered && (
          <View style={styles.dropHint}>
            <Ionicons name="arrow-down-circle-outline" size={14} color={theme.colors.accent} />
            <Text style={styles.dropHintText}>Drop to move into "{folder.name}"</Text>
          </View>
        )}

        {!isCollapsed && (
          <View style={styles.folderRoutines}>
            {items.length === 0 ? (
              <View style={styles.emptyFolderContainer}>
                <Text style={styles.emptyFolderText}>No routines in this folder yet.</Text>
                {/* ── Feature #1: creates routine pre-assigned to this folder ── */}
                <TouchableOpacity
                  style={styles.emptyFolderAction}
                  onPress={() => nav.navigate('CreateRoutine', { targetFolderId: folder.id })}
                >
                  <Ionicons name="add-circle-outline" size={14} color={theme.colors.accent} />
                  <Text style={styles.emptyFolderActionText}>Create a Routine</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {items.map((r) => (
                  <DraggableRoutineCard
                    key={r.id}
                    routine={r}
                    onMenuPress={(rt) => setActiveModal({ type: 'routineMenu', routine: rt })}
                    onDragStart={handleDragStart}
                    isDragging={draggingRoutine?.id === r.id}
                  />
                ))}
                {/* ── Feature #1: shortcut to add another routine to this folder ── */}
                <TouchableOpacity
                  style={styles.addToFolderBtn}
                  onPress={() => nav.navigate('CreateRoutine', { targetFolderId: folder.id })}
                >
                  <Ionicons name="add-outline" size={14} color={theme.colors.muted} />
                  <Text style={styles.addToFolderBtnText}>Add routine to this folder</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </View>
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  const isUnfolderedHovered =
    hoveredTarget === 'unfoldered' &&
    draggingRoutine !== null &&
    draggingRoutine.folderId !== undefined;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: theme.spacing.xl },
        ]}
        scrollEventThrottle={16}
        onScroll={(e) => { scrollOffsetY.current = e.nativeEvent.contentOffset.y; }}
        // Attach global drag tracker only while a drag is active
        {...(draggingRoutine ? scrollPanResponder.panHandlers : {})}
      >
        {/* ── Header ──────────────────────────────────────────────────── */}
        <View style={styles.topSection}>
          <Text style={styles.title}>Exercises</Text>

          <Button
            title="Start New Workout"
            onPress={() => nav.navigate('LogWorkout', { exercisesToAdd: [] })}
            fullWidth
            style={styles.primaryButton}
          />

          <TouchableOpacity
            style={styles.libraryBanner}
            onPress={() => nav.navigate('CustomLibrary')}
            activeOpacity={0.82}
          >
            <LinearGradient
              colors={[
                `${theme.colors.accent}3D`,
                theme.colors.surfaceAlt,
                theme.colors.surface,
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.libraryGradient}
            >
              <View style={styles.libraryAccentDot} />
              <View style={styles.libraryLeft}>
                <View style={styles.libraryIconWrap}>
                  <MaterialCommunityIcons name="bookshelf" size={26} color={theme.colors.accent} />
                </View>
                <View style={styles.libraryText}>
                  <Text style={styles.libraryTitle}>My Custom Library</Text>
                  <Text style={styles.librarySub}>Browse &amp; manage all your exercises</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.accent} />
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.cardsGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => nav.navigate('CreateRoutine', {})}
              activeOpacity={0.7}
            >
              <View style={styles.actionCardIcon}>
                <MaterialCommunityIcons name="pencil-box-outline" size={26} color={theme.colors.accent} />
              </View>
              <Text style={styles.cardTitle}>New Routine</Text>
              <Text style={styles.cardSub}>Build a custom plan</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => nav.navigate('ExploreRoutines')}
              activeOpacity={0.7}
            >
              <View style={styles.actionCardIcon}>
                <Ionicons name="compass-outline" size={26} color={theme.colors.accent} />
              </View>
              <Text style={styles.cardTitle}>Explore</Text>
              <Text style={styles.cardSub}>Browse preset plans</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── My Routines ─────────────────────────────────────────────── */}
        {(routines.length > 0 || folders.length > 0) && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>MY ROUTINES</Text>
              <TouchableOpacity
                onPress={() => setActiveModal({ type: 'createFolder' })}
                style={styles.newFolderHeaderBtn}
              >
                <Ionicons name="folder-open-outline" size={14} color={theme.colors.accent} />
                <Text style={styles.newFolderHeaderText}>New Folder</Text>
              </TouchableOpacity>
            </View>

            {routines.length > 0 && (
              <Text style={styles.dragHintLabel}>
                Hold ≡ on a routine to drag and reassign it to a different folder
              </Text>
            )}

            <View style={styles.routinesContainer}>
              {folders.map((folder) => (
                <FolderSection key={folder.id} folder={folder} />
              ))}

              {/* Un-foldered drop zone — always visible when drag is active or routines exist */}
              {(unfolderedRoutines.length > 0 || (draggingRoutine && draggingRoutine.folderId)) && (
                <View
                  style={[
                    styles.unfolderedGroup,
                    isUnfolderedHovered && styles.unfolderedGroupHovered,
                  ]}
                  onLayout={(e) => {
                    e.target.measure((_x, _y, _w, h, _px, py) => {
                      registerDropZone('unfoldered', py, Math.max(h, 60));
                    });
                  }}
                >
                  {(folders.length > 0 || draggingRoutine) && (
                    <View style={styles.unfolderedLabelRow}>
                      <Text style={styles.unfolderedLabel}>NO FOLDER</Text>
                      {isUnfolderedHovered && (
                        <Text style={styles.dropHintInline}>← Drop here to remove from folder</Text>
                      )}
                    </View>
                  )}
                  {unfolderedRoutines.map((r) => (
                    <DraggableRoutineCard
                      key={r.id}
                      routine={r}
                      onMenuPress={(rt) => setActiveModal({ type: 'routineMenu', routine: rt })}
                      onDragStart={handleDragStart}
                      isDragging={draggingRoutine?.id === r.id}
                    />
                  ))}
                </View>
              )}
            </View>
          </>
        )}

        {/* Empty state */}
        {routines.length === 0 && folders.length === 0 && (
          <View style={styles.noRoutinesBanner}>
            <View style={styles.noRoutinesRow}>
              <Text style={styles.sectionLabel}>MY ROUTINES</Text>
              <TouchableOpacity
                onPress={() => setActiveModal({ type: 'createFolder' })}
                style={styles.newFolderHeaderBtn}
              >
                <Ionicons name="folder-open-outline" size={14} color={theme.colors.accent} />
                <Text style={styles.newFolderHeaderText}>New Folder</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.noRoutinesCard}>
              <Ionicons
                name="albums-outline"
                size={32}
                color={theme.colors.muted}
                style={{ marginBottom: theme.spacing.sm }}
              />
              <Text style={styles.noRoutinesTitle}>No routines yet</Text>
              <Text style={styles.noRoutinesSub}>
                Create a routine or add a folder to organize your workouts.
              </Text>
            </View>
          </View>
        )}

        {/* ── Quick Tips ───────────────────────────────────────────────── */}
        <View style={[styles.sectionHeader, { marginTop: theme.spacing.xl }]}>
          <Text style={styles.sectionLabel}>QUICK TIPS</Text>
        </View>
        <View style={styles.tipsContainer}>
          {TIPS.map((tip) => (
            <View key={tip.id} style={styles.tipCard}>
              <View style={styles.tipIconWrap}>
                <Ionicons name={tip.icon} size={18} color={theme.colors.accent} />
              </View>
              <View style={styles.tipBody}>
                <Text style={styles.tipTitle}>{tip.title}</Text>
                <Text style={styles.tipSub}>{tip.sub}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* ── Floating drag ghost ──────────────────────────────────────────── */}
      {draggingRoutine && (
        <Animated.View
          pointerEvents="none"
          style={[styles.dragGhost, { transform: floatAnim.getTranslateTransform() }]}
        >
          <MaterialCommunityIcons name="dumbbell" size={14} color={theme.colors.accentText} />
          <Text style={styles.dragGhostText} numberOfLines={1}>
            {draggingRoutine.name}
          </Text>
        </Animated.View>
      )}

      {/* ════════════════════════════════════════════════════════════════
          MODALS
      ════════════════════════════════════════════════════════════════ */}

      {/* ── Routine Context Menu ─────────────────────────────────────────── */}
      <BottomSheetModal visible={activeModal?.type === 'routineMenu'} onClose={closeModal}>
        <View style={styles.sheetContent}>
          {activeModal?.type === 'routineMenu' && (
            <Text style={styles.sheetTitle}>{activeModal.routine.name}</Text>
          )}

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              const r = activeModal?.type === 'routineMenu' ? activeModal.routine : null;
              closeModal();
              if (r) nav.navigate('CreateRoutine', { routineId: r.id });
            }}
          >
            <Ionicons name="pencil-outline" size={20} color={theme.colors.accent} />
            <Text style={styles.menuItemText}>Edit Routine</Text>
          </TouchableOpacity>

          {/* ── Feature #2: Move to Folder via menu ── */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              const r = activeModal?.type === 'routineMenu' ? activeModal.routine : null;
              closeModal();
              if (r) setTimeout(() => setActiveModal({ type: 'moveRoutine', routine: r }), 300);
            }}
          >
            <Ionicons name="folder-outline" size={20} color={theme.colors.accent} />
            <Text style={styles.menuItemText}>Move to Folder</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              const r = activeModal?.type === 'routineMenu' ? activeModal.routine : null;
              closeModal();
              if (r)
                setTimeout(() => setActiveModal({ type: 'confirmDeleteRoutine', routine: r }), 300);
            }}
          >
            <Ionicons name="trash-outline" size={20} color={theme.colors.danger} />
            <Text style={[styles.menuItemText, { color: theme.colors.danger }]}>
              Delete Routine
            </Text>
          </TouchableOpacity>
        </View>
      </BottomSheetModal>

      {/* ── Move to Folder sheet ──────────────────────────────────────────── */}
      <BottomSheetModal visible={activeModal?.type === 'moveRoutine'} onClose={closeModal}>
        <View style={styles.sheetContent}>
          <Text style={styles.sheetTitle}>Move to Folder</Text>
          {activeModal?.type === 'moveRoutine' && (
            <Text style={styles.sheetSubtitle}>"{activeModal.routine.name}"</Text>
          )}

          <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
            <TouchableOpacity
              style={styles.folderPickerOption}
              onPress={() => handleMoveRoutine(undefined)}
            >
              <Ionicons
                name="close-circle-outline"
                size={20}
                color={
                  activeModal?.type === 'moveRoutine' && !activeModal.routine.folderId
                    ? theme.colors.accent
                    : theme.colors.muted
                }
              />
              <Text
                style={[
                  styles.folderPickerOptionText,
                  activeModal?.type === 'moveRoutine' &&
                    !activeModal.routine.folderId && { color: theme.colors.accent },
                ]}
              >
                No Folder
              </Text>
              {activeModal?.type === 'moveRoutine' && !activeModal.routine.folderId && (
                <Ionicons name="checkmark" size={18} color={theme.colors.accent} />
              )}
            </TouchableOpacity>

            {folders.map((folder) => (
              <TouchableOpacity
                key={folder.id}
                style={styles.folderPickerOption}
                onPress={() => handleMoveRoutine(folder.id)}
              >
                <Ionicons
                  name="folder-outline"
                  size={20}
                  color={
                    activeModal?.type === 'moveRoutine' &&
                    activeModal.routine.folderId === folder.id
                      ? theme.colors.accent
                      : theme.colors.muted
                  }
                />
                <Text
                  style={[
                    styles.folderPickerOptionText,
                    activeModal?.type === 'moveRoutine' &&
                      activeModal.routine.folderId === folder.id && { color: theme.colors.accent },
                  ]}
                >
                  {folder.name}
                </Text>
                {activeModal?.type === 'moveRoutine' &&
                  activeModal.routine.folderId === folder.id && (
                    <Ionicons name="checkmark" size={18} color={theme.colors.accent} />
                  )}
              </TouchableOpacity>
            ))}

            {folders.length === 0 && (
              <View style={styles.noFoldersHint}>
                <Text style={styles.noFoldersHintText}>
                  No folders yet. Use "New Folder" to create one first.
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </BottomSheetModal>

      {/* ── Confirm Delete Routine ────────────────────────────────────────── */}
      <Modal
        visible={activeModal?.type === 'confirmDeleteRoutine'}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="trash-outline" size={40} color={theme.colors.danger} />
            <Text style={styles.modalTitle}>Delete Routine?</Text>
            <Text style={styles.modalSubtitle}>
              {activeModal?.type === 'confirmDeleteRoutine'
                ? `"${activeModal.routine.name}" will be permanently deleted.`
                : ''}
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalBtnSecondary} onPress={closeModal}>
                <Text style={styles.modalBtnSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtnPrimary, { backgroundColor: theme.colors.danger }]}
                onPress={() => {
                  if (activeModal?.type === 'confirmDeleteRoutine')
                    deleteRoutine(activeModal.routine.id);
                  closeModal();
                }}
              >
                <Text style={styles.modalBtnPrimaryText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Confirm Delete Folder ─────────────────────────────────────────── */}
      <Modal
        visible={activeModal?.type === 'confirmDeleteFolder'}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="folder-open-outline" size={40} color={theme.colors.danger} />
            <Text style={styles.modalTitle}>Delete Folder?</Text>
            <Text style={styles.modalSubtitle}>
              {activeModal?.type === 'confirmDeleteFolder'
                ? `"${activeModal.folder.name}" will be deleted. Routines inside will move to No Folder.`
                : ''}
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalBtnSecondary} onPress={closeModal}>
                <Text style={styles.modalBtnSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtnPrimary, { backgroundColor: theme.colors.danger }]}
                onPress={() => {
                  if (activeModal?.type === 'confirmDeleteFolder')
                    deleteFolder(activeModal.folder.id);
                  closeModal();
                }}
              >
                <Text style={styles.modalBtnPrimaryText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Rename Folder ────────────────────────────────────────────────── */}
      <Modal
        visible={activeModal?.type === 'renameFolder'}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="pencil-outline" size={40} color={theme.colors.accent} />
            <Text style={styles.modalTitle}>Rename Folder</Text>
            <TextInput
              value={renameFolderValue}
              onChangeText={setRenameFolderValue}
              style={styles.folderNameInput}
              placeholderTextColor={theme.colors.muted}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalBtnSecondary}
                onPress={() => { setRenameFolderValue(''); closeModal(); }}
              >
                <Text style={styles.modalBtnSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtnPrimary, !renameFolderValue.trim() && { opacity: 0.4 }]}
                onPress={handleRenameFolder}
                disabled={!renameFolderValue.trim()}
              >
                <Text style={styles.modalBtnPrimaryText}>Rename</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Create Folder ────────────────────────────────────────────────── */}
      <Modal
        visible={activeModal?.type === 'createFolder'}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="folder-open-outline" size={40} color={theme.colors.accent} />
            <Text style={styles.modalTitle}>New Folder</Text>
            <TextInput
              placeholder="Folder name"
              value={newFolderName}
              onChangeText={setNewFolderName}
              style={styles.folderNameInput}
              placeholderTextColor={theme.colors.muted}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalBtnSecondary}
                onPress={() => { setNewFolderName(''); closeModal(); }}
              >
                <Text style={styles.modalBtnSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtnPrimary, !newFolderName.trim() && { opacity: 0.4 }]}
                onPress={handleCreateFolder}
                disabled={!newFolderName.trim()}
              >
                <Text style={styles.modalBtnPrimaryText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── No Routine In Folder ──────────────────────────────────────────── */}
      <Modal
        visible={activeModal?.type === 'noRoutineInFolder'}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="folder-open-outline" size={40} color={theme.colors.accent} />
            <Text style={styles.modalTitle}>No Routines Yet</Text>
            <Text style={styles.modalSubtitle}>
              {activeModal?.type === 'noRoutineInFolder'
                ? `"${activeModal.folderName}" doesn't have any routines yet. Create one and it will be saved here automatically.`
                : ''}
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalBtnSecondary} onPress={closeModal}>
                <Text style={styles.modalBtnSecondaryText}>Dismiss</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalBtnPrimary}
                onPress={() => {
                  const fid =
                    activeModal?.type === 'noRoutineInFolder' ? activeModal.folderId : undefined;
                  closeModal();
                  nav.navigate('CreateRoutine', { targetFolderId: fid });
                }}
              >
                <Text style={styles.modalBtnPrimaryText}>Create Routine</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const createStyles = (appTheme: typeof theme) => {
  const theme = appTheme;
  return StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  scrollContent: {},

  topSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  title: {
    fontSize: 32,
    fontWeight: theme.font.weightBold,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
  primaryButton: { marginBottom: theme.spacing.lg },

  libraryBanner: {
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(198, 255, 61, 0.25)',
  },
  libraryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    overflow: 'hidden',
  },
  libraryAccentDot: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(198, 255, 61, 0.07)',
    right: -20,
    top: -30,
  },
  libraryLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: theme.spacing.md },
  libraryIconWrap: {
    width: 48,
    height: 48,
    borderRadius: theme.radius.md,
    backgroundColor: 'rgba(198, 255, 61, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  libraryText: { flex: 1 },
  libraryTitle: {
    fontSize: theme.font.sizeMd,
    fontWeight: theme.font.weightBold,
    color: theme.colors.text,
    marginBottom: 2,
  },
  librarySub: { fontSize: theme.font.sizeSm, color: theme.colors.muted },

  cardsGrid: { flexDirection: 'row', gap: theme.spacing.md },
  actionCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    minHeight: 130,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 4,
  },
  actionCardIcon: {
    width: 46,
    height: 46,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  cardTitle: { fontSize: theme.font.sizeMd, fontWeight: theme.font.weightBold, color: theme.colors.text },
  cardSub: { fontSize: 11, color: theme.colors.muted },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.xl,
  },
  sectionLabel: {
    color: theme.colors.muted,
    fontSize: 11,
    fontWeight: theme.font.weightBold,
    letterSpacing: 1.2,
  },
  newFolderHeaderBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  newFolderHeaderText: { fontSize: 12, color: theme.colors.accent, fontWeight: theme.font.weightBold },

  dragHintLabel: {
    fontSize: 11,
    color: theme.colors.muted,
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    fontStyle: 'italic',
  },

  noRoutinesBanner: { paddingHorizontal: theme.spacing.lg, marginTop: theme.spacing.xl },
  noRoutinesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  noRoutinesCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  noRoutinesTitle: {
    fontSize: theme.font.sizeMd,
    fontWeight: theme.font.weightBold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  noRoutinesSub: { fontSize: theme.font.sizeSm, color: theme.colors.muted, textAlign: 'center', lineHeight: 20 },

  routinesContainer: { paddingHorizontal: theme.spacing.lg, gap: theme.spacing.sm },

  folderSection: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  folderSectionHovered: {
    borderColor: theme.colors.accent,
    borderWidth: 2,
    backgroundColor: 'rgba(198, 255, 61, 0.04)',
  },
  folderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  folderName: { flex: 1, fontSize: theme.font.sizeSm, fontWeight: theme.font.weightBold, color: theme.colors.text },
  folderCount: { fontSize: 11, color: theme.colors.muted, marginRight: theme.spacing.sm },
  folderRoutines: { borderTopWidth: 1, borderTopColor: theme.colors.border },

  dropHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
    backgroundColor: 'rgba(198, 255, 61, 0.08)',
  },
  dropHintText: { fontSize: 11, color: theme.colors.accent, fontWeight: theme.font.weightBold },

  emptyFolderContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  emptyFolderText: { fontSize: 12, color: theme.colors.muted },
  emptyFolderAction: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  emptyFolderActionText: { fontSize: 12, color: theme.colors.accent, fontWeight: theme.font.weightBold },

  addToFolderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  addToFolderBtnText: { fontSize: 11, color: theme.colors.muted },

  unfolderedGroup: {
    gap: theme.spacing.sm,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.xs,
    minHeight: 60,
  },
  unfolderedGroupHovered: {
    borderWidth: 2,
    borderColor: theme.colors.accent,
    backgroundColor: 'rgba(198, 255, 61, 0.04)',
    padding: theme.spacing.sm,
  },
  unfolderedLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: theme.spacing.sm,
    marginBottom: 2,
  },
  unfolderedLabel: {
    fontSize: 10,
    color: theme.colors.muted,
    fontWeight: theme.font.weightBold,
    letterSpacing: 1,
  },
  dropHintInline: { fontSize: 10, color: theme.colors.accent, fontWeight: theme.font.weightBold },

  routineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  routineCardDragging: {
    opacity: 0.45,
    borderColor: theme.colors.accent,
    borderStyle: 'dashed',
  },
  dragHandle: {
    paddingHorizontal: 4,
    paddingVertical: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  routineCardLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
  routineCardIcon: {
    width: 38,
    height: 38,
    borderRadius: theme.radius.sm,
    backgroundColor: 'rgba(198, 255, 61, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  routineCardInfo: { flex: 1 },
  routineCardName: {
    fontSize: theme.font.sizeSm,
    fontWeight: theme.font.weightBold,
    color: theme.colors.text,
    marginBottom: 2,
  },
  routineCardMeta: { fontSize: 11, color: theme.colors.muted },

  dragGhost: {
    position: 'absolute',
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.radius.md,
    maxWidth: 220,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 8,
  },
  dragGhostText: {
    fontSize: theme.font.sizeSm,
    fontWeight: theme.font.weightBold,
    color: theme.colors.accentText,
    flex: 1,
  },

  tipsContainer: { paddingHorizontal: theme.spacing.lg, gap: theme.spacing.sm },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.md,
  },
  tipIconWrap: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.md,
    backgroundColor: 'rgba(198, 255, 61, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  tipBody: { flex: 1 },
  tipTitle: { fontSize: theme.font.sizeSm, fontWeight: theme.font.weightBold, color: theme.colors.text, marginBottom: 3 },
  tipSub: { fontSize: 12, color: theme.colors.muted, lineHeight: 18 },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.xl,
    width: '100%',
    alignItems: 'center',
    gap: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modalTitle: { fontSize: theme.font.sizeLg, fontWeight: theme.font.weightBold, color: theme.colors.text, textAlign: 'center' },
  modalSubtitle: { fontSize: theme.font.sizeSm, color: theme.colors.muted, textAlign: 'center', lineHeight: 20 },
  modalActions: { flexDirection: 'row', gap: theme.spacing.md, marginTop: theme.spacing.sm, width: '100%' },
  modalBtnSecondary: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceAlt,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modalBtnSecondaryText: { color: theme.colors.text, fontWeight: theme.font.weightBold, fontSize: theme.font.sizeMd },
  modalBtnPrimary: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    backgroundColor: theme.colors.accent,
  },
  modalBtnPrimaryText: { color: theme.colors.accentText, fontWeight: theme.font.weightBold, fontSize: theme.font.sizeMd },

  folderNameInput: {
    width: '100%',
    backgroundColor: theme.colors.bg,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    color: theme.colors.text,
    fontSize: theme.font.sizeMd,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheetContent: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
    borderTopWidth: 1,
    borderColor: theme.colors.border,
  },
  sheetTitle: {
    fontSize: theme.font.sizeLg,
    fontWeight: theme.font.weightBold,
    color: theme.colors.text,
    paddingHorizontal: theme.spacing.lg,
    marginBottom: 4,
  },
  sheetSubtitle: {
    fontSize: theme.font.sizeSm,
    color: theme.colors.muted,
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  menuItemText: { fontSize: theme.font.sizeMd, fontWeight: theme.font.weightMedium, color: theme.colors.text },

  folderPickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  folderPickerOptionText: { flex: 1, fontSize: theme.font.sizeMd, color: theme.colors.text },
  noFoldersHint: { paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md },
  noFoldersHintText: { fontSize: theme.font.sizeSm, color: theme.colors.muted, textAlign: 'center', lineHeight: 20 },
  });
};