import type { Abi, Address } from "viem";
import twainAbi from "./abi/ChogTwain.json";
import postcardAbi from "./abi/TwainPostcard.json";
import { parseAbi } from "viem";

export const TWAIN_ABI = twainAbi as Abi;
export const POSTCARD_ABI = postcardAbi as Abi;

const addr = (v: string | undefined): Address | undefined => (v && /^0x[0-9a-fA-F]{40}$/.test(v) ? (v as Address) : undefined);

export const TWAIN = addr(process.env.NEXT_PUBLIC_TWAIN);
export const POSTCARD = addr(process.env.NEXT_PUBLIC_POSTCARD);
export const CHOG_GENESIS = (addr(process.env.NEXT_PUBLIC_CHOG_GENESIS) ?? "0xc96d31F8626c6D03Fae5dCD3d61e3FB9F4a73763") as Address;
export const CHOG_TOKEN = (addr(process.env.NEXT_PUBLIC_CHOG_TOKEN) ?? "0x350035555E10d9AfAF1566AaebfCeD5BA6C27777") as Address;
export const DEPLOY_BLOCK = process.env.NEXT_PUBLIC_DEPLOY_BLOCK ? BigInt(process.env.NEXT_PUBLIC_DEPLOY_BLOCK) : 0n;
export const EPOCH = process.env.NEXT_PUBLIC_EPOCH ? Number(process.env.NEXT_PUBLIC_EPOCH) : undefined;
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://chogtwain.vercel.app";

/** True when this build is pointed at a deployed ChogTwain. Pages say so plainly when it is not. */
export const DEPLOYED = !!TWAIN;

export const ERC20_ABI = parseAbi([
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address,address) view returns (uint256)",
  "function approve(address,uint256) returns (bool)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
]);
export const ERC721_ABI = parseAbi([
  "function ownerOf(uint256) view returns (address)",
  "function balanceOf(address) view returns (uint256)",
]);

export const BURN = "0x000000000000000000000000000000000000dEaD" as const;