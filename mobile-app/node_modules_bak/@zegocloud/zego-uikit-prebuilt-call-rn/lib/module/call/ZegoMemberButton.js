import React from "react";
import { View, Image, TouchableOpacity, StyleSheet } from "react-native";
export default function ZegoMemberButton(props) {
  const {
    onPressed
  } = props;
  return /*#__PURE__*/React.createElement(View, null, /*#__PURE__*/React.createElement(TouchableOpacity, {
    onPress: onPressed
  }, /*#__PURE__*/React.createElement(Image, {
    source: require('./resources/white_button_members.png')
  })));
}
//# sourceMappingURL=ZegoMemberButton.js.map