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

export async function run({ init, payload }: FlueContext<{ issueNumber: number }>) {
  const harness = await init(agent);
  const session = await harness.session();

  const { data } = await session.skill('fix-issue', {
    args: { issueNumber: payload.issueNumber },
    result: v.object({
      diagnosis: v.string(),
      fix_applied: v.boolean(),
      pr_url: v.optional(v.string()),
    }),
  });

  return data;
}
