import { StyleSheet, Text, TextInput, View } from "react-native";

import { DEFAULT_REDIRECT_URI } from "@/auth/config";

export type CredentialValues = {
  clientId: string;
  clientSecret: string;
  vccApiKey: string;
  redirectUri: string;
  scopes: string;
};

export type CredentialFieldsProps = {
  values: CredentialValues;
  onChange: (next: Partial<CredentialValues>) => void;
};

export function CredentialFields({ values, onChange }: CredentialFieldsProps): JSX.Element {
  return (
    <View style={styles.form}>
      <Field
        label="OAuth client id"
        value={values.clientId}
        onChange={(v) => onChange({ clientId: v })}
        placeholder="From the Volvo portal"
      />
      <Field
        label="OAuth client secret"
        value={values.clientSecret}
        onChange={(v) => onChange({ clientSecret: v })}
        placeholder="From the Volvo portal"
        secure
      />
      <Field
        label="VCC API key"
        value={values.vccApiKey}
        onChange={(v) => onChange({ vccApiKey: v })}
        placeholder="VCC-API-Key"
        secure
      />
      <Field
        label="Redirect URI"
        value={values.redirectUri}
        onChange={(v) => onChange({ redirectUri: v })}
        placeholder={DEFAULT_REDIRECT_URI}
      />
      <Field
        label="OAuth scopes (space-separated)"
        value={values.scopes}
        onChange={(v) => onChange({ scopes: v })}
        placeholder="openid conve:vehicle_relation ..."
        multiline
      />
    </View>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  secure,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  secure?: boolean;
  multiline?: boolean;
}): JSX.Element {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#7f868d"
        secureTextEntry={secure}
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
        multiline={multiline}
        numberOfLines={multiline ? 4 : undefined}
        style={[styles.input, multiline && styles.inputMultiline]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: 12 },
  field: { gap: 4 },
  fieldLabel: { color: "#e8eaed", fontSize: 13, fontWeight: "600" },
  input: {
    color: "#e8eaed",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: "monospace",
  },
  inputMultiline: {
    minHeight: 96,
    textAlignVertical: "top",
  },
});
