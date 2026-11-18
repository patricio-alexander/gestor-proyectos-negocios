"use client";

import { Button, Modal, Spinner, useOverlayState } from "@heroui/react";

type OverlayState = ReturnType<typeof useOverlayState>;

type Props = {
  state: OverlayState;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void | Promise<void>;
};

/** Confirmación en modal HeroUI (nunca window.confirm / alert). */
export function ConfirmModal({
  state,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  danger = false,
  busy = false,
  onConfirm,
}: Props) {
  return (
    <Modal state={state}>
      <Modal.Backdrop isDismissable={!busy}>
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-md">
            {!busy ? <Modal.CloseTrigger /> : null}
            <Modal.Header>
              <Modal.Heading>{title}</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <p className="whitespace-pre-line text-sm text-[var(--gp-text-muted)]">
                {message}
              </p>
            </Modal.Body>
            <Modal.Footer className="flex justify-end gap-2">
              <Button
                variant="secondary"
                isDisabled={busy}
                onPress={() => state.close()}
              >
                {cancelLabel}
              </Button>
              <Button
                isDisabled={busy}
                className={danger ? "bg-red-600 text-white" : undefined}
                style={
                  danger
                    ? undefined
                    : {
                        backgroundColor: "var(--gp-primary)",
                        color: "var(--gp-primary-text)",
                      }
                }
                onPress={() => void onConfirm()}
              >
                {busy ? <Spinner size="sm" /> : confirmLabel}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
