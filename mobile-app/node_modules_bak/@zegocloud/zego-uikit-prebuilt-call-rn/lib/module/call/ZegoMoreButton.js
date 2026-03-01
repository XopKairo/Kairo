import React from "react";
import { View, TouchableOpacity, Image } from "react-native";
export default function ZegoMoreButton(props) {
  const {
    onPress
  } = props;
  return /*#__PURE__*/React.createElement(View, null, /*#__PURE__*/React.createElement(TouchableOpacity, {
    onPress: onPress
  }, /*#__PURE__*/React.createElement(Image, {
    source: require('./resources/white_button_more.png')
  })));
}
//# sourceMappingURL=ZegoMoreButton.js.map