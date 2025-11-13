import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Home from './pages/Home';
import Alumni from './pages/Alumni';
import Blog from './pages/Blog';
import Album from './pages/Album';
import Discuss from './pages/Discuss';
import Donate from './pages/Donate';
import Event from './pages/Event';
import Ideas from './pages/Ideas';
import Guidance from './pages/Guidance';
import Profile from './pages/Profile';
import ProtectedRoute from './components/ProtectedRoute';
import ResetPassword from './pages/ResetPassword';

const App = () => (
  <>
    <Toaster />
    <Routes>
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Public Routes */}
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/events" element={<Event />} />
        <Route path="/guidance" element={<Guidance />} />

        {/* Protected Routes - Only for JZS Family */}
        <Route
          path="/alumni"
          element={
            <ProtectedRoute>
              <Alumni />
            </ProtectedRoute>
          }
        />
        <Route
          path="/blog"
          element={
            <ProtectedRoute>
              <Blog />
            </ProtectedRoute>
          }
        />
        <Route
          path="/album"
          element={
            <ProtectedRoute>
              <Album />
            </ProtectedRoute>
          }
        />
        <Route
          path="/discuss"
          element={
            <ProtectedRoute>
              <Discuss />
            </ProtectedRoute>
          }
        />
        <Route
          path="/donate"
          element={
            <ProtectedRoute>
              <Donate />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ideas"
          element={
            <ProtectedRoute>
              <Ideas />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  </>
);

export default App;
