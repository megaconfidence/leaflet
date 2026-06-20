import { createAgent, type FlueContext } from '@flue/runtime';
import { local } from '@flue/runtime/node';
import * as v from 'valibot';

const agent = createAgent(() => ({
  sandbox: local({
    env: {
      GH_TOKEN: process.env.GH_TOKEN,
    },
  }),
  model: 'mistral/mistral-medium-3.5',
}));

export async function run({ init, payload }: FlueContext<{ prNumber: number }>) {
  const harness = await init(agent);
  const session = await harness.session();

  const { data } = await session.skill('review-pr', {
    args: { prNumber: payload.prNumber },
    result: v.object({
      summary: v.string(),
      verdict: v.picklist(['approve', 'request_changes', 'comment']),
      issues_found: v.array(
        v.object({
          severity: v.picklist(['critical', 'warning', 'info']),
          category: v.string(),
          description: v.string(),
        }),
      ),
    }),
  });

  return data;
}
