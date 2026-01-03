// Fallback for using Ionicons on Android and web.

import { Ionicons } from '@expo/vector-icons';
import { SymbolViewProps, SymbolWeight } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Partial<Record<SymbolViewProps['name'], ComponentProps<typeof Ionicons>['name']>>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Ionicons mappings here.
 * - see Ionicons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  // Housing
  'house.fill': 'home',
  'lightbulb.fill': 'bulb',
  'drop.fill': 'water',
  'wifi': 'wifi',

  // Food & Drink
  'cart.fill': 'cart',
  'fork.knife': 'restaurant',
  'cup.and.saucer.fill': 'cafe',

  // Transport
  'car.fill': 'car',
  'bus.fill': 'bus',

  // Health & Wellness
  'stethoscope': 'medical',
  'pills.fill': 'medkit',
  'dumbbell.fill': 'barbell',

  // Personal Care
  'scissors': 'cut',
  'bag.fill': 'bag',

  // Entertainment
  'gamecontroller.fill': 'game-controller',

  // Finance
  'banknote.fill': 'cash-outline',
  'creditcard.fill': 'card',
  'briefcase.fill': 'briefcase',
  'leaf.fill': 'leaf',

  // Others
  'gift.fill': 'gift',
  'heart.fill': 'heart',
  'graduationcap.fill': 'school',

  // System Icons
  'trash': 'trash',
  'plus.circle.fill': 'add-circle',
  'xmark.circle.fill': 'close-circle',
  'checkmark.circle.fill': 'checkmark-circle',
  'chevron.down': 'chevron-down',
  'chevron.right': 'chevron-forward',
  'chevron.left': 'chevron-back',
  'checkmark': 'checkmark',
  'calendar': 'calendar',
  'ellipsis.circle.fill': 'ellipsis-horizontal-circle',
  'arrow.down.circle.fill': 'arrow-down-circle',
  'arrow.up.circle.fill': 'arrow-up-circle',
} as any;

/**
 * An icon component that uses native SF Symbols on iOS, and Ionicons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Ionicons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <Ionicons color={color} size={size} name={MAPPING[name] || 'help-circle-outline'} style={style} />;
}
