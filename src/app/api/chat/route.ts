import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = await streamText({
    model: openai("gpt-4o-mini"),
    messages: [
      {
        role: "system",
        content: "You are a helpful IT Support AI assistant for our internal Helpdesk. Help users troubleshoot common issues like VPN, passwords, and hardware issues concisely. Provide actionable steps."
      },
      ...messages
    ]
  });

  return result.toTextStreamResponse();
}
