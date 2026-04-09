import { render } from "@react-email/render";
import type { ReactElement } from "react";

import { AuthEmailTemplate } from "./AuthEmailTemplate";

type AuthEmailPayload = {
  resetPasswordURL?: string;
  userEmail: string;
};

export const generateForgotPasswordEmailSubject = ({ userEmail }: Pick<AuthEmailPayload, "userEmail">): string => {
  return `Reset your Sid's Hub CMS password (${userEmail})`;
};

export const generateForgotPasswordEmailHTML = async ({ resetPasswordURL }: AuthEmailPayload): Promise<string> => {
  if (!resetPasswordURL) {
    throw new Error("Missing reset password URL for password reset email.");
  }

  return renderEmail(
    <AuthEmailTemplate
      actionLabel="Reset Password"
      actionURL={resetPasswordURL}
      intro="A request was received to reset your password. Use the button below to continue."
      previewText="Reset your account password"
      title="Reset your password"
    />,
  );
};

const renderEmail = async (component: ReactElement): Promise<string> => {
  return render(component, {
    pretty: true,
  });
};
