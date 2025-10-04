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
  EllipseOutlineGeometry_default
} from "./chunk-UHVE7V65.js";
import "./chunk-6J6WGCWP.js";
import "./chunk-AR2FUSG6.js";
import "./chunk-7PLX65MV.js";
import "./chunk-S4NZVXU6.js";
import "./chunk-ARYRHDEB.js";
import "./chunk-BU4CGMHO.js";
import "./chunk-TG7N7TPY.js";
import "./chunk-EHFMZFVC.js";
import {
  Cartesian3_default,
  Ellipsoid_default
} from "./chunk-CF72FAKC.js";
import "./chunk-NP46ZIBY.js";
import "./chunk-3G5XEUPY.js";
import "./chunk-PXDMWXO5.js";
import "./chunk-JJZWDROM.js";
import {
  defined_default
} from "./chunk-5GHCWGC4.js";

// packages/engine/Source/Workers/createEllipseOutlineGeometry.js
function createEllipseOutlineGeometry(ellipseGeometry, offset) {
  if (defined_default(offset)) {
    ellipseGeometry = EllipseOutlineGeometry_default.unpack(ellipseGeometry, offset);
  }
  ellipseGeometry._center = Cartesian3_default.clone(ellipseGeometry._center);
  ellipseGeometry._ellipsoid = Ellipsoid_default.clone(ellipseGeometry._ellipsoid);
  return EllipseOutlineGeometry_default.createGeometry(ellipseGeometry);
}
var createEllipseOutlineGeometry_default = createEllipseOutlineGeometry;
export {
  createEllipseOutlineGeometry_default as default
};
