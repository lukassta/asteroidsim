/**
 * @license
 * Cesium - https://github.com/CesiumGS/cesium
 * Version 1.134.0
 *
 * Copyright 2011-2022 Cesium Contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Columbus View (Pat. Pend.)
 *
 * Portions licensed separately.
 * See https://github.com/CesiumGS/cesium/blob/main/LICENSE.md for full licensing details.
 */

import {
  BoxGeometry_default
} from "./chunk-JUOEBO4F.js";
import "./chunk-AR2FUSG6.js";
import "./chunk-64WSG7AT.js";
import "./chunk-S4NZVXU6.js";
import "./chunk-ARYRHDEB.js";
import "./chunk-BU4CGMHO.js";
import "./chunk-TG7N7TPY.js";
import "./chunk-EHFMZFVC.js";
import "./chunk-CF72FAKC.js";
import "./chunk-NP46ZIBY.js";
import "./chunk-3G5XEUPY.js";
import "./chunk-PXDMWXO5.js";
import "./chunk-JJZWDROM.js";
import {
  defined_default
} from "./chunk-5GHCWGC4.js";

// packages/engine/Source/Workers/createBoxGeometry.js
function createBoxGeometry(boxGeometry, offset) {
  if (defined_default(offset)) {
    boxGeometry = BoxGeometry_default.unpack(boxGeometry, offset);
  }
  return BoxGeometry_default.createGeometry(boxGeometry);
}
var createBoxGeometry_default = createBoxGeometry;
export {
  createBoxGeometry_default as default
};
