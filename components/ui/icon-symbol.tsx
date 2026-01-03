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
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code-slash',
  'chevron.right': 'chevron-forward',
  'chevron.down': 'chevron-down',
  'chevron.left': 'chevron-back',
  'checkmark': 'checkmark',
  'plus': 'add',
  'plus.circle': 'add-circle-outline',
  'plus.circle.fill': 'add-circle',
  'trash': 'trash',
  'list.bullet': 'list',
  'xmark.circle.fill': 'close-circle',
  'checkmark.circle.fill': 'checkmark-circle',
  'calendar.badge.exclamationmark': 'calendar',
  'cash.fill': 'cash',
  'cart.fill': 'cart',
  'car.fill': 'car',
  'gamecontroller.fill': 'game-controller',
  'bolt.fill': 'flash',
  'bag.fill': 'bag',
  'heart.fill': 'heart',
  'book.fill': 'book',
  'airplane.fill': 'airplane',
  'fitness.fill': 'fitness',
  'medical.fill': 'medical',
  'restaurant.fill': 'restaurant',
  'cafe.fill': 'cafe',
  'bus.fill': 'bus',
  'train.fill': 'train',
  'bicycle.fill': 'bicycle',
  'gift.fill': 'gift',
  'shirt.fill': 'shirt',
  'paw.fill': 'paw',
  'construct.fill': 'construct',
  'hammer.fill': 'hammer',
  'school.fill': 'school',
  'library.fill': 'library',
  'briefcase.fill': 'briefcase',
  'wallet.fill': 'wallet',
  'card.fill': 'card',
  'pie-chart.fill': 'pie-chart',
  'trending-up.fill': 'trending-up',
  'trending-down.fill': 'trending-down',
  'analytics.fill': 'analytics',
  'bar-chart.fill': 'bar-chart',
  'globe.fill': 'globe',
  'map.fill': 'map',
  'location.fill': 'location',
  'navigate.fill': 'navigate',
  'call.fill': 'call',
  'mail.fill': 'mail',
  'chatbubble.fill': 'chatbubble',
  'notifications.fill': 'notifications',
  'settings.fill': 'settings',
  'person.fill': 'person',
  'people.fill': 'people',
  'star.fill': 'star',
  'sunny.fill': 'sunny',
  'moon.fill': 'moon',
  'cloudy.fill': 'cloudy',
  'rainy.fill': 'rainy',
  'snow.fill': 'snow',
  'flash.fill': 'flash',
  'water.fill': 'water',
  'leaf.fill': 'leaf',
  'flower.fill': 'flower',
  'flame.fill': 'flame',
  'ice-cream.fill': 'ice-cream',
  'pizza.fill': 'pizza',
  'beer.fill': 'beer',
  'wine.fill': 'wine',
  'fast-food.fill': 'fast-food',
  'barbell.fill': 'barbell',
  'basketball.fill': 'basketball',
  'football.fill': 'football',
  'tennisball.fill': 'tennisball',
  'ellipsis.circle.fill': 'ellipsis-horizontal-circle',
  'arrow.down.circle.fill': 'arrow-down-circle',
  'arrow.up.circle.fill': 'arrow-up-circle',
  'creditcard.fill': 'card',
} as IconMapping;

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
