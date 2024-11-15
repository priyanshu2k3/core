// eslint-disable-next-line unused-imports/no-unused-imports, no-unused-vars
import React from "react";

// eslint-disable-next-line import/no-unresolved
import { NativeAppDiv } from "@wrappid/native";

import { sanitizeComponentProps } from "../../utils/componentUtil";

export default function CoreAppDiv(props) {
  props = sanitizeComponentProps(CoreAppDiv, props);
  return <NativeAppDiv {...props} />;
}

CoreAppDiv.validProps = [];
CoreAppDiv.invalidProps = [];