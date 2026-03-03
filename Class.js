const mongoose = require("mongoose");

const classSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide a class name"],
      trim: true,
      maxLength: [100, "Class name cannot exceed 100 characters"],
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      match: [/^[A-Z0-9]{6,10}$/, "Invalid class code format"],
    },
    description: {
      type: String,
      maxLength: [500, "Description cannot exceed 500 characters"],
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Class must have a teacher"],
    },
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    subject: {
      type: String,
      required: true,
      enum: [
        "Mathematics",
        "Science",
        "English",
        "History",
        "Geography",
        "Art",
        "PE",
        "Other",
      ],
    },
    schedule: {
      days: [String], // ["Monday", "Wednesday", "Friday"]
      startTime: String, // "09:00"
      endTime: String, // "10:30"
    },
    classroom: String,
    capacity: {
      type: Number,
      default: 30,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    coverImage: {
      type: String,
      default: "https://via.placeholder.com/400x200?text=Classroom",
    },
  },
  { timestamps: true }
);

// Validation: capacity should be reasonable
classSchema.pre("save", function (next) {
  if (this.capacity < 1 || this.capacity > 100) {
    this.invalidate(
      "capacity",
      "Capacity must be between 1 and 100 students"
    );
  }
  if (this.students.length > this.capacity) {
    this.invalidate("students", "Number of students exceeds capacity");
  }
  next();
});

// Cascade delete - remove class from students when deleted
classSchema.pre("findByIdAndDelete", async function (next) {
  const classId = this.getFilter()._id;
  await mongoose.model("User").updateMany(
    { _id: { $in: await mongoose.model("Class").findById(classId) } },
    { $pull: { classes: classId } }
  );
  next();
});

module.exports = mongoose.model("Class", classSchema);
