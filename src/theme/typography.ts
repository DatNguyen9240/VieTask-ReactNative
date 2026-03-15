import { Platform } from 'react-native';

const fontFamily = Platform.select({
  ios: 'Inter',
  android: 'Inter',
  default: 'Inter',
});

export const typography = {
  h1: { fontSize: 28, fontWeight: '700' as const, lineHeight: 36, fontFamily },
  h2: { fontSize: 22, fontWeight: '600' as const, lineHeight: 28, fontFamily },
  h3: { fontSize: 18, fontWeight: '600' as const, lineHeight: 24, fontFamily },
  body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24, fontFamily },
  bodySmall: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20, fontFamily },
  caption: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18, fontFamily },
  button: { fontSize: 15, fontWeight: '600' as const, lineHeight: 20, fontFamily },
  label: { fontSize: 12, fontWeight: '500' as const, lineHeight: 16, fontFamily, letterSpacing: 0.5, textTransform: 'uppercase' as const },
} as const;
