"use client";

import {
  Button,
  Modal,
  Spinner,
  useOverlayState,
  DatePicker,
  TimeField,
  DateField,
  Calendar,
  Select,
  ListBox,
  Label,
} from "@heroui/react";
import CreditCard from "@gravity-ui/icons/CreditCard";
import Plus from "@gravity-ui/icons/Plus";
import CircleCheck from "@gravity-ui/icons/CircleCheck";
import Ban from "@gravity-ui/icons/Ban";
import Clock from "@gravity-ui/icons/Clock";
import { useCallback, useMemo, useState } from "react";
import { useSubscriptions } from "../hooks/useSubscriptions";
import { useApps } from "@/src/features/apps/hooks/useApps";
import { usePlans } from "@/src/features/plans/hooks/usePlans";
import { parseDate, parseTime, CalendarDate, Time } from "@internationalized/date";
import type { Subscription } from "../types";
import { PageHeader } from "@/src/shared/components/PageHeader";
import { StatCard } from "@/src/shared/components/StatCard";
import { TableSearchBar } from "@/src/shared/components/TableSearchBar";
import { TablePagination } from "@/src/shared/components/TablePagination";
import { usePaginatedSearch } from "@/src/shared/hooks/usePaginatedSearch";
import { gp } from "@/src/shared/ui/theme";
import { appToast } from "@/src/shared/utils/app-toast";
import { SubscriptionCard } from "./SubscriptionCard";

const PAGE_SIZE = 9;

function matchesSubSearch(sub: Subscription, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [sub.app_name, sub.plan_name, sub.status, sub.period]
    .filter(Boolean)
    .some((v) => String(v).toLowerCase().includes(q));
}

