// Categorizes a file based on its name and extension.
export const classifyFile = (fileName) => {
  const categories = {
    invoices: ["invoice", "receipt", "bill"],
    reports: ["report", "summary", "analysis"],
    presentations: ["presentation", "slides", "ppt"],
    documents: ["doc", "document", "pdf", "txt"],
    images: ["jpg", "jpeg", "png", "gif"],
    videos: ["mp4", "mov", "avi"],
    personal: ["personal", "private", "notes"],
  };

  fileName = fileName.toLowerCase();

  for (const category in categories) {
    if (categories[category].some((keyword) => fileName.includes(keyword))) {
      return category;
    }
  }

  return "uncategorized";
};
