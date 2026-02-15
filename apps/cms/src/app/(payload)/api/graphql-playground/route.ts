import { GRAPHQL_PLAYGROUND_GET } from "@payloadcms/next/routes";
import "@payloadcms/next/css";

import config from "@payload-config";

export const GET = GRAPHQL_PLAYGROUND_GET(config);
