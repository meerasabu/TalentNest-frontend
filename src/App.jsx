import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login/Login';
import Signup from './components/Signup/Signup';
import ResetPassword from './components/ResetPassword/ResetPassword';
import VerifyOtp from './components/VerifyOtp/VerifyOtp';
import CreateNewPassword from './components/CreateNewPassword/CreateNewPassword';
import IndexDashboard from './components/Dashboard/Index';
import CreateListing from './components/CreateListing/CreateListing';
import Home from './components/Home/Home';
import Marketplace from './components/Marketplace/Marketplace';
import ProductDetails from './components/ProductDetails/ProductDetails';
import SkillExchange from './components/SkillExchange/SkillExchange';
import SkillDetails from './components/SkillDetails/SkillDetails';
import Services from './components/Services/Services';
import ServiceDetails from './components/ServiceDetails/ServiceDetails';
import Orders from './components/Orders/Orders';
import Profile from './components/Profile/Profile';
import EditProfile from './components/EditProfile/EditProfile';
import Settings from './components/Settings/Settings';
import Wishlist from './components/Wishlist/Wishlist';
import Notifications from './components/Notifications/Notifications';
import Messages from './components/Messages/Messages';
import SearchResults from './components/SearchResults/SearchResults';
import AdminDashboard from './components/Admin/AdminDashboard';
import AdminStudents from './components/Admin/AdminStudents';
import AdminStudentDetail from './components/Admin/AdminStudentDetail';
import AdminMarketplace from './components/Admin/AdminMarketplace';
import AdminProductDetail from './components/Admin/AdminProductDetail';
import AdminSkills from './components/Admin/AdminSkills';
import AdminServices from './components/Admin/AdminServices';
import AdminSkillDetail from './components/Admin/AdminSkillDetail';
import AdminServiceDetail from './components/Admin/AdminServiceDetail';
import AdminOrders from './components/Admin/AdminOrders';
import AdminOrderDetail from './components/Admin/AdminOrderDetail';
import ChatModeration from './components/Admin/ChatModeration';
import AdminChatReview from './components/Admin/AdminChatReview';
import AdminVerification from './components/Admin/AdminVerification';
import AdminReports from './components/Admin/AdminReports';
import { NotificationProvider } from './context/NotificationContext';
import { PresenceProvider } from './context/PresenceContext';

const About = () => <div style={{ padding: '2rem' }}><h1>About TalentNest</h1><p>A campus ecosystem for student talent.</p></div>;

function App() {
  return (
    <Router>
      <PresenceProvider>
        <NotificationProvider>
          <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/students" element={<AdminStudents />} />
          <Route path="/admin/students/:id" element={<AdminStudentDetail />} />
          <Route path="/admin/marketplace" element={<AdminMarketplace />} />
          <Route path="/admin/marketplace/:id" element={<AdminProductDetail />} />
          <Route path="/admin/skills" element={<AdminSkills />} />
          <Route path="/admin/skills/:id" element={<AdminSkillDetail />} />
          <Route path="/admin/services" element={<AdminServices />} />
          <Route path="/admin/services/:id" element={<AdminServiceDetail />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route path="/admin/orders/:id" element={<AdminOrderDetail />} />
          <Route path="/admin/chat" element={<ChatModeration />} />
          <Route path="/admin/chat/:id" element={<AdminChatReview />} />
          <Route path="/admin/verification" element={<AdminVerification />} />
          <Route path="/admin/reports" element={<AdminReports />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />
          <Route path="/create-new-password" element={<CreateNewPassword />} />
          <Route path="/index" element={<IndexDashboard />} />
          <Route path="/create-listing" element={<CreateListing />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/skills" element={<SkillExchange />} />
          <Route path="/skill/:id" element={<SkillDetails />} />
          <Route path="/services" element={<Services />} />
          <Route path="/service/:id" element={<ServiceDetails />} />
          <Route path="/services/:id" element={<ServiceDetails />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/edit-profile" element={<EditProfile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/chat" element={<Messages />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/search" element={<SearchResults />} />
          </Routes>
        </NotificationProvider>
      </PresenceProvider>
    </Router>
  );
}

export default App;
