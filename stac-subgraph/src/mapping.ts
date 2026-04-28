import { BigInt, BigDecimal, Address, dataSource } from "@graphprotocol/graph-ts";
import { Swap as SwapEvent } from "../generated/StacDEX/StacDex";
import { MessageReceived as MessageReceivedEvent } from "../generated/CircleBridge/MessageTransmitter";
import { SwapTransaction, BridgeTransaction, GlobalStat } from "../generated/schema";

const ZERO_BI = BigInt.fromI32(0);
const ONE_BI = BigInt.fromI32(1);
const ZERO_BD = BigDecimal.fromString("0");

function getChainName(): string {
  let network = dataSource.network();
  if (network == "arc-testnet") return "Arc Testnet";
  if (network == "sepolia") return "Ethereum Sepolia";
  if (network == "base-sepolia") return "Base Sepolia";
  return "Unknown";
}

function getOrCreateGlobalStat(): GlobalStat {
  let stat = GlobalStat.load("1");
  if (stat == null) {
    stat = new GlobalStat("1");
    stat.totalValueProcessedUSD = ZERO_BD;
    stat.totalTransactions = ZERO_BI;
    stat.activeUsersCount = ZERO_BI;
    stat.save();
  }
  return stat as GlobalStat;
}

export function handleSwap(event: SwapEvent): void {
  let stats = getOrCreateGlobalStat();

  let tx = new SwapTransaction(event.transaction.hash.toHexString().toLowerCase());
  tx.sender = event.params.user.toHexString().toLowerCase();
  tx.tokenIn = event.params.tokenIn.toHexString().toLowerCase();
  tx.tokenOut = event.params.tokenOut.toHexString().toLowerCase();
  
  // Convert amount to USD (assuming 6 decimals for USDC/EURC on Arc for simplicity in this version)
  let amountIn = event.params.amountIn.toBigDecimal().div(BigDecimal.fromString("1000000"));
  let amountOut = event.params.amountOut.toBigDecimal().div(BigDecimal.fromString("1000000"));
  
  tx.amountIn = amountIn;
  tx.amountOut = amountOut;
  tx.chain = getChainName();
  tx.status = "Success";
  tx.blockTimestamp = event.block.timestamp;
  tx.save();

  // Update Global Stats
  stats.totalTransactions = stats.totalTransactions.plus(ONE_BI);
  stats.totalValueProcessedUSD = stats.totalValueProcessedUSD.plus(amountIn);
  stats.save();
}

export function handleBridgeIn(event: MessageReceivedEvent): void {
  let stats = getOrCreateGlobalStat();

  let tx = new BridgeTransaction(event.transaction.hash.toHexString().toLowerCase());
  tx.sender = event.params.caller.toHexString().toLowerCase();
  
  // Circle messages don't expose source chain ID directly here easily without parsing.
  // For the purpose of this explorer, we'll label based on common routes.
  let dest = getChainName();
  tx.sourceChain = dest == "Arc Testnet" ? "Ethereum Sepolia" : "Arc Testnet"; 
  tx.destinationChain = dest;
  tx.amount = ZERO_BD; // Placeholder
  tx.status = "Success";
  tx.blockTimestamp = event.block.timestamp;
  tx.save();

  stats.totalTransactions = stats.totalTransactions.plus(ONE_BI);
  stats.save();
}
