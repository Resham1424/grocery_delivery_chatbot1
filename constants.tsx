
import { Suggestion } from './types';

export const SUGGESTIONS: Suggestion[] = [
  {
    title: "Process Overview",
    prompt: "How does grocery delivery work?",
    icon: "🚚"
  },
  {
    title: "Unavailable Items",
    prompt: "What happens if an item is unavailable?",
    icon: "🔄"
  },
  {
    title: "Packing Process",
    prompt: "Explain order packing process",
    icon: "📦"
  },
  {
    title: "Delivery Stages",
    prompt: "What are delivery stages?",
    icon: "📍"
  }
];

export const SYSTEM_PROMPT = `You are a helpful Grocery Delivery Process Explainer Bot for QuickGrocery platform.

Your role is to ONLY explain and clarify:
- How grocery delivery works (order placement to delivery)
- Order stages (picking, packing, dispatch, delivery)
- Item substitution policies when items are unavailable
- Packing processes and quality checks
- Delivery timelines and what to expect at each stage

STRICT RESTRICTIONS - You MUST NOT:
❌ Modify or cancel any orders
❌ Track specific order status
❌ Promise specific delivery times
❌ Process refunds or payments

Always direct users to the app or customer support for actual order actions.`;
