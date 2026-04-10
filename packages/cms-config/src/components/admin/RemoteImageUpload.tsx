import { RemoteImageUploadClient } from "./RemoteImageUpload.client";

export function RemoteImageUploadServer(props: unknown) {
  return <RemoteImageUploadClient {...(props as Record<string, unknown>)} />;
}
