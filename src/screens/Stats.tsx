import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { C, F, softShadow, cardShadow } from '../tokens';
import { IconBack } from '../shared/Icons';
import BarChart7Days from '../shared/charts/BarChart7Days';
import WeightLineChart from '../shared/charts/WeightLineChart';
import FadeInView from '../shared/FadeInView';
import { useStats, type StatsRange } from '../hooks/useStats';
import { useUserStore, computeMacroTargets } from '../store/useUserStore';
import { hapticSelection } from '../shared/haptics';
import type { HomeStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'Stats'>;

export default function Stats() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const [range, setRange] = useState<StatsRange>(7);

  const stats = useStats(range);

  const weightHistory = useUserStore((s) => s.weightHistory);
  const targetWeightKg = useUserStore((s) => s.targetWeightKg);
  const weightKg = useUserStore((s) => s.weightKg);
  const goal = useUserStore((s) => s.goal);
  const heightCm = useUserStore((s) => s.heightCm);
  const age = useUserStore((s) => s.age);
  const sex = useUserStore((s) => s.sex);
  const activityLevel = useUserStore((s) => s.activityLevel);

  const targets = useMemo(
    () => computeMacroTargets({ weightKg, heightCm, age, sex, activityLevel, goal }),
    [weightKg, heightCm, age, sex, activityLevel, goal]
  );

  const weightDelta = weightHistory.length >= 2 ? weightHistory[weightHistory.length - 1].kg - weightHistory[0].kg : 0;

  const adherence = Math.round((stats.daysLogged / range) * 100);

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
          <Text style={{ fontSize: 11, letterSpacing: 3, color: C.green, fontWeight: '700' }}>MES STATS</Text>
          <Text style={{ fontFamily: F.display, fontSize: 24, fontWeight: '900', color: C.dark, marginTop: 2 }}>
            {range === 7 ? '7 derniers jours' : '30 derniers jours'}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 30 }} showsVerticalScrollIndicator={false}>
        {/* Toggle 7/30 */}
        <View style={{ flexDirection: 'row', marginHorizontal: 16, gap: 8 }}>
          {([7, 30] as const).map((r) => {
            const active = range === r;
            return (
              <Pressable
                key={r}
                onPress={() => {
                  hapticSelection();
                  setRange(r);
                }}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 999,
                  backgroundColor: active ? C.green : C.white,
                  borderWidth: active ? 0 : 1,
                  borderColor: C.beige2,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: active ? C.beige : C.dark, fontWeight: '700', fontSize: 13 }}>
                  {r} jours
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Hero stats */}
        <FadeInView delay={50}>
        <LinearGradient
          colors={[C.green, C.greenAlt]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ marginHorizontal: 16, marginTop: 16, padding: 18, borderRadius: 24, overflow: 'hidden' }}
        >
          <View style={{ position: 'absolute', right: -40, top: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(237,126,0,0.18)' }} />
          <View style={{ position: 'absolute', left: -30, bottom: -50, width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(190,211,92,0.12)' }} />

          <Text style={{ fontSize: 10, letterSpacing: 3, color: C.lime, fontWeight: '700' }}>MOYENNE QUOTIDIENNE</Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 6, gap: 8 }}>
            <Text style={{ fontFamily: F.display, fontSize: 44, fontWeight: '900', color: C.beige }}>
              {stats.averages.kcal}
            </Text>
            <Text style={{ fontSize: 16, color: C.lime, opacity: 0.8 }}>/ {targets.kcal} kcal</Text>
          </View>
          <Text style={{ fontSize: 12, color: C.lime, opacity: 0.85, marginTop: 4 }}>
            {stats.daysLogged}/{range} jours loggés · {adherence}% d'assiduité
          </Text>

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
            <MacroPill label="Prot" value={`${stats.averages.prot}g`} target={`${targets.prot}g`} color={C.lime} />
            <MacroPill label="Gluc" value={`${stats.averages.glu}g`} target={`${targets.glu}g`} color={C.orange} />
            <MacroPill label="Lip" value={`${stats.averages.lip}g`} target={`${targets.lip}g`} color={C.beige} />
          </View>
        </LinearGradient>
        </FadeInView>

        {/* Bar chart kcal */}
        <FadeInView delay={150}>
        <View style={[cardStyle, { marginTop: 16 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Text style={sectionTitle}>Calories par jour</Text>
            {stats.bestDay ? (
              <Text style={{ fontSize: 10, color: C.darkSoft, fontWeight: '600' }}>
                Meilleur : {stats.bestDay.kcal} kcal
              </Text>
            ) : null}
          </View>
          <View style={{ marginTop: 14 }}>
            <BarChart7Days data={stats.bars} goal={targets.kcal} height={range === 7 ? 180 : 160} showValues={range === 7} showLabels />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 }}>
            <Legend color={C.orange} label="Objectif atteint" />
            <Legend color={C.lime} label="Proche" />
            <Legend color="#d8d2c8" label="En-dessous" />
          </View>
        </View>
        </FadeInView>

        {/* Weight line */}
        <FadeInView delay={250}>
        {weightHistory.length >= 2 ? (
          <View style={[cardStyle, { marginTop: 16 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <Text style={sectionTitle}>Évolution du poids</Text>
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
            </View>
            <View style={{ marginTop: 8 }}>
              <WeightLineChart data={weightHistory} target={targetWeightKg} height={170} />
            </View>
            <Text style={{ fontSize: 11, color: C.darkSoft, marginTop: 6 }}>
              {weightHistory.length} mesures sur {weightHistory.length > 1 ? Math.round((Date.parse(weightHistory[weightHistory.length - 1].date) - Date.parse(weightHistory[0].date)) / 86400000) : 0} jours
            </Text>
          </View>
        ) : (
          <View style={[cardStyle, { marginTop: 16 }]}>
            <Text style={sectionTitle}>Évolution du poids</Text>
            <Text style={{ fontSize: 12, color: C.darkSoft, marginTop: 8, lineHeight: 18 }}>
              Ajoute ton poids régulièrement (Profil → Mesures) pour voir ta courbe ici.
            </Text>
          </View>
        )}
        </FadeInView>

        {/* Top foods */}
        <FadeInView delay={350}>
        {stats.topFoods.length > 0 ? (
          <View style={[cardStyle, { marginTop: 16 }]}>
            <Text style={sectionTitle}>Tes plats de la semaine</Text>
            <View style={{ marginTop: 10, gap: 8 }}>
              {stats.topFoods.map((f, i) => (
                <View
                  key={i}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    paddingVertical: 8,
                    paddingHorizontal: 10,
                    backgroundColor: C.beige,
                    borderRadius: 12,
                  }}
                >
                  <Text style={{ fontFamily: F.display, fontWeight: '900', fontSize: 16, color: C.darkSoft, width: 22 }}>
                    {i + 1}
                  </Text>
                  <Text style={{ fontSize: 22 }}>{f.emoji}</Text>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: C.dark }} numberOfLines={1}>
                      {f.food}
                    </Text>
                    <Text style={{ fontSize: 11, color: C.darkSoft, marginTop: 1 }}>
                      {f.count}× · {Math.round(f.kcal / f.count)} kcal moy.
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ) : null}
        </FadeInView>

        {/* Insight card */}
        <FadeInView delay={450}>
        <View style={[cardStyle, { marginTop: 16, backgroundColor: 'rgba(190,211,92,0.18)' }]}>
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: C.lime, fontWeight: '700', fontFamily: F.display }}>N</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: C.green, letterSpacing: 1 }}>COACH NATTY</Text>
              <Text style={{ fontSize: 12, color: C.dark, marginTop: 4, lineHeight: 18 }}>
                {coachInsight(stats, targets, range, weightDelta)}
              </Text>
            </View>
          </View>
        </View>
        </FadeInView>
      </ScrollView>
    </View>
  );
}

