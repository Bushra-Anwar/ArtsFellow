import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function run(modelName) {
  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    await model.embedContent("test");
    console.log(modelName, "SUCCESS");
  } catch(e) {
    console.log(modelName, "FAIL", e.message);
  }
}

async function main() {
  await run("text-embedding-004");
  await run("gemini-embedding-001");
  await run("gemini-embedding-2");
}

main();
