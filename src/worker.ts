import { Container, getContainer } from "@cloudflare/containers";

export class LeafletContainer extends Container<Env> {
  defaultPort = 4321;
  sleepAfter = "10m";
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const container = getContainer(env.LEAFLET_CONTAINER);
    return await container.fetch(request);
  },
};
