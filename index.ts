import 'react-native-gesture-handler';
import { Platform } from 'react-native';
import { registerRootComponent } from 'expo';
import App from './App';

// Sur web, expo-notifications peut afficher un warning bruyant — on filtre.
if (Platform.OS === 'web' && typeof console !== 'undefined') {
  const origWarn = console.warn;
  console.warn = (...args) => {
    const msg = args[0];
    if (typeof msg === 'string' && /notifications|pedometer/i.test(msg)) return;
    origWarn(...args);
  };
}

registerRootComponent(App);
