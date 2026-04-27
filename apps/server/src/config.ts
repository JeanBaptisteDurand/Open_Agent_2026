import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3001),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),

  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().default("redis://localhost:6379"),

  THE_GRAPH_KEY: z.string().optional(),
  UNISWAP_TRADING_API_KEY: z.string().optional(),

  OG_NEWTON_RPC: z.string().url().default("https://evmrpc-testnet.0g.ai"),
  OG_GALILEO_RPC: z.string().url().default("https://evmrpc.0g.ai"),
  OG_INDEXER_RPC: z.string().url().default("https://indexer-storage-testnet-turbo.0g.ai"),
  OG_STORAGE_PRIVATE_KEY: z.string().optional(),
  OG_ANCHOR_PRIVATE_KEY: z.string().optional(),
  OG_CHAIN_ID: z.coerce.number().int().positive().default(16602),

  MAINNET_RPC: z.string().url().default("https://eth.llamarpc.com"),
  SEPOLIA_RPC: z.string().url().default("https://rpc.sepolia.org"),

  OPENAI_API_KEY: z.string().optional(),
  OPENAI_EMBEDDING_MODEL: z.string().default("text-embedding-3-small"),
});

export type Config = z.infer<typeof schema>;

export const config: Config = schema.parse(process.env);
