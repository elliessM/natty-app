// Fake iOS home indicator from the prototype — now a no-op.
// The real one is drawn by iOS on top of the app.
export default function HomeIndicator(_: { dark?: boolean }) {
  return null;
}
