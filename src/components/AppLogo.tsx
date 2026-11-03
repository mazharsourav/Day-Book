import Svg, { Circle, Path, Rect } from 'react-native-svg';

// The app icon art (Icons/app-icon.svg) without its green tile, so the tilted back sheet stays.
// Copied from the design board's share card. On the Light card the rings take the header colour
// and the front sheet gets a thin edge, so the cream still holds on white.
export function AppLogo({ size, look }: { size: number; look: 'light' | 'dark' }) {
  const light = look === 'light';
  const ring = light ? '#163F31' : '#F4F0E6';
  return (
    <Svg viewBox="170 150 720 720" width={size} height={size}>
      <Rect x={267} y={190} width={600} height={600} rx={80} fill="#9CC9AE" opacity={light ? 0.8 : 0.9} transform="rotate(7 267 190)" />
      <Rect
        x={212}
        y={212}
        width={600}
        height={600}
        rx={80}
        fill="#F4F0E6"
        {...(light ? { stroke: '#163F31', strokeOpacity: 0.28, strokeWidth: 8 } : {})}
      />
      <Path d="M212 292A80 80 0 0 1 292 212H732A80 80 0 0 1 812 292V340H212Z" fill="#163F31" />
      <Circle cx={296} cy={290} r={20} fill="#F4F0E6" />
      <Circle cx={368} cy={290} r={20} fill="#F4F0E6" />
      <Circle cx={440} cy={290} r={20} fill="#F4F0E6" />
      <Circle cx={512} cy={290} r={20} fill="#F4F0E6" />
      <Circle cx={584} cy={290} r={20} fill="#F2B544" />
      <Circle cx={656} cy={290} r={16} fill="none" stroke="#9CC9AE" strokeWidth={8} />
      <Circle cx={728} cy={290} r={16} fill="none" stroke="#9CC9AE" strokeWidth={8} />
      <Rect x={388} y={164} width={32} height={84} rx={16} fill={ring} />
      <Rect x={604} y={164} width={32} height={84} rx={16} fill={ring} />
      <Rect x={276} y={384} width={104} height={104} rx={32} fill="#1F5C46" />
      <Path d="M307 437L321 451L349 421" fill="none" stroke="#F4F0E6" strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" />
      <Rect x={416} y={418} width={264} height={36} rx={18} fill="#9CC9AE" />
      <Rect x={276} y={524} width={104} height={104} rx={32} fill="#1F5C46" />
      <Path d="M307 577L321 591L349 561" fill="none" stroke="#F4F0E6" strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" />
      <Rect x={416} y={558} width={200} height={36} rx={18} fill="#9CC9AE" />
      <Rect x={283} y={671} width={90} height={90} rx={25} fill="none" stroke="#F2B544" strokeWidth={14} />
      <Rect x={416} y={698} width={232} height={36} rx={18} fill="#1F5C46" />
    </Svg>
  );
}
