import mongoose from "mongoose";

const marketResearchSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      ref: "User",
    },
    query: {
      type: String,
      required: true,
    },
    summary: {
      type: String,
      required: true,
    },
    sources: {
      type: Array,
      required: true,
    },
  },
  { timestamps: true }
);

const MarketResearch = mongoose.model("MarketResearch", marketResearchSchema);

export default MarketResearch;
