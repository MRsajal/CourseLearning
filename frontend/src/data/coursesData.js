// Static course data for the learning platform
export const preBuiltCourses = [
  {
    id: 1,
    title: "Complete Web Development Bootcamp",
    description: "Learn modern web development from scratch including HTML, CSS, JavaScript, React, Node.js, and MongoDB. Build real-world projects and deploy them to production.",
    category: "Technology",
    level: "Beginner",
    duration: "12 weeks",
    price: 99.99,
    instructorName: "John Smith",
    thumbnail: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=250&fit=crop",
    isPublished: true,
    enrolledStudents: 1250,
    rating: 4.8,
    totalRatings: 342,
    ratings: [],
    totalMaterials: 45,
    completedMaterials: 0,
    progressPercentage: 0
  },
  {
    id: 2,
    title: "React & Redux Masterclass",
    description: "Master React.js and Redux by building complex applications. Learn hooks, context API, advanced patterns, testing, and performance optimization techniques.",
    category: "Technology", 
    level: "Intermediate",
    duration: "8 weeks",
    price: 79.99,
    instructorName: "Sarah Johnson",
    thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=250&fit=crop",
    isPublished: true,
    enrolledStudents: 892,
    rating: 4.9,
    totalRatings: 156,
    ratings: [],
    totalMaterials: 32,
    completedMaterials: 0,
    progressPercentage: 0
  },
  {
    id: 3,
    title: "Python for Data Science",
    description: "Comprehensive course covering Python programming, NumPy, Pandas, Matplotlib, and machine learning basics. Perfect for aspiring data scientists.",
    category: "Technology",
    level: "Intermediate",
    duration: "10 weeks", 
    price: 89.99,
    instructorName: "Dr. Michael Chen",
    thumbnail: "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=400&h=250&fit=crop",
    isPublished: true,
    enrolledStudents: 1150,
    rating: 4.7,
    totalRatings: 289,
    ratings: [],
    totalMaterials: 38,
    completedMaterials: 0,
    progressPercentage: 0
  },
  {
    id: 4,
    title: "Digital Marketing Strategy",
    description: "Learn modern digital marketing strategies including SEO, social media marketing, content marketing, email campaigns, and analytics.",
    category: "Marketing",
    level: "Beginner",
    duration: "6 weeks",
    price: 59.99,
    instructorName: "Emma Wilson",
    thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=250&fit=crop",
    isPublished: true,
    enrolledStudents: 987,
    rating: 4.6,
    totalMaterials: 24,
    completedMaterials: 0,
    progressPercentage: 0
  },
  {
    id: 5,
    title: "UI/UX Design Fundamentals",
    description: "Master the principles of user interface and user experience design. Learn Figma, design systems, prototyping, and user research methodologies.",
    category: "Design",
    level: "Beginner",
    duration: "8 weeks",
    price: 69.99,
    instructorName: "David Rodriguez",
    thumbnail: "https://images.unsplash.com/photo-1558655146-d09347e92766?w=400&h=250&fit=crop",
    isPublished: true,
    enrolledStudents: 756,
    rating: 4.8,
    totalMaterials: 28,
    completedMaterials: 0,
    progressPercentage: 0
  },
  {
    id: 6,
    title: "Advanced JavaScript & ES6+",
    description: "Deep dive into modern JavaScript features, async/await, modules, classes, and advanced programming patterns. Build scalable applications.",
    category: "Technology",
    level: "Advanced",
    duration: "6 weeks",
    price: 74.99,
    instructorName: "Alex Thompson",
    thumbnail: "https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=400&h=250&fit=crop",
    isPublished: true,
    enrolledStudents: 543,
    rating: 4.9,
    totalMaterials: 22,
    completedMaterials: 0,
    progressPercentage: 0
  },
  {
    id: 7,
    title: "Business Analytics with Excel",
    description: "Learn advanced Excel techniques for business analysis including pivot tables, macros, data visualization, and financial modeling.",
    category: "Business",
    level: "Intermediate",
    duration: "5 weeks",
    price: 49.99,
    instructorName: "Lisa Brown",
    thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=250&fit=crop",
    isPublished: true,
    enrolledStudents: 1340,
    rating: 4.5,
    totalMaterials: 18,
    completedMaterials: 0,
    progressPercentage: 0
  },
  {
    id: 8,
    title: "Mobile App Development with React Native",
    description: "Build cross-platform mobile applications using React Native. Learn navigation, state management, native modules, and app store deployment.",
    category: "Technology",
    level: "Intermediate",
    duration: "10 weeks",
    price: 94.99,
    instructorName: "Kevin Park",
    thumbnail: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=250&fit=crop",
    isPublished: true,
    enrolledStudents: 687,
    rating: 4.7,
    totalMaterials: 35,
    completedMaterials: 0,
    progressPercentage: 0
  },
  {
    id: 9,
    title: "Photography Basics & Composition",
    description: "Learn fundamental photography techniques, camera settings, composition rules, lighting, and post-processing basics for stunning photos.",
    category: "Design",
    level: "Beginner",
    duration: "4 weeks",
    price: 39.99,
    instructorName: "Maria Garcia",
    thumbnail: "https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=400&h=250&fit=crop",
    isPublished: true,
    enrolledStudents: 432,
    rating: 4.6,
    totalMaterials: 15,
    completedMaterials: 0,
    progressPercentage: 0
  },
  {
    id: 10,
    title: "Machine Learning with Python",
    description: "Introduction to machine learning algorithms, supervised and unsupervised learning, neural networks, and practical implementations using scikit-learn.",
    category: "Technology",
    level: "Advanced",
    duration: "14 weeks",
    price: 119.99,
    instructorName: "Dr. Robert Lee",
    thumbnail: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400&h=250&fit=crop",
    isPublished: true,
    enrolledStudents: 398,
    rating: 4.9,
    totalMaterials: 52,
    completedMaterials: 0,
    progressPercentage: 0
  },
  {
    id: 11,
    title: "Content Writing & Copywriting",
    description: "Master the art of persuasive writing for web, email marketing, social media, and advertising. Learn storytelling and conversion optimization.",
    category: "Marketing",
    level: "Beginner",
    duration: "6 weeks",
    price: 54.99,
    instructorName: "Jennifer Taylor",
    thumbnail: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400&h=250&fit=crop",
    isPublished: true,
    enrolledStudents: 612,
    rating: 4.7,
    totalMaterials: 20,
    completedMaterials: 0,
    progressPercentage: 0
  },
  {
    id: 12,
    title: "Project Management Professional (PMP)",
    description: "Comprehensive preparation for PMP certification covering project lifecycle, risk management, agile methodologies, and leadership skills.",
    category: "Business",
    level: "Advanced",
    duration: "12 weeks",
    price: 149.99,
    instructorName: "Mark Anderson",
    thumbnail: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=250&fit=crop",
    isPublished: true,
    enrolledStudents: 287,
    rating: 4.8,
    totalMaterials: 40,
    completedMaterials: 0,
    progressPercentage: 0
  }
];

