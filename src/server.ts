import express from "express"
import { Request, Response } from "express"
import { WebhookVerifyParams } from "./types"
import { FACEBOOK_WEBHOOK_VERIFY_TOKEN } from "./config/constants"
import "dotenv/config"
import { createServer } from "node:http";
import { Server } from "socket.io";

const app: express.Application = express()

app.use(express.json())

app.get("/api/v1/webhook", (req: Request, res: Response) => {
  const params: WebhookVerifyParams = req.query as object as WebhookVerifyParams
  if (params["hub.mode"] === "subscribe" && params["hub.verify_token"] === FACEBOOK_WEBHOOK_VERIFY_TOKEN) {
    return res.status(200).send(params["hub.challenge"])
  }
  return res.sendStatus(403)
})

app.post("/api/v1/webhook", async (req: Request, res: Response) => {
  const body = req.body as { entry: Array<{ id: string, time: number, changes: Array<{ field: string, value: { ad_id: string, form_id: string, leadgen_id: string } }> }> }
  console.log(body.entry[0].changes)
  let leadId = body.entry[0].changes[0].value.leadgen_id
  console.log(leadId)
  leadId = '1617451156540367'
  const url = new URL(
    `https://graph.facebook.com/v26.0/${leadId}`,
  );
  url.searchParams.set(
    "fields",
    "id,created_time,field_data,form_id",
  );
  url.searchParams.set(
    "access_token",
    process.env.META_ACCESS_TOKEN!,
  );
  const response = await fetch(url);
  const data = await response.json() as { field_data: Array<{ name: string, values: Array<string> }>, id: string }
  const lead = {name: '', email: '', id: data.id}
  for (const field of data.field_data) {
    if (field.name === "full_name") {
      lead.name = field.values[0]
    }
    if (field.name === "email") {
      lead.email = field.values[0]
    }
  }
  io.emit("lead.created", lead)
  console.log(lead)
  return res.json({message: "success"})
})

app.get("/api/v1/health", (req: Request, res: Response) => {
  console.log("running health endpoint")
  return res.json({message: "healthy"})
})

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "*"
  },
});

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

httpServer.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});
