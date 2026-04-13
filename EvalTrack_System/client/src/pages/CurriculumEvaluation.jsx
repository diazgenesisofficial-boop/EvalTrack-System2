import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
    BookOpen, 
    CheckCircle, 
    XCircle, 
    Clock, 
    TrendingUp,
    User,
    GraduationCap,
    Download,
    Printer,
    Search,
    Filter,
    Calendar,
    Award
} from 'lucide-react';

const CurriculumEvaluation = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [evaluationData, setEvaluationData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedTerm, setSelectedTerm] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [showPrintMode, setShowPrintMode] = useState(false);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        fetchEvaluationData();
    }, [user, navigate]);

    const fetchEvaluationData = async () => {
        try {
            setLoading(true);
            const studentId = user.role === 'student' ? user.id : user.id;
            const response = await fetch(`/api/student/evaluation/${studentId}`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch evaluation data');
            }
            
            const result = await response.json();
            
            if (result.success) {
                setEvaluationData(result.data);
            } else {
                setError(result.message || 'Failed to load evaluation data');
            }
        } catch (err) {
            setError(err.message || 'Connection error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        setShowPrintMode(true);
        setTimeout(() => {
            window.print();
            setShowPrintMode(false);
        }, 100);
    };

    const handleDownload = () => {
        // Create CSV or PDF download functionality
        const csvContent = generateCSV();
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `curriculum_evaluation_${user?.id}_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const generateCSV = () => {
        if (!evaluationData) return '';
        
        const headers = ['Year', 'Semester', 'Course Code', 'Course Title', 'Units', 'Grade', 'Status', 'Remarks'];
        const rows = evaluationData.curriculum.map(course => [
            course.year_level,
            course.semester,
            course.course_code,
            course.title,
            course.units,
            course.grade || '',
            course.grade_status || '',
            course.remarks || ''
        ]);
        
        return [headers, ...rows].map(row => row.join(',')).join('\n');
    };

    const filteredCurriculum = evaluationData?.curriculum?.filter(course => {
        const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            course.course_code.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesTerm = selectedTerm === 'all' || true; // Add term filtering logic
        return matchesSearch && matchesTerm;
    }) || [];

    const groupedCurriculum = filteredCurriculum.reduce((acc, course) => {
        const key = `${course.year_level}-${course.semester}`;
        if (!acc[key]) {
            acc[key] = [];
        }
        acc[key].push(course);
        return acc;
    }, {});

    const getStatusIcon = (status) => {
        switch (status) {
            case 'passed':
                return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'failed':
                return <XCircle className="w-5 h-5 text-red-500" />;
            case 'incomplete':
                return <Clock className="w-5 h-5 text-yellow-500" />;
            default:
                return <Clock className="w-5 h-5 text-gray-400" />;
        }
    };

    const getStatusBadge = (status) => {
        const styles = {
            passed: 'bg-green-100 text-green-800 border-green-200',
            failed: 'bg-red-100 text-red-800 border-red-200',
            incomplete: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            default: 'bg-gray-100 text-gray-800 border-gray-200'
        };
        
        const style = styles[status] || styles.default;
        
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${style}`}>
                {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Not Taken'}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading curriculum evaluation...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
                    <div className="text-center">
                        <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Data</h3>
                        <p className="text-gray-600 mb-4">{error}</p>
                        <button
                            onClick={fetchEvaluationData}
                            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!evaluationData) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No evaluation data available</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen bg-gray-50 ${showPrintMode ? 'print-mode' : ''}`}>
            <style jsx>{`
                @media print {
                    .no-print { display: none !important; }
                    .print-mode { background: white !important; }
                    .print-break { page-break-after: always; }
                }
            `}</style>
            
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold flex items-center gap-3">
                                <GraduationCap className="w-8 h-8" />
                                Curriculum Evaluation
                            </h1>
                            <p className="text-purple-100 mt-2">Track your academic progress</p>
                        </div>
                        <div className="no-print flex gap-3">
                            <button
                                onClick={handleDownload}
                                className="bg-white text-purple-600 px-4 py-2 rounded-lg hover:bg-purple-50 transition-colors flex items-center gap-2"
                            >
                                <Download className="w-4 h-4" />
                                Download
                            </button>
                            <button
                                onClick={handlePrint}
                                className="bg-white text-purple-600 px-4 py-2 rounded-lg hover:bg-purple-50 transition-colors flex items-center gap-2"
                            >
                                <Printer className="w-4 h-4" />
                                Print
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Student Info Card */}
            <div className="container mx-auto px-4 py-6">
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="flex items-center gap-3">
                            <div className="bg-purple-100 p-3 rounded-full">
                                <User className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Student Name</p>
                                <p className="font-semibold text-gray-900">{evaluationData.student.name}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-100 p-3 rounded-full">
                                <BookOpen className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Program</p>
                                <p className="font-semibold text-gray-900">{evaluationData.student.program_name}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="bg-green-100 p-3 rounded-full">
                                <Award className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Year Level</p>
                                <p className="font-semibold text-gray-900">{evaluationData.student.year_level || 'N/A'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="bg-yellow-100 p-3 rounded-full">
                                <Calendar className="w-6 h-6 text-yellow-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Student Type</p>
                                <p className="font-semibold text-gray-900 capitalize">{evaluationData.student.student_type}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Completed Courses</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {evaluationData.statistics.completedCourses}
                                </p>
                            </div>
                            <CheckCircle className="w-8 h-8 text-green-500" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Total Courses</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {evaluationData.statistics.totalCourses}
                                </p>
                            </div>
                            <BookOpen className="w-8 h-8 text-blue-500" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Units Earned</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {evaluationData.statistics.totalUnitsEarned}
                                </p>
                            </div>
                            <Award className="w-8 h-8 text-purple-500" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Completion Rate</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {evaluationData.statistics.completionRate}%
                                </p>
                            </div>
                            <TrendingUp className="w-8 h-8 text-orange-500" />
                        </div>
                    </div>
                </div>

                {/* Search and Filter */}
                <div className="bg-white rounded-lg shadow-md p-4 mb-6 no-print">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Search courses..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                                <Filter className="w-4 h-4" />
                                Filter
                            </button>
                        </div>
                    </div>
                </div>

                {/* Curriculum Evaluation Table */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-900">Curriculum Evaluation</h2>
                    </div>
                    
                    <div className="overflow-x-auto">
                        {Object.entries(groupedCurriculum).map(([key, courses]) => {
                            const [year, semester] = key.split('-');
                            const semesterDisplay = semester === 'Summer' ? 'Summer' : `${semester} Semester`;
                            
                            return (
                                <div key={key} className="print-break">
                                    <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                                        <h3 className="text-lg font-semibold text-gray-900">
                                            {year === '1' ? 'First' : year === '2' ? 'Second' : year === '3' ? 'Third' : 'Fourth'} Year / {semesterDisplay}
                                        </h3>
                                    </div>
                                    
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
                                                    Prerequisites
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Grade
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Status
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Remarks
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {courses.map((course) => (
                                                <tr key={`${course.course_code}-${course.year_level}-${course.semester}`} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {course.course_code}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-900">
                                                        {course.title}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {course.units}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-500">
                                                        {course.prerequisites || 'None'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {course.grade || '-'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center gap-2">
                                                            {getStatusIcon(course.grade_status)}
                                                            {getStatusBadge(course.grade_status)}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-500">
                                                        {course.remarks || '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    
                                    {/* Semester Total */}
                                    <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
                                        <div className="flex justify-end">
                                            <span className="text-sm font-medium text-gray-700">
                                                Semester Total: {courses.reduce((sum, course) => sum + parseFloat(course.units), 0)} units
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CurriculumEvaluation;
