import { handleServerFunctions, RootLayout } from "@payloadcms/next/layouts";
import "@payloadcms/next/css";
import "@sidshub/cms-lib-editor/web/html/styles.css";
import type { ServerFunctionClientArgs } from "payload";
import type { ReactNode } from "react";

import config from "@payload-config";

import { importMap } from "./admin/importMap.js";

type Props = {
  children: ReactNode;
};

export default function Layout({ children }: Props) {
  const serverFunction = async (args: ServerFunctionClientArgs) => {
    "use server";

    return handleServerFunctions({
      ...args,
      config,
      importMap,
    });
  };

  return RootLayout({
    children,
    config,
    importMap,
    serverFunction,
  });
}
