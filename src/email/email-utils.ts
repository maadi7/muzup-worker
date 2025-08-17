import { createTransport } from "nodemailer";
import hbs, {
  HbsTransporter,
  NodemailerExpressHandlebarsOptions,
} from "nodemailer-express-handlebars";
import path from "path";
import { restaurantBrandingDetails } from "../utils/customer-email-utils";
import { logger } from "../utils/logger";
import { TEmailSendingConfig } from "./email-subjects";
import { TSendCustomerEmailParams, TSendEmailParams } from "./email.types";
import dotenv from "dotenv";

// Nodemailer transport configuration
dotenv.config();
let transporterConfig: {
  host: string;
  port: number;
  auth: { user: string; pass: string };
  pool: boolean;
  maxConnections: number;
  rateLimit: number;
  secure?: boolean;
  tls?: any;
} = {
  host: process.env.SMTP_HOST ?? "",
  port: Number(process.env.SMTP_PORT ?? 587),
  auth: {
    user: process.env.SMTP_USERNAME ?? "",
    pass: process.env.SMTP_PASSWORD ?? "",
  },
  pool: true,
  maxConnections: 10,
  rateLimit: 12,
};

if (process.env.NODE_ENV === "production" && process.env.SMTP_PORT !== "587") {
  transporterConfig["secure"] = true;
  transporterConfig["tls"] = {};
}

const transporter: HbsTransporter = createTransport(transporterConfig);
const transporterInternal: HbsTransporter = createTransport(transporterConfig);

// Hbs configuration
const hbsOptions: NodemailerExpressHandlebarsOptions = {
  viewEngine: {
    extname: ".hbs",
    partialsDir: path.join(__dirname, "./templates/partials"),
    helpers: {},
    defaultLayout: path.join(__dirname, "./templates/layout/main"),
  },
  viewPath: path.join(__dirname, "./templates"), // Base path for all template folders
  extName: ".hbs",
};
transporter.use("compile", hbs(hbsOptions));

// Internal Hbs configuration
const hbsOptionsInternal: NodemailerExpressHandlebarsOptions = {
  viewEngine: {
    extname: ".hbs",
    helpers: {},
  },
  viewPath: path.join(__dirname, "./templates"), // Base path for all files
  extName: ".hbs",
};

transporterInternal.use("compile", hbs(hbsOptionsInternal));

// From emails
const transactionalEmail = "info@muzup.com";

export const sendEmail = async (data: TSendEmailParams) => {
  try {
    const { to, emailSendingConfig } = data;
    const { subject, template, type } = emailSendingConfig;
    // Cleaning context object
    let context: {
      to?: string;
      emailSendingConfig?: TEmailSendingConfig;
      [key: string]: any;
    } = { ...data };
    delete context.to;
    delete context.emailSendingConfig;
    const mailOptions = {
      from: `"Muzup" <${transactionalEmail}>`,
      to,
      subject: subject,
      template: template,
      context,
    };
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error: any) {
    logger.warn(error, { ...data, emailFn: "sendEmail" });
    throw error;
  }
};
