const mongoose = require("mongoose");
require("dotenv").config();

// Import models
const Course = require("./models/Course");
const User = require("./models/User");

// Sample courses with ratings
const sampleCoursesWithRatings = [
  {
    title: "Advanced React Development",
    description: "Master React hooks, context, and advanced patterns for building scalable applications.",
    category: "Technology",
    level: "Advanced",
    duration: "8 weeks",
    price: 149.99,
    thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=250&fit=crop",
    isPublished: true,
    ratings: [
      { rating: 5 },
      { rating: 4 },
      { rating: 5 },
      { rating: 4 },
      { rating: 5 },
      { rating: 3 },
      { rating: 4 },
      { rating: 5 },
      { rating: 4 },
      { rating: 5 }
    ],
    averageRating: 4.4,
    totalRatings: 10
  },
  {
    title: "Machine Learning Fundamentals",
    description: "Learn the basics of machine learning with Python, scikit-learn, and real-world projects.",
    category: "Technology",
    level: "Intermediate",
    duration: "10 weeks",
    price: 199.99,
    thumbnail: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400&h=250&fit=crop",
    isPublished: true,
    ratings: [
      { rating: 5 },
      { rating: 5 },
      { rating: 4 },
      { rating: 5 },
      { rating: 5 },
      { rating: 4 },
      { rating: 5 },
      { rating: 5 }
    ],
    averageRating: 4.8,
    totalRatings: 8
  },
  {
    title: "Digital Marketing Strategy",
    description: "Complete guide to digital marketing including SEO, PPC, social media, and analytics.",
    category: "Marketing",
    level: "Beginner",
    duration: "6 weeks",
    price: 89.99,
    thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=250&fit=crop",
    isPublished: true,
    ratings: [
      { rating: 4 },
      { rating: 4 },
      { rating: 5 },
      { rating: 3 },
      { rating: 4 },
      { rating: 4 },
      { rating: 5 },
      { rating: 4 },
      { rating: 3 },
      { rating: 4 },
      { rating: 5 },
      { rating: 4 }
    ],
    averageRating: 4.1,
    totalRatings: 12
  },
  {
    title: "UX/UI Design Masterclass",
    description: "Learn user experience and interface design from wireframes to prototypes.",
    category: "Design",
    level: "Intermediate",
    duration: "12 weeks",
    price: 179.99,
    thumbnail: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=250&fit=crop",
    isPublished: true,
    ratings: [
      { rating: 5 },
      { rating: 5 },
      { rating: 4 },
      { rating: 5 },
      { rating: 5 },
      { rating: 4 },
      { rating: 5 }
    ],
    averageRating: 4.7,
    totalRatings: 7
  },
  {
    title: "Financial Planning Basics",
    description: "Learn personal finance, budgeting, investing, and retirement planning strategies.",
    category: "Business",
    level: "Beginner",
    duration: "4 weeks",
    price: 59.99,
    thumbnail: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=250&fit=crop",
    isPublished: true,
    ratings: [
      { rating: 4 },
      { rating: 5 },
      { rating: 4 },
      { rating: 4 },
      { rating: 3 },
      { rating: 4 },
      { rating: 5 },
      { rating: 4 },
      { rating: 4 },
      { rating: 5 },
      { rating: 3 },
      { rating: 4 },
      { rating: 4 },
      { rating: 5 },
      { rating: 4 }
    ],
    averageRating: 4.2,
    totalRatings: 15
  }
];

async function seedCoursesWithRatings() {
  try {
    // Connect to MongoDB
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/mern_auth",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );

    console.log("Connected to MongoDB");

    // Find an instructor user to assign courses to
    let instructor = await User.findOne({ role: "instructor" });
    
    if (!instructor) {
      console.log("No instructor found, creating one...");
      const bcrypt = require("bcryptjs");
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("instructor123", salt);
      
      instructor = new User({
        name: "Sample Instructor",
        email: "instructor@example.com",
        password: hashedPassword,
        role: "instructor"
      });
      await instructor.save();
      console.log("Sample instructor created");
    }

    // Clear existing sample courses (optional)
    await Course.deleteMany({ 
      title: { 
        $in: sampleCoursesWithRatings.map(course => course.title) 
      } 
    });

    // Create courses with ratings
    for (const courseData of sampleCoursesWithRatings) {
      const course = new Course({
        ...courseData,
        instructor: instructor._id,
        instructorName: instructor.name,
        enrolledStudents: [], // Start with no enrolled students
        ratings: courseData.ratings.map(rating => ({
          ...rating,
          user: instructor._id, // For simplicity, using instructor as rater
          ratedAt: new Date()
        }))
      });

      await course.save();
      console.log(`Created course: ${course.title} with ${course.totalRatings} ratings (avg: ${course.averageRating})`);
    }

    console.log("✅ Sample courses with ratings created successfully!");
    console.log("You can now see the ratings on the Landing page");
    
  } catch (error) {
    console.error("Error seeding courses:", error);
  } finally {
    await mongoose.connection.close();
    console.log("Database connection closed");
  }
}

// Run the seed script
seedCoursesWithRatings();
