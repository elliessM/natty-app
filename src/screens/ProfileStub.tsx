import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, Alert, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { C, F, cardShadow, softShadow, withAlpha } from '../tokens';
import {
  useUserStore,
  computeMacroTargets,
  ACTIVITY_LABEL,
  GOAL_LABEL,
} from '../store/useUserStore';
import { useCartStore } from '../store/useCartStore';
import { useJournalStore } from '../store/useJournalStore';
import { useAuthStore } from '../store/useAuthStore';
import { hapticLight, hapticSelection, hapticSuccess, hapticWarning } from '../shared/haptics';
import { seedDemoData, clearDemoData } from '../data/demoSeed';
import WeighInSheet from '../shared/WeighInSheet';
import WeightLineChart from '../shared/charts/WeightLineChart';
import { useNavigation } from '@react-navigation/native';
import {
  isWebPushSupported,
  isIosStandaloneRequired,
  subscribeAndSync,
  unsubscribe,
  sendTestNotification,
} from '../api/webpush';
import { Platform } from 'react-native';
import type { ActivityLevel, Goal, Sex } from '../types';

const SEXES: Array<{ id: Sex; label: string }> = [
  { id: 'M', label: 'Homme' },
  { id: 'F', label: 'Femme' },
  { id: 'other', label: 'Autre' },
];

const ACTIVITY_LEVELS: Array<{ id: ActivityLevel; short: string }> = [
  { id: 'sedentary', short: 'Sédentaire' },
  { id: 'light', short: 'Peu actif' },
  { id: 'active', short: 'Actif' },
  { id: 'athlete', short: 'Athlète' },
];

const GOALS: Array<{ id: Goal; emoji: string }> = [
  { id: 'energy', emoji: '⚡' },
  { id: 'muscle', emoji: '💪' },
  { id: 'weight', emoji: '🔥' },
  { id: 'perf', emoji: '🏃' },
];

