import { BigInt, BigDecimal, Address } from "@graphprotocol/graph-ts";
import { Swap as SwapEvent } from "../generated/StacDEX/StacDex";
import { MessageReceived as MessageReceivedEvent } from "../generated/CircleBridge/MessageTransmitter";
import { Transaction, GlobalStat, User } from "../generated/schema";

const ZERO_BI = BigInt.fromI32(0);
const ONE_BI = BigInt.fromI32(1);
const ZERO_BD = BigDecimal.fromString("0");

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

function getOrCreateUser(address: Address): User {
  let user = User.load(address.toHexString());
  if (user == null) {
    user = new User(address.toHexString());
    user.transactionCount = ZERO_BI;
    user.totalVolumeUSD = ZERO_BD;
    user.lastTransactionTimestamp = ZERO_BI;
    
    let stats = getOrCreateGlobalStat();
    stats.activeUsersCount = stats.activeUsersCount.plus(ONE_BI);
    stats.save();
  }
  return user as User;
}

export function handleSwap(event: SwapEvent): void {
  let user = getOrCreateUser(event.params.user);
  let stats = getOrCreateGlobalStat();

  let tx = new Transaction(event.transaction.hash.toHexString());
  tx.type = "Swap";
  tx.user = user.id;
  tx.fromToken = event.params.tokenIn.toHexString();
  tx.toToken = event.params.tokenOut.toHexString();
  
  // Convert amount to USD (assuming 6 decimals for USDC/EURC on Arc for simplicity in this version)
  let amountUSD = event.params.amountIn.toBigDecimal().div(BigDecimal.fromString("1000000"));
  tx.amountUSD = amountUSD;
  tx.timestamp = event.block.timestamp;
  tx.chainId = BigInt.fromI32(5042002); // Arc Testnet
  tx.save();

  // Update User
  user.transactionCount = user.transactionCount.plus(ONE_BI);
  user.totalVolumeUSD = user.totalVolumeUSD.plus(amountUSD);
  user.lastTransactionTimestamp = event.block.timestamp;
  user.save();

  // Update Global Stats
  stats.totalTransactions = stats.totalTransactions.plus(ONE_BI);
  stats.totalValueProcessedUSD = stats.totalValueProcessedUSD.plus(amountUSD);
  stats.save();
}

export function handleBridgeIn(event: MessageReceivedEvent): void {
  // We identify the user from the caller or the message content
  // For simplicity, we'll use the caller for now as a placeholder for the mint recipient
  let user = getOrCreateUser(event.params.caller);
  let stats = getOrCreateGlobalStat();

  let tx = new Transaction(event.transaction.hash.toHexString());
  tx.type = "Bridge";
  tx.user = user.id;
  tx.fromToken = "USDC"; // CCTP on Arc is USDC
  tx.toToken = "USDC";
  
  // We'd parse the message for the exact amount, but using a placeholder or 
  // looking at the transfer event in the same tx is better. 
  // For now, we increment counts.
  tx.amountUSD = ZERO_BD; 
  tx.timestamp = event.block.timestamp;
  tx.chainId = BigInt.fromI32(5042002);
  tx.save();

  user.transactionCount = user.transactionCount.plus(ONE_BI);
  user.save();

  stats.totalTransactions = stats.totalTransactions.plus(ONE_BI);
  stats.save();
}
