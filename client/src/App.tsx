import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Providers
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';

// Layout
import UserLayout from './components/layout/UserLayout';

// User Pages
import HomePage from './pages/user/HomePage';
import CoursesPage from './pages/user/CoursesPage';
import CourseDetailPage from './pages/user/CourseDetailPage';
import CoursePlayerPage from './pages/user/CoursePlayerPage';
import StudyMaterialsPage from './pages/user/StudyMaterialsPage';
import MaterialDetailPage from './pages/user/MaterialDetailPage';
import TestSeriesPage from './pages/user/TestSeriesPage';
import TestAttemptPage from './pages/user/TestAttemptPage';
import TestResultPage from './pages/user/TestResultPage';
import TypingTestPage from './pages/user/TypingTestPage';
import CartPage from './pages/user/CartPage';
import WishlistPage from './pages/user/WishlistPage';
import NotificationsPage from './pages/user/NotificationsPage';
import LoginPage from './pages/user/LoginPage';
import RegisterPage from './pages/user/RegisterPage';
import DashboardPage from './pages/user/DashboardPage';
import NotFoundPage from './pages/user/NotFoundPage';

// Admin Pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminCoursesPage from './pages/admin/AdminCoursesPage';
import AdminCourseFormPage from './pages/admin/AdminCourseFormPage';
import AdminCategoriesPage from './pages/admin/AdminCategoriesPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';
import AdminMaterialsPage from './pages/admin/AdminMaterialsPage';
import AdminTestsPage from './pages/admin/AdminTestsPage';
import AdminQuestionsPage from './pages/admin/AdminQuestionsPage';
import AdminReviewsPage from './pages/admin/AdminReviewsPage';
import AdminPromoCodesPage from './pages/admin/AdminPromoCodesPage';
import AdminLiveClassesPage from './pages/admin/AdminLiveClassesPage';
import AdminRecordedClassesPage from './pages/admin/AdminRecordedClassesPage';
import AdminNotificationsPage from './pages/admin/AdminNotificationsPage';
import AdminSlidersPage from './pages/admin/AdminSlidersPage';
import AdminFooterSettingsPage from './pages/admin/AdminFooterSettingsPage';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminTypingPage from './pages/admin/AdminTypingPage';

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <Router>
              <Routes>
                {/* Immersive Focus Mode Routes (No User Header/Footer) */}
                <Route path="/courses/:slug/learn" element={<CoursePlayerPage />} />
                <Route path="/test-series/:id/attempt" element={<TestAttemptPage />} />

                {/* User Facing Routes with Navbar and Footer */}
                <Route
                  path="/"
                  element={
                    <UserLayout>
                      <HomePage />
                    </UserLayout>
                  }
                />
                <Route
                  path="/courses"
                  element={
                    <UserLayout>
                      <CoursesPage />
                    </UserLayout>
                  }
                />
                <Route
                  path="/courses/:slug"
                  element={
                    <UserLayout>
                      <CourseDetailPage />
                    </UserLayout>
                  }
                />
                <Route
                  path="/study-materials"
                  element={
                    <UserLayout>
                      <StudyMaterialsPage />
                    </UserLayout>
                  }
                />
                <Route
                  path="/study-materials/:slug"
                  element={
                    <UserLayout>
                      <MaterialDetailPage />
                    </UserLayout>
                  }
                />
                <Route
                  path="/test-series"
                  element={
                    <UserLayout>
                      <TestSeriesPage />
                    </UserLayout>
                  }
                />
                <Route
                  path="/test-series/:id/result/:attemptId"
                  element={
                    <UserLayout>
                      <TestResultPage />
                    </UserLayout>
                  }
                />
                <Route
                  path="/typing-test"
                  element={
                    <UserLayout>
                      <TypingTestPage />
                    </UserLayout>
                  }
                />
                <Route
                  path="/cart"
                  element={
                    <UserLayout>
                      <CartPage />
                    </UserLayout>
                  }
                />
                <Route
                  path="/wishlist"
                  element={
                    <UserLayout>
                      <WishlistPage />
                    </UserLayout>
                  }
                />
                <Route
                  path="/notifications"
                  element={
                    <UserLayout>
                      <NotificationsPage />
                    </UserLayout>
                  }
                />
                <Route
                  path="/login"
                  element={
                    <UserLayout>
                      <LoginPage />
                    </UserLayout>
                  }
                />
                <Route
                  path="/register"
                  element={
                    <UserLayout>
                      <RegisterPage />
                    </UserLayout>
                  }
                />
                <Route
                  path="/dashboard"
                  element={
                    <UserLayout>
                      <DashboardPage />
                    </UserLayout>
                  }
                />

                {/* Dedicated Admin Login Routes */}
                <Route path="/Admin.login" element={<AdminLoginPage />} />
                <Route path="/admin.login" element={<AdminLoginPage />} />
                <Route path="/admin/login" element={<AdminLoginPage />} />

                {/* Admin Control Panel Routes (AdminLayout handled per-page) */}
                <Route path="/admin" element={<AdminDashboardPage />} />
                <Route path="/admin/courses" element={<AdminCoursesPage />} />
                <Route path="/admin/courses/new" element={<AdminCourseFormPage />} />
                <Route path="/admin/courses/:id/edit" element={<AdminCourseFormPage />} />
                <Route path="/admin/courses/edit/:id" element={<AdminCourseFormPage />} />
                <Route path="/admin/categories" element={<AdminCategoriesPage />} />
                <Route path="/admin/users" element={<AdminUsersPage />} />
                <Route path="/admin/orders" element={<AdminOrdersPage />} />
                <Route path="/admin/materials" element={<AdminMaterialsPage />} />
                <Route path="/admin/tests" element={<AdminTestsPage />} />
                <Route path="/admin/typing" element={<AdminTypingPage />} />
                <Route path="/admin/questions" element={<AdminQuestionsPage />} />
                <Route path="/admin/reviews" element={<AdminReviewsPage />} />
                <Route path="/admin/promo-codes" element={<AdminPromoCodesPage />} />
                <Route path="/admin/live-classes" element={<AdminLiveClassesPage />} />
                <Route path="/admin/recorded-classes" element={<AdminRecordedClassesPage />} />
                <Route path="/admin/notifications" element={<AdminNotificationsPage />} />
                <Route path="/admin/sliders" element={<AdminSlidersPage />} />
                <Route path="/admin/footer-settings" element={<AdminFooterSettingsPage />} />

                {/* 404 Fallback */}
                <Route
                  path="*"
                  element={
                    <UserLayout>
                      <NotFoundPage />
                    </UserLayout>
                  }
                />
              </Routes>
            </Router>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </ToastProvider>
  );
};

export default App;
