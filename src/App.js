import { useState } from 'react';
import Login from './components/Login';
import Chat from './components/Chat';

function App() {
  const [user, setUser] = useState(null);

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      {!user ? (
        <Login onLogin={setUser} />
      ) : (
        <Chat username={user} onLogout={() => setUser(null)} />
      )}
    </div>
  );
}

export default App;