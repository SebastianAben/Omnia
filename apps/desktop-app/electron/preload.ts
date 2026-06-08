import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("omniaDesktop", {
  platform: process.platform,
  versions: {
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node,
  },
  authSession: {
    read: () => ipcRenderer.invoke("omnia:auth-session:read"),
    write: (input: unknown) =>
      ipcRenderer.invoke("omnia:auth-session:write", input),
    clear: () => ipcRenderer.invoke("omnia:auth-session:clear"),
  },
  localStore: {
    saveCheckout: (input: unknown) =>
      ipcRenderer.invoke("omnia:local-store:save-checkout", input),
    listTransactions: () =>
      ipcRenderer.invoke("omnia:local-store:list-transactions"),
    listSyncQueue: () =>
      ipcRenderer.invoke("omnia:local-store:list-sync-queue"),
    listInventoryBalances: () =>
      ipcRenderer.invoke("omnia:local-store:list-inventory-balances"),
    listStockMovements: () =>
      ipcRenderer.invoke("omnia:local-store:list-stock-movements"),
    saveStockAdjustment: (input: unknown) =>
      ipcRenderer.invoke("omnia:local-store:save-stock-adjustment", input),
    replaySync: (input: unknown) =>
      ipcRenderer.invoke("omnia:local-store:replay-sync", input),
    saveShiftEvent: (input: unknown) =>
      ipcRenderer.invoke("omnia:local-store:save-shift-event", input),
    getActiveShift: (input: unknown) =>
      ipcRenderer.invoke("omnia:local-store:get-active-shift", input),
  },
});
