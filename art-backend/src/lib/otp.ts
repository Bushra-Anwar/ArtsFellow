import { getDatabase } from "./mongo.js";

const OTP_COLLECTION = "otps";
const OTP_EXPIRY_MINUTES = 10;

export interface OtpRecord {
  email?: string;
  phone?: string;
  otp: string;
  createdAt: Date;
  expiresAt: Date;
}

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function saveOtp(
  identifier: string,
  otp: string,
  isEmail: boolean = true,
): Promise<void> {
  const db = await getDatabase();
  const collection = db.collection<OtpRecord>(OTP_COLLECTION);

  const normalizedIdentifier = identifier.trim().toLowerCase();
  const normalizedOtp = otp.trim();

  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + OTP_EXPIRY_MINUTES);

  const query = isEmail
    ? { email: normalizedIdentifier }
    : { phone: normalizedIdentifier };
  const update = isEmail
    ? {
        email: normalizedIdentifier,
        otp: normalizedOtp,
        createdAt: new Date(),
        expiresAt,
      }
    : {
        phone: normalizedIdentifier,
        otp: normalizedOtp,
        createdAt: new Date(),
        expiresAt,
      };

  await collection.updateOne(query, { $set: update }, { upsert: true });
}

export async function verifyOtp(
  identifier: string,
  otp: string,
  isEmail: boolean = true,
): Promise<boolean> {
  const db = await getDatabase();
  const collection = db.collection<OtpRecord>(OTP_COLLECTION);

  const normalizedIdentifier = identifier.trim().toLowerCase();
  const normalizedOtp = otp.trim();

  console.log(
    `Verifying OTP for '${normalizedIdentifier}'. Provided OTP: '${normalizedOtp}'`,
  );
  const query = isEmail
    ? { email: normalizedIdentifier }
    : { phone: normalizedIdentifier };
  const record = await collection.findOne(query);
  console.log("Found record:", record);

  if (!record) {
    console.log("No record found for identifier:", normalizedIdentifier);
    return false;
  }

  if (record.otp !== normalizedOtp) {
    console.log(
      `OTP mismatch. Record: '${record.otp}', Provided: '${normalizedOtp}'`,
    );
    return false;
  }

  if (new Date() > record.expiresAt) {
    console.log("OTP expired");
    return false;
  }

  // Optional: Delete OTP after successful verification to prevent reuse
  await collection.deleteOne(query);
  console.log("OTP verified successfully");

  return true;
}
