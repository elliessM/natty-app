import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, Modal, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { C, F, cardShadow } from '../tokens';
import { hapticSelection, hapticMedium } from './haptics';

// Créneaux pré-définis : 9h → 21h tous les 30 min (en minutes depuis minuit).
const SLOTS: Array<{ h: number; m: number }> = (() => {
  const arr: Array<{ h: number; m: number }> = [];
  for (let h = 9; h <= 21; h++) {
    arr.push({ h, m: 0 });
    if (h < 21) arr.push({ h, m: 30 });
  }
  return arr;
})();

const DAY_OFFSETS = [0, 1, 2, 3, 4, 5, 6];

type Props = {
  visible: boolean;
  onClose: () => void;
  onConfirm: (pickupTimestamp: number) => void;
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
};

function startOfDay(d = new Date()) {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

function slotTimestamp(dayOffset: number, hour: number, minute = 0): number {
  const d = startOfDay();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d.getTime();
}

function formatDateChip(offset: number): string {
  if (offset === 0) return "Aujourd'hui";
  if (offset === 1) return 'Demain';
  const d = startOfDay();
  d.setDate(d.getDate() + offset);
  const days = ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.'];
  return `${days[d.getDay()]} ${d.getDate()}`;
}

function formatHm(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function TimeSlotPickerModal({ visible, onClose, onConfirm, title, subtitle, ctaLabel }: Props) {
  const insets = useSafeAreaInsets();
  const [dayOffset, setDayOffset] = useState(0);
  const [slotKey, setSlotKey] = useState<string | null>(null); // "HH:MM"
  const [customTs, setCustomTs] = useState<number | null>(null);
  const [customPickerVisible, setCustomPickerVisible] = useState(false);

  const availableSlots = useMemo(() => {
    const now = Date.now();
    return SLOTS.map(({ h, m }) => {
      const ts = slotTimestamp(dayOffset, h, m);
      return { h, m, ts, key: `${h}:${m}`, past: ts < now };
    });
  }, [dayOffset]);

  const selectedSlot = slotKey ? availableSlots.find((s) => s.key === slotKey) : null;
  const selectedTs: number | null = customTs ?? selectedSlot?.ts ?? null;
  const canConfirm = selectedTs != null && selectedTs > Date.now();

  const reset = () => {
    setSlotKey(null);
    setCustomTs(null);
    setDayOffset(0);
    setCustomPickerVisible(false);
  };

  const handleConfirm = () => {
    if (!canConfirm || selectedTs == null) return;
    hapticMedium();
    onConfirm(selectedTs);
    reset();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const onCustomChange = (_e: any, date?: Date) => {
    if (Platform.OS === 'android') setCustomPickerVisible(false);
    if (!date) return;
    // On ne permet pas un horaire dans le passé.
    if (date.getTime() < Date.now()) return;
    setCustomTs(date.getTime());
    setSlotKey(null);
    // Aligne la date-chip sur le jour choisi.
    const todayStart = startOfDay();
    const picked = startOfDay(date);
    const diffDays = Math.round((picked.getTime() - todayStart.getTime()) / 86400000);
    if (diffDays >= 0 && diffDays <= 6) setDayOffset(diffDays);
  };

  const initialPickerDate = () => {
    const base = new Date();
    base.setMinutes(Math.ceil(base.getMinutes() / 15) * 15, 0, 0);
    base.setTime(base.getTime() + 60 * 60000); // défaut : +1h arrondi
    return base;
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <Pressable onPress={handleClose} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' }} />

      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: C.white,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          paddingHorizontal: 20,
          paddingTop: 10,
          paddingBottom: insets.bottom + 16,
          ...cardShadow,
        }}
      >
        <View style={{ alignSelf: 'center', width: 44, height: 4, borderRadius: 2, backgroundColor: '#e0e0e0', marginBottom: 14 }} />

        <Text style={{ fontFamily: F.display, fontSize: 22, fontWeight: '900', color: C.dark, lineHeight: 24 }}>
          {title ?? 'Programmer ma commande'}
        </Text>
        {subtitle ? <Text style={{ fontSize: 12, color: C.darkSoft, marginTop: 6, lineHeight: 18 }}>{subtitle}</Text> : null}

        <Text style={sectionLabel}>JOUR</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 2, paddingRight: 12 }} style={{ marginTop: 8 }}>
          {DAY_OFFSETS.map((offset) => {
            const active = dayOffset === offset && customTs == null;
            return (
              <Pressable
                key={offset}
                onPress={() => {
                  hapticSelection();
                  setDayOffset(offset);
                  setSlotKey(null);
                  setCustomTs(null);
                }}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 16,
                  borderRadius: 999,
                  backgroundColor: active ? C.green : C.beige,
                  borderWidth: active ? 0 : 1.5,
                  borderColor: 'rgba(0,65,47,0.15)',
                }}
              >
                <Text style={{ color: active ? C.beige : C.dark, fontSize: 13, fontWeight: active ? '700' : '500' }}>
                  {formatDateChip(offset)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Text style={sectionLabel}>CRÉNEAU</Text>
        <ScrollView
          style={{ marginTop: 8, maxHeight: 220 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingBottom: 4 }}
        >
          {availableSlots.map(({ h, m, key, past }) => {
            const active = slotKey === key && customTs == null && !past;
            return (
              <Pressable
                key={key}
                disabled={past}
                onPress={() => {
                  hapticSelection();
                  setSlotKey(key);
                  setCustomTs(null);
                }}
                style={{
                  width: '23.5%',
                  paddingVertical: 10,
                  borderRadius: 12,
                  backgroundColor: past ? '#f0eae2' : active ? C.orange : C.beige,
                  borderWidth: active ? 0 : 1.5,
                  borderColor: active ? C.orange : 'rgba(0,65,47,0.12)',
                  alignItems: 'center',
                  opacity: past ? 0.35 : 1,
                }}
              >
                <Text
                  style={{
                    fontFamily: F.display,
                    fontSize: 15,
                    fontWeight: '900',
                    color: active ? C.beige : C.dark,
                    lineHeight: 17,
                  }}
                >
                  {String(h).padStart(2, '0')}:{String(m).padStart(2, '0')}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Pill "Personnalisé" */}
        <View style={{ flexDirection: 'row', marginTop: 10 }}>
          <Pressable
            onPress={() => {
              hapticSelection();
              if (!customTs) {
                // pré-remplit avec la proposition par défaut
                setCustomTs(initialPickerDate().getTime());
              }
              setCustomPickerVisible(true);
              setSlotKey(null);
            }}
            style={{
              flex: 1,
              paddingVertical: 12,
              borderRadius: 14,
              backgroundColor: customTs != null ? C.orange : C.beige,
              borderWidth: customTs != null ? 0 : 1.5,
              borderColor: 'rgba(0,65,47,0.12)',
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <Text style={{ fontSize: 16 }}>🕑</Text>
            <Text
              style={{
                fontFamily: F.display,
                fontSize: 16,
                fontWeight: '900',
                color: customTs != null ? C.beige : C.dark,
              }}
            >
              {customTs != null ? `Perso · ${formatHm(customTs)}` : 'Heure personnalisée'}
            </Text>
          </Pressable>
        </View>

        {/* DateTimePicker iOS inline bottom sheet ; Android dialog */}
        {customPickerVisible ? (
          Platform.OS === 'ios' ? (
            <View style={{ marginTop: 10, alignItems: 'center' }}>
              <DateTimePicker
                value={customTs ? new Date(customTs) : initialPickerDate()}
                mode="datetime"
                display="spinner"
                minuteInterval={5}
                minimumDate={new Date()}
                maximumDate={(() => {
                  const d = new Date();
                  d.setDate(d.getDate() + 7);
                  return d;
                })()}
                onChange={onCustomChange}
                locale="fr-FR"
                textColor={C.dark}
                style={{ height: 160 }}
              />
              <Pressable
                onPress={() => setCustomPickerVisible(false)}
                style={{ paddingVertical: 8, paddingHorizontal: 20, borderRadius: 999, backgroundColor: C.beige }}
              >
                <Text style={{ color: C.dark, fontWeight: '700', fontSize: 12 }}>OK</Text>
              </Pressable>
            </View>
          ) : (
            <DateTimePicker
              value={customTs ? new Date(customTs) : initialPickerDate()}
              mode="datetime"
              is24Hour
              minimumDate={new Date()}
              maximumDate={(() => {
                const d = new Date();
                d.setDate(d.getDate() + 7);
                return d;
              })()}
              onChange={onCustomChange}
            />
          )
        ) : null}

        <Pressable
          onPress={handleConfirm}
          disabled={!canConfirm}
          style={{
            marginTop: 18,
            height: 56,
            borderRadius: 28,
            backgroundColor: canConfirm ? C.orange : C.beige3,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: canConfirm ? 1 : 0.5,
            shadowColor: C.orange,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: canConfirm ? 0.3 : 0,
            shadowRadius: 16,
            elevation: canConfirm ? 6 : 0,
          }}
        >
          <Text style={{ color: canConfirm ? C.beige : C.green, fontWeight: '700', fontSize: 15 }}>
            {ctaLabel ?? 'Confirmer la commande'}
          </Text>
        </Pressable>

        <Pressable onPress={handleClose} style={{ marginTop: 10, alignItems: 'center', padding: 10 }}>
          <Text style={{ color: C.darkSoft, fontWeight: '600', fontSize: 13 }}>Annuler</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const sectionLabel = {
  fontSize: 10,
  letterSpacing: 2,
  color: C.green,
  fontWeight: '700' as const,
  marginTop: 18,
};
