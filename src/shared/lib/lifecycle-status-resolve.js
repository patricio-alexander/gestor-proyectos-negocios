"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.effectiveLifecycleStatus = effectiveLifecycleStatus;
/** Override por app gana; si no hay, el status global. */
function effectiveLifecycleStatus(globalStatus, overrideStatus) {
    var raw = (overrideStatus !== null && overrideStatus !== void 0 ? overrideStatus : globalStatus);
    if (raw === "development")
        return "maintenance";
    if (raw === "active" ||
        raw === "maintenance" ||
        raw === "developer" ||
        raw === "planned") {
        return raw;
    }
    return "active";
}
