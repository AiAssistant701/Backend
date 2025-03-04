import { Pinecone } from "@pinecone-database/pinecone";
import dotenv from "dotenv";

dotenv.config();

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
  controllerHostUrl: `https://${process.env.PINECONE_INDEX}.svc.${process.env.PINECONE_REGION}.pinecone.io`,
});

export default pinecone;
