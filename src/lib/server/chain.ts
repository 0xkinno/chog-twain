import "server-only";
import { createPublicClient } from "viem";
import { ACTIVE_CHAIN, makeTransport } from "@/lib/chains";

export const serverClient = () => createPublicClient({ chain: ACTIVE_CHAIN, transport: makeTransport() });