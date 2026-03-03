const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please provide a task title"],
      trim: true,
      maxLength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Please provide a description"],
      maxLength: [2000, "Description cannot exceed 2000 characters"],
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: [true, "Task must belong to a class"],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    difficulty: {
      type: String,
      enum: {
        values: ["easy", "medium", "hard"],
        message: "Difficulty must be easy, medium or hard",
      },
      default: "medium",
    },
    type: {
      type: String,
      enum: {
        values: ["assignment", "quiz", "project", "homework"],
        message: "Invalid task type",
      },
      default: "assignment",
    },
    dueDate: {
      type: Date,
      required: [true, "Please provide a due date"],
    },
    estimatedTime: Number, // in minutes
    points: {
      type: Number,
      default: 100,
      min: 0,
      max: 1000,
    },
    attachments: [
      {
        url: String,
        filename: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    status: {
      type: String,
      enum: {
        values: ["draft", "published", "closed"],
        message: "Invalid status",
      },
      default: "draft",
    },
    rubric: {
      criteria: [
        {
          name: String,
          maxPoints: Number,
          description: String,
        },
      ],
    },
    emoji: String,
    isPublished: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Validate dueDate is in the future
taskSchema.pre("save", function (next) {
  if (this.dueDate && this.dueDate <= new Date()) {
    this.invalidate("dueDate", "Due date must be in the future");
  }
  next();
});

module.exports = mongoose.model("Task", taskSchema);
