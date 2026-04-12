import type { BlockComponents } from "../types";
import { CalloutDaisy } from "./CalloutDaisy";
import { CodeDaisy } from "./CodeDaisy";
import { ImageGalleryDaisy } from "./ImageGalleryDaisy";
import { UploadDaisy } from "./UploadDaisy";

export const daisyuiComponents: BlockComponents = {
  Callout: CalloutDaisy,
  Code: CodeDaisy,
  ImageGallery: ImageGalleryDaisy,
  Upload: UploadDaisy,
};
