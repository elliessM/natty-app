import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, Modal, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { C, F, cardShadow } from '../tokens';
import { hapticSelection, hapticMedium } from './haptics';

// Créneaux pré-définis (raccourcis) + option "Personnalisé" qui ouvre le picker.
const SLOTS = [10, 12, 14, 17, 19, 21];

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
  const [slotHour, setSlotHour] = useState<number | null>(null);
  const [customTs, setCustomTs] = useState<number | null>(null);
  const [customPickerVisible, setCustomPickerVisible] = useState(false);

  const availableSlots = useMemo(() => {
    const now = Date.now();
    return SLOTS.map((h) => ({ h, ts: slotTimestamp(dayOffset, h), past: slotTimestamp(dayOffset, h) < now }));
  }, [dayOffset]);

  const selectedTs: number | null = customTs ?? (slotHour != null ? slotTimestamp(dayOffset, slotHour) : null);
  const canConfirm = selectedTs != null && selectedTs > Date.now();

  const reset = () => {
    setSlotHour(null);
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
    setSlotHour(null);
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
          {title ?? 'Réserver ton retrait'}
        </Text>
        {subtitle ? <Text style={{ fontSize: 12, color: C.darkSoft, marginTop: 6, lineHeight: 18 }}>{subtitle}</Text> : null}

        <Text style={sectionLabel}>JOUR</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 2 }} style={{ marginTop: 8 }}>
          {[0, 1, 2, 3].map((offset) => {
            const active = dayOffset === offset && customTs == null;
            return (
              <Pressable
                key={offset}
                onPress={() => {
                  hapticSelection();
                  setDayOffset(offset);
                  setSlotHour(null);
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
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
          {availableSlots.map(({ h, past }) => {
            const active = slotHour === h && customTs == null && !past;
            return (
              <Pressable
                key={h}
                disabled={past}
                onPress={() => {
                  hapticSelection();
                  setSlotHour(h);
                  setCustomTs(null);
                }}
                style={{
                  width: '31%',
                  paddingVertical: 12,
                  borderRadius: 14,
                  backgroundColor: past ? '#f0eae2' : active ? C.orange : C.beige,
                  borderWidth: active ? 0 : 1.5,
                  borderColor: active ? C.orange : 'rgba(0,65,47,0.12)',
                  alignItems: 'center',
                  opacity: past ? 0.4 : 1,
                }}
              >
                <Text
                  style={{
                    fontFamily: F.display,
                    fontSize: 18,
                    fontWeight: '900',
                    color: active ? C.beige : C.dark,
                    lineHeight: 20,
                  }}
                >
                  {String(h).padStart(2, '0')}:00
                </Text>
                <Text style={{ fontSize: 10, color: active ? C.lime : C.darkSoft, marginTop: 2 }}>
                  {past ? 'Passé' : h < 12 ? 'Matin' : h < 17 ? 'Midi' : 'Soir'}
                </Text>
              </Pressable>
            );
          })}

          {/* Pill "Personnalisé" */}
          <Pressable
            onPress={() => {
              hapticSelection();
              if (!customTs) {
                // pré-remplit avec la proposition par défaut
                setCustomTs(initialPickerDate().getTime());
              }
              setCustomPickerVisible(true);
              setSlotHour(null);
            }}
            style={{
              width: '65%',
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
            {ctaLabel ?? 'Confirmer la réservation'}
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
