import pinecone from "./services/pinecone/pineconeClient.js";

await pinecone.index(process.env.PINECONE_INDEX).deleteAll();