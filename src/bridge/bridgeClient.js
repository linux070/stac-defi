// src/bridge/bridgeClient.js
import { BridgeKit } from "@circle-fin/bridge-kit";
import { createAdapterFromProvider } from "@circle-fin/adapter-viem-v2";

export function getBridgeKit(provider) {
  const adapter = createAdapterFromProvider({ provider });
  const kit = new BridgeKit();
  return { kit, adapter };
}
