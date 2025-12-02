// src/bridge/bridge.js
import { getBridgeKit } from "./bridgeClient";

export async function bridgeToken({
  provider,
  sourceChain,
  destinationChain,
  amount,            // string, e.g. '10.5'
  destinationAddress // string, e.g. '0x...'
}) {
  const { kit, adapter } = getBridgeKit(provider);

  const result = await kit.bridge({
    from: { adapter, chain: sourceChain },
    to: { adapter, chain: destinationChain, address: destinationAddress },
    amount,
    token: "USDC"    // or another token if supported
  });

  return result;
}