export function SubscriptionsManager() {
  const { subscriptions, loading, create, cancel, update } = useSubscriptions();
  const { apps } = useApps();
  const deploymentApps = useMemo(
    () => apps.filter((a) => a.kind !== "template"),
    [apps],
  );
  const { plans } = usePlans();
  const [editing, setEditing] = useState<Subscription | null>(null);
  const [canceling, setCanceling] = useState<Subscription | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [createAppId, setCreateAppId] = useState("");
  const [createPlanId, setCreatePlanId] = useState("");
  const [createPeriod, setCreatePeriod] = useState<"MONTHLY" | "ANNUALLY">("MONTHLY");

  const [createDate, setCreateDate] = useState<CalendarDate | null>(null);
  const [createTime, setCreateTime] = useState<Time | null>(null);
  const [createExpiresDate, setCreateExpiresDate] = useState<CalendarDate | null>(null);
  const [createExpiresTime, setCreateExpiresTime] = useState<Time | null>(null);

  const [editDate, setEditDate] = useState<CalendarDate | null>(null);
  const [editTime, setEditTime] = useState<Time | null>(null);
  const [editExpiresDate, setEditExpiresDate] = useState<CalendarDate | null>(null);
  const [editExpiresTime, setEditExpiresTime] = useState<Time | null>(null);

  const createState = useOverlayState();
  const editState = useOverlayState();
  const cancelState = useOverlayState();

  function toISO(date: CalendarDate | null, time: Time | null): string | null {
    if (!date) return null;
    const h = time?.hour ?? 0;
    const m = time?.minute ?? 0;
    const s = time?.second ?? 0;
    return new Date(date.year, date.month - 1, date.day, h, m, s).toISOString();
  }

  function fromISO(iso: string | null): { date: CalendarDate | null; time: Time | null } {
    if (!iso) return { date: null, time: null };
    const d = new Date(iso);
    return {
      date: new CalendarDate(d.getFullYear(), d.getMonth() + 1, d.getDate()),
      time: new Time(d.getHours(), d.getMinutes(), d.getSeconds()),
    };
  }

  const createPlans = useMemo(() => plans, [plans]);

  const selectedPlan = useMemo(
    () => createPlans.find((p) => String(p.id) === createPlanId),
    [createPlans, createPlanId],
  );

  const selectedPrice = useMemo(
    () => selectedPlan?.prices.find((p) => p.period === createPeriod),
    [selectedPlan, createPeriod],
  );

  const stats = useMemo(
    () => ({
      total: subscriptions.length,
      active: subscriptions.filter((s) => s.status === "ACTIVE").length,
      expired: subscriptions.filter((s) => s.status === "EXPIRED").length,
      canceled: subscriptions.filter((s) => s.status === "CANCELED").length,
    }),
    [subscriptions],
  );

  const filterSubs = useCallback(
    (sub: Subscription, query: string) => matchesSubSearch(sub, query),
    [],
  );

  const { search, setSearch, page, setPage, paginated, total } =
    usePaginatedSearch(subscriptions, filterSubs, PAGE_SIZE);

  function calcDates(period: "MONTHLY" | "ANNUALLY") {
    const now = new Date();
    const start = new CalendarDate(now.getFullYear(), now.getMonth() + 1, now.getDate());
    const endDate = new Date(now);
    if (period === "ANNUALLY") {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }
    return {
      start,
      expires: new CalendarDate(endDate.getFullYear(), endDate.getMonth() + 1, endDate.getDate()),
      time: new Time(now.getHours(), now.getMinutes()),
    };
  }

  function openCreate() {
    setCreateAppId("");
    setCreatePlanId("");
    setCreatePeriod("MONTHLY");
    const d = calcDates("MONTHLY");
    setCreateDate(d.start);
    setCreateTime(d.time);
    setCreateExpiresDate(d.expires);
    setCreateExpiresTime(d.time);
    createState.open();
  }

  function handlePeriodChange(period: "MONTHLY" | "ANNUALLY") {
    setCreatePeriod(period);
    const d = calcDates(period);
    setCreateDate(d.start);
    setCreateTime(d.time);
    setCreateExpiresDate(d.expires);
    setCreateExpiresTime(d.time);
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedPrice) return;
    setSubmitting(true);
    const app = apps.find((a) => String(a.id) === createAppId);
    if (!app?.hash) {
      appToast.warning("Seleccioná una aplicación");
      setSubmitting(false);
      return;
    }
    try {
      await create({
        app_hash: app.hash,
        plan_price_id: selectedPrice.id,
        start_at: toISO(createDate, createTime),
        expires_at: toISO(createExpiresDate, createExpiresTime),
      });
      createState.close();
      appToast.success("Suscripción creada");
    } catch (err) {
      appToast.error(err instanceof Error ? err.message : "Error al crear");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing) return;
    setSubmitting(true);
    try {
      await update(editing.id, {
        start_at: toISO(editDate, editTime),
        expires_at: toISO(editExpiresDate, editExpiresTime),
      });
      editState.close();
      setEditing(null);
    } catch (err) {
      appToast.error(err instanceof Error ? err.message : "Error al actualizar");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancel() {
    if (!canceling) return;
    setSubmitting(true);
    try {
      await cancel(canceling.id);
      cancelState.close();
      setCanceling(null);
    } catch (err) {
      appToast.error(err instanceof Error ? err.message : "Error al cancelar");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className={`${gp.page} items-center justify-center`}>
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className={gp.page}>
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="Suscripciones"
          description="Historial de suscripciones activas en las apps. Creá nuevas desde aquí."
          Icon={CreditCard}
        />
        <Button
          style={{
            backgroundColor: "var(--gp-primary)",
            color: "var(--gp-primary-text)",
          }}
          onPress={openCreate}
        >
          <Plus width={16} height={16} />
          Nueva suscripción
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={CreditCard} label="Total" value={stats.total} />
        <StatCard
          icon={CircleCheck}
          label="Activas"
          value={stats.active}
          featured={stats.active > 0}
        />
        <StatCard icon={Clock} label="Vencidas" value={stats.expired} />
        <StatCard icon={Ban} label="Canceladas" value={stats.canceled} />
      </div>

      <TableSearchBar
        value={search}
        onChange={setSearch}
        placeholder="Buscar por app, plan o estado…"
        total={total}
        totalLabel="suscripciones"
      />

      {paginated.length === 0 ? (
        <div className={`${gp.empty} flex flex-col items-center gap-3 py-16`}>
          <CreditCard width={40} height={40} className="text-[var(--gp-text-faint)]" />
          <p className="text-sm font-medium text-[var(--gp-text)]">
            {search.trim()
              ? "Sin resultados"
              : "No hay suscripciones registradas"}
          </p>
          <p className="text-xs text-[var(--gp-text-muted)]">
            Creá una nueva suscripción desde el botón superior.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {paginated.map((sub) => (
              <SubscriptionCard
                key={sub.id}
                subscription={sub}
                onEdit={(s) => {
                  setEditing(s);
                  const sd = fromISO(s.start_at);
                  const ed = fromISO(s.expires_at);
                  setEditDate(sd.date);
                  setEditTime(sd.time);
                  setEditExpiresDate(ed.date);
                  setEditExpiresTime(ed.time);
                  editState.open();
                }}
                onCancel={(s) => {
                  setCanceling(s);
                  cancelState.open();
                }}
              />
            ))}
          </div>
          <TablePagination
            page={page}
            pageSize={PAGE_SIZE}
            total={total}
            onPageChange={setPage}
          />
        </>
      )}

      <Modal state={editState}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="sm:max-w-md">
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>Editar suscripción</Modal.Heading>
              </Modal.Header>
              {editing && (
                <form onSubmit={handleEdit}>
                  <Modal.Body className="space-y-4">
                    <p className="text-sm text-[var(--gp-text-muted)]">
                      {editing.app_name} · {editing.plan_name}
                    </p>
                    <p className="text-xs font-medium text-zinc-700">Inicio</p>
                    <div className="flex gap-2">
                      <DatePicker
                        value={editDate}
                        onChange={setEditDate}
                        className="flex-1 min-w-0"
                      >
                        <DateField.Group>
                          <DateField.Input>
                            {(segment) => <DateField.Segment segment={segment} />}
                          </DateField.Input>
                          <DateField.Suffix>
                            <DatePicker.Trigger>
                              <DatePicker.TriggerIndicator />
                            </DatePicker.Trigger>
                          </DateField.Suffix>
                        </DateField.Group>
                        <DatePicker.Popover>
                          <Calendar aria-label="Fecha inicio">
                            <Calendar.Header>
                              <Calendar.YearPickerTrigger>
                                <Calendar.YearPickerTriggerHeading />
                                <Calendar.YearPickerTriggerIndicator />
                              </Calendar.YearPickerTrigger>
                              <Calendar.NavButton slot="previous" />
                              <Calendar.NavButton slot="next" />
                            </Calendar.Header>
                            <Calendar.Grid weekdayStyle="short">
                              <Calendar.GridHeader>
                                {(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}
                              </Calendar.GridHeader>
                              <Calendar.GridBody>
                                {(date) => <Calendar.Cell date={date} />}
                              </Calendar.GridBody>
                            </Calendar.Grid>
                          </Calendar>
                        </DatePicker.Popover>
                      </DatePicker>
                      <TimeField value={editTime} onChange={setEditTime} className="w-32 shrink-0">
                        <TimeField.Group>
                          <TimeField.Input>
                            {(segment) => <TimeField.Segment segment={segment} />}
                          </TimeField.Input>
                        </TimeField.Group>
                      </TimeField>
                    </div>
                    <p className="text-xs font-medium text-zinc-700">Vencimiento</p>
                    <div className="flex gap-2">
                      <DatePicker
                        value={editExpiresDate}
                        onChange={setEditExpiresDate}
                        className="flex-1 min-w-0"
                      >
                        <DateField.Group>
                          <DateField.Input>
                            {(segment) => <DateField.Segment segment={segment} />}
                          </DateField.Input>
                          <DateField.Suffix>
                            <DatePicker.Trigger>
                              <DatePicker.TriggerIndicator />
                            </DatePicker.Trigger>
                          </DateField.Suffix>
                        </DateField.Group>
                        <DatePicker.Popover>
                          <Calendar aria-label="Fecha vencimiento">
                            <Calendar.Header>
                              <Calendar.YearPickerTrigger>
                                <Calendar.YearPickerTriggerHeading />
                                <Calendar.YearPickerTriggerIndicator />
                              </Calendar.YearPickerTrigger>
                              <Calendar.NavButton slot="previous" />
                              <Calendar.NavButton slot="next" />
                            </Calendar.Header>
                            <Calendar.Grid weekdayStyle="short">
                              <Calendar.GridHeader>
                                {(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}
                              </Calendar.GridHeader>
                              <Calendar.GridBody>
                                {(date) => <Calendar.Cell date={date} />}
                              </Calendar.GridBody>
                            </Calendar.Grid>
                          </Calendar>
                        </DatePicker.Popover>
                      </DatePicker>
                      <TimeField value={editExpiresTime} onChange={setEditExpiresTime} className="w-32 shrink-0">
                        <TimeField.Group>
                          <TimeField.Input>
                            {(segment) => <TimeField.Segment segment={segment} />}
                          </TimeField.Input>
                        </TimeField.Group>
                      </TimeField>
                    </div>
                  </Modal.Body>
                  <Modal.Footer>
                    <Button variant="secondary" slot="close">
                      Cancelar
                    </Button>
                    <Button type="submit" isDisabled={submitting}>
                      {submitting ? <Spinner size="sm" /> : "Guardar"}
                    </Button>
                  </Modal.Footer>
                </form>
              )}
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      <Modal state={cancelState}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="sm:max-w-md">
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>Cancelar suscripción</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <p className={gp.subtitle}>
                  ¿Cancelar la suscripción de{" "}
                  <strong>{canceling?.app_name}</strong> ({canceling?.plan_name}
                  )?
                </p>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" slot="close">
                  Volver
                </Button>
                <Button
                  className="bg-red-600 text-white"
                  isDisabled={submitting}
                  onPress={handleCancel}
                >
                  {submitting ? <Spinner size="sm" /> : "Cancelar suscripción"}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      <Modal state={createState}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="sm:max-w-md">
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>Nueva suscripción</Modal.Heading>
              </Modal.Header>
              <form onSubmit={handleCreate}>
                <Modal.Body className="space-y-4">
                  <Select
                    selectedKey={createAppId || null}
                    onSelectionChange={(key) => {
                      setCreateAppId(String(key));
                      setCreatePlanId("");
                    }}
                    isRequired
                  >
                    <Label>Aplicación</Label>
                    <Select.Trigger>
                      <Select.Value />
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover>
                      <ListBox>
                        {deploymentApps.map((app) => (
                          <ListBox.Item key={String(app.id)} id={String(app.id)}>
                            {app.name || app.hash}
                          </ListBox.Item>
                        ))}
                      </ListBox>
                    </Select.Popover>
                  </Select>
                  <Select
                    selectedKey={createPlanId || null}
                    onSelectionChange={(key) => setCreatePlanId(String(key))}
                    isRequired
                    isDisabled={false}
                  >
                    <Label>Plan</Label>
                    <Select.Trigger>
                      <Select.Value />
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover>
                      <ListBox>
                        {createPlans.map((plan) => (
                          <ListBox.Item key={String(plan.id)} id={String(plan.id)}>
                            {plan.name}
                          </ListBox.Item>
                        ))}
                      </ListBox>
                    </Select.Popover>
                  </Select>
                  <Select
                    selectedKey={createPeriod}
                    onSelectionChange={(key) => handlePeriodChange(key as "MONTHLY" | "ANNUALLY")}
                  >
                    <Label>Período</Label>
                    <Select.Trigger>
                      <Select.Value />
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover>
                      <ListBox>
                        <ListBox.Item id="MONTHLY">Mensual</ListBox.Item>
                        <ListBox.Item id="ANNUALLY">Anual</ListBox.Item>
                      </ListBox>
                    </Select.Popover>
                  </Select>
                  {selectedPrice && (
                    <p className="text-xs text-[var(--gp-text-muted)]">
                      Precio: ${selectedPrice.price ?? "—"} ·{" "}
                      {selectedPrice.period === "MONTHLY" ? "Mensual" : "Anual"}
                    </p>
                  )}
                  <p className="text-xs font-medium text-zinc-700">Inicio</p>
                  <div className="flex gap-2">
                    <DatePicker
                      value={createDate}
                      onChange={setCreateDate}
                      className="flex-1 min-w-0"
                    >
                      <DateField.Group>
                        <DateField.Input>
                          {(segment) => <DateField.Segment segment={segment} />}
                        </DateField.Input>
                        <DateField.Suffix>
                          <DatePicker.Trigger>
                            <DatePicker.TriggerIndicator />
                          </DatePicker.Trigger>
                        </DateField.Suffix>
                      </DateField.Group>
                      <DatePicker.Popover>
                        <Calendar aria-label="Fecha inicio">
                          <Calendar.Header>
                            <Calendar.YearPickerTrigger>
                              <Calendar.YearPickerTriggerHeading />
                              <Calendar.YearPickerTriggerIndicator />
                            </Calendar.YearPickerTrigger>
                            <Calendar.NavButton slot="previous" />
                            <Calendar.NavButton slot="next" />
                          </Calendar.Header>
                          <Calendar.Grid weekdayStyle="short">
                            <Calendar.GridHeader>
                              {(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}
                            </Calendar.GridHeader>
                            <Calendar.GridBody>
                              {(date) => <Calendar.Cell date={date} />}
                            </Calendar.GridBody>
                          </Calendar.Grid>
                        </Calendar>
                      </DatePicker.Popover>
                    </DatePicker>
                    <TimeField value={createTime} onChange={setCreateTime} className="w-32 shrink-0">
                      <TimeField.Group>
                        <TimeField.Input>
                          {(segment) => <TimeField.Segment segment={segment} />}
                        </TimeField.Input>
                      </TimeField.Group>
                    </TimeField>
                  </div>
                  <p className="text-xs font-medium text-zinc-700">Vencimiento</p>
                  <div className="flex gap-2">
                    <DatePicker
                      value={createExpiresDate}
                      onChange={setCreateExpiresDate}
                      className="flex-1 min-w-0"
                    >
                      <DateField.Group>
                        <DateField.Input>
                          {(segment) => <DateField.Segment segment={segment} />}
                        </DateField.Input>
                        <DateField.Suffix>
                          <DatePicker.Trigger>
                            <DatePicker.TriggerIndicator />
                          </DatePicker.Trigger>
                        </DateField.Suffix>
                      </DateField.Group>
                      <DatePicker.Popover>
                        <Calendar aria-label="Fecha vencimiento">
                          <Calendar.Header>
                            <Calendar.YearPickerTrigger>
                              <Calendar.YearPickerTriggerHeading />
                              <Calendar.YearPickerTriggerIndicator />
                            </Calendar.YearPickerTrigger>
                            <Calendar.NavButton slot="previous" />
                            <Calendar.NavButton slot="next" />
                          </Calendar.Header>
                          <Calendar.Grid weekdayStyle="short">
                            <Calendar.GridHeader>
                              {(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}
                            </Calendar.GridHeader>
                            <Calendar.GridBody>
                              {(date) => <Calendar.Cell date={date} />}
                            </Calendar.GridBody>
                          </Calendar.Grid>
                        </Calendar>
                      </DatePicker.Popover>
                    </DatePicker>
                    <TimeField value={createExpiresTime} onChange={setCreateExpiresTime} className="w-32 shrink-0">
                      <TimeField.Group>
                        <TimeField.Input>
                          {(segment) => <TimeField.Segment segment={segment} />}
                        </TimeField.Input>
                      </TimeField.Group>
                    </TimeField>
                  </div>
                </Modal.Body>
                <Modal.Footer>
                  <Button variant="secondary" slot="close">
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    isDisabled={submitting || !selectedPrice}
                  >
                    {submitting ? <Spinner size="sm" /> : "Crear suscripción"}
                  </Button>
                </Modal.Footer>
              </form>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}
