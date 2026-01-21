import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoutes from './router/PrivateRoutes';
import Login from './pages/auth/Login';
import ForgotPassword from './pages/auth/ForgotPassword';
import Unauthorized from './pages/shared/Unauthorized';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Private Routes */}
          <Route path="/*" element={<PrivateRoutes />} />

          {/* Default redirect */}
          {/* Default redirect - handled by PrivateRoutes */}
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;