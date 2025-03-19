import TaskHistory from "../models/TaskHistory.js";

export const createTaskHistory = async (
  userId,
  taskType,
  description,
  prompt
) => {
  const taskHistory = await TaskHistory.create({
    userId,
    taskType,
    description,
    prompt,
    status: "pending",
  });

  return taskHistory;
};

export const getUserTaskHistory = async (userId) => {
  const tasks = await TaskHistory.find({ userId, status: "completed" }).sort({
    timestamp: -1,
  });

  return tasks.length ? tasks : null;
};

export const updateTaskToCompleted = async (id) => {
  await TaskHistory.findByIdAndUpdate(id, { $set: { status: "completed" } });
};
