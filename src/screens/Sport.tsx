import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, Modal, TextInput, Alert, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { C, F, softShadow, cardShadow, withAlpha } from '../tokens';
import { hapticLight, hapticSelection, hapticSuccess } from '../shared/haptics';
import { btnDark, btnDarkLabel } from '../shared/Buttons';
import { useUserStore } from '../store/useUserStore';
import { useSteps } from '../hooks/useSteps';
import {
  useSportStore,
  estimateKcal,
  workoutsForDay,
  dayWorkoutTotals,
  WORKOUT_META,
  type WorkoutType,
  type Workout,
} from '../store/useSportStore';
import { dayKey, formatTime } from '../store/useJournalStore';
import { useFastingStore, currentTargetFastH, formatDuration } from '../store/useFastingStore';

const WORKOUT_TYPES: WorkoutType[] = ['course', 'velo', 'muscu', 'natation', 'yoga', 'football', 'cardio', 'autre'];

export default function Sport() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const weightKg = useUserStore((s) => s.weightKg);
  const workouts = useSportStore((s) => s.workouts);
  const addWorkout = useSportStore((s) => s.addWorkout);
  const removeWorkout = useSportStore((s) => s.removeWorkout);

  const { steps, available: stepsAvailable, goal: stepsGoal } = useSteps();
  const stepsPct = Math.min(steps / stepsGoal, 1);

  const today = dayKey(Date.now());
  const todayWorkouts = useMemo(() => workoutsForDay(workouts, today), [workouts, today]);
  const totals = useMemo(() => dayWorkoutTotals(todayWorkouts), [todayWorkouts]);

  // 7-day summary
  const last7 = useMemo(() => {
    const cutoff = Date.now() - 7 * 86400000;
    return workouts.filter((w) => w.timestamp >= cutoff);
  }, [workouts]);
  const week = useMemo(() => dayWorkoutTotals(last7), [last7]);

  const [addOpen, setAddOpen] = useState(false);

  // Fasting widget data
  const fastingPreset = useFastingStore((s) => s.preset);
  const fastingCustomH = useFastingStore((s) => s.customFastH);
  const fastingStartTs = useFastingStore((s) => s.startTs);
  const fastingTargetH = useMemo(
    () => currentTargetFastH({ preset: fastingPreset, customFastH: fastingCustomH }),
    [fastingPreset, fastingCustomH]
  );
  const [fastingNow, setFastingNow] = useState(Date.now());
  useEffect(() => {
    if (!fastingStartTs) return;
    const id = setInterval(() => setFastingNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, [fastingStartTs]);
  const fastingMs = fastingStartTs ? fastingNow - fastingStartTs : 0;
  const fastingPct = fastingStartTs ? Math.min(fastingMs / (fastingTargetH * 3_600_000), 1) : 0;

  const confirmRemove = (w: Workout) => {
    Alert.alert('Supprimer ?', `Retirer "${WORKOUT_META[w.type].label}" ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: () => {
          hapticLight();
          removeWorkout(w.id);
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.beige }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      >
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: insets.top + 12, paddingBottom: 8 }}>
          <Text style={{ fontSize: 11, letterSpacing: 3, color: C.green, fontWeight: '700' }}>MON SPORT</Text>
          <Text style={{ fontFamily: F.display, fontSize: 30, fontWeight: '900', color: C.dark, marginTop: 4 }}>
            Activité du jour
          </Text>
        </View>

        {/* Hero — Pas + Kcal brûlées */}
        <View
          style={{
            marginHorizontal: 16,
            marginTop: 12,
            backgroundColor: C.green,
            borderRadius: 24,
            padding: 22,
            overflow: 'hidden',
          }}
        >
          <View style={{ position: 'absolute', right: -50, top: -40, width: 180, height: 180, borderRadius: 90, backgroundColor: withAlpha(C.lime, 0.18) }} />
          <View style={{ position: 'absolute', left: -40, bottom: -60, width: 160, height: 160, borderRadius: 80, backgroundColor: withAlpha(C.orange, 0.12) }} />

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
            {/* Anneau pas */}
            <StepRing pct={stepsPct} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 10, letterSpacing: 2.5, color: C.lime, fontWeight: '700' }}>PAS</Text>
              <Text style={{ fontFamily: F.display, fontSize: 32, fontWeight: '900', color: C.beige, marginTop: 2 }}>
                {steps.toLocaleString('fr-FR')}
              </Text>
              <Text style={{ fontSize: 11, color: C.lime, opacity: 0.75, marginTop: 2 }}>
                / {stepsGoal.toLocaleString('fr-FR')} objectif
              </Text>
              {!stepsAvailable ? (
                <Text style={{ fontSize: 10, color: C.lime, opacity: 0.6, marginTop: 4 }}>
                  {Platform.OS === 'web' ? 'Podomètre indispo sur web' : 'Capteur indisponible'}
                </Text>
              ) : null}
            </View>
          </View>

          {/* Séances du jour */}
          <View style={{ flexDirection: 'row', marginTop: 18, gap: 12 }}>
            <MetricChip label="SÉANCES" value={String(todayWorkouts.length)} />
            <MetricChip label="MINUTES" value={String(totals.minutes)} />
            <MetricChip label="KCAL" value={String(totals.kcal)} accent />
          </View>
        </View>

        {/* CTA ajout séance */}
        <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
          <Pressable
            onPress={() => {
              hapticLight();
              setAddOpen(true);
            }}
            style={[btnDark(), { backgroundColor: C.orange, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 }]}
          >
            <Text style={{ color: C.beige, fontSize: 18, lineHeight: 18, marginTop: -2 }}>＋</Text>
            <Text style={[btnDarkLabel, { color: C.beige }]}>Ajouter une séance</Text>
          </Pressable>
        </View>

        {/* Jeûne */}
        <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
          <Pressable
            onPress={() => {
              hapticLight();
              // Fasting vit dans le HomeStack d'un autre onglet : il faut passer par le tab navigator.
              navigation.getParent()?.navigate('HomeTab', { screen: 'Fasting' });
            }}
            style={({ pressed }) => ({
              padding: 16,
              borderRadius: 18,
              backgroundColor: C.white,
              borderWidth: 1,
              borderColor: C.beige2,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
              opacity: pressed ? 0.95 : 1,
              ...softShadow,
            })}
          >
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 26,
                backgroundColor: fastingStartTs ? withAlpha(C.orange, 0.15) : withAlpha(C.green, 0.08),
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 24 }}>⏳</Text>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ fontSize: 11, letterSpacing: 1.5, color: C.green, fontWeight: '700' }}>
                JEÛNE INTERMITTENT
              </Text>
              <Text style={{ fontSize: 14, fontWeight: '700', color: C.dark, marginTop: 3 }}>
                {fastingStartTs
                  ? `${formatDuration(fastingMs).slice(0, 5)} / ${fastingTargetH}h`
                  : `Protocole ${fastingPreset === 'custom' ? `${fastingCustomH}h` : fastingPreset}`}
              </Text>
              <View style={{ height: 4, borderRadius: 2, backgroundColor: C.beige3, marginTop: 8, overflow: 'hidden' }}>
                <View
                  style={{
                    width: `${fastingPct * 100}%`,
                    height: '100%',
                    backgroundColor: fastingPct >= 1 ? C.lime : C.orange,
                    borderRadius: 2,
                  }}
                />
              </View>
            </View>
            <Text style={{ fontSize: 18, color: C.darkSoft }}>›</Text>
          </Pressable>
        </View>

        {/* Résumé semaine */}
        <View style={{ marginHorizontal: 16, marginTop: 20 }}>
          <Text style={{ fontSize: 11, letterSpacing: 2, color: C.green, fontWeight: '700' }}>7 DERNIERS JOURS</Text>
          <View
            style={{
              marginTop: 10,
              flexDirection: 'row',
              gap: 10,
            }}
          >
            <SummaryCard label="Séances" value={String(last7.length)} emoji="🏆" />
            <SummaryCard label="Minutes" value={String(week.minutes)} emoji="⏱️" />
            <SummaryCard label="Kcal" value={String(week.kcal)} emoji="🔥" />
          </View>
        </View>

        {/* Liste séances du jour */}
        <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: C.dark, marginLeft: 4 }}>Aujourd'hui</Text>

          {todayWorkouts.length === 0 ? (
            <View
              style={{
                marginTop: 10,
                padding: 24,
                borderRadius: 20,
                backgroundColor: C.white,
                borderWidth: 1,
                borderColor: C.beige2,
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Text style={{ fontSize: 36 }}>💪</Text>
              <Text style={{ fontSize: 13, fontWeight: '700', color: C.dark, textAlign: 'center' }}>
                Pas encore d'entraînement
              </Text>
              <Text style={{ fontSize: 12, color: C.darkSoft, textAlign: 'center', lineHeight: 17, maxWidth: 260 }}>
                Ajoute une séance pour compter les calories brûlées et ajuster ton apport.
              </Text>
            </View>
          ) : (
            <View style={{ marginTop: 10, gap: 10 }}>
              {todayWorkouts.map((w) => {
                const meta = WORKOUT_META[w.type];
                return (
                  <Pressable
                    key={w.id}
                    onLongPress={() => confirmRemove(w)}
                    delayLongPress={400}
                    style={({ pressed }) => ({
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      paddingVertical: 12,
                      paddingHorizontal: 14,
                      backgroundColor: C.white,
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: C.beige2,
                      opacity: pressed ? 0.9 : 1,
                    })}
                  >
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        backgroundColor: withAlpha(C.lime, 0.22),
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 22 }}>{meta.emoji}</Text>
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: C.dark }} numberOfLines={1}>
                        {meta.label}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 }}>
                        <Text style={{ fontSize: 11, color: C.darkSoft }}>{formatTime(w.timestamp)}</Text>
                        <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: C.darkSoft }} />
                        <Text style={{ fontSize: 11, color: C.darkSoft }}>{w.durationMin} min</Text>
                        {w.source === 'healthkit' ? (
                          <>
                            <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: C.darkSoft }} />
                            <Text style={{ fontSize: 10, color: C.green, fontWeight: '700' }}>SANTÉ</Text>
                          </>
                        ) : null}
                      </View>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: C.orange }}>{w.kcal} kcal</Text>
                      <Text style={{ fontSize: 10, color: C.darkSoft, marginTop: 2 }}>brûlées</Text>
                    </View>
                  </Pressable>
                );
              })}
              <Text style={{ textAlign: 'center', fontSize: 10, color: C.darkSoft, marginTop: 4 }}>
                Appui long pour supprimer
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <AddWorkoutSheet
        visible={addOpen}
        onClose={() => setAddOpen(false)}
        onSave={(type, durationMin, note) => {
          const kcal = estimateKcal(type, durationMin, weightKg);
          addWorkout({
            type,
            timestamp: Date.now(),
            durationMin,
            kcal,
            note,
            source: 'manual',
          });
          hapticSuccess();
          setAddOpen(false);
        }}
        weightKg={weightKg}
      />
    </View>
  );
}

function MetricChip({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: accent ? withAlpha(C.orange, 0.25) : withAlpha(C.beige, 0.12),
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 10,
        borderWidth: accent ? 1 : 0,
        borderColor: withAlpha(C.orange, 0.4),
      }}
    >
      <Text style={{ fontSize: 9, letterSpacing: 1.5, color: accent ? C.orange : C.lime, opacity: accent ? 1 : 0.8, fontWeight: '700' }}>
        {label}
      </Text>
      <Text style={{ fontFamily: F.display, fontSize: 20, fontWeight: '900', color: C.beige, marginTop: 2 }}>
        {value}
      </Text>
    </View>
  );
}

function SummaryCard({ label, value, emoji }: { label: string; value: string; emoji: string }) {
  return (
    <View
      style={{
        flex: 1,
        padding: 14,
        borderRadius: 16,
        backgroundColor: C.white,
        borderWidth: 1,
        borderColor: C.beige2,
        ...softShadow,
      }}
    >
      <Text style={{ fontSize: 22 }}>{emoji}</Text>
      <Text style={{ fontFamily: F.display, fontSize: 22, fontWeight: '900', color: C.dark, marginTop: 6 }}>
        {value}
      </Text>
      <Text style={{ fontSize: 10, color: C.darkSoft, marginTop: 2, letterSpacing: 1 }}>{label.toUpperCase()}</Text>
    </View>
  );
}

function StepRing({ pct }: { pct: number }) {
  const size = 80;
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - pct);
  return (
    <Svg width={size} height={size}>
      <Circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(252,233,218,0.18)" strokeWidth={stroke} fill="none" />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={C.lime}
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </Svg>
  );
}

function AddWorkoutSheet({
  visible,
  onClose,
  onSave,
  weightKg,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (type: WorkoutType, durationMin: number, note?: string) => void;
  weightKg: number;
}) {
  const [type, setType] = useState<WorkoutType>('course');
  const [duration, setDuration] = useState('30');
  const [note, setNote] = useState('');
  const insets = useSafeAreaInsets();

  const durationN = parseInt(duration, 10);
  const valid = Number.isFinite(durationN) && durationN > 0 && durationN <= 600;
  const estimatedKcal = valid ? estimateKcal(type, durationN, weightKg) : 0;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: C.beige }}>
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontFamily: F.display, fontSize: 24, fontWeight: '900', color: C.dark }}>
              Nouvelle séance
            </Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Text style={{ fontSize: 22, color: C.darkSoft }}>✕</Text>
            </Pressable>
          </View>

          {/* Type */}
          <Text style={labelStyle}>TYPE D'ACTIVITÉ</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
            {WORKOUT_TYPES.map((t) => {
              const meta = WORKOUT_META[t];
              const active = type === t;
              return (
                <Pressable
                  key={t}
                  onPress={() => {
                    hapticSelection();
                    setType(t);
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    paddingVertical: 10,
                    paddingHorizontal: 14,
                    borderRadius: 999,
                    backgroundColor: active ? C.green : C.white,
                    borderWidth: active ? 0 : 1.5,
                    borderColor: withAlpha(C.green, 0.15),
                  }}
                >
                  <Text style={{ fontSize: 14 }}>{meta.emoji}</Text>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: active ? '700' : '500',
                      color: active ? C.beige : C.dark,
                    }}
                  >
                    {meta.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Durée */}
          <Text style={[labelStyle, { marginTop: 22 }]}>DURÉE</Text>
          <View
            style={{
              marginTop: 6,
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: C.white,
              borderRadius: 14,
              paddingHorizontal: 14,
              paddingVertical: 12,
              gap: 6,
            }}
          >
            <TextInput
              value={duration}
              onChangeText={(v) => setDuration(v.replace(/[^0-9]/g, ''))}
              placeholder="30"
              placeholderTextColor={C.darkSoft}
              keyboardType="number-pad"
              maxLength={3}
              numberOfLines={1}
              style={{
                flex: 1,
                minWidth: 0,
                fontFamily: F.bodyBold,
                fontSize: 17,
                color: C.dark,
                padding: 0,
                lineHeight: 22,
                includeFontPadding: false,
                textAlignVertical: 'center',
              }}
            />
            <Text
              style={{
                fontSize: 13,
                color: C.darkSoft,
                fontFamily: F.bodyMedium,
                lineHeight: 22,
                includeFontPadding: false,
                flexShrink: 0,
              }}
            >
              min
            </Text>
          </View>

          {/* Estimation kcal */}
          <View
            style={{
              marginTop: 14,
              padding: 14,
              borderRadius: 14,
              backgroundColor: withAlpha(C.orange, 0.1),
              borderWidth: 1,
              borderColor: withAlpha(C.orange, 0.25),
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <Text style={{ fontSize: 28 }}>🔥</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, color: C.darkSoft, letterSpacing: 1, fontWeight: '700' }}>
                ESTIMATION
              </Text>
              <Text style={{ fontFamily: F.display, fontSize: 24, fontWeight: '900', color: C.orange, marginTop: 2 }}>
                {estimatedKcal} kcal
              </Text>
              <Text style={{ fontSize: 11, color: C.darkSoft, marginTop: 2 }}>
                Basé sur ton poids ({weightKg} kg) et l'intensité moyenne du sport.
              </Text>
            </View>
          </View>

          {/* Note */}
          <Text style={[labelStyle, { marginTop: 22 }]}>NOTE (OPTIONNEL)</Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Ressenti, parcours, performance..."
            placeholderTextColor={C.darkSoft}
            multiline
            maxLength={140}
            style={{
              marginTop: 6,
              backgroundColor: C.white,
              borderRadius: 14,
              paddingHorizontal: 14,
              paddingVertical: 12,
              fontSize: 14,
              color: C.dark,
              fontFamily: F.body,
              minHeight: 70,
              textAlignVertical: 'top',
            }}
          />

          <Pressable
            onPress={() => onSave(type, durationN, note.trim() || undefined)}
            disabled={!valid}
            style={[btnDark(), { marginTop: 24, opacity: valid ? 1 : 0.4 }]}
          >
            <Text style={btnDarkLabel}>Enregistrer la séance</Text>
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}

const labelStyle = {
  fontSize: 11,
  letterSpacing: 2,
  color: C.green,
  fontWeight: '700' as const,
  marginTop: 22,
};
