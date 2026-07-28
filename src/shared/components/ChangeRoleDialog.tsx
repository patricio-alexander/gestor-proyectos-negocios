"use client";

import { Button, Modal, useOverlayState } from "@heroui/react";
import Check from "@gravity-ui/icons/Check";
import type { AuthRole } from "@/src/features/auth/types";

type ChangeRoleDialogProps = {
  open: boolean;
  onClose: () => void;
  roles: AuthRole[];
  activeRoleId: number | null;
  onSelect: (roleId: number) => void;
};

export function ChangeRoleDialog({
  open,
  onClose,
  roles,
  activeRoleId,
  onSelect,
}: ChangeRoleDialogProps) {
  const state = useOverlayState({
    isOpen: open,
    onOpenChange: (isOpen) => {
      if (!isOpen) onClose();
    },
  });

  if (!open) return null;

  return (
    <Modal state={state}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-sm">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>Cambiar rol</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="space-y-2">
              {roles.length === 0 ? (
                <p className="text-sm text-[var(--gp-text-muted)]">No hay roles disponibles.</p>
              ) : (
                roles.map((role) => {
                  const active = role.id === activeRoleId;
                  return (
                    <Button
                      key={role.id}
                      fullWidth
                      variant={active ? "primary" : "secondary"}
                      className="justify-between"
                      onPress={() => {
                        onSelect(role.id);
                        onClose();
                      }}
                    >
                      <span>{role.name}</span>
                      {active && <Check width={16} height={16} />}
                    </Button>
                  );
                })
              )}
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
