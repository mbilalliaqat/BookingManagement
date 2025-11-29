// AdminLayout.jsx
import Sidebar from './Sidebar';
import Header from './Header';
import pg from '../../assets/Aeroplane.jpeg'

function AdminLayout({ children }) {
  return (
     <div className="flex min-h-screen bg-cover bg-center bg-no-repeat" style={{backgroundImage: `url(${pg})`}}>
      <Sidebar isAdmin />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-hidden p-6">
          <div className=" max-w mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;