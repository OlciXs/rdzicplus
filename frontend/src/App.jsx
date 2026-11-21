import { useEffect, useState } from "react";

export default function App() {
  const [message, setMessage] = useState("Ładowanie...");

  useEffect(() => {
    fetch("/api/hello")
      .then((res) => res.json())
      .then((data) => setMessage(data.message))
      .catch(() => setMessage("Nie udało się połączyć z backendem"));
  }, []);

  return (
    <div style={{ fontFamily: "sans-serif", padding: 24 }}>
      <h1>Hello World z Reacta!</h1>
      <p>{message}</p>
    </div>
  );
}
