import type { IconProvider } from "../types";
import { simpleIconsProvider } from "./simple-icons";
import { phosphorProvider } from "./phosphor";

/**
 * All registered icon providers, in display order.
 *
 * To add a new provider:
 *   1. Create a file in this directory implementing `IconProvider`
 *   2. Import it here and add it to this array
 */
export const PROVIDERS: IconProvider[] = [simpleIconsProvider, phosphorProvider];