function coachInsight(
  stats: ReturnType<typeof useStats>,
  targets: { kcal: number; prot: number },
  range: number,
  weightDelta: number
) {
  if (stats.daysLogged === 0) return `Commence par scanner ou ajouter quelques repas pour voir tes stats apparaître.`;
  const adh = stats.daysLogged / range;
  const protRatio = stats.averages.prot / targets.prot;

  if (adh >= 0.85 && protRatio >= 0.9) {
    return `Excellente régularité (${stats.daysLogged}/${range} jours) et protéines au top (${stats.averages.prot}g/j en moyenne). Continue comme ça !`;
  }
  if (protRatio < 0.75) {
    const missing = Math.round(targets.prot - stats.averages.prot);
    return `Tu manques de ${missing}g de protéines en moyenne. Ajoute un Protein Shake ou un Chicken Bowl à ta journée.`;
  }
  if (adh < 0.5) {
    return `Tu as loggé seulement ${stats.daysLogged} jour${stats.daysLogged > 1 ? 's' : ''} sur ${range}. Essaie d'enregistrer chaque repas pour des stats fiables.`;
  }
  if (weightDelta < -0.5 && Date.now()) {
    return `Tu as perdu ${Math.abs(weightDelta).toFixed(1)} kg sur la période. Beau progrès — garde le cap.`;
  }
  return `${stats.daysLogged} jours suivis sur ${range}, moyenne de ${stats.averages.kcal} kcal. Tu es dans le bon rythme.`;
}

function MacroPill({ label, value, target, color }: { label: string; value: string; target: string; color: string }) {
  return (
    <View style={{ flex: 1, padding: 10, borderRadius: 12, backgroundColor: 'rgba(252,233,218,0.1)' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
        <Text style={{ fontSize: 9, fontWeight: '700', color: C.lime, letterSpacing: 1 }}>{label.toUpperCase()}</Text>
      </View>
      <Text style={{ fontFamily: F.display, fontSize: 18, fontWeight: '900', color: C.beige, marginTop: 4 }}>
        {value}
      </Text>
      <Text style={{ fontSize: 9, color: C.lime, opacity: 0.7 }}>cible {target}</Text>
    </View>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
      <Text style={{ fontSize: 10, color: C.darkSoft, fontWeight: '600' }}>{label}</Text>
    </View>
  );
}

const cardStyle = {
  marginHorizontal: 16,
  padding: 16,
  backgroundColor: C.white,
  borderRadius: 20,
  ...cardShadow,
};

const sectionTitle = {
  fontSize: 13,
  fontWeight: '700' as const,
  color: C.dark,
};
