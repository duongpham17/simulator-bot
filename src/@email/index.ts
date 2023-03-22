import nodemailer from 'nodemailer';
import { authTemplate } from './template';

const email_address = process.env.EMAIL_ADDRESS;
const email_password = process.env.EMAIL_PASSWORD;

const Email = () => nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: email_address,
        pass: email_password,
    }
});

interface EamilAuthentication {
    email: string,
    url: string,
    code: string
};

export const emailSignup = async (data: EamilAuthentication) => {
    const transporter = Email();

    const mailOptions = {
        from: `${email_address} <${email_address}>`,
        to: data.email,
        subject: "Confirm Email",
        html: `
            ${authTemplate(
                "Confirm Email",
                data.url,
                data.code
            )}
        `
    }

    await transporter.sendMail(mailOptions);
}

export const emailLogin = async (data: EamilAuthentication) => {
    const transporter = Email();

    const mailOptions = {
        from: `${email_address} <${email_address}>`,
        to: data.email,
        subject: "Magic Link",
        html: `
            ${authTemplate(
                "Login now",
                data.url, 
                data.code
            )}
        `
    }

    await transporter.sendMail(mailOptions);
}