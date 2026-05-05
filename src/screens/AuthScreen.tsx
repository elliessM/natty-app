import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, F } from '../tokens';
import Ambience from '../shared/Ambience';
import { useAuthStore } from '../store/useAuthStore';
import { hapticLight, hapticSelection, hapticWarning } from '../shared/haptics';

type Mode = 'signin' | 'signup';

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const signIn = useAuthStore((s) => s.signInWithPassword);
  const signUp = useAuthStore((s) => s.signUpWithPassword);
  const signingIn = useAuthStore((s) => s.signingIn);
  const error = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);

  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const canSubmit =
    email.trim().length > 3 &&
    password.length >= 6 &&
    (mode === 'signin' || name.trim().length > 0);

  const submit = async () => {
    if (!canSubmit || signingIn) return;
    hapticLight();
    const ok = mode === 'signin' ? await signIn(email, password) : await signUp(email, password, name);
    if (!ok) hapticWarning();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: C.green }}
    >
      <Ambience />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 28,
          paddingTop: insets.top + 40,
          paddingBottom: insets.bottom + 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Brand mark */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 40 }}>
          <View
            style={{
              width: 60,
              height: 60,
              borderRadius: 18,
              backgroundColor: C.lime,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontFamily: F.display, fontWeight: '900', fontSize: 40, color: C.green, lineHeight: 42, marginTop: -3 }}>N</Text>
          </View>
          <Text style={{ fontSize: 12, letterSpacing: 4, fontWeight: '700', color: C.lime }}>NATTY · v 2.1</Text>
        </View>

        <Text style={{ fontSize: 12, letterSpacing: 3, color: C.lime, fontWeight: '700' }}>
          {mode === 'signin' ? 'BON RETOUR' : 'BIENVENUE'}
        </Text>
        <Text
          style={{
            fontFamily: F.display,
            fontWeight: '900',
            fontSize: 32,
            color: C.beige,
            marginTop: 8,
            lineHeight: 34,
          }}
        >
          {mode === 'signin' ? 'Connecte-toi' : 'Crée ton compte'}
        </Text>
        <Text style={{ fontSize: 13, color: C.beige, opacity: 0.7, marginTop: 8, lineHeight: 19 }}>
          {mode === 'signin'
            ? 'Retrouve ton journal, tes réservations et tes objectifs partout.'
            : 'Sync cloud pour ne jamais perdre tes scans, ton historique et ton profil.'}
        </Text>

        <View style={{ marginTop: 28, gap: 12 }}>
          {mode === 'signup' ? (
            <Field
              label="Prénom"
              value={name}
              onChangeText={(v) => {
                setName(v);
                if (error) clearError();
              }}
              placeholder="Comment on t'appelle ?"
              autoCapitalize="words"
              maxLength={24}
            />
          ) : null}
          <Field
            label="Email"
            value={email}
            onChangeText={(v) => {
              setEmail(v);
              if (error) clearError();
            }}
            placeholder="toi@exemple.fr"
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <Field
            label="Mot de passe"
            value={password}
            onChangeText={(v) => {
              setPassword(v);
              if (error) clearError();
            }}
            placeholder="6 caractères minimum"
            secureTextEntry
            autoCapitalize="none"
          />
        </View>

        {error ? (
          <View style={{ marginTop: 16, padding: 12, borderRadius: 14, backgroundColor: 'rgba(237,126,0,0.15)', borderWidth: 1, borderColor: C.orange }}>
            <Text style={{ color: C.orange, fontSize: 12, fontWeight: '600', lineHeight: 16 }}>{error}</Text>
          </View>
        ) : null}

        <Pressable
          onPress={submit}
          disabled={!canSubmit || signingIn}
          style={{
            marginTop: 24,
            height: 56,
            borderRadius: 28,
            backgroundColor: canSubmit ? C.orange : 'rgba(237,126,0,0.35)',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: 10,
            shadowColor: C.orange,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: canSubmit ? 0.35 : 0,
            shadowRadius: 20,
            elevation: canSubmit ? 6 : 0,
          }}
        >
          {signingIn ? (
            <ActivityIndicator color={C.beige} />
          ) : (
            <Text style={{ color: C.beige, fontWeight: '700', fontSize: 15 }}>
              {mode === 'signin' ? 'Se connecter' : 'Créer mon compte'}
            </Text>
          )}
        </Pressable>

        <Pressable
          onPress={() => {
            hapticSelection();
            clearError();
            setMode(mode === 'signin' ? 'signup' : 'signin');
          }}
          style={{ marginTop: 18, alignItems: 'center', padding: 8 }}
        >
          <Text style={{ color: C.lime, fontSize: 13, fontWeight: '600' }}>
            {mode === 'signin' ? "Pas encore de compte ? Créer un compte" : 'Déjà un compte ? Se connecter'}
          </Text>
        </Pressable>

        <View style={{ flex: 1, minHeight: 30 }} />

        <Text style={{ textAlign: 'center', fontSize: 10, color: C.beige, opacity: 0.5, lineHeight: 14 }}>
          En continuant, tu acceptes les conditions d'utilisation et la politique de confidentialité.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  maxLength,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address';
  autoCapitalize?: 'none' | 'words' | 'sentences';
  maxLength?: number;
}) {
  return (
    <View>
      <Text style={{ fontSize: 10, letterSpacing: 2, color: C.lime, fontWeight: '700', marginBottom: 6 }}>
        {label.toUpperCase()}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="rgba(252,233,218,0.35)"
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        maxLength={maxLength}
        returnKeyType="done"
        style={{
          backgroundColor: 'rgba(252,233,218,0.08)',
          borderWidth: 1,
          borderColor: 'rgba(252,233,218,0.18)',
          borderRadius: 14,
          paddingHorizontal: 16,
          paddingVertical: 14,
          color: C.beige,
          fontFamily: F.body,
          fontSize: 15,
          fontWeight: '500',
        }}
      />
    </View>
  );
}
