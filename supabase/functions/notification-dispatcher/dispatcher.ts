/**
 * Re-export the pure dispatcher from the shared lib module.
 *
 * The edge function and Deno tests import from this file so imports stay
 * within the functions/ directory tree. The actual logic lives in
 * lib/dispatcher.ts which is free of any Deno- or Node-specific APIs.
 */
export {
  dispatch,
  type DbContext,
  type DueRevisionRow,
  type FcmContext,
  type FcmPayload,
  type DispatchResult,
} from '../../../lib/dispatcher.ts';
