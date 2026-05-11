import nodemailer from 'nodemailer';
import connectToDatabase from './db';
import { ClinicSettings } from '../models';

export async function getEmailTransporter() {
  await connectToDatabase();
  const settings = await ClinicSettings.findById('singleton');
  const smtp = settings?.smtp;
  if (!smtp || !smtp.host || !smtp.user || !smtp.pass) {
    throw new Error('Email service is not configured. Please set SMTP settings in Settings.');
  }
  return {
    transporter: nodemailer.createTransport({
      host: smtp.host,
      port: Number(smtp.port) || 587,
      secure: Boolean(smtp.secure),
      auth: { user: smtp.user, pass: smtp.pass },
    }),
    from: smtp.from || smtp.user,
  };
}

export function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
