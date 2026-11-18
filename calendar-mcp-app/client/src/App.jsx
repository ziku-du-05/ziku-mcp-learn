import { useEffect, useState } from "react";
import "./index.css";
import ChatBox from "./components/ChatBox";

const API_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:4000";

/**
 * Google Calendar date-time display করার helper।
 */
function formatEventDate(value) {
  if (!value) {
    return "Date পাওয়া যায়নি";
  }

  // All-day event: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return `${value} — All day`;
  }

  return new Intl.DateTimeFormat("en-BD", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function App() {
  const [connected, setConnected] = useState(false);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function checkAuthStatus() {
    const response = await fetch(
      `${API_URL}/api/auth/status`,
      {
        credentials: "include",
      }
    );

    const data = await response.json();

    setConnected(data.connected);

    return data.connected;
  }

  async function loadEvents() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/api/calendar/events?days=30`,
        {
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message ?? "Events load failed");
      }

      setEvents(data.events);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function initialize() {
      try {
        const isConnected = await checkAuthStatus();

        if (isConnected) {
          await loadEvents();
        } else {
          setLoading(false);
        }
      } catch {
        setError("Backend server-এর সঙ্গে connect করা যাচ্ছে না।");
        setLoading(false);
      }
    }

    initialize();
  }, []);

  return (
    <main className="container">
      <header className="header">
        <div>
          <h1>📅 My Google Calendar</h1>
          <p>আগামী ৩০ দিনের events</p>
        </div>

        {!connected ? (
          <a
            className="button"
            href={`${API_URL}/auth/google`}
          >
            Connect Google Calendar
          </a>
        ) : (
          <button className="button" onClick={loadEvents}>
            Refresh Events
          </button>
        )}
      </header>

      {!connected && !loading && (
        <section className="notice">
          Google Calendar events দেখতে account connect করুন।
        </section>
      )}

      {loading && <p>Loading calendar events...</p>}

      {error && <p className="error">{error}</p>}

      {connected && !loading && events.length === 0 && (
        <section className="notice">
          আগামী ৩০ দিনে কোনো event পাওয়া যায়নি।
        </section>
      )}

      <section className="event-grid">
        {events.map((event) => (
          <article className="event-card" key={event.id}>
            <h2>{event.title}</h2>

            <p>
              <strong>Start:</strong>{" "}
              {formatEventDate(event.start)}
            </p>

            <p>
              <strong>End:</strong>{" "}
              {formatEventDate(event.end)}
            </p>

            {event.location && (
              <p>
                <strong>Location:</strong> {event.location}
              </p>
            )}

            {event.description && (
              <p className="description">
                {event.description}
              </p>
            )}

            {event.htmlLink && (
              <a
                href={event.htmlLink}
                target="_blank"
                rel="noreferrer"
              >
                Open in Google Calendar
              </a>
            )}
          </article>
        ))}
      </section>
      <ChatBox disabled={!connected} />
    </main>
  );
}

export default App;