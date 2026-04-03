// ─── Hooks barrel export ───────────────────────────────────────────────────────
// import { useAuth, useApiCollection, useApiDocument } from "@/hooks";

export { useAuth } from "./useAuth";
export type { AuthUser, AuthContextValue } from "./useAuth";
export { useClient } from "./useClient";
export { useForm } from "./useForm";
export { useFetch, useMutation } from "./useFetch";
export { useDebounce } from "./useDebounce";
export { useLocalStorage } from "./useLocalStorage";
export {
  useApiCollection,
  useApiDocument,
  useApiMutations,
  // Legacy aliases — kept so existing code using old names still compiles
  useFirestoreCollection,
  useFirestoreDocument,
  useFirestoreMutations,
} from "./useApi";

// ─── Real-time hooks ──────────────────────────────────────────────
export { useSocket, useSocketContext, SocketProvider } from "./useSocket";
export type {
  TypedSocket,
  UseSocketReturn,
  SocketStatus,
  ServerToClientEvents,
  ClientToServerEvents,
  ServerMessage,
} from "./useSocket";
export { useMessages } from "./useMessages";
export type { Message } from "./useMessages";
export { useConversations } from "./useConversations";
export type { Conversation } from "./useConversations";
export { useChat } from "./useChat";
