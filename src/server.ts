import express from "express"
import { Request, Response } from "express"
import { WebhookVerifyParams } from "./types"
import { FACEBOOK_WEBHOOK_VERIFY_TOKEN } from "./config/constants"
import "dotenv/config"

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
  const body = req.body as { entry: Array<{id: string, time: number, changes: Array<{field: string, value:{ ad_id: string, form_id: string, leadgen_id: string}}>}> }
  console.log(body)
  console.log(body.entry[0].changes)

  let leadId = body.entry[0].changes[0].value.leadgen_id
  leadId = '1768343300880894'
  const url = new URL(
    `https://graph.facebook.com/v26.0/${leadId}`,
  );

  url.searchParams.set(
    "fields",
    "id,created_time,field_data,form_id",
  );
  console.log(process.env.META_ACCESS_TOKEN)
  url.searchParams.set(
    "access_token",
    process.env.META_ACCESS_TOKEN!,
  );

  const response = await fetch(url);
  const lead = await response.json();
  console.log(lead)

  return res.json({message: "success"})
})

app.get("/api/v1/health", (req: Request, res: Response) => {
  console.log("running health endpoint")
  return res.json({message: "healthy"})
})


app.listen(3000, () => {
  console.log(`Server running at http://localhost:${3000}`);
});