// Helper functions to work with course data
export const getCoursesByCategory = (category) => {
  if (category === 'all') return preBuiltCourses;
  return preBuiltCourses.filter(course => course.category === category);
};

export const getCoursesByLevel = (level) => {
  if (level === 'all') return preBuiltCourses;
  return preBuiltCourses.filter(course => course.level === level);
};

export const searchCourses = (searchTerm) => {
  if (!searchTerm) return preBuiltCourses;
  const term = searchTerm.toLowerCase();
  return preBuiltCourses.filter(course => 
    course.title.toLowerCase().includes(term) ||
    course.description.toLowerCase().includes(term) ||
    course.instructorName.toLowerCase().includes(term)
  );
};

export const getCourseById = (id) => {
  return preBuiltCourses.find(course => course.id === parseInt(id));
};

// Categories and levels for filters
export const categories = [
  { value: 'all', label: 'All Categories' },
  { value: 'Technology', label: 'Technology' },
  { value: 'Design', label: 'Design' },
  { value: 'Marketing', label: 'Marketing' },
  { value: 'Business', label: 'Business' }
];

export const levels = [
  { value: 'all', label: 'All Levels' },
  { value: 'Beginner', label: 'Beginner' },
  { value: 'Intermediate', label: 'Intermediate' },
  { value: 'Advanced', label: 'Advanced' }
];
