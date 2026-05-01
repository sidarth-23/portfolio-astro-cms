import { Body, Button, Container, Head, Heading, Hr, Html, Link, Preview, Section, Text } from "@react-email/components";

type AuthEmailTemplateProps = {
  actionLabel: string;
  actionURL: string;
  intro: string;
  previewText: string;
  title: string;
};

export const AuthEmailTemplate = ({ actionLabel, actionURL, intro, previewText, title }: AuthEmailTemplateProps) => {
  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Heading style={styles.heading}>{title}</Heading>
          <Text style={styles.text}>{intro}</Text>
          <Section style={styles.buttonSection}>
            <Button href={actionURL} style={styles.button}>
              {actionLabel}
            </Button>
          </Section>
          <Text style={styles.mutedText}>If the button does not work, copy and paste this URL in your browser:</Text>
          <Link href={actionURL} style={styles.link}>
            {actionURL}
          </Link>
          <Hr style={styles.hr} />
          <Text style={styles.footerText}>If you did not request this email, you can safely ignore it.</Text>
        </Container>
      </Body>
    </Html>
  );
};

const styles = {
  body: {
    backgroundColor: "#f6f9fc",
    fontFamily: "Arial, sans-serif",
    padding: "24px 12px",
  },
  container: {
    backgroundColor: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    margin: "0 auto",
    maxWidth: "560px",
    padding: "24px",
  },
  heading: {
    color: "#111827",
    fontSize: "24px",
    fontWeight: "700",
    lineHeight: "1.3",
    margin: "0 0 12px",
  },
  text: {
    color: "#111827",
    fontSize: "16px",
    lineHeight: "1.6",
    margin: "0",
  },
  buttonSection: {
    margin: "24px 0",
  },
  button: {
    backgroundColor: "#0f172a",
    borderRadius: "8px",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: "600",
    padding: "12px 20px",
    textDecoration: "none",
  },
  mutedText: {
    color: "#6b7280",
    fontSize: "13px",
    lineHeight: "1.5",
    margin: "0 0 8px",
  },
  link: {
    color: "#1d4ed8",
    fontSize: "13px",
    lineHeight: "1.5",
    textDecoration: "underline",
    wordBreak: "break-all" as const,
  },
  hr: {
    borderColor: "#e5e7eb",
    margin: "24px 0 12px",
  },
  footerText: {
    color: "#6b7280",
    fontSize: "12px",
    lineHeight: "1.5",
    margin: "0",
  },
};
