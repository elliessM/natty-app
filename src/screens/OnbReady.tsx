import React, { useMemo } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, F, withAlpha } from '../tokens';
import Ambience from '../shared/Ambience';
import OnboardingProgress from '../shared/OnboardingProgress';
import { btnPrimary, btnPrimaryLabel } from '../shared/Buttons';
import { IconCheck } from '../shared/Icons';
import { useUserStore, computeMacroTargets, GOAL_LABEL, ACTIVITY_LABEL } from '../store/useUserStore';

export default function OnbReady() {
  const insets = useSafeAreaInsets();
  const name = useUserStore((s) => s.name);
  const goal = useUserStore((s) => s.goal);
  const restrictions = useUserStore((s) => s.restrictions);
  const setHasOnboarded = useUserStore((s) => s.setHasOnboarded);

  const weightKg = useUserStore((s) => s.weightKg);
  const heightCm = useUserStore((s) => s.heightCm);
  const age = useUserStore((s) => s.age);
  const sex = useUserStore((s) => s.sex);
  const activityLevel = useUserStore((s) => s.activityLevel);

  const targets = useMemo(
    () => computeMacroTargets({ weightKg, heightCm, age, sex, activityLevel, goal }),
    [weightKg, heightCm, age, sex, activityLevel, goal]
  );

  return (
    <View style={{ flex: 1, backgroundColor: C.green }}>
      <Ambience />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 28, paddingTop: insets.top + 30, paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ alignItems: 'center' }}>
          <View
            style={{
              width: 88,
              height: 88,
              borderRadius: 26,
              backgroundColor: C.orange,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: C.orange,
              shadowOffset: { width: 0, height: 16 },
              shadowOpacity: 0.45,
              shadowRadius: 50,
              elevation: 10,
            }}
          >
            <IconCheck color={C.beige} size={44} />
          </View>
        </View>

        <View style={{ alignItems: 'center', marginTop: 20 }}>
          <Text style={{ fontSize: 12, letterSpacing: 3, fontWeight: '700', color: C.lime }}>TOUT EST PRÊT</Text>
          <Text
            style={{
              fontFamily: F.display,
              fontWeight: '900',
              fontSize: 28,
              color: C.beige,
              marginTop: 10,
              textAlign: 'center',
              lineHeight: 32,
            }}
          >
            {name}, voici ton plan{'\n'}personnalisé
          </Text>
        </View>

        {/* Hero macro */}
        <View
          style={{
            marginTop: 22,
            backgroundColor: withAlpha(C.beige, 0.08),
            borderWidth: 1,
            borderColor: withAlpha(C.beige, 0.18),
            borderRadius: 22,
            padding: 18,
            overflow: 'hidden',
          }}
        >
          <View style={{ position: 'absolute', right: -30, top: -30, width: 120, height: 120, borderRadius: 60, backgroundColor: withAlpha(C.lime, 0.12) }} />

          <Text style={{ fontSize: 10, letterSpacing: 3, color: C.lime, fontWeight: '700' }}>OBJECTIF QUOTIDIEN</Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 6 }}>
            <Text style={{ fontFamily: F.display, fontSize: 44, fontWeight: '900', color: C.beige }}>{targets.kcal}</Text>
            <Text style={{ fontSize: 16, color: C.lime, marginLeft: 6 }}>kcal</Text>
          </View>
          <Text style={{ fontSize: 11, color: C.lime, opacity: 0.75, marginTop: 4 }}>
            Calculé à partir de ta morphologie et de ton activité ({ACTIVITY_LABEL[activityLevel]})
          </Text>

          <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
            <Macro color={C.orange} label="Prot" value={`${targets.prot}g`} />
            <Macro color={C.lime} label="Gluc" value={`${targets.glu}g`} />
            <Macro color={C.beige} label="Lip" value={`${targets.lip}g`} />
          </View>
        </View>

        {/* Plan résumé */}
        <View
          style={{
            marginTop: 14,
            backgroundColor: withAlpha(C.beige, 0.08),
            borderWidth: 1,
            borderColor: withAlpha(C.beige, 0.12),
            borderRadius: 18,
            paddingVertical: 6,
            paddingHorizontal: 16,
          }}
        >
          <Row label="Objectif" value={GOAL_LABEL[goal]} />
          <Row
            label="Restrictions"
            value={restrictions.length ? `${restrictions.length} sélectionnée${restrictions.length > 1 ? 's' : ''}` : 'Aucune'}
          />
          <Row label="Niveau d'activité" value={ACTIVITY_LABEL[activityLevel]} last />
        </View>

        <View style={{ flex: 1, minHeight: 20 }} />

        <View style={{ marginTop: 24, marginBottom: 14 }}>
          <OnboardingProgress step={7} total={7} tone="dark" />
        </View>
        <Pressable onPress={() => setHasOnboarded(true)} style={btnPrimary()}>
          <Text style={btnPrimaryLabel}>Ouvrir mon tableau de bord →</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function Row({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: last ? 0 : 1,
        borderColor: withAlpha(C.beige, 0.1),
      }}
    >
      <Text style={{ fontSize: 12, color: C.beige, opacity: 0.7 }}>{label}</Text>
      <Text style={{ fontWeight: '700', fontSize: 13, color: C.beige }}>{value}</Text>
    </View>
  );
}

function Macro({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <View style={{ flex: 1, padding: 10, borderRadius: 12, backgroundColor: withAlpha(C.beige, 0.08) }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
        <Text style={{ fontSize: 9, fontWeight: '700', color: C.lime, letterSpacing: 1 }}>{label.toUpperCase()}</Text>
      </View>
      <Text style={{ fontFamily: F.display, fontSize: 18, fontWeight: '900', color: C.beige, marginTop: 4 }}>{value}</Text>
    </View>
  );
}
