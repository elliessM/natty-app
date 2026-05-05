// Fake status bar from the prototype — now a no-op.
// The real OS status bar is handled by `expo-status-bar` in App.tsx.
// Kept as a compat shim so individual screens don't all need to be edited.
export default function StatusBar(_: { dark?: boolean; timeStr?: string }) {
  return null;
}
