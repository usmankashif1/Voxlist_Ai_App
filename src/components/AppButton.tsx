import React from 'react';
import { TouchableOpacity, type TouchableOpacityProps } from 'react-native';

const AppButton = (props: TouchableOpacityProps) => (
    <TouchableOpacity activeOpacity={0.5} {...props} />
);

export default AppButton;
