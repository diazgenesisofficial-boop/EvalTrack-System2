import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
    Users, 
    BookOpen, 
    GraduationCap, 
    Settings,
    Plus,
    Edit,
    Trash2,
    Search,
    Download,
    Eye,
    CheckCircle,
    XCircle,
    Clock,
    TrendingUp,
    BarChart3,
    FileText,
    Calendar
} from 'lucide-react';

const AdminDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [students, setStudents] = useState([]);
    const [courses, setCourses] = useState([]);
    const [programs, setPrograms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [showGradeModal, setShowGradeModal] = useState(false);

    useEffect(() => {
        if (!user || (user.role !== 'admin' && user.role !== 'registrar')) {
            navigate('/dashboard');
            return;
        }

        fetchDashboardData();
    }, [user, navigate]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            
            // Fetch students, courses, and programs
            const [studentsRes, coursesRes, programsRes] = await Promise.all([
                fetch('/api/students'),
                fetch('/api/courses'),
                fetch('/api/programs')
            ]);

            if (studentsRes.ok) {
                const studentsData = await studentsRes.json();
                setStudents(studentsData.data || []);
            }

            if (coursesRes.ok) {
                const coursesData = await coursesRes.json();
                setCourses(coursesData.data || []);
            }

            if (programsRes.ok) {
                const programsData = await programsRes.json();
                setPrograms(programsData.data || []);
            }
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredStudents = students.filter(student =>
        student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.id?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatistics = () => {
        const totalStudents = students.length;
        const activeStudents = students.filter(s => s.enrollment_status === 'active').length;
        const totalCourses = courses.length;
        const totalPrograms = programs.length;

        return {
            totalStudents,
            activeStudents,
            totalCourses,
            totalPrograms
        };
    };

    const stats = getStatistics();

    const handleViewStudent = (student) => {
        setSelectedStudent(student);
        setActiveTab('student-details');
    };

    const handleGradeStudent = (student) => {
        setSelectedStudent(student);
        setShowGradeModal(true);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold flex items-center gap-3">
                                <Settings className="w-8 h-8" />
                                Admin Dashboard
                            </h1>
                            <p className="text-purple-100 mt-2">Manage students, curriculum, and evaluations</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-sm">Welcome, {user?.name}</span>
                            <div className="bg-white/20 px-3 py-1 rounded-full text-sm">
                                {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white shadow-sm border-b border-gray-200">
                <div className="container mx-auto px-4">
                    <div className="flex space-x-8">
                        {[
                            { id: 'overview', label: 'Overview', icon: BarChart3 },
                            { id: 'students', label: 'Students', icon: Users },
                            { id: 'courses', label: 'Courses', icon: BookOpen },
                            { id: 'programs', label: 'Programs', icon: GraduationCap },
                            { id: 'evaluations', label: 'Evaluations', icon: FileText }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                    activeTab === tab.id
                                        ? 'border-purple-600 text-purple-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 py-6">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        {/* Statistics Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-white rounded-lg shadow-md p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500">Total Students</p>
                                        <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
                                    </div>
                                    <Users className="w-8 h-8 text-blue-500" />
                                </div>
                            </div>
                            <div className="bg-white rounded-lg shadow-md p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500">Active Students</p>
                                        <p className="text-2xl font-bold text-gray-900">{stats.activeStudents}</p>
                                    </div>
                                    <CheckCircle className="w-8 h-8 text-green-500" />
                                </div>
                            </div>
                            <div className="bg-white rounded-lg shadow-md p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500">Total Courses</p>
                                        <p className="text-2xl font-bold text-gray-900">{stats.totalCourses}</p>
                                    </div>
                                    <BookOpen className="w-8 h-8 text-purple-500" />
                                </div>
                            </div>
                            <div className="bg-white rounded-lg shadow-md p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500">Programs</p>
                                        <p className="text-2xl font-bold text-gray-900">{stats.totalPrograms}</p>
                                    </div>
                                    <GraduationCap className="w-8 h-8 text-orange-500" />
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <button className="flex items-center gap-3 p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                                    <Plus className="w-5 h-5 text-purple-600" />
                                    <span className="text-left">
                                        <div className="font-medium">Add New Student</div>
                                        <div className="text-sm text-gray-500">Register a new student</div>
                                    </span>
                                </button>
                                <button className="flex items-center gap-3 p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                                    <Edit className="w-5 h-5 text-purple-600" />
                                    <span className="text-left">
                                        <div className="font-medium">Manage Courses</div>
                                        <div className="text-sm text-gray-500">Update course information</div>
                                    </span>
                                </button>
                                <button className="flex items-center gap-3 p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                                    <FileText className="w-5 h-5 text-purple-600" />
                                    <span className="text-left">
                                        <div className="font-medium">Generate Reports</div>
                                        <div className="text-sm text-gray-500">Create evaluation reports</div>
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Students Tab */}
                {activeTab === 'students' && (
                    <div className="space-y-6">
                        <div className="bg-white rounded-lg shadow-md">
                            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                                <h2 className="text-xl font-semibold text-gray-900">Students Management</h2>
                                <div className="flex gap-3">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                        <input
                                            type="text"
                                            placeholder="Search students..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        />
                                    </div>
                                    <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2">
                                        <Plus className="w-4 h-4" />
                                        Add Student
                                    </button>
                                </div>
                            </div>
                            
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Student ID
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Name
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Program
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Year Level
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredStudents.map((student) => (
                                            <tr key={student.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {student.id}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {student.name}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {student.program_code}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {student.year_level || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                        student.enrollment_status === 'active' 
                                                            ? 'bg-green-100 text-green-800' 
                                                            : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                        {student.enrollment_status || 'Unknown'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleViewStudent(student)}
                                                            className="text-blue-600 hover:text-blue-800"
                                                            title="View Details"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleGradeStudent(student)}
                                                            className="text-green-600 hover:text-green-800"
                                                            title="Manage Grades"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button className="text-purple-600 hover:text-purple-800" title="View Evaluation">
                                                            <FileText className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Courses Tab */}
                {activeTab === 'courses' && (
                    <div className="space-y-6">
                        <div className="bg-white rounded-lg shadow-md">
                            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                                <h2 className="text-xl font-semibold text-gray-900">Courses Management</h2>
                                <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2">
                                    <Plus className="w-4 h-4" />
                                    Add Course
                                </button>
                            </div>
                            
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Code
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Title
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Units
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Type
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Prerequisites
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {courses.map((course) => (
                                            <tr key={course.code} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {course.code}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-900">
                                                    {course.title}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {course.units}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                        {course.course_type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    {course.prerequisites || 'None'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    <div className="flex gap-2">
                                                        <button className="text-blue-600 hover:text-blue-800">
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button className="text-red-600 hover:text-red-800">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Programs Tab */}
                {activeTab === 'programs' && (
                    <div className="space-y-6">
                        <div className="bg-white rounded-lg shadow-md">
                            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                                <h2 className="text-xl font-semibold text-gray-900">Programs Management</h2>
                                <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2">
                                    <Plus className="w-4 h-4" />
                                    Add Program
                                </button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                                {programs.map((program) => (
                                    <div key={program.code} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900">{program.code}</h3>
                                                <p className="text-gray-600">{program.name}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button className="text-blue-600 hover:text-blue-800">
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button className="text-red-600 hover:text-red-800">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-500">Total Units:</span>
                                                <span className="font-medium">{program.total_units}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-500">Students:</span>
                                                <span className="font-medium">
                                                    {students.filter(s => s.program_code === program.code).length}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Evaluations Tab */}
                {activeTab === 'evaluations' && (
                    <div className="space-y-6">
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Curriculum Evaluations</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="border border-gray-200 rounded-lg p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Evaluations</h3>
                                    <p className="text-gray-600">View and manage recent curriculum evaluations</p>
                                    <button className="mt-4 text-purple-600 hover:text-purple-800 font-medium">
                                        View All →
                                    </button>
                                </div>
                                <div className="border border-gray-200 rounded-lg p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Generate Reports</h3>
                                    <p className="text-gray-600">Create batch evaluation reports for students</p>
                                    <button className="mt-4 text-purple-600 hover:text-purple-800 font-medium">
                                        Generate Reports →
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Grade Modal */}
            {showGradeModal && selectedStudent && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-xl font-semibold text-gray-900">
                                Manage Grades - {selectedStudent.name}
                            </h3>
                        </div>
                        <div className="p-6">
                            <p className="text-gray-600">Grade management interface would go here</p>
                            <div className="mt-4 flex justify-end gap-3">
                                <button
                                    onClick={() => setShowGradeModal(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                                    Save Grades
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
