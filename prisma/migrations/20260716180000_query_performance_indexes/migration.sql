-- Índices para consultas frecuentes (soft-delete, suscripciones, planes, catálogo)

-- User
CREATE INDEX `User_deleted_at_idx` ON `User`(`deleted_at`);

-- Offer
CREATE INDEX `Offer_deleted_at_idx` ON `Offer`(`deleted_at`);
CREATE INDEX `Offer_app_id_deleted_at_idx` ON `Offer`(`app_id`, `deleted_at`);

-- OfferModule / PlanOffer
CREATE INDEX `OfferModule_module_id_idx` ON `OfferModule`(`module_id`);
CREATE INDEX `PlanOffer_offer_id_idx` ON `PlanOffer`(`offer_id`);

-- Module
CREATE INDEX `Module_deleted_at_idx` ON `Module`(`deleted_at`);
CREATE INDEX `Module_deleted_at_name_idx` ON `Module`(`deleted_at`, `name`);

-- Section
CREATE INDEX `Section_module_id_deleted_at_idx` ON `Section`(`module_id`, `deleted_at`);
CREATE INDEX `Section_module_id_key_idx` ON `Section`(`module_id`, `key`);

-- Apps
CREATE INDEX `Apps_deleted_at_idx` ON `Apps`(`deleted_at`);
CREATE INDEX `Apps_deleted_at_created_at_idx` ON `Apps`(`deleted_at`, `created_at`);
CREATE INDEX `Apps_kind_deleted_at_idx` ON `Apps`(`kind`, `deleted_at`);
CREATE INDEX `Apps_entitlement_secret_idx` ON `Apps`(`entitlement_secret`);

-- Plan
CREATE INDEX `Plan_deleted_at_idx` ON `Plan`(`deleted_at`);
CREATE INDEX `Plan_deleted_at_sort_order_idx` ON `Plan`(`deleted_at`, `sort_order`);

-- PlanPrice: un precio por período y plan
DELETE pp1 FROM `PlanPrice` pp1
INNER JOIN `PlanPrice` pp2
  ON pp1.`plan_id` = pp2.`plan_id`
  AND pp1.`period` = pp2.`period`
  AND pp1.`id` > pp2.`id`;

CREATE UNIQUE INDEX `PlanPrice_plan_id_period_key` ON `PlanPrice`(`plan_id`, `period`);

-- Subscription (compuestos; FK ya indexa app_hash y plan_price_id)
CREATE INDEX `Subscription_app_hash_status_idx` ON `Subscription`(`app_hash`, `status`);
CREATE INDEX `Subscription_status_plan_price_id_idx` ON `Subscription`(`status`, `plan_price_id`);

-- Event: timeline por app
CREATE INDEX `Event_app_id_created_at_idx` ON `Event`(`app_id`, `created_at`);
