import React from 'react';
import Svg, { Circle, Ellipse, G, Path, Rect, Text } from 'react-native-svg';
import { taskTheme } from '../../../core/theme/taskTheme';

const MessyTalkIllustration = () => (
    <Svg width="100%" height="100%" viewBox="0 0 335 294" fill="none">
        <Circle cx={168} cy={143} r={116} fill="#E9EDFF" />
        <Ellipse cx={168} cy={253} rx={91} ry={10} fill="#D9DFF8" />
        <G>
            <Rect x={37} y={88} width={142} height={73} rx={24} fill="#FFFFFF" />
            <Path d="M66 158 L53 177 L83 160" fill="#FFFFFF" />
            <Rect x={54} y={108} width={65} height={7} rx={3.5} fill="#C5CCDE" />
            <Rect x={54} y={123} width={104} height={7} rx={3.5} fill="#D9DEEA" />
            <Rect x={54} y={138} width={79} height={7} rx={3.5} fill="#D9DEEA" />
        </G>
        <G>
            <Rect x={155} y={58} width={143} height={79} rx={25} fill={taskTheme.colors.onboardingAccent} />
            <Path d="M263 132 L283 148 L282 131" fill={taskTheme.colors.onboardingAccent} />
            <Text x={177} y={91} fill="#FFFFFF" fontSize={15} fontWeight="700">
                Umm... so
            </Text>
            <G fill="#FFFFFF">
                <Circle cx={185} cy={111} r={3.4} />
                <Circle cx={199} cy={111} r={3.4} />
                <Circle cx={213} cy={111} r={3.4} />
            </G>
        </G>
        <G>
            <Circle cx={165} cy={187} r={40} fill="#FFFFFF" />
            <Circle cx={165} cy={187} r={30} fill="#EFF1F8" />
            <Path
                d="M151 187 C155 176 160 198 165 187 C170 176 175 198 179 187"
                stroke={taskTheme.colors.onboardingAccent}
                strokeWidth={4}
                strokeLinecap="round"
            />
            <Circle cx={165} cy={187} r={40} stroke="#DCE2FF" strokeWidth={2} />
        </G>
        <Circle cx={64} cy={64} r={7} fill="#FFB978" />
        <Circle cx={270} cy={190} r={8} fill="#AEBBFF" />
        <Path d="M86 56 L92 45 L98 56 L109 62 L98 68 L92 80 L86 68 L75 62 Z" fill="#FFCA8A" />
        <Path d="M241 56 L245 48 L249 56 L257 60 L249 64 L245 72 L241 64 L233 60 Z" fill="#B4C0FF" />
    </Svg>
);

export default MessyTalkIllustration;
