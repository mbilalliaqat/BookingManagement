// UserLayout.jsx
import Sidebar from './Sidebar';
import Header from './Header';
// import { useAppContext } from '../contexts/AppContext';

function UserLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-hidden p-6">
          <div className="h-full max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default UserLayout;