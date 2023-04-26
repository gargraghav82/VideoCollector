import { createTransport } from "nodemailer";

export const sendEmail = async (to, subject, text) => {
  const transport = createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  await transport.sendMail({
    to,
    subject,
    text,
    from: "hello@gmail.com",
  });
};
