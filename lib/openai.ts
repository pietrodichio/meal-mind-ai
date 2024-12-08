import OpenAI from "openai";
import Instructor from "@instructor-ai/instructor";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const client = Instructor({
  client: openai,
  mode: "TOOLS",
});
