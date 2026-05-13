import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, Alert, Switch, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { C, F, softShadow } from '../tokens';
import { IconBack } from '../shared/Icons';
import { hapticLight, hapticSelection, hapticSuccess } from '../shared/haptics';
import { btnDark, btnDarkLabel } from '../shared/Buttons';
import {
  useFastingStore,
  PRESETS,
  currentTargetFastH,
  currentEatH,
  formatDuration,
  type FastingPreset,
} from '../store/useFastingStore';
import {
  ensurePermission,
  ensureChannelAndroid,
  scheduleFastingNotifs,
  cancelFastingNotifs,
} from '../notifications/scheduler';

const PRESET_LIST: FastingPreset[] = ['16:8', '18:6', '20:4', 'custom'];

export default function Fasting() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const preset = useFastingStore((s) => s.preset);
  const customFastH = useFastingStore((s) => s.customFastH);
  const startTs = useFastingStore((s) => s.startTs);
  const notifyStart = useFastingStore((s) => s.notifyStart);
  const notifyEnd = useFastingStore((s) => s.notifyEnd);
  const history = useFastingStore((s) => s.history);
  const setPreset = useFastingStore((s) => s.setPreset);
  const setCustomFastH = useFastingStore((s) => s.setCustomFastH);
  const startFast = useFastingStore((s) => s.startFast);
  const stopFast = useFastingStore((s) => s.stopFast);
  const setNotifyStart = useFastingStore((s) => s.setNotifyStart);
  const setNotifyEnd = useFastingStore((s) => s.setNotifyEnd);

  const targetFastH = useMemo(() => currentTargetFastH({ preset, customFastH }), [preset, customFastH]);
  const eatH = useMemo(() => currentEatH({ preset, customFastH }), [preset, customFastH]);

  // Tick chaque seconde si jeûne en cours
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!startTs) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [startTs]);

  const fastingMs = startTs ? now - startTs : 0;
  const targetMs = targetFastH * 3_600_000;
  const pct = startTs ? Math.min(fastingMs / targetMs, 1) : 0;
  const completed = fastingMs >= targetMs;
  const remainingMs = Math.max(0, targetMs - fastingMs);

  // 7 derniers jeûnes
  const recent = useMemo(() => [...history].reverse().slice(0, 7), [history]);
  const completedCount = history.filter((h) => h.completed).length;

  const onStart = async () => {
    hapticSuccess();
    const ok = await ensurePermission();
    if (Platform.OS === 'android') await ensureChannelAndroid();
    startFast();
    const ts = Date.now();
    if (ok) {
      await scheduleFastingNotifs({
        startTs: ts,
        targetFastH,
        notifyEnd,
        notifyEatWindowStart: notifyStart,
      });
    }
  };

  const onStop = () => {
    Alert.alert(
      completed ? 'Terminer le jeûne ?' : 'Arrêter avant la fin ?',
      completed
        ? `Bravo, ${targetFastH} h tenues 💪`
        : `Tu n'as fait que ${Math.floor(fastingMs / 3_600_000)} h sur ${targetFastH} h — sûr de vouloir stopper ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: completed ? 'Valider' : 'Arrêter',
          style: completed ? 'default' : 'destructive',
          onPress: async () => {
            hapticLight();
            await cancelFastingNotifs();
            stopFast();
          },
        },
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.beige }}>
      {/* Header */}
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 16, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Pressable
          onPress={() => navigation.goBack()}
          accessibilityLabel="Retour"
          hitSlop={12}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: C.white,
            alignItems: 'center',
            justifyContent: 'center',
            ...softShadow,
          }}
        >
          <IconBack />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 11, letterSpacing: 3, color: C.green, fontWeight: '700' }}>JEÛNE INTERMITTENT</Text>
          <Text style={{ fontFamily: F.display, fontSize: 22, fontWeight: '900', color: C.dark, marginTop: 2 }}>
            {startTs ? (completed ? 'Objectif atteint' : 'En cours') : 'Prêt à démarrer'}
          </Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        {/* Timer hero */}
        <View style={{ alignItems: 'center', marginTop: 16 }}>
          <FastingRing pct={pct} completed={completed} active={!!startTs} />
          <View style={{ position: 'absolute', top: 0, alignItems: 'center', justifyContent: 'center', height: 220, width: 220 }}>
            <Text style={{ fontSize: 10, letterSpacing: 2.5, color: C.green, fontWeight: '700' }}>
              {startTs ? (completed ? 'TENU' : 'TEMPS ÉCOULÉ') : 'OBJECTIF'}
            </Text>
            <Text style={{ fontFamily: F.display, fontSize: 36, fontWeight: '900', color: C.dark, marginTop: 4, letterSpacing: -1 }}>
              {startTs ? formatDuration(fastingMs) : `${targetFastH}h`}
            </Text>
            {startTs ? (
              <Text style={{ fontSize: 11, color: C.darkSoft, marginTop: 6 }}>
                {completed ? '🎯 Tu peux manger' : `Reste ${formatDuration(remainingMs)}`}
              </Text>
            ) : (
              <Text style={{ fontSize: 11, color: C.darkSoft, marginTop: 6 }}>
                Fenêtre alim {eatH}h
              </Text>
            )}
          </View>
        </View>

        {/* CTA */}
        <View style={{ paddingHorizontal: 20, marginTop: 30 }}>
          {startTs ? (
            <Pressable
              onPress={onStop}
              style={[
                btnDark(),
                {
                  backgroundColor: completed ? C.orange : C.white,
                  borderWidth: completed ? 0 : 1.5,
                  borderColor: 'rgba(0,65,47,0.2)',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 8,
                },
              ]}
            >
              <Text style={[btnDarkLabel, { color: completed ? C.beige : C.green }]}>
                {completed ? '✓ Valider mon jeûne' : 'Arrêter le jeûne'}
              </Text>
            </Pressable>
          ) : (
            <Pressable onPress={onStart} style={[btnDark(), { backgroundColor: C.green }]}>
              <Text style={btnDarkLabel}>Démarrer le jeûne ({targetFastH}h)</Text>
            </Pressable>
          )}
        </View>

        {/* Preset selector */}
        <View style={{ paddingHorizontal: 16, marginTop: 30 }}>
          <Text style={{ fontSize: 11, letterSpacing: 2, color: C.green, fontWeight: '700', marginLeft: 4 }}>
            PROTOCOLE
          </Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
            {PRESET_LIST.map((p) => {
              const active = preset === p;
              const fastH = p === 'custom' ? customFastH : PRESETS[p].fastH;
              const eatHp = p === 'custom' ? Math.max(0, 24 - customFastH) : PRESETS[p].eatH;
              return (
                <Pressable
                  key={p}
                  onPress={() => {
                    if (startTs) return;
                    hapticSelection();
                    setPreset(p);
                  }}
                  disabled={!!startTs}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    paddingHorizontal: 6,
                    borderRadius: 14,
                    backgroundColor: active ? C.green : C.white,
                    borderWidth: active ? 0 : 1.5,
                    borderColor: 'rgba(0,65,47,0.15)',
                    alignItems: 'center',
                    opacity: startTs ? 0.5 : 1,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '700',
                      color: active ? C.beige : C.dark,
                      fontFamily: F.bodyBold,
                    }}
                  >
                    {p === 'custom' ? 'Custom' : p}
                  </Text>
                  <Text style={{ fontSize: 9, color: active ? C.lime : C.darkSoft, marginTop: 3, letterSpacing: 0.5 }}>
                    {fastH}h / {eatHp}h
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Custom stepper */}
          {preset === 'custom' ? (
            <View
              style={{
                marginTop: 12,
                padding: 14,
                borderRadius: 14,
                backgroundColor: C.white,
                borderWidth: 1,
                borderColor: C.beige2,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View>
                <Text style={{ fontSize: 11, color: C.darkSoft, letterSpacing: 1, fontWeight: '700' }}>DURÉE JEÛNE</Text>
                <Text style={{ fontFamily: F.display, fontSize: 24, fontWeight: '900', color: C.dark, marginTop: 2 }}>
                  {customFastH}h
                </Text>
                <Text style={{ fontSize: 10, color: C.darkSoft, marginTop: 2 }}>
                  Fenêtre alim {Math.max(0, 24 - customFastH)}h
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <StepperBtn
                  label="−"
                  onPress={() => {
                    hapticSelection();
                    setCustomFastH(customFastH - 1);
                  }}
                  disabled={customFastH <= 8 || !!startTs}
                />
                <StepperBtn
                  label="+"
                  onPress={() => {
                    hapticSelection();
                    setCustomFastH(customFastH + 1);
                  }}
                  disabled={customFastH >= 24 || !!startTs}
                />
              </View>
            </View>
          ) : null}
        </View>

        {/* Notifs */}
        <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
          <Text style={{ fontSize: 11, letterSpacing: 2, color: C.green, fontWeight: '700', marginLeft: 4 }}>
            NOTIFICATIONS
          </Text>
          <View style={{ marginTop: 10, backgroundColor: C.white, borderRadius: 16, borderWidth: 1, borderColor: C.beige2 }}>
            <ToggleRow
              label="Fin du jeûne"
              sub="Alerte quand l'objectif est atteint (et 1h avant)."
              value={notifyEnd}
              onValueChange={setNotifyEnd}
            />
            <View style={{ height: 1, backgroundColor: C.beige2, marginHorizontal: 14 }} />
            <ToggleRow
              label="Fenêtre alimentaire"
              sub="Rappel pour logger ton premier repas."
              value={notifyStart}
              onValueChange={setNotifyStart}
            />
          </View>
        </View>

        {/* Historique */}
        <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginLeft: 4 }}>
            <Text style={{ fontSize: 11, letterSpacing: 2, color: C.green, fontWeight: '700' }}>HISTORIQUE</Text>
            <Text style={{ fontSize: 10, color: C.darkSoft }}>
              {completedCount} / {history.length} réussis
            </Text>
          </View>

          {recent.length === 0 ? (
            <View
              style={{
                marginTop: 10,
                padding: 20,
                borderRadius: 16,
                backgroundColor: C.white,
                borderWidth: 1,
                borderColor: C.beige2,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 32 }}>⏳</Text>
              <Text style={{ fontSize: 12, color: C.darkSoft, marginTop: 8, textAlign: 'center' }}>
                Aucun jeûne enregistré pour le moment.
              </Text>
            </View>
          ) : (
            <View style={{ marginTop: 10, gap: 8 }}>
              {recent.map((s) => {
                const durH = (s.endTs - s.startTs) / 3_600_000;
                return (
                  <View
                    key={s.id}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: 12,
                      paddingHorizontal: 14,
                      backgroundColor: C.white,
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: C.beige2,
                      gap: 12,
                    }}
                  >
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: s.completed ? 'rgba(190,211,92,0.25)' : 'rgba(237,126,0,0.15)',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 16 }}>{s.completed ? '✓' : '·'}</Text>
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: C.dark }}>
                        {durH.toFixed(1)}h tenues
                      </Text>
                      <Text style={{ fontSize: 11, color: C.darkSoft, marginTop: 2 }}>
                        Objectif {s.targetFastH}h · {new Date(s.endTs).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 11, color: s.completed ? C.green : C.darkSoft, fontWeight: '700' }}>
                      {s.completed ? 'RÉUSSI' : 'INCOMPLET'}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function FastingRing({ pct, completed, active }: { pct: number; completed: boolean; active: boolean }) {
  const size = 220;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - pct);
  const color = completed ? C.lime : active ? C.orange : C.green;
  return (
    <Svg width={size} height={size}>
      <Circle cx={size / 2} cy={size / 2} r={r} stroke={C.white} strokeWidth={stroke} fill="none" />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={color}
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={c}
        strokeDashoffset={active ? offset : c}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </Svg>
  );
}

function StepperBtn({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={{
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: C.green,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.3 : 1,
      }}
    >
      <Text style={{ color: C.beige, fontSize: 20, fontWeight: '700', lineHeight: 22, marginTop: -2 }}>{label}</Text>
    </Pressable>
  );
}

function ToggleRow({
  label,
  sub,
  value,
  onValueChange,
}: {
  label: string;
  sub: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  return (
    <View style={{ paddingVertical: 14, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: C.dark }}>{label}</Text>
        <Text style={{ fontSize: 11, color: C.darkSoft, marginTop: 2, lineHeight: 15 }}>{sub}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={(v) => {
          hapticSelection();
          onValueChange(v);
        }}
        trackColor={{ false: '#e0d8ce', true: C.green }}
        thumbColor={C.beige}
      />
    </View>
  );
}
