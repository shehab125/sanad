import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import NavBar from './components/NavBar';
import Footer from './components/Footer';
import Home from './pages/Home';
import BooksList from './pages/books/BooksList';
import BookDetails from './pages/books/BookDetails';
import AddBook from './pages/books/AddBook';
import NotesList from './pages/notes/NotesList';
import NoteDetails from './pages/notes/NoteDetails';
import UploadNote from './pages/notes/UploadNote';
import TutorsList from './pages/tutors/TutorsList';
import TutorDetails from './pages/tutors/TutorDetails';
import TutorBooking from './pages/tutors/TutorBooking';
import HousingList from './pages/housing/HousingList';
import HousingDetails from './pages/housing/HousingDetails';
import AddHousing from './pages/housing/AddHousing';
import ToolsList from './pages/tools/ToolsList';
import ToolDetails from './pages/tools/ToolDetails';
import AddTool from './pages/tools/AddTool';
import Profile from './pages/Profile';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Chat from './pages/chat/Chat';
import Notifications from './pages/Notifications';
import Admin from './pages/admin/Admin';
import SearchPage from './pages/Search';
import Checkout from './pages/checkout/Checkout';
import PaymentSuccess from './pages/checkout/PaymentSuccess';
import PaymentPreview from './pages/checkout/PaymentPreview';
import ProtectedRoute from './components/ProtectedRoute';
import AIAssistant from './components/AIAssistant';
import { useAuth } from './contexts/AuthContext';

const App: React.FC = () => {
  const { session } = useAuth();
  return (
    <>
      <NavBar />
      <main style={{ minHeight: 'calc(100vh - var(--nav-height) - 70px)' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          {/* Auth */}
          <Route path="/login" element={session ? <Navigate to="/" replace /> : <Login />} />
          <Route path="/register" element={<Register />} />
          {/* Books */}
          <Route path="/books" element={<BooksList />} />
          <Route path="/books/new" element={<ProtectedRoute><AddBook /></ProtectedRoute>} />
          <Route path="/books/:id" element={<BookDetails />} />
          {/* Notes */}
          <Route path="/notes" element={<NotesList />} />
          <Route path="/notes/new" element={<ProtectedRoute><UploadNote /></ProtectedRoute>} />
          <Route path="/notes/:id" element={<NoteDetails />} />
          {/* Tutors */}
          <Route path="/tutors" element={<TutorsList />} />
          <Route path="/tutors/:id" element={<TutorDetails />} />
          <Route path="/tutors/:id/book" element={<ProtectedRoute><TutorBooking /></ProtectedRoute>} />
          {/* Housing */}
          <Route path="/housing" element={<HousingList />} />
          <Route path="/housing/new" element={<ProtectedRoute><AddHousing /></ProtectedRoute>} />
          <Route path="/housing/:id" element={<HousingDetails />} />
          {/* Tools */}
          <Route path="/tools" element={<ToolsList />} />
          <Route path="/tools/new" element={<ProtectedRoute><AddTool /></ProtectedRoute>} />
          <Route path="/tools/:id" element={<ToolDetails />} />
          {/* Profile */}
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          {/* Chat & Notifications */}
          <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
          {/* Search */}
          <Route path="/search" element={<SearchPage />} />
          {/* Checkout & payment */}
          <Route path="/payment/preview" element={<PaymentPreview />} />
          <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
          <Route path="/payment/success" element={<ProtectedRoute><PaymentSuccess /></ProtectedRoute>} />
          {/* Admin */}
          <Route path="/admin/*" element={<ProtectedRoute requireAdmin={true}><Admin /></ProtectedRoute>} />
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      <Footer />
      <AIAssistant />
    </>
  );
};

export default App;