import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// ─── Configuration globale ─────────────────────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export type NotifPrefs = {
  hydration: boolean;
  meals: boolean;
  weighIn: boolean;
  reservations: boolean;
};

export type NotifSchedule = {
  prefs: NotifPrefs;
  weighInDay: number; // 1=Lun..7=Dim
  weighInHour: number;
};

const TAG_HYDRATION = 'natty.hydration';
const TAG_MEAL = 'natty.meal';
const TAG_WEIGHIN = 'natty.weighin';
const TAG_RESERVATION = 'natty.reservation';

export async function ensurePermission(): Promise<boolean> {
  const status = await Notifications.getPermissionsAsync();
  if (status.granted) return true;
  if (!status.canAskAgain) return false;
  const r = await Notifications.requestPermissionsAsync();
  return r.granted;
}

async function cancelByTag(tag: string) {
  const all = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    all
      .filter((n) => (n.identifier ?? '').startsWith(tag))
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier))
  );
}

export async function cancelAll() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// ─── Daily reminders ────────────────────────────────────────────────
async function scheduleDaily(
  identifier: string,
  hour: number,
  minute: number,
  title: string,
  body: string
) {
  await Notifications.scheduleNotificationAsync({
    identifier,
    content: { title, body, sound: 'default' },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    } as any,
  });
}

const HYDRATION_SLOTS = [
  { h: 11, m: 0, body: 'Pause eau ? +250 mL pour rester sur ton objectif.' },
  { h: 14, m: 30, body: 'Petit verre d\'eau pour passer le cap de l\'aprèm.' },
  { h: 17, m: 30, body: 'Encore un dernier shot d\'eau avant la séance ?' },
];

const MEAL_SLOTS = [
  { h: 9, m: 0, title: '🍳 Petit-déjeuner', body: "Tu as déjà loggé ton petit-déj ?" },
  { h: 13, m: 30, title: '🍽️ Déjeuner', body: 'Pense à enregistrer ton repas du midi.' },
  { h: 21, m: 0, title: '🌙 Dîner', body: "Dernier rappel : logge ton dîner avant d'aller te coucher." },
];

// iOS weekly weekday : 1=dim ... 7=sam.
// Notre store : 1=lun ... 7=dim. Mapping :
function isoToIosWeekday(iso: number): number {
  // 1(lun)→2, 2(mar)→3, ..., 6(sam)→7, 7(dim)→1
  return iso === 7 ? 1 : iso + 1;
}

export async function scheduleDailyReminders(schedule: NotifSchedule) {
  const { prefs } = schedule;
  // On nettoie d'abord ce qui pourrait subsister
  await cancelByTag(TAG_HYDRATION);
  await cancelByTag(TAG_MEAL);
  await cancelByTag(TAG_WEIGHIN);

  if (prefs.hydration) {
    for (let i = 0; i < HYDRATION_SLOTS.length; i++) {
      const s = HYDRATION_SLOTS[i];
      await scheduleDaily(`${TAG_HYDRATION}.${i}`, s.h, s.m, '💧 Hydratation', s.body);
    }
  }

  if (prefs.meals) {
    for (let i = 0; i < MEAL_SLOTS.length; i++) {
      const s = MEAL_SLOTS[i];
      await scheduleDaily(`${TAG_MEAL}.${i}`, s.h, s.m, s.title, s.body);
    }
  }

  if (prefs.weighIn) {
    await Notifications.scheduleNotificationAsync({
      identifier: `${TAG_WEIGHIN}.weekly`,
      content: {
        title: '⚖️ Pèse-toi ce matin',
        body: 'Une mesure rapide pour suivre ta progression hebdo.',
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: isoToIosWeekday(schedule.weighInDay),
        hour: schedule.weighInHour,
        minute: 0,
      } as any,
    });
  }
}

// ─── Reservations ───────────────────────────────────────────────────
export async function scheduleReservationNotif(reservationId: string, pickupTimestamp: number, fridgeName: string) {
  // Annulation préalable au cas où on re-schedule
  await cancelReservationNotif(reservationId);

  const now = Date.now();
  const fifteenMinBefore = pickupTimestamp - 15 * 60 * 1000;

  if (fifteenMinBefore > now) {
    await Notifications.scheduleNotificationAsync({
      identifier: `${TAG_RESERVATION}.${reservationId}.before`,
      content: {
        title: '🕒 Ton retrait dans 15 min',
        body: `Direction ${fridgeName}.`,
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(fifteenMinBefore),
      } as any,
    });
  }

  if (pickupTimestamp > now) {
    await Notifications.scheduleNotificationAsync({
      identifier: `${TAG_RESERVATION}.${reservationId}.now`,
      content: {
        title: '✅ Ton retrait est dispo',
        body: `Récupère ta commande chez ${fridgeName}.`,
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(pickupTimestamp),
      } as any,
    });
  }
}

export async function cancelReservationNotif(reservationId: string) {
  await Notifications.cancelScheduledNotificationAsync(`${TAG_RESERVATION}.${reservationId}.before`).catch(() => {});
  await Notifications.cancelScheduledNotificationAsync(`${TAG_RESERVATION}.${reservationId}.now`).catch(() => {});
}

// ─── iOS channel (no-op iOS, utile Android) ────────────────────────
export async function ensureChannelAndroid() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('default', {
    name: 'Rappels Natty',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 200, 100, 200],
    lightColor: '#ED7E00',
  });
}