export default function Profile() {
  const insets = useSafeAreaInsets();

  const user = useUserStore();
  const clearCart = useCartStore((s) => s.clear);
  const clearJournal = useJournalStore((s) => s.clear);
  const authEmail = useAuthStore((s) => s.user?.email ?? null);
  const signOut = useAuthStore((s) => s.signOut);
  const navigation = useNavigation<any>();
  const weightHistory = user.weightHistory;
  const weightDelta = weightHistory.length >= 2 ? weightHistory[weightHistory.length - 1].kg - weightHistory[0].kg : 0;
  const deleteAccount = useAuthStore((s) => s.deleteAccount);
  const clearJournalLocal = useJournalStore((s) => s.clear);
  const userResetLocal = useUserStore((s) => s.reset);

  const [weighInOpen, setWeighInOpen] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushHint, setPushHint] = useState<string | null>(null);
  const [nameDraft, setNameDraft] = useState(user.name);
  const authUserId = useAuthStore((s) => s.user?.id ?? null);

  React.useEffect(() => {
    if (Platform.OS !== 'web' || !isWebPushSupported()) return;
    (async () => {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager?.getSubscription();
      setPushEnabled(!!sub);
    })();
  }, []);

  const togglePush = async (next: boolean) => {
    if (!authUserId) return;
    if (!isWebPushSupported()) {
      setPushHint('Notifications push non supportées sur ce navigateur.');
      return;
    }
    if (next && isIosStandaloneRequired()) {
      setPushHint("Sur iPhone, ajoute d'abord Natty à l'écran d'accueil (Safari → Partager → Sur l'écran d'accueil).");
      return;
    }
    setPushBusy(true);
    setPushHint(null);
    if (next) {
      const r = await subscribeAndSync(authUserId);
      if (r.ok) {
        setPushEnabled(true);
        hapticSuccess();
      } else {
        setPushHint(reasonToFr(r.reason));
        hapticWarning();
      }
    } else {
      await unsubscribe(authUserId);
      setPushEnabled(false);
      hapticLight();
    }
    setPushBusy(false);
  };

  const sendTest = async () => {
    setPushBusy(true);
    const r = await sendTestNotification();
    setPushBusy(false);
    if (r.ok) {
      hapticSuccess();
      setPushHint('Envoyée ! Tu devrais recevoir la notification dans quelques secondes.');
    } else {
      hapticWarning();
      setPushHint(r.error ?? 'Échec d\'envoi.');
    }
  };
  const [emailDraft, setEmailDraft] = useState(user.email);
  const [weightDraft, setWeightDraft] = useState(String(user.weightKg));
  const [targetWeightDraft, setTargetWeightDraft] = useState(String(user.targetWeightKg));
  const [heightDraft, setHeightDraft] = useState(String(user.heightCm));
  const [ageDraft, setAgeDraft] = useState(String(user.age));

  const macros = computeMacroTargets(user);
  const imc = user.weightKg / Math.pow(user.heightCm / 100, 2);

  const commitNumeric = (
    draft: string,
    setter: (v: number) => void,
    fallback: number
  ) => {
    const n = parseInt(draft, 10);
    setter(Number.isFinite(n) ? n : fallback);
  };

  const confirmReset = () => {
    Alert.alert(
      'Tout réinitialiser ?',
      'Ça remet à zéro ton profil, ton panier et ton journal — pratique pour tester en dev.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            hapticWarning();
            user.reset();
            clearCart();
            clearJournal();
          },
        },
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.beige }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <LinearGradient
          colors={[C.green, C.greenAlt]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingTop: insets.top + 16, paddingBottom: 60, paddingHorizontal: 20 }}
        >
          <Text style={{ fontSize: 11, letterSpacing: 3, color: C.lime, fontWeight: '700' }}>MON PROFIL</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 16 }}>
            <View
              style={{
                width: 68,
                height: 68,
                borderRadius: 22,
                backgroundColor: C.lime,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontFamily: F.display, fontWeight: '900', fontSize: 34, color: C.green, lineHeight: 36, marginTop: -2 }}>
                {(nameDraft || 'N')[0].toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: F.display, fontSize: 26, fontWeight: '900', color: C.beige, lineHeight: 28 }} numberOfLines={1}>
                {nameDraft || 'Anonyme'}
              </Text>
              <Text style={{ fontSize: 12, color: C.lime, opacity: 0.85, marginTop: 4 }} numberOfLines={1}>
                {emailDraft || 'email à compléter'}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Identity card */}
        <Card title="IDENTITÉ" style={{ marginTop: -40 }}>
          <Field label="Prénom">
            <TextInput
              value={nameDraft}
              onChangeText={setNameDraft}
              onBlur={() => user.setName(nameDraft)}
              maxLength={24}
              placeholder="Ton prénom"
              placeholderTextColor={C.darkSoft}
              style={inputStyle}
              returnKeyType="done"
            />
          </Field>
          <Field label="Email" last>
            <TextInput
              value={emailDraft}
              onChangeText={setEmailDraft}
              onBlur={() => user.setEmail(emailDraft)}
              placeholder="tonemail@exemple.fr"
              placeholderTextColor={C.darkSoft}
              style={inputStyle}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="done"
            />
          </Field>
        </Card>

        {/* Body metrics card */}
        <Card title="MESURES">
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <MetricInput
              label="Poids"
              unit="kg"
              value={weightDraft}
              onChangeText={setWeightDraft}
              onBlur={() => commitNumeric(weightDraft, user.setWeightKg, user.weightKg)}
            />
            <MetricInput
              label="Objectif"
              unit="kg"
              value={targetWeightDraft}
              onChangeText={setTargetWeightDraft}
              onBlur={() => commitNumeric(targetWeightDraft, user.setTargetWeightKg, user.targetWeightKg)}
            />
          </View>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
            <MetricInput
              label="Taille"
              unit="cm"
              value={heightDraft}
              onChangeText={setHeightDraft}
              onBlur={() => commitNumeric(heightDraft, user.setHeightCm, user.heightCm)}
            />
            <MetricInput
              label="Âge"
              unit="ans"
              value={ageDraft}
              onChangeText={setAgeDraft}
              onBlur={() => commitNumeric(ageDraft, user.setAge, user.age)}
            />
          </View>

          <View style={{ marginTop: 14 }}>
            <Text style={fieldLabelStyle}>Sexe</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
              {SEXES.map((s) => {
                const active = user.sex === s.id;
                return (
                  <Pressable
                    key={s.id}
                    onPress={() => {
                      hapticSelection();
                      user.setSex(s.id);
                    }}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 999,
                      backgroundColor: active ? C.green : C.beige,
                      alignItems: 'center',
                      borderWidth: active ? 0 : 1.5,
                      borderColor: withAlpha(C.green, 0.15),
                    }}
                  >
                    <Text style={{ color: active ? C.beige : C.dark, fontSize: 13, fontWeight: active ? '700' : '500' }}>{s.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {Number.isFinite(imc) ? (
            <View
              style={{
                marginTop: 14,
                padding: 12,
                backgroundColor: C.beige,
                borderRadius: 12,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 12, color: C.darkSoft }}>IMC</Text>
              <Text style={{ fontSize: 14, fontWeight: '700', color: C.dark }}>{imc.toFixed(1)}</Text>
            </View>
          ) : null}

          {/* Quick weigh-in CTA */}
          <Pressable
            onPress={() => {
              hapticLight();
              setWeighInOpen(true);
            }}
            style={({ pressed }) => ({
              marginTop: 14,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              paddingVertical: 12,
              paddingHorizontal: 14,
              borderRadius: 14,
              backgroundColor: C.green,
              opacity: pressed ? 0.9 : 1,
            })}
          >
            <Text style={{ fontSize: 22 }}>⚖️</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: C.beige }}>Peser aujourd'hui</Text>
              <Text style={{ fontSize: 11, color: C.lime, opacity: 0.85, marginTop: 2 }}>
                Met à jour ta courbe de poids en 5 secondes
              </Text>
            </View>
            <Text style={{ color: C.beige, fontSize: 18 }}>›</Text>
          </Pressable>
        </Card>

        {/* Suivi du poids — courbe + accès rapide aux stats */}
        <Pressable
          onPress={() => {
            hapticLight();
            navigation.navigate('Stats');
          }}
          style={({ pressed }) => ({
            marginHorizontal: 16,
            marginTop: 16,
            padding: 18,
            backgroundColor: C.white,
            borderRadius: 20,
            opacity: pressed ? 0.95 : 1,
            ...cardShadow,
          })}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Text style={{ fontSize: 10, letterSpacing: 3, color: C.green, fontWeight: '700' }}>SUIVI DU POIDS</Text>
            {weightHistory.length >= 2 ? (
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: weightDelta < 0 ? C.green : weightDelta > 0 ? C.orange : C.darkSoft,
                }}
              >
                {weightDelta > 0 ? '+' : ''}
                {weightDelta.toFixed(1)} kg
              </Text>
            ) : null}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 6, gap: 6 }}>
            <Text style={{ fontFamily: F.display, fontSize: 32, fontWeight: '900', color: C.dark }}>
              {user.weightKg.toFixed(1).replace('.', ',')}
            </Text>
            <Text style={{ fontSize: 14, color: C.darkSoft, fontWeight: '600' }}>kg</Text>
            {user.targetWeightKg !== user.weightKg ? (
              <Text style={{ fontSize: 11, color: C.darkSoft, marginLeft: 6 }}>
                · objectif {user.targetWeightKg} kg
              </Text>
            ) : null}
          </View>
          {weightHistory.length >= 2 ? (
            <View style={{ marginTop: 10 }}>
              <WeightLineChart data={weightHistory} target={user.targetWeightKg} height={130} />
            </View>
          ) : (
            <Text style={{ fontSize: 12, color: C.darkSoft, marginTop: 8, lineHeight: 17 }}>
              Pèse-toi régulièrement pour voir ta courbe de progression apparaître ici.
            </Text>
          )}
          <View
            style={{
              marginTop: 12,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: 10,
              borderTopWidth: 1,
              borderTopColor: C.beige2,
            }}
          >
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                hapticLight();
                setWeighInOpen(true);
              }}
              hitSlop={8}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
            >
              <Text style={{ fontSize: 13 }}>⚖️</Text>
              <Text style={{ fontSize: 12, fontWeight: '700', color: C.green }}>Peser aujourd'hui</Text>
            </Pressable>
            <Text style={{ fontSize: 12, fontWeight: '700', color: C.green }}>Voir mes stats →</Text>
          </View>
        </Pressable>

        {/* Mes objectifs — paramétrables */}
        <Card title="MES OBJECTIFS" subtitle="Servent au tracking et aux rappels">
          {/* Hydratation */}
          <Text style={fieldLabelStyle}>Hydratation</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <Pressable
              onPress={() => {
                hapticSelection();
                user.setHydrationGoalMl(user.hydrationGoalMl - 250);
              }}
              style={goalStepBtn}
            >
              <Text style={goalStepLabel}>−</Text>
            </Pressable>
            <View style={goalValueBox}>
              <Text style={goalValueText}>
                {(user.hydrationGoalMl / 1000).toFixed(1).replace('.', ',')} L
              </Text>
            </View>
            <Pressable
              onPress={() => {
                hapticSelection();
                user.setHydrationGoalMl(user.hydrationGoalMl + 250);
              }}
              style={[goalStepBtn, { backgroundColor: C.orange }]}
            >
              <Text style={[goalStepLabel, { color: C.beige }]}>+</Text>
            </Pressable>
          </View>

          {/* Pas */}
          <Text style={[fieldLabelStyle, { marginTop: 16 }]}>Pas par jour</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <Pressable
              onPress={() => {
                hapticSelection();
                user.setStepsGoal(user.stepsGoal - 1000);
              }}
              style={goalStepBtn}
            >
              <Text style={goalStepLabel}>−</Text>
            </Pressable>
            <View style={goalValueBox}>
              <Text style={goalValueText}>{user.stepsGoal.toLocaleString('fr-FR')}</Text>
            </View>
            <Pressable
              onPress={() => {
                hapticSelection();
                user.setStepsGoal(user.stepsGoal + 1000);
              }}
              style={[goalStepBtn, { backgroundColor: C.orange }]}
            >
              <Text style={[goalStepLabel, { color: C.beige }]}>+</Text>
            </Pressable>
          </View>

          {/* Jour de pesée */}
          <Text style={[fieldLabelStyle, { marginTop: 16 }]}>Jour de pesée hebdo</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
            {(['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'] as const).map((d, i) => {
              const day = i + 1;
              const active = user.weighInDay === day;
              return (
                <Pressable
                  key={d}
                  onPress={() => {
                    hapticSelection();
                    user.setWeighInDay(day);
                  }}
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderRadius: 999,
                    backgroundColor: active ? C.green : C.beige,
                    borderWidth: active ? 0 : 1.5,
                    borderColor: withAlpha(C.green, 0.12),
                  }}
                >
                  <Text style={{ color: active ? C.beige : C.dark, fontSize: 12, fontWeight: active ? '700' : '500' }}>
                    {d}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Heure de pesée */}
          <Text style={[fieldLabelStyle, { marginTop: 16 }]}>Heure du rappel</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <Pressable
              onPress={() => {
                hapticSelection();
                user.setWeighInHour(user.weighInHour - 1);
              }}
              style={goalStepBtn}
            >
              <Text style={goalStepLabel}>−</Text>
            </Pressable>
            <View style={goalValueBox}>
              <Text style={goalValueText}>{String(user.weighInHour).padStart(2, '0')}:00</Text>
            </View>
            <Pressable
              onPress={() => {
                hapticSelection();
                user.setWeighInHour(user.weighInHour + 1);
              }}
              style={[goalStepBtn, { backgroundColor: C.orange }]}
            >
              <Text style={[goalStepLabel, { color: C.beige }]}>+</Text>
            </Pressable>
          </View>
        </Card>

        {/* Activity card */}
        <Card title="NIVEAU D'ACTIVITÉ">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {ACTIVITY_LEVELS.map((a) => {
              const active = user.activityLevel === a.id;
              return (
                <Pressable
                  key={a.id}
                  onPress={() => {
                    hapticSelection();
                    user.setActivityLevel(a.id);
                  }}
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: 16,
                    borderRadius: 999,
                    backgroundColor: active ? C.orange : C.beige,
                    borderWidth: active ? 0 : 1.5,
                    borderColor: withAlpha(C.green, 0.15),
                  }}
                >
                  <Text style={{ color: active ? C.beige : C.dark, fontSize: 12, fontWeight: active ? '700' : '500' }}>{a.short}</Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={{ fontSize: 11, color: C.darkSoft, marginTop: 10, lineHeight: 16 }}>
            {describeActivity(user.activityLevel)}
          </Text>
        </Card>

        {/* Goal card */}
        <Card title="OBJECTIF">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {GOALS.map((g) => {
              const active = user.goal === g.id;
              return (
                <Pressable
                  key={g.id}
                  onPress={() => {
                    hapticSelection();
                    user.setGoal(g.id);
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    paddingVertical: 10,
                    paddingHorizontal: 14,
                    borderRadius: 999,
                    backgroundColor: active ? C.green : C.beige,
                    borderWidth: active ? 0 : 1.5,
                    borderColor: withAlpha(C.green, 0.15),
                  }}
                >
                  <Text style={{ fontSize: 14 }}>{g.emoji}</Text>
                  <Text style={{ color: active ? C.beige : C.dark, fontSize: 12, fontWeight: active ? '700' : '500' }}>
                    {GOAL_LABEL[g.id]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Card>

        {/* Computed macros */}
        <Card title="OBJECTIFS CALCULÉS" subtitle="Mis à jour en temps réel depuis ton profil">
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
            <Text style={{ fontFamily: F.display, fontSize: 42, fontWeight: '900', color: C.green, lineHeight: 44 }}>{macros.kcal}</Text>
            <Text style={{ fontSize: 14, color: C.darkSoft }}>kcal / jour</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
            <MacroChip color={C.orange} label="Protéines" value={`${macros.prot}g`} />
            <MacroChip color={C.lime} label="Glucides" value={`${macros.glu}g`} />
            <MacroChip color={C.green} label="Lipides" value={`${macros.lip}g`} />
          </View>
        </Card>

        {/* Credits placeholder */}
        <Card title="NATTY CREDITS">
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View>
              <Text style={{ fontFamily: F.display, fontSize: 28, fontWeight: '900', color: C.dark }}>
                {user.creditsEur.toFixed(2).replace('.', ',')} €
              </Text>
              <Text style={{ fontSize: 11, color: C.darkSoft, marginTop: 2 }}>Solde disponible</Text>
            </View>
            <Pressable
              onPress={() => {
                hapticLight();
                Alert.alert('Bientôt', 'La recharge Natty Credits arrive en v1.1.');
              }}
              style={{ paddingVertical: 10, paddingHorizontal: 18, borderRadius: 999, backgroundColor: C.orange }}
            >
              <Text style={{ color: C.beige, fontWeight: '700', fontSize: 13 }}>Recharger</Text>
            </Pressable>
          </View>
        </Card>

        {/* Paramètres */}
        <Card title="PARAMÈTRES">
          <SettingToggle
            label="Notifications"
            sublabel={user.notificationsEnabled ? 'Rappels actifs' : 'Désactivées'}
            value={user.notificationsEnabled}
            onChange={(v) => {
              hapticSelection();
              user.setNotificationsEnabled(v);
            }}
          />

          {user.notificationsEnabled ? (
            <View style={{ marginTop: 14, paddingLeft: 14, borderLeftWidth: 2, borderLeftColor: C.beige2, gap: 12 }}>
              <SettingToggle
                label="Hydratation"
                sublabel="11h, 14h30, 17h30"
                value={user.notifPrefs.hydration}
                onChange={(v) => {
                  hapticSelection();
                  user.setNotifPref('hydration', v);
                }}
              />
              <SettingToggle
                label="Repas"
                sublabel="Petit-déj, déj, dîner"
                value={user.notifPrefs.meals}
                onChange={(v) => {
                  hapticSelection();
                  user.setNotifPref('meals', v);
                }}
              />
              <SettingToggle
                label="Pesée hebdo"
                sublabel="Lundi matin · 8h"
                value={user.notifPrefs.weighIn}
                onChange={(v) => {
                  hapticSelection();
                  user.setNotifPref('weighIn', v);
                }}
              />
              <SettingToggle
                label="Commandes"
                sublabel="15 min avant retrait"
                value={user.notifPrefs.reservations}
                onChange={(v) => {
                  hapticSelection();
                  user.setNotifPref('reservations', v);
                }}
              />
            </View>
          ) : null}

          <View style={{ height: 16 }} />
          <SettingPills
            label="Unités"
            options={[
              { id: 'metric', label: 'kg · cm' },
              { id: 'imperial', label: 'lb · ft' },
            ]}
            value={user.unitSystem}
            onChange={(v) => {
              hapticSelection();
              user.setUnitSystem(v as 'metric' | 'imperial');
            }}
          />
          <View style={{ height: 12 }} />
          <SettingPills
            label="Langue"
            options={[
              { id: 'fr', label: 'Français' },
              { id: 'en', label: 'English' },
            ]}
            value={user.language}
            onChange={(v) => {
              hapticSelection();
              user.setLanguage(v as 'fr' | 'en');
            }}
          />
          <View style={{ height: 16 }} />
          <Pressable
            onPress={() => {
              hapticLight();
              Alert.alert(
                'Supprimer mon compte ?',
                'Toutes tes données (profil, journal, commandes, favoris) seront effacées du cloud. Cette action est irréversible.',
                [
                  { text: 'Annuler', style: 'cancel' },
                  {
                    text: 'Supprimer définitivement',
                    style: 'destructive',
                    onPress: async () => {
                      hapticWarning();
                      const res = await deleteAccount();
                      if (res.ok) {
                        // Cleanup local — l'auth gate fera revenir sur AuthScreen
                        clearCart();
                        clearJournal();
                        clearJournalLocal();
                        userResetLocal();
                      } else {
                        Alert.alert('Erreur', res.error ?? 'Impossible de supprimer le compte.');
                      }
                    },
                  },
                ]
              );
            }}
            style={{
              alignSelf: 'flex-start',
              paddingVertical: 6,
            }}
          >
            <Text style={{ color: C.danger, fontSize: 12, fontWeight: '600', textDecorationLine: 'underline' }}>
              Supprimer mon compte
            </Text>
          </Pressable>
        </Card>

        {/* Notifications push */}
        {Platform.OS === 'web' ? (
          <Card title="NOTIFICATIONS PUSH" subtitle="Rappels même quand l'app est fermée">
            <SettingToggle
              label={pushEnabled ? 'Push activées' : 'Activer les notifications'}
              sublabel={pushEnabled ? 'Tu peux les désactiver à tout moment' : 'Hydratation, repas, rappels commande'}
              value={pushEnabled}
              onChange={togglePush}
            />
            {pushEnabled ? (
              <Pressable
                onPress={sendTest}
                disabled={pushBusy}
                style={{
                  marginTop: 12,
                  paddingVertical: 10,
                  borderRadius: 999,
                  borderWidth: 1.5,
                  borderColor: C.green,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: C.green, fontWeight: '700', fontSize: 13 }}>
                  {pushBusy ? 'Envoi…' : '🔔 Envoyer une notif test'}
                </Text>
              </Pressable>
            ) : null}
            {pushHint ? (
              <Text style={{ marginTop: 10, fontSize: 11, color: C.darkSoft, lineHeight: 16 }}>{pushHint}</Text>
            ) : null}
          </Card>
        ) : null}

        {/* Session */}
        <Card title="SESSION" subtitle={authEmail ? `Connecté en tant que ${authEmail}` : 'Mode local'}>
          <Pressable
            onPress={() => {
              const title = 'Se déconnecter ?';
              const msg = 'Tes données cloud restent sauvegardées — tu pourras les retrouver en te reconnectant.';
              // Alert.alert avec boutons est un no-op sur web : window.confirm prend le relais en PWA.
              if (Platform.OS === 'web') {
                if (window.confirm(`${title}\n\n${msg}`)) {
                  hapticWarning();
                  signOut();
                }
                return;
              }
              Alert.alert(title, msg, [
                { text: 'Annuler', style: 'cancel' },
                {
                  text: 'Se déconnecter',
                  style: 'destructive',
                  onPress: async () => {
                    hapticWarning();
                    await signOut();
                  },
                },
              ]);
            }}
            style={{
              height: 48,
              borderRadius: 24,
              backgroundColor: C.green,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: C.beige, fontWeight: '700', fontSize: 13 }}>Se déconnecter</Text>
          </Pressable>
        </Card>

        {/* Mode démo */}
        <Card title="MODE DÉMO" subtitle="Pour tes présentations — semble une app vivante en 1 tap">
          <Pressable
            onPress={() => {
              hapticSuccess();
              seedDemoData();
              Alert.alert(
                'Démo prête 🎬',
                "Profil rempli, journal sur 7 jours, 1 commande à venir, hydratation à 75%. Tu peux montrer l'app à n'importe qui."
              );
            }}
            style={{
              height: 52,
              borderRadius: 26,
              backgroundColor: C.green,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 8,
            }}
          >
            <Text style={{ fontSize: 16 }}>🎬</Text>
            <Text style={{ color: C.beige, fontWeight: '700', fontSize: 14 }}>Préparer la démo</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              hapticLight();
              Alert.alert('Vider la démo ?', 'Efface journal, commandes, panier et hydratation. Le profil reste.', [
                { text: 'Annuler', style: 'cancel' },
                {
                  text: 'Vider',
                  style: 'destructive',
                  onPress: () => {
                    hapticWarning();
                    clearDemoData();
                  },
                },
              ]);
            }}
            style={{
              marginTop: 10,
              height: 44,
              borderRadius: 22,
              borderWidth: 1.5,
              borderColor: C.beige2,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: C.darkSoft, fontWeight: '700', fontSize: 12 }}>Vider la démo (garder profil)</Text>
          </Pressable>
        </Card>

        {/* Dev zone */}
        <Card title="ZONE DEV" subtitle="À retirer en prod">
          <Pressable
            onPress={confirmReset}
            style={{
              height: 48,
              borderRadius: 24,
              borderWidth: 1.5,
              borderColor: C.danger,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: C.danger, fontWeight: '700', fontSize: 13 }}>Tout réinitialiser (local)</Text>
          </Pressable>
        </Card>

        <Text style={{ textAlign: 'center', fontSize: 10, color: C.darkSoft, marginTop: 14, opacity: 0.7 }}>
          Natty v2.1 · Profil local · cloud sync en Phase 3
        </Text>
      </ScrollView>
      <WeighInSheet visible={weighInOpen} onClose={() => setWeighInOpen(false)} />
    </View>
  );
}

// ─── Sub-components ────────────────────────────────────────────────
function Card({
  title,
  subtitle,
  children,
  style,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  style?: any;
}) {
  return (
    <View
      style={[
        {
          marginHorizontal: 16,
          marginTop: 16,
          padding: 18,
          backgroundColor: C.white,
          borderRadius: 20,
          ...cardShadow,
        },
        style,
      ]}
    >
      <Text style={{ fontSize: 10, letterSpacing: 3, color: C.green, fontWeight: '700' }}>{title}</Text>
      {subtitle ? (
        <Text style={{ fontSize: 11, color: C.darkSoft, marginTop: 3 }}>{subtitle}</Text>
      ) : null}
      <View style={{ marginTop: 14 }}>{children}</View>
    </View>
  );
}

function Field({ label, children, last }: { label: string; children: React.ReactNode; last?: boolean }) {
  return (
    <View style={{ marginBottom: last ? 0 : 12 }}>
      <Text style={fieldLabelStyle}>{label}</Text>
      {children}
    </View>
  );
}

function MetricInput({
  label,
  unit,
  value,
  onChangeText,
  onBlur,
}: {
  label: string;
  unit: string;
  value: string;
  onChangeText: (v: string) => void;
  onBlur: () => void;
}) {
  return (
    <View style={{ flex: 1, minWidth: 0 }}>
      <Text style={fieldLabelStyle}>{label}</Text>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: C.beige,
          borderRadius: 14,
          paddingHorizontal: 12,
          paddingVertical: 10,
          marginTop: 6,
          gap: 4,
        }}
      >
        <TextInput
          value={value}
          onChangeText={(v) => onChangeText(v.replace(/[^0-9]/g, ''))}
          onBlur={onBlur}
          keyboardType="number-pad"
          maxLength={3}
          numberOfLines={1}
          style={{
            flex: 1,
            minWidth: 0,
            fontSize: 16,
            color: C.dark,
            fontFamily: F.bodyBold,
            padding: 0,
            lineHeight: 20,
            includeFontPadding: false,
            textAlignVertical: 'center',
          }}
          returnKeyType="done"
        />
        <Text
          style={{
            fontSize: 12,
            color: C.darkSoft,
            fontFamily: F.bodyMedium,
            lineHeight: 20,
            includeFontPadding: false,
            textAlignVertical: 'center',
            flexShrink: 0,
          }}
        >
          {unit}
        </Text>
      </View>
    </View>
  );
}

function MacroChip({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <View style={{ flex: 1, padding: 12, backgroundColor: C.beige, borderRadius: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
        <Text style={{ fontSize: 10, color: C.darkSoft, fontWeight: '700', letterSpacing: 0.5 }}>{label.toUpperCase()}</Text>
      </View>
      <Text style={{ fontFamily: F.display, fontSize: 22, fontWeight: '900', color: C.dark, marginTop: 4 }}>{value}</Text>
    </View>
  );
}

function SettingToggle({
  label,
  sublabel,
  value,
  onChange,
}: {
  label: string;
  sublabel?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: C.dark }}>{label}</Text>
        {sublabel ? <Text style={{ fontSize: 11, color: C.darkSoft, marginTop: 2 }}>{sublabel}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: C.line, true: C.lime }}
        thumbColor={value ? C.green : '#f1f1f1'}
        ios_backgroundColor="#d8d2c8"
      />
    </View>
  );
}

function SettingPills<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Array<{ id: T; label: string }>;
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View>
      <Text style={fieldLabelStyle}>{label}</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
        {options.map((o) => {
          const active = value === o.id;
          return (
            <Pressable
              key={o.id}
              onPress={() => onChange(o.id)}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: 999,
                backgroundColor: active ? C.green : C.beige,
                borderWidth: active ? 0 : 1.5,
                borderColor: withAlpha(C.green, 0.15),
                alignItems: 'center',
              }}
            >
              <Text style={{ color: active ? C.beige : C.dark, fontSize: 13, fontWeight: active ? '700' : '500' }}>
                {o.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function reasonToFr(reason?: string): string {
  if (!reason) return 'Erreur inconnue.';
  if (reason === 'unsupported') return 'Ton navigateur ne supporte pas Web Push.';
  if (reason === 'ios-not-standalone')
    return "Sur iPhone : ajoute Natty à l'écran d'accueil avant d'activer les notifs.";
  if (reason === 'sw-failed') return 'Impossible de démarrer le service worker.';
  if (reason === 'permission-denied') return 'Tu as refusé les notifications dans les réglages du navigateur.';
  if (reason === 'missing-vapid') return 'La clé VAPID publique n\'est pas configurée dans le code.';
  return reason;
}

function describeActivity(a: ActivityLevel): string {
  switch (a) {
    case 'sedentary':
      return 'Peu d’activité physique, travail de bureau, pas de sport régulier.';
    case 'light':
      return 'Sport léger 1-3 fois par semaine ou marche quotidienne.';
    case 'active':
      return 'Entraînement soutenu 3-5 fois par semaine.';
    case 'athlete':
      return 'Sport intensif 6-7 fois par semaine, compétition ou double séance.';
  }
}

const fieldLabelStyle = {
  fontSize: 11,
  fontWeight: '700' as const,
  color: C.darkSoft,
  letterSpacing: 1,
  textTransform: 'uppercase' as const,
};

const inputStyle = {
  marginTop: 6,
  backgroundColor: C.beige,
  borderRadius: 14,
  paddingHorizontal: 14,
  paddingVertical: 12,
  fontSize: 15,
  fontWeight: '600' as const,
  color: C.dark,
  fontFamily: F.body,
};

const goalStepBtn = {
  width: 44,
  height: 44,
  borderRadius: 22,
  backgroundColor: C.beige,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

const goalStepLabel = {
  fontSize: 20,
  fontWeight: '700' as const,
  color: C.dark,
};

const goalValueBox = {
  flex: 1,
  paddingVertical: 12,
  borderRadius: 14,
  backgroundColor: C.beige,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

const goalValueText = {
  fontFamily: F.display,
  fontSize: 20,
  fontWeight: '900' as const,
  color: C.dark,
};
