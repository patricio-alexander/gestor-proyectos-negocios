"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildEntitlementForAppHash = buildEntitlementForAppHash;
var prisma_1 = require("@/src/shared/lib/prisma");
var lifecycle_status_resolve_1 = require("./lifecycle-status-resolve");
function buildEntitlementForAppHash(appHash) {
    return __awaiter(this, void 0, void 0, function () {
        var app, subscription, appModules, appSections, sectionOverrideById, allowedSectionIds, hasExplicitSections, modules, capabilitiesMapped, offers;
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        return __generator(this, function (_k) {
            switch (_k.label) {
                case 0: return [4 /*yield*/, prisma_1.prisma.apps.findFirst({
                        where: { hash: appHash, deleted_at: null },
                        select: { id: true, maintenance: true },
                    })];
                case 1:
                    app = _k.sent();
                    if (!app) {
                        return [2 /*return*/, { maintenance: false, subscribed: false, subscription: null }];
                    }
                    return [4 /*yield*/, prisma_1.prisma.subscription.findFirst({
                            where: { app_hash: appHash },
                            include: {
                                plan_price: {
                                    select: {
                                        period: true,
                                        plan: {
                                            select: {
                                                name: true,
                                                planOffers: {
                                                    select: {
                                                        offer: {
                                                            select: {
                                                                name: true,
                                                                price: true,
                                                                start_at: true,
                                                                expires_at: true,
                                                                offersModules: {
                                                                    select: {
                                                                        modules: {
                                                                            select: { id: true, name: true },
                                                                        },
                                                                    },
                                                                },
                                                            },
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                            orderBy: { id: "desc" },
                        })];
                case 2:
                    subscription = _k.sent();
                    return [4 /*yield*/, prisma_1.prisma.appModule.findMany({
                            where: { app_id: app.id },
                            select: {
                                module_id: true,
                                status: true,
                                module: {
                                    select: {
                                        id: true,
                                        key: true,
                                        name: true,
                                        status: true,
                                        is_maintainer: true,
                                        is_trial: true,
                                        limit_days_trial: true,
                                        start_trial: true,
                                        end_trial: true,
                                        image_url: true,
                                        sections: {
                                            where: { deleted_at: null },
                                            select: {
                                                id: true,
                                                key: true,
                                                name: true,
                                                status: true,
                                                max_records_limit: true,
                                                usage_count: true,
                                                capabilities: {
                                                    select: {
                                                        code: true,
                                                        name: true,
                                                        is_active: true,
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        })];
                case 3:
                    appModules = _k.sent();
                    return [4 /*yield*/, prisma_1.prisma.appSection.findMany({
                            where: { app_id: app.id },
                            select: { section_id: true, status: true },
                        })];
                case 4:
                    appSections = _k.sent();
                    sectionOverrideById = new Map(appSections.map(function (as) { return [as.section_id, as.status]; }));
                    allowedSectionIds = new Set(appSections.map(function (as) { return as.section_id; }));
                    hasExplicitSections = appSections.length > 0;
                    modules = appModules.map(function (am) {
                        var moduleStatus = (0, lifecycle_status_resolve_1.effectiveLifecycleStatus)(am.module.status, am.status);
                        var sections = am.module.sections
                            .filter(function (s) {
                            return !hasExplicitSections || allowedSectionIds.has(s.id);
                        })
                            .map(function (s) { return ({
                            id: s.id,
                            key: s.key,
                            name: s.name,
                            status: (0, lifecycle_status_resolve_1.effectiveLifecycleStatus)(s.status, sectionOverrideById.get(s.id)),
                            max_records_limit: s.max_records_limit,
                            usage_count: s.usage_count,
                            capabilities: s.capabilities,
                        }); });
                        return {
                            id: am.module.id,
                            name: am.module.name,
                            key: am.module.key,
                            status: moduleStatus,
                            is_maintainer: am.module.is_maintainer,
                            image_url: am.module.image_url,
                            is_trial: am.module.is_trial,
                            start_trial: am.module.start_trial,
                            limit_days_trial: am.module.limit_days_trial,
                            end_trial: am.module.end_trial,
                            sections: sections,
                        };
                    });
                    capabilitiesMapped = new Map();
                    modules.forEach(function (mod) {
                        return mod.sections.forEach(function (s) {
                            var _a, _b, _c;
                            if (!capabilitiesMapped.has((_a = s.key) !== null && _a !== void 0 ? _a : "")) {
                                capabilitiesMapped.set((_b = s.key) !== null && _b !== void 0 ? _b : "", []);
                            }
                            var availableCapabilities = s.capabilities.map(function (c) { return [
                                c.code,
                                c.is_active,
                            ]; });
                            capabilitiesMapped
                                .get((_c = s.key) !== null && _c !== void 0 ? _c : "")
                                .push(Object.fromEntries(availableCapabilities));
                        });
                    });
                    offers = ((_a = subscription === null || subscription === void 0 ? void 0 : subscription.plan_price.plan.planOffers) !== null && _a !== void 0 ? _a : []).map(function (po) {
                        var _a, _b;
                        return ({
                            name: po.offer.name,
                            price: (_a = po.offer.price) !== null && _a !== void 0 ? _a : null,
                            start_at: po.offer.start_at.toISOString(),
                            expires_at: po.offer.expires_at.toISOString(),
                            modules: ((_b = po.offer.offersModules) !== null && _b !== void 0 ? _b : []).map(function (om) { return ({
                                id: om.modules.id,
                                name: om.modules.name,
                            }); }),
                        });
                    });
                    return [2 /*return*/, {
                            maintenance: app.maintenance,
                            subscribed: (subscription === null || subscription === void 0 ? void 0 : subscription.status) === "ACTIVE",
                            subscription: {
                                id: (_b = subscription === null || subscription === void 0 ? void 0 : subscription.id) !== null && _b !== void 0 ? _b : 0,
                                plan_name: (_c = subscription === null || subscription === void 0 ? void 0 : subscription.plan_price.plan.name) !== null && _c !== void 0 ? _c : null,
                                period: (_d = subscription === null || subscription === void 0 ? void 0 : subscription.plan_price.period) !== null && _d !== void 0 ? _d : "MONTHLY",
                                status: (_e = subscription === null || subscription === void 0 ? void 0 : subscription.status) !== null && _e !== void 0 ? _e : "NONE",
                                start_at: (_g = (_f = subscription === null || subscription === void 0 ? void 0 : subscription.start_at) === null || _f === void 0 ? void 0 : _f.toISOString()) !== null && _g !== void 0 ? _g : null,
                                expires_at: (_j = (_h = subscription === null || subscription === void 0 ? void 0 : subscription.expires_at) === null || _h === void 0 ? void 0 : _h.toISOString()) !== null && _j !== void 0 ? _j : null,
                                modules: modules,
                                capabilities: Object.fromEntries(capabilitiesMapped),
                                offers: offers,
                            },
                        }];
            }
        });
    });
}
