import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendPasswordResetEmail(
  email: string,
  code: string
) {
  const response = await resend.emails.send({
    from:
      process.env.EMAIL_FROM ||
      "onboarding@resend.dev",

    to: email,

    subject:
      "Code de réinitialisation - Smart Sheep Manager",

    html: `
      <div style="font-family:Arial,sans-serif;padding:30px;max-width:600px;margin:auto;">

        <h2 style="color:#2E7D32;">
          Smart Sheep Manager
        </h2>

        <p>Bonjour,</p>

        <p>
          Vous avez demandé la réinitialisation de votre mot de passe.
        </p>

        <p>
          Saisissez le code suivant dans l'application :
        </p>

        <div
          style="
            background:#F4F4F4;
            padding:20px;
            border-radius:10px;
            text-align:center;
            font-size:36px;
            font-weight:bold;
            color:#2E7D32;
            letter-spacing:8px;
          "
        >
          ${code}
        </div>

        <p>
          Ce code expire dans
          <strong>10 minutes</strong>.
        </p>

        <p>
          Si vous n'êtes pas à l'origine de cette demande,
          ignorez simplement cet email.
        </p>

      </div>
    `,
  });

  if (response.error) {
    throw new Error(response.error.message);
  }

  return response;
}