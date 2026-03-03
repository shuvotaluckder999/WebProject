const router = require("express").Router();
const { body, validationResult, param } = require("express-validator");
const Class = require("../models/Class");
const User = require("../models/User");
const Task = require("../models/Task");
const Assignment = require("../models/Assignment");
const { protect, authorize } = require("../middleware/Auth");

// Generate unique class code
const generateClassCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// @route   GET /api/class
// @desc    Get all classes for current user
// @access  Private
router.get("/", protect, async (req, res, next) => {
  try {
    let query;

    if (req.user.role === "teacher") {
      // Teachers see their classes
      query = Class.find({ teacher: req.user.id });
    } else {
      // Students see classes they're enrolled in
      query = Class.find({ students: req.user.id });
    }

    const classes = await query
      .populate("teacher", "name email avatar")
      .populate("students", "name email avatar")
      .sort("-createdAt");

    res.status(200).json({
      success: true,
      count: classes.length,
      data: classes,
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/class/:id
// @desc    Get single class by ID
// @access  Private
router.get(
  "/:id",
  protect,
  param("id").isMongoId().withMessage("Invalid class ID"),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const cls = await Class.findById(req.params.id)
        .populate("teacher", "name email avatar role")
        .populate("students", "name email avatar role");

      if (!cls) {
        return res.status(404).json({
          success: false,
          message: "Class not found",
        });
      }

      // Check if user has access
      const hasAccess =
        cls.teacher._id.toString() === req.user.id ||
        cls.students.some((s) => s._id.toString() === req.user.id);

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to access this class",
        });
      }

      res.status(200).json({
        success: true,
        data: cls,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   POST /api/class
// @desc    Create a new class (Teacher only)
// @access  Private
router.post(
  "/",
  protect,
  authorize("teacher", "admin"),
  [
    body("name")
      .trim()
      .isLength({ min: 3 })
      .withMessage("Class name must be at least 3 characters"),
    body("description")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Description cannot exceed 500 characters"),
    body("subject")
      .isIn([
        "Mathematics",
        "Science",
        "English",
        "History",
        "Geography",
        "Art",
        "PE",
        "Other",
      ])
      .withMessage("Invalid subject"),
    body("capacity")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Capacity must be between 1 and 100"),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { name, description, subject, capacity, classroom, schedule } =
        req.body;

      const newClass = await Class.create({
        name,
        description,
        subject,
        capacity: capacity || 30,
        classroom,
        schedule,
        code: generateClassCode(),
        teacher: req.user.id,
      });

      // CORRECTION: Remplacer execPopulate() par findById avec populate
      const cls = await Class.findById(newClass._id)
        .populate("teacher", "name email avatar");

      res.status(201).json({
        success: true,
        data: cls,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   PUT /api/class/:id
// @desc    Update class (Teacher only)
// @access  Private
router.put(
  "/:id",
  protect,
  param("id").isMongoId().withMessage("Invalid class ID"),
  async (req, res, next) => {
    try {
      let cls = await Class.findById(req.params.id);

      if (!cls) {
        return res.status(404).json({
          success: false,
          message: "Class not found",
        });
      }

      // Check authorization
      if (cls.teacher.toString() !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Not authorized to update this class",
        });
      }

      // Update allowed fields
      const fieldsToUpdate = [
        "name",
        "description",
        "subject",
        "capacity",
        "classroom",
        "schedule",
        "coverImage",
        "isActive",
      ];

      fieldsToUpdate.forEach((field) => {
        if (req.body[field] !== undefined) {
          cls[field] = req.body[field];
        }
      });

      cls = await cls.save();

      res.status(200).json({
        success: true,
        data: cls,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   DELETE /api/class/:id
// @desc    Delete class (Teacher only)
// @access  Private
router.delete(
  "/:id",
  protect,
  param("id").isMongoId().withMessage("Invalid class ID"),
  async (req, res, next) => {
    try {
      const cls = await Class.findById(req.params.id);

      if (!cls) {
        return res.status(404).json({
          success: false,
          message: "Class not found",
        });
      }

      // Check authorization
      if (cls.teacher.toString() !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Not authorized to delete this class",
        });
      }

      // Delete all tasks and assignments for this class
      await Task.deleteMany({ classId: req.params.id });
      await Assignment.deleteMany({ classId: req.params.id });

      await Class.findByIdAndDelete(req.params.id);

      res.status(200).json({
        success: true,
        message: "Class deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   POST /api/class/:id/join
// @desc    Student joins class with code
// @access  Private
router.post(
  "/join/code",
  protect,
  body("code")
    .trim()
    .isLength({ min: 6, max: 10 })
    .withMessage("Invalid class code"),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const cls = await Class.findOne({ code: req.body.code.toUpperCase() });

      if (!cls) {
        return res.status(404).json({
          success: false,
          message: "Class not found with this code",
        });
      }

      // Check if student is already in class
      if (cls.students.includes(req.user.id)) {
        return res.status(400).json({
          success: false,
          message: "You are already enrolled in this class",
        });
      }

      // Check capacity
      if (cls.students.length >= cls.capacity) {
        return res.status(400).json({
          success: false,
          message: "Class is at full capacity",
        });
      }

      cls.students.push(req.user.id);
      await cls.save();

      // CORRECTION: Remplacer execPopulate() par findById avec populate
      const updatedClass = await Class.findById(cls._id)
        .populate("teacher", "name email avatar")
        .populate("students", "name email avatar");

      res.status(200).json({
        success: true,
        message: "Successfully joined class",
        data: updatedClass,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   POST /api/class/:id/remove-student
// @desc    Remove student from class (Teacher only)
// @access  Private
router.post(
  "/:id/remove-student",
  protect,
  param("id").isMongoId().withMessage("Invalid class ID"),
  body("studentId").isMongoId().withMessage("Invalid student ID"),
  async (req, res, next) => {
    try {
      const cls = await Class.findById(req.params.id);

      if (!cls) {
        return res.status(404).json({
          success: false,
          message: "Class not found",
        });
      }

      // Check authorization
      if (cls.teacher.toString() !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Not authorized",
        });
      }

      cls.students = cls.students.filter(
        (id) => id.toString() !== req.body.studentId
      );
      await cls.save();

      res.status(200).json({
        success: true,
        message: "Student removed from class",
        data: cls,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   GET /api/class/:id/stats
// @desc    Get class statistics
// @access  Private
router.get(
  "/:id/stats",
  protect,
  param("id").isMongoId().withMessage("Invalid class ID"),
  async (req, res, next) => {
    try {
      const cls = await Class.findById(req.params.id);

      if (!cls) {
        return res.status(404).json({
          success: false,
          message: "Class not found",
        });
      }

      const tasksCount = await Task.countDocuments({ classId: req.params.id });
      const assignmentsCount = await Assignment.countDocuments({
        classId: req.params.id,
      });
      const submittedAssignments = await Assignment.countDocuments({
        classId: req.params.id,
        status: { $in: ["submitted", "graded"] },
      });

      res.status(200).json({
        success: true,
        data: {
          totalStudents: cls.students.length,
          totalTasks: tasksCount,
          totalAssignments: assignmentsCount,
          submittedAssignments,
          enrollmentCapacity: `${cls.students.length}/${cls.capacity}`,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;