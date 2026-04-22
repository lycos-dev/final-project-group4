import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Screen } from "../../components/ui/Screen";
import { useExercises } from "../../context/ExerciseContext";
import { RootStackParamList } from "../../navigation/RootNavigator";
import { theme } from "../../theme/theme";

type Nav = NativeStackNavigationProp<RootStackParamList>;

type Tab = "exercises" | "routines";

export const CustomLibraryScreen = () => {
  const nav = useNavigation<Nav>();
  const { exercises } = useExercises();
  const [activeTab, setActiveTab] = useState<Tab>("exercises");

  return (
    <Screen padded={false}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* ── Hero Header ─────────────────────────────────────────────── */}
        <LinearGradient
          colors={["#1C2A00", "#111800", theme.colors.bg]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.hero}
        >
          {/* Back button */}
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => nav.goBack()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
          </TouchableOpacity>

          {/* Decorative orb */}
          <View style={styles.heroOrb} />

          <View style={styles.heroContent}>
            <View style={styles.heroIcon}>
              <MaterialCommunityIcons
                name="bookshelf"
                size={30}
                color={theme.colors.accent}
              />
            </View>
            <Text style={styles.heroTitle}>My Custom Library</Text>
            <Text style={styles.heroSub}>
              Your personal collection of exercises and routines
            </Text>
          </View>

          {/* Stats row */}
          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{exercises.length}</Text>
              <Text style={styles.heroStatLabel}>Exercises</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>0</Text>
              <Text style={styles.heroStatLabel}>Routines</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>0</Text>
              <Text style={styles.heroStatLabel}>Workouts</Text>
            </View>
          </View>
        </LinearGradient>

        {/* ── Tab Switcher ─────────────────────────────────────────────── */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "exercises" && styles.tabActive]}
            onPress={() => setActiveTab("exercises")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "exercises" && styles.tabTextActive,
              ]}
            >
              Exercises
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "routines" && styles.tabActive]}
            onPress={() => setActiveTab("routines")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "routines" && styles.tabTextActive,
              ]}
            >
              Routines
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Content ──────────────────────────────────────────────────── */}
        <View style={styles.content}>
          {activeTab === "exercises" ? (
            <>
              {/* Add exercise CTA */}
              <TouchableOpacity
                style={styles.addCard}
                onPress={() => nav.navigate("ExerciseForm", {})}
                activeOpacity={0.75}
              >
                <View style={styles.addCardIcon}>
                  <Ionicons name="add" size={22} color={theme.colors.accent} />
                </View>
                <View style={styles.addCardText}>
                  <Text style={styles.addCardTitle}>Create New Exercise</Text>
                  <Text style={styles.addCardSub}>
                    Add a custom move to your library
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={theme.colors.muted}
                />
              </TouchableOpacity>

              {exercises.length === 0 ? (
                <View style={styles.empty}>
                  <MaterialCommunityIcons
                    name="dumbbell"
                    size={48}
                    color={theme.colors.border}
                  />
                  <Text style={styles.emptyTitle}>No exercises yet</Text>
                  <Text style={styles.emptySub}>
                    Tap above to create your first custom exercise.
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={exercises}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.listItem}
                      onPress={() =>
                        nav.navigate("ExerciseDetail", {
                          exerciseId: item.id,
                        })
                      }
                      activeOpacity={0.72}
                    >
                      <View style={styles.listIconWrap}>
                        <Ionicons
                          name="barbell-outline"
                          size={18}
                          color={theme.colors.accent}
                        />
                      </View>
                      <View style={styles.listBody}>
                        <Text style={styles.listName} numberOfLines={1}>
                          {item.name}
                        </Text>
                        <Text style={styles.listMeta}>
                          {item.muscleGroup} · {item.equipment}
                        </Text>
                      </View>
                      <Ionicons
                        name="chevron-forward"
                        size={15}
                        color={theme.colors.muted}
                      />
                    </TouchableOpacity>
                  )}
                />
              )}
            </>
          ) : (
            <>
              {/* Create routine CTA */}
              <TouchableOpacity
                style={styles.addCard}
                onPress={() => nav.navigate("CreateRoutine", {})}
                activeOpacity={0.75}
              >
                <View style={styles.addCardIcon}>
                  <MaterialCommunityIcons
                    name="pencil-box-outline"
                    size={20}
                    color={theme.colors.accent}
                  />
                </View>
                <View style={styles.addCardText}>
                  <Text style={styles.addCardTitle}>Create New Routine</Text>
                  <Text style={styles.addCardSub}>
                    Build a structured training plan
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={theme.colors.muted}
                />
              </TouchableOpacity>

              <View style={styles.empty}>
                <MaterialCommunityIcons
                  name="clipboard-list-outline"
                  size={48}
                  color={theme.colors.border}
                />
                <Text style={styles.emptyTitle}>No routines yet</Text>
                <Text style={styles.emptySub}>
                  Create a routine to organize your training sessions.
                </Text>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: theme.spacing.xxl,
  },

  /* ── Hero ──────────────────────────────────────────────────────────── */
  hero: {
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    overflow: "hidden",
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  heroOrb: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(198, 255, 61, 0.06)",
    right: -40,
    top: -40,
  },
  heroContent: {
    marginBottom: theme.spacing.xl,
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: theme.radius.lg,
    backgroundColor: "rgba(198, 255, 61, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: "rgba(198, 255, 61, 0.2)",
  },
  heroTitle: {
    fontSize: theme.font.sizeXxl,
    fontWeight: theme.font.weightBold,
    color: theme.colors.text,
    marginBottom: 4,
  },
  heroSub: {
    fontSize: theme.font.sizeSm,
    color: theme.colors.muted,
  },
  heroStats: {
    flexDirection: "row",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  heroStat: {
    flex: 1,
    alignItems: "center",
  },
  heroStatValue: {
    fontSize: theme.font.sizeXl,
    fontWeight: theme.font.weightBold,
    color: theme.colors.text,
  },
  heroStatLabel: {
    fontSize: 11,
    color: theme.colors.muted,
    marginTop: 2,
  },
  heroStatDivider: {
    width: 1,
    backgroundColor: theme.colors.border,
  },

  /* ── Tabs ──────────────────────────────────────────────────────────── */
  tabRow: {
    flexDirection: "row",
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.xl,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 9,
    alignItems: "center",
    borderRadius: theme.radius.sm,
  },
  tabActive: {
    backgroundColor: theme.colors.accent,
  },
  tabText: {
    fontSize: theme.font.sizeSm,
    fontWeight: theme.font.weightBold,
    color: theme.colors.muted,
  },
  tabTextActive: {
    color: theme.colors.accentText,
  },

  /* ── Content ───────────────────────────────────────────────────────── */
  content: {
    marginTop: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  addCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: "rgba(198, 255, 61, 0.2)",
    gap: theme.spacing.md,
  },
  addCardIcon: {
    width: 42,
    height: 42,
    borderRadius: theme.radius.md,
    backgroundColor: "rgba(198, 255, 61, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  addCardText: {
    flex: 1,
  },
  addCardTitle: {
    fontSize: theme.font.sizeMd,
    fontWeight: theme.font.weightBold,
    color: theme.colors.text,
    marginBottom: 2,
  },
  addCardSub: {
    fontSize: 12,
    color: theme.colors.muted,
  },

  /* ── List Items ────────────────────────────────────────────────────── */
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  listIconWrap: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.md,
    backgroundColor: "rgba(198, 255, 61, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: theme.spacing.md,
    borderWidth: 1,
    borderColor: "rgba(198, 255, 61, 0.15)",
  },
  listBody: {
    flex: 1,
  },
  listName: {
    color: theme.colors.text,
    fontSize: theme.font.sizeMd,
    fontWeight: theme.font.weightBold,
    marginBottom: 2,
  },
  listMeta: {
    color: theme.colors.muted,
    fontSize: 12,
  },

  /* ── Empty State ───────────────────────────────────────────────────── */
  empty: {
    alignItems: "center",
    paddingVertical: theme.spacing.xxl,
    gap: theme.spacing.sm,
  },
  emptyTitle: {
    fontSize: theme.font.sizeLg,
    fontWeight: theme.font.weightBold,
    color: theme.colors.muted,
    marginTop: theme.spacing.sm,
  },
  emptySub: {
    fontSize: theme.font.sizeSm,
    color: theme.colors.muted,
    textAlign: "center",
    lineHeight: 20,
  },
});
