import * as Haptics from 'expo-haptics';

// Thin wrappers — safe to call on any platform, no-op if haptics unavailable.
export const hapticLight = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
export const hapticMedium = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
export const hapticSelection = () => Haptics.selectionAsync().catch(() => {});
export const hapticSuccess = () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
export const hapticWarning = () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
export const hapticError = () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
