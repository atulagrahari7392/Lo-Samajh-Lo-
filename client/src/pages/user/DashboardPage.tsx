import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Award,
  ShoppingCart,
  User,
  Settings,
  Clock,
  PlayCircle,
  CheckCircle2,
  Lock,
  Download,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import { Course, Order, TestAttempt } from '../../types';

export const DashboardPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [activeTab, setActiveTab] = useState<'courses' | 'tests' | 'orders' | 'settings'>('courses');
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [testAttempts, setTestAttempts] = useState<TestAttempt[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Settings form
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [ordersRes, attemptsRes, coursesRes] = await Promise.all([
          api.orders.getMyOrders(),
          api.tests.getMyAttempts(),
          api.courses.getAll(),
        ]);

        if (ordersRes.success) setOrders(ordersRes.orders || []);
        if (attemptsRes.success) setTestAttempts(attemptsRes.attempts || []);
        if (coursesRes.success) {
          // Filter enrolled courses
          const enrolled = (coursesRes.courses || []).filter((c: Course) => c.isEnrolled);
          setEnrolledCourses(enrolled);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setUpdatingProfile(true);
      const data = await api.auth.updateProfile({
        name,
        phone,
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined,
      });

      if (data.success) {
        success('Profile updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
        await refreshUser();
      }
    } catch (err: any) {
      toastError(err.message || 'Profile update failed.');
    } finally {
      setUpdatingProfile(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Welcome Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-[#1a1a2e] to-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#6C63FF] to-[#FF6584] text-white font-black text-2xl flex items-center justify-center shadow-lg">
            {user?.name.charAt(0) || 'U'}
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black">{user?.name}</h1>
            <p className="text-xs text-slate-400 mt-0.5">{user?.email}</p>
            <span className="inline-block mt-2 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-purple-500/20 text-[#FF6584] border border-purple-500/30">
              Active Aspirant • Student Portal
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-center">
          <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md min-w-[90px]">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Enrolled</span>
            <p className="text-xl font-black text-white">{enrolledCourses.length}</p>
          </div>
          <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md min-w-[90px]">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Tests Done</span>
            <p className="text-xl font-black text-emerald-400">{testAttempts.length}</p>
          </div>
          <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md min-w-[90px]">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Orders</span>
            <p className="text-xl font-black text-[#FF6584]">{orders.length}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        {[
          { id: 'courses', label: `My Courses (${enrolledCourses.length})`, icon: BookOpen },
          { id: 'tests', label: `Test Scores (${testAttempts.length})`, icon: Award },
          { id: 'orders', label: `Order History (${orders.length})`, icon: ShoppingCart },
          { id: 'settings', label: 'Account Settings', icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-3.5 text-xs sm:text-sm font-bold border-b-2 transition-colors ${
                active
                  ? 'border-[#6C63FF] text-[#6C63FF]'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Enrolled Courses */}
      {activeTab === 'courses' && (
        <div className="space-y-6">
          {enrolledCourses.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrolledCourses.map((course) => (
                <div
                  key={course.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <img
                      src={course.thumbnail || 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600'}
                      alt={course.title}
                      className="w-full aspect-video object-cover"
                    />
                    <div className="p-5 space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#6C63FF] bg-purple-50 px-2.5 py-0.5 rounded">
                        {course.category?.name || 'Enrolled Course'}
                      </span>
                      <h3 className="font-bold text-sm sm:text-base text-slate-900 line-clamp-2 leading-snug">
                        {course.title}
                      </h3>
                      <p className="text-xs text-slate-500">Instructor: {course.instructorName}</p>
                    </div>
                  </div>

                  <div className="p-5 pt-3 border-t border-slate-100">
                    <Link
                      to={`/courses/${course.slug}/learn`}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow transition-all"
                    >
                      <PlayCircle className="w-4 h-4" />
                      <span>Continue Learning</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white p-12 rounded-3xl text-center border border-slate-200 max-w-md mx-auto space-y-3">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-800">No Enrolled Courses Yet</h3>
              <p className="text-xs text-slate-500">Explore our selection of government exam batches and enroll today.</p>
              <Link to="/courses" className="inline-block px-5 py-2 rounded-xl bg-[#6C63FF] text-white font-bold text-xs shadow">
                Browse Courses
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Test Attempts */}
      {activeTab === 'tests' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5">
          <h3 className="font-bold text-lg text-slate-900">Your Exam & Mock History</h3>
          {testAttempts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-3.5 rounded-l-xl">Test Name</th>
                    <th className="p-3.5">Score</th>
                    <th className="p-3.5">Accuracy</th>
                    <th className="p-3.5">Correct / Incorrect</th>
                    <th className="p-3.5">Date</th>
                    <th className="p-3.5 rounded-r-xl">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {testAttempts.map((att) => (
                    <tr key={att.id} className="hover:bg-slate-50/50">
                      <td className="p-3.5 font-bold text-slate-900">
                        {att.test?.title || 'Mock Test'}
                      </td>
                      <td className="p-3.5 font-black text-[#6C63FF] text-sm">
                        {att.score} / {att.test?.totalMarks || 100}
                      </td>
                      <td className="p-3.5 text-emerald-600 font-bold">{att.accuracy}%</td>
                      <td className="p-3.5">
                        <span className="text-emerald-600 font-bold">{att.correctCount}</span> /{' '}
                        <span className="text-rose-500 font-bold">{att.incorrectCount}</span>
                      </td>
                      <td className="p-3.5 text-slate-400">
                        {new Date(att.submittedAt).toLocaleDateString()}
                      </td>
                      <td className="p-3.5">
                        <Link
                          to={`/test-series/${att.testId}/result/${att.id}`}
                          className="text-xs font-bold text-[#6C63FF] hover:underline"
                        >
                          View Solutions
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-slate-400 text-center py-6">You haven't attempted any tests yet.</p>
          )}
        </div>
      )}

      {/* Tab 3: Order History */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5">
          <h3 className="font-bold text-lg text-slate-900">Order History & Invoices</h3>
          {orders.length > 0 ? (
            <div className="space-y-4">
              {orders.map((ord) => (
                <div
                  key={ord.id}
                  className="p-5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-slate-900">
                        Order #{ord.orderNumber}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                        {ord.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Date: {new Date(ord.createdAt).toLocaleDateString()} • Provider: {ord.paymentProvider}
                    </p>
                    <div className="text-xs text-slate-700 font-medium pt-1">
                      {ord.items?.map((item, idx) => (
                        <span key={item.id}>
                          {item.course?.title}
                          {idx < ord.items.length - 1 ? ', ' : ''}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-lg font-black text-slate-900">₹{ord.totalAmount}</span>
                    {ord.discount > 0 && (
                      <p className="text-[11px] text-emerald-600 font-semibold">
                        Discount: -₹{ord.discount}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 text-center py-6">No order transactions found.</p>
          )}
        </div>
      )}

      {/* Tab 4: Account Settings */}
      {activeTab === 'settings' && (
        <div className="max-w-xl bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <h3 className="font-bold text-lg text-slate-900">Update Profile Details</h3>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#6C63FF]"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Mobile Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#6C63FF]"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-3">
              <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                Change Password (Optional)
              </h4>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#6C63FF]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#6C63FF]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={updatingProfile}
              className="px-6 py-2.5 rounded-xl bg-[#6C63FF] hover:bg-[#564ec9] text-white font-bold text-xs shadow transition-all disabled:opacity-50"
            >
              {updatingProfile ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
