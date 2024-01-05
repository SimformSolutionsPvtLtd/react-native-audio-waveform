import { Dimensions, Platform, type ScaledSize } from 'react-native';

let { width, height }: ScaledSize = Dimensions.get('window');

if (width > height) {
  [width, height] = [height, width];
}

const guidelineBaseWidth: number = 375;
const guidelineBaseHeight: number = 812;

const baseWidth = width / guidelineBaseWidth;
const baseHeight = height / guidelineBaseHeight;

let baseSize = (baseWidth + baseHeight) / 2;

const isTablet: boolean =
  (Platform.OS === 'ios' && Platform.isPad) || baseSize > 1.2;

baseSize = (baseWidth + baseHeight) * (isTablet ? 0.4 : 0.5);

const scale = (size: number): number => Math.ceil(size * baseSize);

interface GlobalMetricsType {
  isAndroid: boolean;
  isIos: boolean;
  isPad: boolean;
  isTV: boolean;
}

const globalMetrics: GlobalMetricsType = {
  isAndroid: Platform.OS === 'android',
  isIos: Platform.OS === 'ios',
  isPad: Platform.OS === 'ios' && Platform.isPad,
  isTV: Platform.isTV,
};

export { globalMetrics, height, scale, width };
