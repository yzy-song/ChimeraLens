import { create } from "zustand";

interface ModalState {
  isAuthModalOpen: boolean;
  isBillingModalOpen: boolean;
  isSecurityModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  openBillingModal: () => void;
  closeBillingModal: () => void;
  openSecurityModal: () => void;
  closeSecurityModal: () => void;
}

// This store centralizes the state for all modals in the application.
export const useModalStore = create<ModalState>((set) => ({
  isAuthModalOpen: false,
  isBillingModalOpen: false,
  isSecurityModalOpen: false,
  openAuthModal: () =>
    set({
      isAuthModalOpen: true,
      isBillingModalOpen: false,
      isSecurityModalOpen: false,
    }),
  closeAuthModal: () => set({ isAuthModalOpen: false }),
  openBillingModal: () =>
    set({
      isBillingModalOpen: true,
      isAuthModalOpen: false,
      isSecurityModalOpen: false,
    }),
  closeBillingModal: () => set({ isBillingModalOpen: false }),
  openSecurityModal: () =>
    set({
      isSecurityModalOpen: true,
      isAuthModalOpen: false,
      isBillingModalOpen: false,
    }),
  closeSecurityModal: () => set({ isSecurityModalOpen: false }),
}));
